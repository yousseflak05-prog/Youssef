import config from './config.js';

/**
 * Arrondi commercial à 2 décimales en passant par les centimes entiers,
 * pour éviter les surprises du binaire flottant (0.1 + 0.2 !== 0.3).
 */
export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Calcule les totaux d'un document (vente ou achat) à partir de ses lignes.
 * Le HT est arrondi ligne par ligne, comme sur une facture papier.
 */
export function computeTotals(items, tvaRate = config.tvaRate) {
  const totalHt = round2(
    items.reduce((sum, item) => sum + round2(Number(item.prixUnitaire) * Number(item.quantite)), 0)
  );
  const tva = round2(totalHt * tvaRate);
  const total = round2(totalHt + tva);
  return { totalHt, tva, total };
}

/** Formate un montant pour l'affichage : "1 234,50 DH". */
export function formatMoney(value, currency = config.currency) {
  const symbol = currency === 'MAD' ? 'DH' : currency;
  const formatted = Number(value)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${symbol}`;
}

/** Convertit les Decimal Prisma en nombres pour la sérialisation JSON. */
export function decimalToNumber(value) {
  return value === null || value === undefined ? value : Number(value);
}
