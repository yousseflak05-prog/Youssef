import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import config from './lib/config.js';
import { requireAuth } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import clientsRoutes from './routes/clients.js';
import fournisseursRoutes from './routes/fournisseurs.js';
import produitsRoutes from './routes/produits.js';
import ventesRoutes from './routes/ventes.js';
import achatsRoutes from './routes/achats.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  if (config.env !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: config.env, time: new Date().toISOString() });
  });

  // Configuration publique consommée par le front (devise, taux de TVA, société).
  app.get('/api/config', (req, res) => {
    res.json({
      currency: config.currency,
      tvaRate: config.tvaRate,
      company: config.company,
    });
  });

  app.use('/api/auth', authRoutes);

  // Tout ce qui suit exige un jeton valide.
  app.use('/api/dashboard', requireAuth, dashboardRoutes);
  app.use('/api/clients', requireAuth, clientsRoutes);
  app.use('/api/fournisseurs', requireAuth, fournisseursRoutes);
  app.use('/api/produits', requireAuth, produitsRoutes);
  app.use('/api/ventes', requireAuth, ventesRoutes);
  app.use('/api/achats', requireAuth, achatsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
