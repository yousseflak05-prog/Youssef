const TONS = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  stone: 'bg-stone-100 text-stone-600 ring-stone-500/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

/** Pastille d'état : statut de facture, alerte de stock, catégorie… */
export default function Badge({ ton = 'stone', point = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold
                  ring-1 ring-inset ${TONS[ton]} ${className}`}
    >
      {point && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
