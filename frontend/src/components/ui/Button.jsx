import { Loader2 } from 'lucide-react';

const VARIANTES = {
  primaire: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
  secondaire:
    'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 hover:border-stone-400',
  discret: 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  dangerDiscret: 'text-red-600 hover:bg-red-50',
};

const TAILLES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icone: 'h-8 w-8 justify-center',
};

/**
 * Bouton unique de l'application : gère l'état de chargement (spinner +
 * désactivation) pour qu'aucun formulaire ne puisse être soumis deux fois.
 */
export default function Button({
  variante = 'primaire',
  taille = 'md',
  icone: Icone,
  chargement = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || chargement}
      className={`inline-flex items-center rounded-lg font-semibold transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${VARIANTES[variante]} ${TAILLES[taille]} ${className}`}
      {...props}
    >
      {chargement ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        Icone && <Icone size={taille === 'sm' ? 14 : 16} aria-hidden />
      )}
      {children}
    </button>
  );
}
