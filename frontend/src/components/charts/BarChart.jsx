import { useState } from 'react';

import { montant, montantCompact } from '../../lib/format.js';

/**
 * Histogramme d'une seule série (chiffre d'affaires mensuel), en SVG inline.
 *
 * Série unique → pas de légende, le titre de la carte nomme la mesure. Les
 * barres partagent une seule teinte (emerald-600), la grille reste discrète et
 * seule la barre survolée affiche son montant exact ; la plus haute est
 * étiquetée en permanence pour donner l'échelle sans surcharger.
 */
export default function BarChart({ donnees, hauteur = 200 }) {
  const [survolee, setSurvolee] = useState(null);

  const maximum = Math.max(...donnees.map((d) => d.valeur), 1);
  const indexMax = donnees.findIndex((d) => d.valeur === maximum);

  return (
    <div className="relative">
      {/* `pt-7` réserve la bande où s'affichent les étiquettes : sans elle,
          celle du plus haut barreau viendrait le recouvrir. */}
      <div className="flex items-end gap-2 pt-7" style={{ height: hauteur }}>
        {donnees.map((point, index) => {
          const ratio = point.valeur / maximum;
          const actif = survolee === index;

          return (
            <div
              key={point.cle}
              className="group relative flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setSurvolee(index)}
              onMouseLeave={() => setSurvolee(null)}
            >
              {/* Étiquette : toujours sur le maximum, sinon au survol */}
              {(actif || index === indexMax) && point.valeur > 0 && (
                <span className="tabular absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-semibold text-white shadow-pop">
                  {actif ? montant(point.valeur) : montantCompact(point.valeur)}
                </span>
              )}

              <div
                className={`w-full rounded-t transition-all duration-200
                            ${actif ? 'bg-emerald-700' : 'bg-emerald-600'}
                            ${point.valeur === 0 ? 'bg-stone-200' : ''}`}
                style={{ height: `${Math.max(ratio * 100, point.valeur > 0 ? 3 : 1.5)}%` }}
                role="img"
                aria-label={`${point.libelle} : ${montant(point.valeur)}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2 border-t border-stone-200 pt-2">
        {donnees.map((point, index) => (
          <span
            key={point.cle}
            className={`flex-1 text-center text-[11px] capitalize transition
                        ${survolee === index ? 'font-semibold text-stone-800' : 'text-stone-500'}`}
          >
            {point.libelle}
          </span>
        ))}
      </div>
    </div>
  );
}
