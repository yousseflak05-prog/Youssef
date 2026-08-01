import { Router } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma.js';
import serialize from '../lib/serialize.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';

/**
 * Clients et fournisseurs partagent exactement la même fiche (nom, téléphone,
 * email, adresse) et le même CRUD. Cette fabrique produit le routeur des deux,
 * en ne paramétrant que le modèle Prisma et la relation à compter.
 */

const tiersSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(150),
  telephone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().email('Adresse email invalide').max(150).optional().or(z.literal('')),
  adresse: z.string().trim().max(500).optional().or(z.literal('')),
});

/** Les champs facultatifs vides sont stockés en NULL plutôt qu'en chaîne vide. */
function normalize(data) {
  return {
    nom: data.nom,
    telephone: data.telephone || null,
    email: data.email || null,
    adresse: data.adresse || null,
  };
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest('Identifiant invalide');
  return id;
}

export function createTiersRouter({ model, relation, libelle, libellePluriel }) {
  const router = Router();
  const delegate = prisma[model];

  /** GET / — liste, avec recherche plein texte simple et nombre de documents liés. */
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { q } = req.query;
      const where = q
        ? {
            OR: [
              { nom: { contains: String(q), mode: 'insensitive' } },
              { email: { contains: String(q), mode: 'insensitive' } },
              { telephone: { contains: String(q), mode: 'insensitive' } },
            ],
          }
        : {};

      const rows = await delegate.findMany({
        where,
        orderBy: { nom: 'asc' },
        include: { _count: { select: { [relation]: true } } },
      });

      res.json(
        serialize(
          rows.map(({ _count, ...row }) => ({ ...row, nbDocuments: _count[relation] }))
        )
      );
    })
  );

  /** GET /:id — fiche détaillée avec l'historique des documents. */
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const row = await delegate.findUnique({
        where: { id },
        include: {
          [relation]: {
            orderBy: { date: 'desc' },
            take: 20,
            select: { id: true, numero: true, date: true, total: true },
          },
        },
      });
      if (!row) throw ApiError.notFound(`${libelle} introuvable`);
      res.json(serialize(row));
    })
  );

  /** POST / — création. */
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const data = normalize(tiersSchema.parse(req.body));
      const row = await delegate.create({ data });
      res.status(201).json(serialize(row));
    })
  );

  /** PUT /:id — mise à jour complète de la fiche. */
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const data = normalize(tiersSchema.parse(req.body));

      const existe = await delegate.findUnique({ where: { id }, select: { id: true } });
      if (!existe) throw ApiError.notFound(`${libelle} introuvable`);

      const row = await delegate.update({ where: { id }, data });
      res.json(serialize(row));
    })
  );

  /**
   * DELETE /:id — suppression.
   * Les documents comptables déjà émis ne sont jamais détruits : la clé
   * étrangère passe à NULL (ON DELETE SET NULL) et la fiche conserve le nom
   * saisi sur la facture. On exige toutefois `?force=true` si des documents
   * existent, pour que ce ne soit pas un accident.
   */
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);

      const row = await delegate.findUnique({
        where: { id },
        include: { _count: { select: { [relation]: true } } },
      });
      if (!row) throw ApiError.notFound(`${libelle} introuvable`);

      const nbDocuments = row._count[relation];
      if (nbDocuments > 0 && req.query.force !== 'true') {
        throw ApiError.conflict(
          `Ce ${libelle.toLowerCase()} est rattaché à ${nbDocuments} document(s). ` +
            `La suppression les conservera mais les détachera.`,
          { nbDocuments, confirmationRequise: true }
        );
      }

      await delegate.delete({ where: { id } });
      res.status(204).end();
    })
  );

  router.libellePluriel = libellePluriel;
  return router;
}

export default createTiersRouter;
