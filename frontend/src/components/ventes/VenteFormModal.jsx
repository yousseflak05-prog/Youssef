import { useEffect, useMemo, useState } from 'react';

import api, { ApiError } from '../../lib/api.js';
import useFetch from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfig } from '../../context/ConfigContext.jsx';
import { montant, dateInput } from '../../lib/format.js';

import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Select } from '../ui/Field.jsx';
import LignesDocument from './LignesDocument.jsx';

const LIGNE_VIDE = { produitId: '', quantite: '1', prixUnitaire: '', prixModifie: false };

const etatInitial = () => ({
  clientId: '',
  date: dateInput(),
  statut: 'payee',
  lignes: [{ ...LIGNE_VIDE }],
});

/** Formulaire de création d'une facture, avec totaux calculés en direct. */
export default function VenteFormModal({ ouvert, onFermer, onCree }) {
  const toast = useToast();
  const { tvaRate } = useConfig();

  const { donnees: clients } = useFetch(() => api.get('/clients'));
  const { donnees: produits } = useFetch(() => api.get('/produits'));

  const [valeurs, setValeurs] = useState(etatInitial);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Repart d'un formulaire vierge à chaque ouverture.
  useEffect(() => {
    if (ouvert) {
      setValeurs(etatInitial());
      setErreur(null);
    }
  }, [ouvert]);

  // Le total affiché reprend le calcul du serveur (arrondi ligne par ligne)
  // pour qu'aucun écart de centime n'apparaisse après enregistrement.
  const totaux = useMemo(() => {
    const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
    const totalHt = round2(
      valeurs.lignes.reduce(
        (somme, ligne) => somme + round2(Number(ligne.quantite || 0) * Number(ligne.prixUnitaire || 0)),
        0
      )
    );
    const tva = round2(totalHt * tvaRate);
    return { totalHt, tva, total: round2(totalHt + tva) };
  }, [valeurs.lignes, tvaRate]);

  const lignesValides = valeurs.lignes.filter((l) => l.produitId && Number(l.quantite) > 0);

  const stockDepasse = valeurs.lignes.some((ligne) => {
    const produit = produits?.find((p) => String(p.id) === String(ligne.produitId));
    return produit && Number(ligne.quantite || 0) > produit.stock;
  });

  const enregistrer = async (e) => {
    e.preventDefault();

    if (lignesValides.length === 0) {
      setErreur('Ajoutez au moins une ligne avec un produit et une quantité.');
      return;
    }

    setEnregistrement(true);
    setErreur(null);

    try {
      const vente = await api.post('/ventes', {
        clientId: valeurs.clientId ? Number(valeurs.clientId) : null,
        date: new Date(`${valeurs.date}T12:00:00`).toISOString(),
        statut: valeurs.statut,
        items: lignesValides.map((ligne) => ({
          produitId: Number(ligne.produitId),
          quantite: Number(ligne.quantite),
          prixUnitaire: Number(ligne.prixUnitaire),
        })),
      });

      toast.succes(`Facture ${vente.numero} créée · stock mis à jour.`);
      onCree(vente);
    } catch (e) {
      // Un 409 signale un stock devenu insuffisant entre l'affichage et l'envoi.
      setErreur(e instanceof ApiError ? e.message : 'Enregistrement impossible.');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <Modal
      ouvert={ouvert}
      onFermer={onFermer}
      titre="Nouvelle facture"
      sousTitre="Le stock des produits est décrémenté à l'enregistrement."
      largeur="xl"
      pied={
        <>
          <Button variante="secondaire" onClick={onFermer}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="formulaire-vente"
            chargement={enregistrement}
            disabled={stockDepasse}
          >
            Créer la facture
          </Button>
        </>
      }
    >
      <form id="formulaire-vente" onSubmit={enregistrer} className="space-y-5">
        {erreur && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {erreur}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Client"
            value={valeurs.clientId}
            onChange={(e) => setValeurs((v) => ({ ...v, clientId: e.target.value }))}
          >
            <option value="">Client de passage</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
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

          <Select
            label="Statut"
            value={valeurs.statut}
            onChange={(e) => setValeurs((v) => ({ ...v, statut: e.target.value }))}
          >
            <option value="payee">Payée</option>
            <option value="en_attente">En attente</option>
          </Select>
        </div>

        <div>
          <p className="label">Lignes de la facture</p>
          <LignesDocument
            lignes={valeurs.lignes}
            onChange={(lignes) => setValeurs((v) => ({ ...v, lignes }))}
            produits={produits}
            champPrix="prixVente"
            controlerStock
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
  );
}
