import config from './lib/config.js';
import prisma from './lib/prisma.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API Registre ERP → http://localhost:${config.port}/api  (${config.env})`);
});

/** Ferme proprement le serveur HTTP puis le pool de connexions Postgres. */
async function shutdown(signal) {
  console.log(`\n${signal} reçu, arrêt en cours…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Filet de sécurité si des connexions restent ouvertes.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
