import { Router } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma.js';
import config from '../lib/config.js';
import serialize from '../lib/serialize.js';
import { computeTotals } from '../lib/money.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';
import { nextNumero, withNumeroRetry, prepareLignes, runTransaction } from '../services/documents.js';

const router = Router();

const achatSchema = z.object({
  fournisseurId: z.coerce.number().int().positive().nullable().optional(),
  date: z.coerce.date().optional(),
  items: z
    .array(
      z.object({
        produitId: z.coerce.number().int().positive(),
        quantite: z.coerce.number().int().positive('La quantité doit être supérieure à 0'),
        prixUnitaire: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, 'Un achat doit contenir au moins une ligne'),
});

const ACHAT_DETAIL = {
  fournisseur: true,
  items: {
    orderBy: { id: 'asc' },
    include: { produit: { select: { id: true, nom: true, categorie: true } } },
  },
};

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest('Identifiant invalide');
  return id;
}

/** GET /api/achats — filtres ?fournisseurId= ?du= ?au= ?limit= */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { fournisseurId, du, au, limit } = req.query;

    const where = {};
    if (fournisseurId) where.fournisseurId = Number(fournisseurId);
    if (du || au) {
      where.date = {};
      if (du) where.date.gte = new Date(String(du));
      if (au) where.date.lte = new Date(`${String(au)}T23:59:59.999Z`);
    }

    const achats = await prisma.achat.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit ? Math.min(Number(limit), 500) : undefined,
      include: {
        fournisseur: { select: { id: true, nom: true } },
        _count: { select: { items: true } },
      },
    });

    res.json(
      serialize(achats.map(({ _count, ...achat }) => ({ ...achat, nbLignes: _count.items })))
    );
  })
);

/** GET /api/achats/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const achat = await prisma.achat.findUnique({ where: { id }, include: ACHAT_DETAIL });
    if (!achat) throw ApiError.notFound('Achat introuvable');
    res.json(serialize(achat));
  })
);

/**
 * POST /api/achats — enregistre un réapprovisionnement.
 * Symétrique de la vente : même transaction, mais le stock est incrémenté.
 * Le prix unitaire par défaut est le prix d'achat du catalogue.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = achatSchema.parse(req.body);

    const achat = await withNumeroRetry(() =>
      runTransaction(async (tx) => {
        if (payload.fournisseurId) {
          const fournisseur = await tx.fournisseur.findUnique({
            where: { id: payload.fournisseurId },
            select: { id: true },
          });
          if (!fournisseur) throw ApiError.badRequest('Fournisseur introuvable');
        }

        const lignes = await prepareLignes(tx, payload.items, 'prixAchat');

        for (const ligne of lignes) {
          await tx.produit.update({
            where: { id: ligne.produitId },
            data: { stock: { increment: ligne.quantite } },
          });
        }

        const totaux = computeTotals(lignes, config.tvaRate);

        return tx.achat.create({
          data: {
            numero: await nextNumero(tx, { prefix: 'ACH', model: 'achat' }),
            fournisseurId: payload.fournisseurId ?? null,
            date: payload.date ?? new Date(),
            ...totaux,
            items: { create: lignes },
          },
          include: ACHAT_DETAIL,
        });
      })
    );

    res.status(201).json(serialize(achat));
  })
);

/**
 * DELETE /api/achats/:id — annule un achat et retire du stock les quantités
 * entrées. Refusé si elles ont déjà été revendues, pour ne pas créer de
 * stock négatif.
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);

    await runTransaction(async (tx) => {
      const achat = await tx.achat.findUnique({ where: { id }, include: { items: true } });
      if (!achat) throw ApiError.notFound('Achat introuvable');

      for (const item of achat.items) {
        if (item.produitId === null) continue;

        const { count } = await tx.produit.updateMany({
          where: { id: item.produitId, stock: { gte: item.quantite } },
          data: { stock: { decrement: item.quantite } },
        });

        if (count === 0) {
          const produit = await tx.produit.findUnique({
            where: { id: item.produitId },
            select: { nom: true, stock: true },
          });
          throw ApiError.conflict(
            `Annulation impossible : « ${produit.nom} » n'a plus que ${produit.stock} unité(s) en stock ` +
              `sur les ${item.quantite} entrées par cet achat (elles ont probablement été vendues).`
          );
        }
      }

      await tx.achat.delete({ where: { id } });
    });

    res.status(204).end();
  })
);

export default router;
