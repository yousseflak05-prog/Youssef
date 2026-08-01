import { Trash2, Plus } from 'lucide-react';

import { montant } from '../../lib/format.js';
import Button from '../ui/Button.jsx';

/**
 * Éditeur des lignes d'un document commercial (facture ou achat).
 *
 * Partagé entre ventes et achats : seul le champ de prix par défaut change
 * (`prixVente` ou `prixAchat`), ainsi que l'affichage du stock disponible,
 * pertinent uniquement à la vente.
 */
export default function LignesDocument({
  lignes,
  onChange,
  produits,
  champPrix,
  controlerStock = false,
}) {
  const modifierLigne = (index, champ, valeur) => {
    const suivantes = lignes.map((ligne, i) => {
      if (i !== index) return ligne;
      const majee = { ...ligne, [champ]: valeur };

      // Choisir un produit renseigne son prix catalogue, sauf si l'utilisateur
      // a déjà saisi un prix manuellement sur cette ligne.
      if (champ === 'produitId') {
        const produit = produits?.find((p) => String(p.id) === String(valeur));
        if (produit && !ligne.prixModifie) majee.prixUnitaire = String(produit[champPrix]);
      }
      if (champ === 'prixUnitaire') majee.prixModifie = true;

      return majee;
    });
    onChange(suivantes);
  };

  const ajouter = () =>
    onChange([...lignes, { produitId: '', quantite: '1', prixUnitaire: '', prixModifie: false }]);

  const retirer = (index) => onChange(lignes.filter((_, i) => i !== index));

  const produitDe = (ligne) => produits?.find((p) => String(p.id) === String(ligne.produitId));

  const totalLigne = (ligne) => Number(ligne.quantite || 0) * Number(ligne.prixUnitaire || 0);

  return (
    <div className="space-y-2">
      <div className="hidden gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-stone-500 sm:flex">
        <span className="flex-1">Produit</span>
        <span className="w-20 text-right">Qté</span>
        <span className="w-28 text-right">P.U. HT</span>
        <span className="w-28 text-right">Total</span>
        <span className="w-8" />
      </div>

      {lignes.map((ligne, index) => {
        const produit = produitDe(ligne);
        const quantite = Number(ligne.quantite || 0);
        const stockInsuffisant = controlerStock && produit && quantite > produit.stock;

        return (
          <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1">
              <select
                value={ligne.produitId}
                onChange={(e) => modifierLigne(index, 'produitId', e.target.value)}
                aria-label={`Produit de la ligne ${index + 1}`}
                className={`field ${stockInsuffisant ? 'field-error' : ''}`}
                required
              >
                <option value="">Sélectionner un produit…</option>
                {produits?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                    {controlerStock ? ` — ${p.stock} en stock` : ''}
                  </option>
                ))}
              </select>
              {stockInsuffisant && (
                <p className="mt-1 text-xs text-red-600">
                  Stock insuffisant : {produit.stock} disponible{produit.stock > 1 ? 's' : ''}.
                </p>
              )}
            </div>

            <input
              type="number"
              min="1"
              step="1"
              value={ligne.quantite}
              onChange={(e) => modifierLigne(index, 'quantite', e.target.value)}
              aria-label={`Quantité de la ligne ${index + 1}`}
              className={`field tabular text-right sm:w-20 ${stockInsuffisant ? 'field-error' : ''}`}
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={ligne.prixUnitaire}
              onChange={(e) => modifierLigne(index, 'prixUnitaire', e.target.value)}
              aria-label={`Prix unitaire de la ligne ${index + 1}`}
              placeholder="0,00"
              className="field tabular text-right sm:w-28"
              required
            />

            <span className="tabular flex h-10 items-center justify-end px-1 text-sm font-semibold text-stone-900 sm:w-28">
              {montant(totalLigne(ligne), { avecDevise: false })}
            </span>

            <Button
              variante="dangerDiscret"
              taille="icone"
              onClick={() => retirer(index)}
              disabled={lignes.length === 1}
              aria-label={`Supprimer la ligne ${index + 1}`}
              className="mt-0 shrink-0 sm:mt-1"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        );
      })}

      <Button variante="secondaire" taille="sm" icone={Plus} onClick={ajouter} className="mt-1">
        Ajouter une ligne
      </Button>
    </div>
  );
}
