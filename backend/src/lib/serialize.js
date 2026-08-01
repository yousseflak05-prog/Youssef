import { Prisma } from '@prisma/client';

/**
 * Prisma renvoie les colonnes `Decimal` sous forme d'objets Decimal.js, que
 * `JSON.stringify` sérialise en chaînes. Le front veut des nombres : on
 * convertit récursivement avant l'envoi.
 */
export function serialize(value) {
  if (value === null || value === undefined) return value;

  if (Prisma.Decimal.isDecimal(value)) return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);

  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  }

  return value;
}

export default serialize;
