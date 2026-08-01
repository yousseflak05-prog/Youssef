import TiersPage from './TiersPage.jsx';

export default function Clients() {
  return (
    <TiersPage
      ressource="clients"
      titre="Clients"
      singulier="Client"
      description="Fiches clients et historique de facturation"
      colonneDocuments="Factures"
    />
  );
}
