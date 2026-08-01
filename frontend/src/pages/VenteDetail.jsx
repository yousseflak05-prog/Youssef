import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Trash2, CheckCircle2, Clock3 } from 'lucide-react';

import api from '../lib/api.js';
import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { montant, date, dateHeure, STATUTS_VENTE } from '../lib/format.js';

import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';

export default function VenteDetail() {
  const { id } = useParams();
  const toast = useToast();
  const naviguer = useNavigate();
  const { tvaRate, company } = useConfig();

  const { donnees: vente, chargement, erreur, recharger } = useFetch(
    () => api.get(`/ventes/${id}`),
    [id]
  );

  const [telechargement, setTelechargement] = useState(false);
  const [changementStatut, setChangementStatut] = useState(false);
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  if (chargement) {
    return (
      <div className="flex justify-center py-24">
        <Spinner taille={28} />
      </div>
    );
  }

  if (erreur || !vente) {
    return (
      <EmptyState
        ton="erreur"
        titre="Facture introuvable"
        description={erreur ?? "Cette facture n'existe pas ou a été supprimée."}
        action={
          <Link to="/ventes">
            <Button variante="secondaire" icone={ArrowLeft}>
              Retour aux factures
            </Button>
          </Link>
        }
      />
    );
  }

  const statut = STATUTS_VENTE[vente.statut] ?? STATUTS_VENTE.payee;

  const telecharger = async () => {
    setTelechargement(true);
    try {
      await api.telechargerPdf(`/ventes/${vente.id}/pdf`, `${vente.numero}.pdf`);
      toast.succes('PDF téléchargé.');
    } catch (e) {
      toast.erreur(e.message);
    } finally {
      setTelechargement(false);
    }
  };

  const changerStatut = async (nouveau) => {
    setChangementStatut(true);
    try {
      await api.patch(`/ventes/${vente.id}/statut`, { statut: nouveau });
      toast.succes(nouveau === 'payee' ? 'Facture marquée payée.' : 'Facture remise en attente.');
      recharger();
    } catch (e) {
      toast.erreur(e.message);
    } finally {
      setChangementStatut(false);
    }
  };

  const supprimer = async () => {
    setSuppressionEnCours(true);
    try {
      await api.delete(`/ventes/${vente.id}`);
      toast.succes('Facture annulée · stock restitué.');
      naviguer('/ventes');
    } catch (e) {
      toast.erreur(e.message);
      setSuppressionEnCours(false);
      setConfirmationOuverte(false);
    }
  };

  return (
    <>
      <Link
        to="/ventes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-800"
      >
        <ArrowLeft size={15} aria-hidden />
        Retour aux factures
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="tabular text-2xl font-extrabold tracking-tight text-stone-900">
              {vente.numero}
            </h1>
            <Badge ton={statut.ton} point>
              {statut.libelle}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Émise le {date(vente.date)} · enregistrée le {dateHeure(vente.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {vente.statut === 'en_attente' ? (
            <Button
              variante="secondaire"
              icone={CheckCircle2}
              onClick={() => changerStatut('payee')}
              chargement={changementStatut}
            >
              Marquer payée
            </Button>
          ) : (
            vente.statut === 'payee' && (
              <Button
                variante="secondaire"
                icone={Clock3}
                onClick={() => changerStatut('en_attente')}
                chargement={changementStatut}
              >
                Mettre en attente
              </Button>
            )
          )}

          <Button icone={FileDown} onClick={telecharger} chargement={telechargement}>
            Télécharger le PDF
          </Button>

          <Button
            variante="dangerDiscret"
            taille="icone"
            onClick={() => setConfirmationOuverte(true)}
            aria-label="Annuler la facture"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <h2 className="border-b border-stone-200 px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-stone-500">
            Détail des lignes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th scope="col" className="px-5 py-2.5 text-left">Désignation</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Qté</th>
                  <th scope="col" className="px-5 py-2.5 text-right">P.U. HT</th>
                  <th scope="col" className="px-5 py-2.5 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {vente.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-stone-900">{item.designation}</p>
                      {item.produit?.categorie && (
                        <p className="text-xs text-stone-500">{item.produit.categorie}</p>
                      )}
                    </td>
                    <td className="tabular px-5 py-3 text-right text-stone-700">{item.quantite}</td>
                    <td className="tabular px-5 py-3 text-right text-stone-600">
                      {montant(item.prixUnitaire)}
                    </td>
                    <td className="tabular px-5 py-3 text-right font-semibold text-stone-900">
                      {montant(item.prixUnitaire * item.quantite)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="space-y-1.5 border-t border-stone-200 bg-stone-50 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Total HT</dt>
              <dd className="tabular text-stone-700">{montant(vente.totalHt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">TVA ({Math.round(tvaRate * 100)} %)</dt>
              <dd className="tabular text-stone-700">{montant(vente.tva)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2">
              <dt className="text-base font-bold text-stone-900">Total TTC</dt>
              <dd className="tabular text-base font-bold text-emerald-700">{montant(vente.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">Client</h2>

            {vente.client ? (
              <>
                <p className="text-base font-bold text-stone-900">{vente.client.nom}</p>
                <div className="mt-2 space-y-1 text-sm text-stone-600">
                  {vente.client.adresse && <p>{vente.client.adresse}</p>}
                  {vente.client.telephone && <p className="tabular">{vente.client.telephone}</p>}
                  {vente.client.email && <p>{vente.client.email}</p>}
                </div>
                <Link
                  to="/clients"
                  className="mt-3 inline-block text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Voir les clients
                </Link>
              </>
            ) : (
              <p className="text-sm text-stone-500">
                Client de passage — aucune fiche rattachée à cette facture.
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">
              Émetteur
            </h2>
            <p className="text-base font-bold text-stone-900">{company?.name}</p>
            <div className="mt-2 space-y-1 text-sm text-stone-600">
              {company?.address && <p>{company.address}</p>}
              {company?.phone && <p className="tabular">{company.phone}</p>}
              {company?.email && <p>{company.email}</p>}
              {company?.ice && <p className="tabular text-xs text-stone-500">ICE : {company.ice}</p>}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        ouvert={confirmationOuverte}
        onFermer={() => setConfirmationOuverte(false)}
        onConfirmer={supprimer}
        chargement={suppressionEnCours}
        titre={`Annuler la facture ${vente.numero} ?`}
        libelleConfirmation="Annuler la facture"
        message="La facture sera supprimée et les quantités vendues seront remises en stock. Cette action est irréversible."
      />
    </>
  );
}
