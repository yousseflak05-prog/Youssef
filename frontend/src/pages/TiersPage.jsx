import { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone, MapPin, UserPlus } from 'lucide-react';

import api, { ApiError } from '../lib/api.js';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { useToast } from '../context/ToastContext.jsx';
import { initiales } from '../lib/format.js';

import PageHeader from '../components/ui/PageHeader.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Input, Textarea } from '../components/ui/Field.jsx';

const FORMULAIRE_VIDE = { nom: '', telephone: '', email: '', adresse: '' };

/**
 * Page de gestion d'un tiers (client ou fournisseur). Les deux fiches étant
 * identiques, la page est partagée et paramétrée par les libellés et la
 * ressource d'API.
 */
export default function TiersPage({ ressource, titre, singulier, description, colonneDocuments }) {
  const toast = useToast();

  const [recherche, setRecherche] = useState('');
  const rechercheDifferee = useDebounce(recherche);

  const {
    donnees: tiers,
    chargement,
    erreur,
    recharger,
  } = useFetch(() => api.get(`/${ressource}`, { q: rechercheDifferee }), [rechercheDifferee]);

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [valeurs, setValeurs] = useState(FORMULAIRE_VIDE);
  const [erreursChamps, setErreursChamps] = useState({});
  const [enregistrement, setEnregistrement] = useState(false);

  const [aSupprimer, setASupprimer] = useState(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const ouvrirCreation = () => {
    setEnEdition(null);
    setValeurs(FORMULAIRE_VIDE);
    setErreursChamps({});
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (ligne) => {
    setEnEdition(ligne);
    setValeurs({
      nom: ligne.nom ?? '',
      telephone: ligne.telephone ?? '',
      email: ligne.email ?? '',
      adresse: ligne.adresse ?? '',
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
        await api.put(`/${ressource}/${enEdition.id}`, valeurs);
        toast.succes(`${singulier} modifié.`);
      } else {
        await api.post(`/${ressource}`, valeurs);
        toast.succes(`${singulier} créé.`);
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

  /**
   * La suppression d'un tiers rattaché à des documents renvoie un 409 : on
   * réaffiche la demande avec le message de l'API, la validation rejouant
   * l'appel avec `force`.
   */
  const supprimer = async (forcer = false) => {
    setSuppressionEnCours(true);
    try {
      await api.delete(`/${ressource}/${aSupprimer.ligne.id}`, forcer ? { force: 'true' } : undefined);
      toast.succes(`${singulier} supprimé.`);
      setASupprimer(null);
      recharger();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.details?.confirmationRequise) {
        setASupprimer({ ligne: aSupprimer.ligne, avertissement: e.message });
      } else {
        toast.erreur(e.message);
        setASupprimer(null);
      }
    } finally {
      setSuppressionEnCours(false);
    }
  };

  const colonnes = [
    {
      cle: 'nom',
      titre: 'Nom',
      rendu: (ligne) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500">
            {initiales(ligne.nom)}
          </span>
          <span className="font-semibold text-stone-900">{ligne.nom}</span>
        </div>
      ),
    },
    {
      cle: 'contact',
      titre: 'Contact',
      rendu: (ligne) => (
        <div className="space-y-0.5 text-xs">
          {ligne.telephone && (
            <p className="tabular flex items-center gap-1.5 text-stone-600">
              <Phone size={12} className="text-stone-400" aria-hidden />
              {ligne.telephone}
            </p>
          )}
          {ligne.email && (
            <p className="flex items-center gap-1.5 text-stone-600">
              <Mail size={12} className="text-stone-400" aria-hidden />
              {ligne.email}
            </p>
          )}
          {!ligne.telephone && !ligne.email && <span className="text-stone-400">—</span>}
        </div>
      ),
    },
    {
      cle: 'adresse',
      titre: 'Adresse',
      rendu: (ligne) =>
        ligne.adresse ? (
          <span className="flex items-start gap-1.5 text-xs text-stone-600">
            <MapPin size={12} className="mt-0.5 shrink-0 text-stone-400" aria-hidden />
            {ligne.adresse}
          </span>
        ) : (
          <span className="text-stone-400">—</span>
        ),
    },
    {
      cle: 'nbDocuments',
      titre: colonneDocuments,
      align: 'center',
      rendu: (ligne) => <span className="tabular text-stone-700">{ligne.nbDocuments}</span>,
    },
    {
      cle: 'actions',
      titre: '',
      align: 'right',
      rendu: (ligne) => (
        <div className="flex justify-end gap-1">
          <Button
            variante="discret"
            taille="icone"
            onClick={() => ouvrirEdition(ligne)}
            aria-label={`Modifier ${ligne.nom}`}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variante="dangerDiscret"
            taille="icone"
            onClick={() => setASupprimer({ ligne, avertissement: null })}
            aria-label={`Supprimer ${ligne.nom}`}
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
        titre={titre}
        description={description}
        compteur={tiers?.length}
        actions={
          <Button icone={Plus} onClick={ouvrirCreation}>
            Nouveau
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="border-b border-stone-200 p-4">
          <SearchInput
            valeur={recherche}
            onChange={setRecherche}
            placeholder="Rechercher par nom, email ou téléphone…"
            className="max-w-md"
          />
        </div>

        <Table
          colonnes={colonnes}
          donnees={tiers}
          chargement={chargement}
          erreur={erreur}
          vide={
            <EmptyState
              icone={UserPlus}
              titre={recherche ? 'Aucun résultat' : `Aucun ${singulier.toLowerCase()}`}
              description={
                recherche
                  ? `Aucune fiche ne correspond à « ${recherche} ».`
                  : `Créez votre premier ${singulier.toLowerCase()} pour commencer.`
              }
              action={
                !recherche && (
                  <Button icone={Plus} onClick={ouvrirCreation}>
                    Nouveau {singulier.toLowerCase()}
                  </Button>
                )
              }
            />
          }
        />
      </div>

      <Modal
        ouvert={formulaireOuvert}
        onFermer={() => setFormulaireOuvert(false)}
        titre={enEdition ? `Modifier ${enEdition.nom}` : `Nouveau ${singulier.toLowerCase()}`}
        sousTitre="Les champs marqués d'une étoile sont obligatoires."
        pied={
          <>
            <Button variante="secondaire" onClick={() => setFormulaireOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" form="formulaire-tiers" chargement={enregistrement}>
              {enEdition ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <form id="formulaire-tiers" onSubmit={enregistrer} className="space-y-4">
          <Input
            label="Nom"
            obligatoire
            autoFocus
            value={valeurs.nom}
            onChange={modifier('nom')}
            erreur={erreursChamps.nom}
            placeholder="Atlas Distribution"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Téléphone"
              value={valeurs.telephone}
              onChange={modifier('telephone')}
              erreur={erreursChamps.telephone}
              placeholder="+212 6 00 00 00 00"
              mono
            />
            <Input
              label="Email"
              type="email"
              value={valeurs.email}
              onChange={modifier('email')}
              erreur={erreursChamps.email}
              placeholder="contact@exemple.ma"
            />
          </div>

          <Textarea
            label="Adresse"
            value={valeurs.adresse}
            onChange={modifier('adresse')}
            erreur={erreursChamps.adresse}
            placeholder="12 Avenue Hassan II, Casablanca"
          />
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={Boolean(aSupprimer)}
        onFermer={() => setASupprimer(null)}
        onConfirmer={() => supprimer(Boolean(aSupprimer?.avertissement))}
        chargement={suppressionEnCours}
        titre={`Supprimer ${aSupprimer?.ligne.nom ?? ''} ?`}
        libelleConfirmation={aSupprimer?.avertissement ? 'Supprimer quand même' : 'Supprimer'}
        message={
          aSupprimer?.avertissement ??
          `Cette fiche sera définitivement supprimée. Cette action est irréversible.`
        }
      />
    </>
  );
}
