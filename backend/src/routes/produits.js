import { Router } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma.js';
import serialize from '../lib/serialize.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';

const router = Router();

const produitSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(150),
  categorie: z.string().trim().max(80).optional().or(z.literal('')),
  prixAchat: z.coerce.number().min(0, "Le prix d'achat ne peut pas être négatif"),
  prixVente: z.coerce.number().min(0, 'Le prix de vente ne peut pas être négatif'),
  stock: z.coerce.number().int('Le stock doit être un entier').min(0, 'Le stock ne peut pas être négatif'),
  seuilAlerte: z.coerce.number().int().min(0).optional().default(5),
});

// L'ajustement manuel de stock (inventaire, casse, retour) est un mouvement
// à part : on ne l'expose pas via le PUT pour garder une trace de l'intention.
const ajustementSchema = z.object({
  delta: z.coerce.number().int().refine((v) => v !== 0, 'Le delta doit être non nul'),
  motif: z.string().trim().max(200).optional(),
});

function normalize(data) {
  return { ...data, categorie: data.categorie || null };
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest('Identifiant invalide');
  return id;
}

/**
 * GET /api/produits
 * Filtres : ?q=recherche  ?categorie=Informatique  ?stockFaible=true
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, categorie, stockFaible } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { nom: { contains: String(q), mode: 'insensitive' } },
        { categorie: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    if (categorie) where.categorie = String(categorie);

    let produits = await prisma.produit.findMany({ where, orderBy: { nom: 'asc' } });

    // Le seuil d'alerte étant propre à chaque produit, la comparaison
    // colonne-à-colonne se fait ici plutôt qu'en SQL.
    if (stockFaible === 'true') {
      produits = produits.filter((p) => p.stock <= p.seuilAlerte);
    }

    res.json(serialize(produits));
  })
);

/** GET /api/produits/categories — alimente les filtres du front. */
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const rows = await prisma.produit.findMany({
      where: { categorie: { not: null } },
      distinct: ['categorie'],
      select: { categorie: true },
      orderBy: { categorie: 'asc' },
    });
    res.json(rows.map((r) => r.categorie));
  })
);

/** GET /api/produits/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const produit = await prisma.produit.findUnique({
      where: { id },
      include: {
        venteItems: {
          take: 10,
          orderBy: { id: 'desc' },
          include: { vente: { select: { numero: true, date: true } } },
        },
      },
    });
    if (!produit) throw ApiError.notFound('Produit introuvable');
    res.json(serialize(produit));
  })
);

/** POST /api/produits */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = normalize(produitSchema.parse(req.body));
    const produit = await prisma.produit.create({ data });
    res.status(201).json(serialize(produit));
  })
);

/** PUT /api/produits/:id */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = normalize(produitSchema.parse(req.body));

    const existe = await prisma.produit.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw ApiError.notFound('Produit introuvable');

    const produit = await prisma.produit.update({ where: { id }, data });
    res.json(serialize(produit));
  })
);

/** POST /api/produits/:id/ajuster-stock — entrée/sortie manuelle. */
router.post(
  '/:id/ajuster-stock',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { delta } = ajustementSchema.parse(req.body);

    const produit = await prisma.produit.findUnique({ where: { id } });
    if (!produit) throw ApiError.notFound('Produit introuvable');

    if (produit.stock + delta < 0) {
      throw ApiError.conflict(
        `Stock insuffisant : ${produit.stock} en stock, retrait de ${Math.abs(delta)} demandé`
      );
    }

    const maj = await prisma.produit.update({
      where: { id },
      data: { stock: { increment: delta } },
    });
    res.json(serialize(maj));
  })
);

/**
 * DELETE /api/produits/:id
 * Le produit est détaché des lignes de facture existantes (ON DELETE SET NULL) ;
 * la désignation ayant été recopiée sur la ligne, l'historique reste lisible.
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);

    const produit = await prisma.produit.findUnique({
      where: { id },
      include: { _count: { select: { venteItems: true, achatItems: true } } },
    });
    if (!produit) throw ApiError.notFound('Produit introuvable');

    const nbDocuments = produit._count.venteItems + produit._count.achatItems;
    if (nbDocuments > 0 && req.query.force !== 'true') {
      throw ApiError.conflict(
        `Ce produit apparaît dans ${nbDocuments} ligne(s) de documents. ` +
          `La suppression conservera ces lignes mais les détachera du catalogue.`,
        { nbDocuments, confirmationRequise: true }
      );
    }

    await prisma.produit.delete({ where: { id } });
    res.status(204).end();
  })
);

export default router;
