import { Router } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma.js';
import config from '../lib/config.js';
import serialize from '../lib/serialize.js';
import { computeTotals } from '../lib/money.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';
import { nextNumero, withNumeroRetry, prepareLignes, runTransaction } from '../services/documents.js';
import { genererFacturePdf } from '../services/pdf.js';

const router = Router();

const venteSchema = z.object({
  clientId: z.coerce.number().int().positive().nullable().optional(),
  date: z.coerce.date().optional(),
  statut: z.enum(['payee', 'en_attente', 'annulee']).optional().default('payee'),
  items: z
    .array(
      z.object({
        produitId: z.coerce.number().int().positive(),
        quantite: z.coerce.number().int().positive('La quantité doit être supérieure à 0'),
        prixUnitaire: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, 'Une facture doit contenir au moins une ligne'),
});

const VENTE_DETAIL = {
  client: true,
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

/**
 * GET /api/ventes
 * Filtres : ?clientId= ?statut= ?du=2026-01-01 ?au=2026-01-31 ?limit=
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { clientId, statut, du, au, limit } = req.query;

    const where = {};
    if (clientId) where.clientId = Number(clientId);
    if (statut) where.statut = String(statut);
    if (du || au) {
      where.date = {};
      if (du) where.date.gte = new Date(String(du));
      if (au) where.date.lte = new Date(`${String(au)}T23:59:59.999Z`);
    }

    const ventes = await prisma.vente.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit ? Math.min(Number(limit), 500) : undefined,
      include: {
        client: { select: { id: true, nom: true } },
        _count: { select: { items: true } },
      },
    });

    res.json(
      serialize(
        ventes.map(({ _count, ...vente }) => ({ ...vente, nbLignes: _count.items }))
      )
    );
  })
);

/** GET /api/ventes/:id — facture complète avec ses lignes. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const vente = await prisma.vente.findUnique({ where: { id }, include: VENTE_DETAIL });
    if (!vente) throw ApiError.notFound('Facture introuvable');
    res.json(serialize(vente));
  })
);

/**
 * POST /api/ventes — crée une facture.
 *
 * Tout se joue dans une seule transaction :
 *   1. lecture des produits et calcul des totaux,
 *   2. décrément conditionnel du stock (`WHERE stock >= quantite`), qui échoue
 *      si un autre utilisateur a vidé le stock entre-temps,
 *   3. insertion de la facture et de ses lignes.
 * Le moindre échec annule l'ensemble : jamais de facture sans mouvement de
 * stock, ni de stock décrémenté sans facture.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = venteSchema.parse(req.body);

    const vente = await withNumeroRetry(() =>
      runTransaction(async (tx) => {
        if (payload.clientId) {
          const client = await tx.client.findUnique({
            where: { id: payload.clientId },
            select: { id: true },
          });
          if (!client) throw ApiError.badRequest('Client introuvable');
        }

        const lignes = await prepareLignes(tx, payload.items, 'prixVente');

        // Décrément atomique : `updateMany` avec garde sur le stock renvoie 0
        // ligne modifiée si la quantité disponible est insuffisante.
        for (const ligne of lignes) {
          const { count } = await tx.produit.updateMany({
            where: { id: ligne.produitId, stock: { gte: ligne.quantite } },
            data: { stock: { decrement: ligne.quantite } },
          });

          if (count === 0) {
            const produit = await tx.produit.findUnique({
              where: { id: ligne.produitId },
              select: { nom: true, stock: true },
            });
            throw ApiError.conflict(
              `Stock insuffisant pour « ${produit.nom} » : ${produit.stock} disponible(s), ${ligne.quantite} demandé(s)`,
              { produitId: ligne.produitId, disponible: produit.stock, demande: ligne.quantite }
            );
          }
        }

        const totaux = computeTotals(lignes, config.tvaRate);

        return tx.vente.create({
          data: {
            numero: await nextNumero(tx, { prefix: 'FAC', model: 'vente' }),
            clientId: payload.clientId ?? null,
            date: payload.date ?? new Date(),
            statut: payload.statut,
            ...totaux,
            items: { create: lignes },
          },
          include: VENTE_DETAIL,
        });
      })
    );

    res.status(201).json(serialize(vente));
  })
);

/** PATCH /api/ventes/:id/statut — encaissement ou mise en attente. */
router.patch(
  '/:id/statut',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { statut } = z
      .object({ statut: z.enum(['payee', 'en_attente', 'annulee']) })
      .parse(req.body);

    const existe = await prisma.vente.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw ApiError.notFound('Facture introuvable');

    const vente = await prisma.vente.update({
      where: { id },
      data: { statut },
      include: VENTE_DETAIL,
    });
    res.json(serialize(vente));
  })
);

/**
 * DELETE /api/ventes/:id — annule une facture et restitue le stock vendu,
 * dans la même transaction.
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);

    await runTransaction(async (tx) => {
      const vente = await tx.vente.findUnique({ where: { id }, include: { items: true } });
      if (!vente) throw ApiError.notFound('Facture introuvable');

      for (const item of vente.items) {
        if (item.produitId === null) continue; // produit supprimé du catalogue
        await tx.produit.update({
          where: { id: item.produitId },
          data: { stock: { increment: item.quantite } },
        });
      }

      await tx.vente.delete({ where: { id } }); // les lignes suivent (ON DELETE CASCADE)
    });

    res.status(204).end();
  })
);

/** GET /api/ventes/:id/pdf — facture au format PDF. */
router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const vente = await prisma.vente.findUnique({ where: { id }, include: VENTE_DETAIL });
    if (!vente) throw ApiError.notFound('Facture introuvable');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.inline === 'true' ? 'inline' : 'attachment'}; filename="${vente.numero}.pdf"`
    );

    genererFacturePdf(vente, res);
  })
);

export default router;
