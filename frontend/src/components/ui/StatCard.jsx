import { TrendingUp, TrendingDown } from 'lucide-react';

import { pourcentage } from '../../lib/format.js';

const TONS = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  stone: 'bg-stone-100 text-stone-500',
  blue: 'bg-sky-50 text-sky-600',
};

/** Tuile d'indicateur du tableau de bord. */
export default function StatCard({ libelle, valeur, detail, icone: Icone, ton = 'stone', evolution }) {
  const enHausse = evolution !== null && evolution !== undefined && evolution >= 0;
  const Tendance = enHausse ? TrendingUp : TrendingDown;

  return (
    <div className="card p-5 transition hover:border-stone-300">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{libelle}</p>
        {Icone && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONS[ton]}`}>
            <Icone size={16} />
          </span>
        )}
      </div>

      <p className="tabular mt-3 text-2xl font-bold tracking-tight text-stone-900">{valeur}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {evolution !== null && evolution !== undefined && (
          <span
            className={`tabular inline-flex items-center gap-1 text-xs font-semibold
                        ${enHausse ? 'text-emerald-600' : 'text-red-600'}`}
          >
            <Tendance size={13} aria-hidden />
            {pourcentage(evolution)}
          </span>
        )}
        {detail && <span className="text-xs text-stone-500">{detail}</span>}
      </div>
    </div>
  );
}
