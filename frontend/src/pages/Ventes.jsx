import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ReceiptText, FileDown, Eye } from 'lucide-react';

import api from '../lib/api.js';
import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { montant, date, STATUTS_VENTE } from '../lib/format.js';

import PageHeader from '../components/ui/PageHeader.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import VenteFormModal from '../components/ventes/VenteFormModal.jsx';

export default function Ventes() {
  const toast = useToast();
  const naviguer = useNavigate();

  const [filtres, setFiltres] = useState({ statut: '', clientId: '', du: '', au: '' });
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const {
    donnees: ventes,
    chargement,
    erreur,
    recharger,
  } = useFetch(() => api.get('/ventes', filtres), [filtres]);

  const { donnees: clients } = useFetch(() => api.get('/clients'));

  const majFiltre = (cle) => (e) => setFiltres((f) => ({ ...f, [cle]: e.target.value }));

  const telecharger = async (vente, e) => {
    e.stopPropagation();
    try {
      await api.telechargerPdf(`/ventes/${vente.id}/pdf`, `${vente.numero}.pdf`);
      toast.succes(`Facture ${vente.numero} téléchargée.`);
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  const totalAffiche = ventes?.reduce((somme, v) => somme + Number(v.total), 0) ?? 0;

  const colonnes = [
    {
      cle: 'numero',
      titre: 'N° facture',
      rendu: (vente) => (
        <span className="tabular font-semibold text-stone-900">{vente.numero}</span>
      ),
    },
    {
      cle: 'client',
      titre: 'Client',
      rendu: (vente) => (
        <span className="text-stone-700">{vente.client?.nom ?? 'Client de passage'}</span>
      ),
    },
    {
      cle: 'date',
      titre: 'Date',
      rendu: (vente) => <span className="tabular text-stone-600">{date(vente.date)}</span>,
    },
    {
      cle: 'nbLignes',
      titre: 'Lignes',
      align: 'center',
      rendu: (vente) => <span className="tabular text-stone-600">{vente.nbLignes}</span>,
    },
    {
      cle: 'statut',
      titre: 'Statut',
      align: 'center',
      rendu: (vente) => {
        const statut = STATUTS_VENTE[vente.statut] ?? STATUTS_VENTE.payee;
        return <Badge ton={statut.ton}>{statut.libelle}</Badge>;
      },
    },
    {
      cle: 'total',
      titre: 'Total TTC',
      align: 'right',
      rendu: (vente) => (
        <span className="tabular font-semibold text-stone-900">{montant(vente.total)}</span>
      ),
    },
    {
      cle: 'actions',
      titre: '',
      align: 'right',
      rendu: (vente) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/ventes/${vente.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Voir ${vente.numero}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-900"
          >
            <Eye size={15} />
          </Link>
          <Button
            variante="discret"
            taille="icone"
            onClick={(e) => telecharger(vente, e)}
            aria-label={`Télécharger ${vente.numero}`}
          >
            <FileDown size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titre="Factures"
        description="Ventes enregistrées et documents à télécharger"
        compteur={ventes?.length}
        actions={
          <Button icone={Plus} onClick={() => setFormulaireOuvert(true)}>
            Nouvelle facture
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex-1 sm:max-w-[200px]">
            <span className="label">Client</span>
            <select value={filtres.clientId} onChange={majFiltre('clientId')} className="field">
              <option value="">Tous les clients</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:w-40">
            <span className="label">Statut</span>
            <select value={filtres.statut} onChange={majFiltre('statut')} className="field">
              <option value="">Tous</option>
              <option value="payee">Payée</option>
              <option value="en_attente">En attente</option>
              <option value="annulee">Annulée</option>
            </select>
          </label>

          <label className="sm:w-40">
            <span className="label">Du</span>
            <input type="date" value={filtres.du} onChange={majFiltre('du')} className="field tabular" />
          </label>

          <label className="sm:w-40">
            <span className="label">Au</span>
            <input type="date" value={filtres.au} onChange={majFiltre('au')} className="field tabular" />
          </label>

          {(filtres.clientId || filtres.statut || filtres.du || filtres.au) && (
            <Button
              variante="discret"
              onClick={() => setFiltres({ statut: '', clientId: '', du: '', au: '' })}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <Table
          colonnes={colonnes}
          donnees={ventes}
          chargement={chargement}
          erreur={erreur}
          onLigneClic={(vente) => naviguer(`/ventes/${vente.id}`)}
          vide={
            <EmptyState
              icone={ReceiptText}
              titre="Aucune facture"
              description="Créez une facture pour enregistrer une vente et décrémenter le stock."
              action={
                <Button icone={Plus} onClick={() => setFormulaireOuvert(true)}>
                  Nouvelle facture
                </Button>
              }
            />
          }
        />

        {ventes?.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-3">
            <span className="text-sm text-stone-500">
              {ventes.length} facture{ventes.length > 1 ? 's' : ''} affichée
              {ventes.length > 1 ? 's' : ''}
            </span>
            <span className="tabular text-sm font-bold text-stone-900">
              Total : {montant(totalAffiche)}
            </span>
          </div>
        )}
      </div>

      <VenteFormModal
        ouvert={formulaireOuvert}
        onFermer={() => setFormulaireOuvert(false)}
        onCree={(vente) => {
          setFormulaireOuvert(false);
          recharger();
          naviguer(`/ventes/${vente.id}`);
        }}
      />
    </>
  );
}
