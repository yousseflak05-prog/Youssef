import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

import api, { ApiError } from '../lib/api.js';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { useToast } from '../context/ToastContext.jsx';
import { montant } from '../lib/format.js';

import PageHeader from '../components/ui/PageHeader.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Input, Select } from '../components/ui/Field.jsx';

const FORMULAIRE_VIDE = {
  nom: '',
  categorie: '',
  prixAchat: '',
  prixVente: '',
  stock: '0',
  seuilAlerte: '5',
};

/** Pastille d'état du stock au regard du seuil d'alerte du produit. */
function EtatStock({ produit }) {
  if (produit.stock === 0) return <Badge ton="red">Rupture</Badge>;
  if (produit.stock <= produit.seuilAlerte) return <Badge ton="amber">Stock faible</Badge>;
  return <Badge ton="emerald">En stock</Badge>;
}

export default function Produits() {
  const toast = useToast();
  const [parametres, setParametres] = useSearchParams();

  const [recherche, setRecherche] = useState('');
  const rechercheDifferee = useDebounce(recherche);
  const categorie = parametres.get('categorie') ?? '';
  const stockFaible = parametres.get('stockFaible') === 'true';

  const {
    donnees: produits,
    chargement,
    erreur,
    recharger,
  } = useFetch(
    () =>
      api.get('/produits', {
        q: rechercheDifferee,
        categorie,
        stockFaible: stockFaible ? 'true' : '',
      }),
    [rechercheDifferee, categorie, stockFaible]
  );

  const { donnees: categories } = useFetch(() => api.get('/produits/categories'));

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [valeurs, setValeurs] = useState(FORMULAIRE_VIDE);
  const [erreursChamps, setErreursChamps] = useState({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [aSupprimer, setASupprimer] = useState(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const majFiltre = (cle, valeur) => {
    const suivants = new URLSearchParams(parametres);
    if (valeur) suivants.set(cle, valeur);
    else suivants.delete(cle);
    setParametres(suivants, { replace: true });
  };

  const ouvrirCreation = () => {
    setEnEdition(null);
    setValeurs(FORMULAIRE_VIDE);
    setErreursChamps({});
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (produit) => {
    setEnEdition(produit);
    setValeurs({
      nom: produit.nom,
      categorie: produit.categorie ?? '',
      prixAchat: String(produit.prixAchat),
      prixVente: String(produit.prixVente),
      stock: String(produit.stock),
      seuilAlerte: String(produit.seuilAlerte),
    });
    setErreursChamps({});
    setFormulaireOuvert(true);
  };

  const modifier = (champ) => (e) =>
    setValeurs((actuelles) => ({ ...actuelles, [champ]: e.target.value }));

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setErreursChamps({});

    try {
      if (enEdition) {
        await api.put(`/produits/${enEdition.id}`, valeurs);
        toast.succes('Produit modifié.');
      } else {
        await api.post('/produits', valeurs);
        toast.succes('Produit créé.');
      }
      setFormulaireOuvert(false);
      recharger();
    } catch (e) {
      if (e instanceof ApiError && e.details) setErreursChamps(e.parErreur);
      else toast.erreur(e.message);
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (forcer = false) => {
    setSuppressionEnCours(true);
    try {
      await api.delete(`/produits/${aSupprimer.produit.id}`, forcer ? { force: 'true' } : undefined);
      toast.succes('Produit supprimé.');
      setASupprimer(null);
      recharger();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.details?.confirmationRequise) {
        setASupprimer({ produit: aSupprimer.produit, avertissement: e.message });
      } else {
        toast.erreur(e.message);
        setASupprimer(null);
      }
    } finally {
      setSuppressionEnCours(false);
    }
  };

  // Marge unitaire, indicateur le plus utile au moment de fixer un prix.
  const marge = (produit) => Number(produit.prixVente) - Number(produit.prixAchat);

  const colonnes = [
    {
      cle: 'nom',
      titre: 'Produit',
      rendu: (produit) => (
        <div>
          <p className="font-semibold text-stone-900">{produit.nom}</p>
          <p className="text-xs text-stone-500">{produit.categorie ?? 'Sans catégorie'}</p>
        </div>
      ),
    },
    {
      cle: 'prixAchat',
      titre: "Prix d'achat",
      align: 'right',
      rendu: (produit) => <span className="tabular text-stone-600">{montant(produit.prixAchat)}</span>,
    },
    {
      cle: 'prixVente',
      titre: 'Prix de vente',
      align: 'right',
      rendu: (produit) => (
        <span className="tabular font-semibold text-stone-900">{montant(produit.prixVente)}</span>
      ),
    },
    {
      cle: 'marge',
      titre: 'Marge',
      align: 'right',
      rendu: (produit) => (
        <span className={`tabular ${marge(produit) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
          {montant(marge(produit))}
        </span>
      ),
    },
    {
      cle: 'stock',
      titre: 'Stock',
      align: 'center',
      rendu: (produit) => (
        <div className="flex flex-col items-center gap-1">
          <span className="tabular font-semibold text-stone-900">{produit.stock}</span>
          <EtatStock produit={produit} />
        </div>
      ),
    },
    {
      cle: 'actions',
      titre: '',
      align: 'right',
      rendu: (produit) => (
        <div className="flex justify-end gap-1">
          <Button
            variante="discret"
            taille="icone"
            onClick={() => ouvrirEdition(produit)}
            aria-label={`Modifier ${produit.nom}`}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variante="dangerDiscret"
            taille="icone"
            onClick={() => setASupprimer({ produit, avertissement: null })}
            aria-label={`Supprimer ${produit.nom}`}
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
        titre="Produits"
        description="Catalogue, prix et niveaux de stock"
        compteur={produits?.length}
        actions={
          <Button icone={Plus} onClick={ouvrirCreation}>
            Nouveau
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center">
          <SearchInput
            valeur={recherche}
            onChange={setRecherche}
            placeholder="Rechercher un produit…"
            className="sm:max-w-xs sm:flex-1"
          />

          <select
            value={categorie}
            onChange={(e) => majFiltre('categorie', e.target.value)}
            aria-label="Filtrer par catégorie"
            className="field sm:w-48"
          >
            <option value="">Toutes les catégories</option>
            {categories?.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={stockFaible}
              onChange={(e) => majFiltre('stockFaible', e.target.checked ? 'true' : '')}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            Stock faible uniquement
          </label>
        </div>

        <Table
          colonnes={colonnes}
          donnees={produits}
          chargement={chargement}
          erreur={erreur}
          vide={
            <EmptyState
              icone={Package}
              titre="Aucun produit"
              description={
                recherche || categorie || stockFaible
                  ? 'Aucun produit ne correspond à ces critères.'
                  : 'Ajoutez votre premier article au catalogue.'
              }
              action={
                <Button icone={Plus} onClick={ouvrirCreation}>
                  Nouveau produit
                </Button>
              }
            />
          }
        />
      </div>

      <Modal
        ouvert={formulaireOuvert}
        onFermer={() => setFormulaireOuvert(false)}
        titre={enEdition ? `Modifier ${enEdition.nom}` : 'Nouveau produit'}
        sousTitre="Le stock saisi ici est le stock de départ ; il évolue ensuite avec les ventes et les achats."
        pied={
          <>
            <Button variante="secondaire" onClick={() => setFormulaireOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" form="formulaire-produit" chargement={enregistrement}>
              {enEdition ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <form id="formulaire-produit" onSubmit={enregistrer} className="space-y-4">
          <Input
            label="Désignation"
            obligatoire
            autoFocus
            value={valeurs.nom}
            onChange={modifier('nom')}
            erreur={erreursChamps.nom}
            placeholder="Ordinateur portable 15&quot;"
          />

          <Select
            label="Catégorie"
            value={valeurs.categorie}
            onChange={modifier('categorie')}
            erreur={erreursChamps.categorie}
          >
            <option value="">Sans catégorie</option>
            {categories?.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {/* Autorise une catégorie encore absente du catalogue */}
            {valeurs.categorie && !categories?.includes(valeurs.categorie) && (
              <option value={valeurs.categorie}>{valeurs.categorie}</option>
            )}
          </Select>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Prix d'achat (DH)"
              type="number"
              step="0.01"
              min="0"
              obligatoire
              mono
              value={valeurs.prixAchat}
              onChange={modifier('prixAchat')}
              erreur={erreursChamps.prixAchat}
            />
            <Input
              label="Prix de vente (DH)"
              type="number"
              step="0.01"
              min="0"
              obligatoire
              mono
              value={valeurs.prixVente}
              onChange={modifier('prixVente')}
              erreur={erreursChamps.prixVente}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Stock"
              type="number"
              min="0"
              obligatoire
              mono
              value={valeurs.stock}
              onChange={modifier('stock')}
              erreur={erreursChamps.stock}
            />
            <Input
              label="Seuil d'alerte"
              type="number"
              min="0"
              mono
              value={valeurs.seuilAlerte}
              onChange={modifier('seuilAlerte')}
              erreur={erreursChamps.seuilAlerte}
              aide="En dessous, le produit remonte en alerte."
            />
          </div>

          {Number(valeurs.prixVente) > 0 && Number(valeurs.prixAchat) > 0 && (
            <p className="rounded-lg bg-stone-50 px-3.5 py-2.5 text-sm text-stone-600">
              Marge unitaire :{' '}
              <span className="tabular font-semibold text-emerald-700">
                {montant(Number(valeurs.prixVente) - Number(valeurs.prixAchat))}
              </span>
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={Boolean(aSupprimer)}
        onFermer={() => setASupprimer(null)}
        onConfirmer={() => supprimer(Boolean(aSupprimer?.avertissement))}
        chargement={suppressionEnCours}
        titre={`Supprimer ${aSupprimer?.produit.nom ?? ''} ?`}
        libelleConfirmation={aSupprimer?.avertissement ? 'Supprimer quand même' : 'Supprimer'}
        message={
          aSupprimer?.avertissement ??
          'Ce produit sera retiré du catalogue. Cette action est irréversible.'
        }
      />
    </>
  );
}
