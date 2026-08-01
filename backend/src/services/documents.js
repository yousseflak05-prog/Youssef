import prisma from '../lib/prisma.js';
import { ApiError } from '../middleware/errors.js';

/**
 * Génère le prochain numéro de document de l'année : FAC-2026-0001, ACH-2026-0012…
 * Appelé DANS la transaction : le numéro est réservé au moment de l'insertion,
 * et une éventuelle collision (contrainte UNIQUE) est rejouée par l'appelant.
 */
export async function nextNumero(tx, { prefix, model }) {
  const annee = new Date().getFullYear();
  const dernier = await tx[model].findFirst({
    where: { numero: { startsWith: `${prefix}-${annee}-` } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  const sequence = dernier ? Number(dernier.numero.split('-')[2]) + 1 : 1;
  return `${prefix}-${annee}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Rejoue une transaction dont le numéro de document est entré en collision avec
 * une écriture concurrente (deux factures créées à la même seconde).
 */
export async function withNumeroRetry(fn, tentatives = 5) {
  for (let essai = 1; essai <= tentatives; essai += 1) {
    try {
      return await fn();
    } catch (error) {
      const collisionNumero = error?.code === 'P2002' && error?.meta?.target?.includes('numero');
      if (!collisionNumero || essai === tentatives) throw error;
    }
  }
}

/**
 * Charge les produits d'un document et vérifie que chaque ligne est exploitable.
 * Le prix unitaire par défaut vient du catalogue (`champPrix`), mais l'appelant
 * peut le surcharger ligne par ligne (remise ponctuelle, prix négocié).
 */
export async function prepareLignes(tx, items, champPrix) {
  const ids = [...new Set(items.map((i) => i.produitId))];
  const produits = await tx.produit.findMany({ where: { id: { in: ids } } });
  const parId = new Map(produits.map((p) => [p.id, p]));

  const manquants = ids.filter((id) => !parId.has(id));
  if (manquants.length > 0) {
    throw ApiError.badRequest(`Produit(s) introuvable(s) : ${manquants.join(', ')}`);
  }

  // Un même produit saisi sur deux lignes est fusionné : une seule ligne, une
  // seule écriture de stock, et un total identique.
  const fusion = new Map();
  for (const item of items) {
    const produit = parId.get(item.produitId);
    const prixUnitaire =
      item.prixUnitaire !== undefined && item.prixUnitaire !== null
        ? Number(item.prixUnitaire)
        : Number(produit[champPrix]);

    const cle = `${item.produitId}:${prixUnitaire}`;
    const existante = fusion.get(cle);
    if (existante) {
      existante.quantite += item.quantite;
    } else {
      fusion.set(cle, {
        produitId: produit.id,
        designation: produit.nom,
        quantite: item.quantite,
        prixUnitaire,
      });
    }
  }

  return [...fusion.values()];
}

/** Transaction Prisma avec les réglages utilisés par les documents commerciaux. */
export function runTransaction(fn) {
  return prisma.$transaction(fn, { timeout: 15_000 });
}
