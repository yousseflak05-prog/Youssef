import { PrismaClient } from '@prisma/client';

// Instance unique réutilisée par toute l'application. En développement, le
// `--watch` de Node recharge le module : on la mémorise sur globalThis pour
// éviter d'ouvrir un pool de connexions à chaque rechargement.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__erpPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__erpPrisma = prisma;
}

export default prisma;
