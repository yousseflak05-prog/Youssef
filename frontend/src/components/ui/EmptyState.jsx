import { Inbox, AlertCircle } from 'lucide-react';

const TONS = {
  neutre: { fond: 'bg-stone-100 text-stone-400', Icone: Inbox },
  erreur: { fond: 'bg-red-50 text-red-500', Icone: AlertCircle },
};

/** Affiché à la place d'une liste vide ou en erreur. */
export default function EmptyState({ titre, description, action, icone, ton = 'neutre' }) {
  const { fond, Icone } = TONS[ton];
  const IconeFinale = icone ?? Icone;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${fond}`}>
        <IconeFinale size={22} />
      </div>
      <h3 className="text-base font-bold tracking-tight text-stone-800">{titre}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
