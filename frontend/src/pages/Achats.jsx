import { useMemo, useState } from 'react';
import { Plus, ShoppingCart, Trash2, ChevronRight } from 'lucide-react';

import api, { ApiError } from '../lib/api.js';
import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { montant, date, dateInput } from '../lib/format.js';

import PageHeader from '../components/ui/PageHeader.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Select } from '../components/ui/Field.jsx';
import LignesDocument from '../components/ventes/LignesDocument.jsx';

const etatInitial = () => ({
  fournisseurId: '',
  date: dateInput(),
  lignes: [{ produitId: '', quantite: '1', prixUnitaire: '', prixModifie: false }],
});

export default function Achats() {
  const toast = useToast();
  const { tvaRate } = useConfig();

  const [fournisseurId, setFournisseurId] = useState('');
  const {
    donnees: achats,
    chargement,
    erreur,
    recharger,
  } = useFetch(() => api.get('/achats', { fournisseurId }), [fournisseurId]);

  const { donnees: fournisseurs } = useFetch(() => api.get('/fournisseurs'));
  const { donnees: produits, recharger: rechargerProduits } = useFetch(() => api.get('/produits'));

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [valeurs, setValeurs] = useState(etatInitial);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState(null);

  const [detail, setDetail] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const totaux = useMemo(() => {
    const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
    const totalHt = round2(
      valeurs.lignes.reduce(
        (somme, l) => somme + round2(Number(l.quantite || 0) * Number(l.prixUnitaire || 0)),
        0
      )
    );
    const tva = round2(totalHt * tvaRate);
    return { totalHt, tva, total: round2(totalHt + tva) };
  }, [valeurs.lignes, tvaRate]);

  const ouvrirCreation = () => {
    setValeurs(etatInitial());
    setErreurFormulaire(null);
    setFormulaireOuvert(true);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    const lignesValides = valeurs.lignes.filter((l) => l.produitId && Number(l.quantite) > 0);

    if (lignesValides.length === 0) {
      setErreurFormulaire('Ajoutez au moins une ligne avec un produit et une quantité.');
      return;
    }

    setEnregistrement(true);
    setErreurFormulaire(null);

    try {
      const achat = await api.post('/achats', {
        fournisseurId: valeurs.fournisseurId ? Number(valeurs.fournisseurId) : null,
        date: new Date(`${valeurs.date}T12:00:00`).toISOString(),
        items: lignesValides.map((l) => ({
          produitId: Number(l.produitId),
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
        })),
      });

      toast.succes(`Achat ${achat.numero} enregistré · stock réapprovisionné.`);
      setFormulaireOuvert(false);
      recharger();
      rechargerProduits();
    } catch (e) {
      setErreurFormulaire(e instanceof ApiError ? e.message : 'Enregistrement impossible.');
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async () => {
    setSuppressionEnCours(true);
    try {
      await api.delete(`/achats/${aSupprimer.id}`);
      toast.succes('Achat annulé · stock ajusté.');
      setASupprimer(null);
      recharger();
      rechargerProduits();
    } catch (e) {
      toast.erreur(e.message);
      setASupprimer(null);
    } finally {
      setSuppressionEnCours(false);
    }
  };

  const voirDetail = async (achat) => {
    try {
      setDetail(await api.get(`/achats/${achat.id}`));
    } catch (e) {
      toast.erreur(e.message);
    }
  };

  const colonnes = [
    {
      cle: 'numero',
      titre: 'N° achat',
      rendu: (achat) => <span className="tabular font-semibold text-stone-900">{achat.numero}</span>,
    },
    {
      cle: 'fournisseur',
      titre: 'Fournisseur',
      rendu: (achat) => (
        <span className="text-stone-700">{achat.fournisseur?.nom ?? 'Non renseigné'}</span>
      ),
    },
    {
      cle: 'date',
      titre: 'Date',
      rendu: (achat) => <span className="tabular text-stone-600">{date(achat.date)}</span>,
    },
    {
      cle: 'nbLignes',
      titre: 'Lignes',
      align: 'center',
      rendu: (achat) => <span className="tabular text-stone-600">{achat.nbLignes}</span>,
    },
    {
      cle: 'total',
      titre: 'Total TTC',
      align: 'right',
      rendu: (achat) => (
        <span className="tabular font-semibold text-stone-900">{montant(achat.total)}</span>
      ),
    },
    {
      cle: 'actions',
      titre: '',
      align: 'right',
      rendu: (achat) => (
        <div className="flex justify-end gap-1">
          <Button
            variante="discret"
            taille="icone"
            onClick={(e) => {
              e.stopPropagation();
              voirDetail(achat);
            }}
            aria-label={`Voir ${achat.numero}`}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variante="dangerDiscret"
            taille="icone"
            onClick={(e) => {
              e.stopPropagation();
              setASupprimer(achat);
            }}
            aria-label={`Annuler ${achat.numero}`}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titre="Achats"
        description="Réapprovisionnements fournisseurs — le stock est incrémenté à l'enregistrement"
        compteur={achats?.length}
        actions={
          <Button icone={Plus} onClick={ouvrirCreation}>
            Nouvel achat
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="border-b border-stone-200 p-4">
          <label className="block max-w-xs">
            <span className="label">Fournisseur</span>
            <select
              value={fournisseurId}
              onChange={(e) => setFournisseurId(e.target.value)}
              className="field"
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Table
          colonnes={colonnes}
          donnees={achats}
          chargement={chargement}
          erreur={erreur}
          onLigneClic={voirDetail}
          vide={
            <EmptyState
              icone={ShoppingCart}
              titre="Aucun achat"
              description="Enregistrez un achat pour réapprovisionner le stock."
              action={
                <Button icone={Plus} onClick={ouvrirCreation}>
                  Nouvel achat
                </Button>
              }
            />
          }
        />
      </div>

      {/* Création */}
      <Modal
        ouvert={formulaireOuvert}
        onFermer={() => setFormulaireOuvert(false)}
        titre="Nouvel achat"
        sousTitre="Le stock des produits est incrémenté à l'enregistrement."
        largeur="xl"
        pied={
          <>
            <Button variante="secondaire" onClick={() => setFormulaireOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" form="formulaire-achat" chargement={enregistrement}>
              Enregistrer l'achat
            </Button>
          </>
        }
      >
        <form id="formulaire-achat" onSubmit={enregistrer} className="space-y-5">
          {erreurFormulaire && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {erreurFormulaire}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Fournisseur"
              value={valeurs.fournisseurId}
              onChange={(e) => setValeurs((v) => ({ ...v, fournisseurId: e.target.value }))}
            >
              <option value="">Non renseigné</option>
              {fournisseurs?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </Select>

            <div>
              <span className="label">Date</span>
              <input
                type="date"
                value={valeurs.date}
                onChange={(e) => setValeurs((v) => ({ ...v, date: e.target.value }))}
                className="field tabular"
                required
              />
            </div>
          </div>

          <div>
            <p className="label">Lignes de l'achat</p>
            <LignesDocument
              lignes={valeurs.lignes}
              onChange={(lignes) => setValeurs((v) => ({ ...v, lignes }))}
              produits={produits}
              champPrix="prixAchat"
            />
          </div>

          <div className="flex justify-end">
            <dl className="w-full max-w-xs space-y-1.5 rounded-lg bg-stone-50 px-4 py-3.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Total HT</dt>
                <dd className="tabular text-stone-700">{montant(totaux.totalHt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">TVA ({Math.round(tvaRate * 100)} %)</dt>
                <dd className="tabular text-stone-700">{montant(totaux.tva)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-1.5">
                <dt className="font-bold text-stone-900">Total TTC</dt>
                <dd className="tabular font-bold text-emerald-700">{montant(totaux.total)}</dd>
              </div>
            </dl>
          </div>
        </form>
      </Modal>

      {/* Détail */}
      <Modal
        ouvert={Boolean(detail)}
        onFermer={() => setDetail(null)}
        titre={detail?.numero ?? ''}
        sousTitre={
          detail ? `${detail.fournisseur?.nom ?? 'Fournisseur non renseigné'} · ${date(detail.date)}` : ''
        }
        largeur="lg"
      >
        {detail && (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th scope="col" className="py-2 text-left">Désignation</th>
                  <th scope="col" className="py-2 text-right">Qté</th>
                  <th scope="col" className="py-2 text-right">P.U. HT</th>
                  <th scope="col" className="py-2 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {detail.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 text-stone-800">{item.designation}</td>
                    <td className="tabular py-2.5 text-right text-stone-700">{item.quantite}</td>
                    <td className="tabular py-2.5 text-right text-stone-600">
                      {montant(item.prixUnitaire)}
                    </td>
                    <td className="tabular py-2.5 text-right font-semibold text-stone-900">
                      {montant(item.prixUnitaire * item.quantite)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-4 space-y-1.5 border-t border-stone-200 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Total HT</dt>
                <dd className="tabular text-stone-700">{montant(detail.totalHt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">TVA</dt>
                <dd className="tabular text-stone-700">{montant(detail.tva)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold text-stone-900">Total TTC</dt>
                <dd className="tabular font-bold text-emerald-700">{montant(detail.total)}</dd>
              </div>
            </dl>
          </>
        )}
      </Modal>

      <ConfirmDialog
        ouvert={Boolean(aSupprimer)}
        onFermer={() => setASupprimer(null)}
        onConfirmer={supprimer}
        chargement={suppressionEnCours}
        titre={`Annuler l'achat ${aSupprimer?.numero ?? ''} ?`}
        libelleConfirmation="Annuler l'achat"
        message="Les quantités entrées par cet achat seront retirées du stock. L'opération échoue si elles ont déjà été vendues."
      />
    </>
  );
}
