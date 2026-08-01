import { createTiersRouter } from './tiers.js';

/** CRUD /api/clients */
export default createTiersRouter({
  model: 'client',
  relation: 'ventes',
  libelle: 'Client',
  libellePluriel: 'Clients',
});
