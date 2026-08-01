import { createTiersRouter } from './tiers.js';

/** CRUD /api/fournisseurs */
export default createTiersRouter({
  model: 'fournisseur',
  relation: 'achats',
  libelle: 'Fournisseur',
  libellePluriel: 'Fournisseurs',
});
