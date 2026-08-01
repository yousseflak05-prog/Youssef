import { Search, X } from 'lucide-react';

/** Champ de recherche avec icône et bouton d'effacement. */
export default function SearchInput({ valeur, onChange, placeholder = 'Rechercher…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
