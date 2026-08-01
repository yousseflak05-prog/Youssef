import TiersPage from './TiersPage.jsx';

export default function Fournisseurs() {
  return (
    <TiersPage
      ressource="fournisseurs"
      titre="Fournisseurs"
      singulier="Fournisseur"
      description="Fiches fournisseurs et historique d'approvisionnement"
      colonneDocuments="Achats"
    />
  );
}
