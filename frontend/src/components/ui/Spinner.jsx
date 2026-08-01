import { Loader2 } from 'lucide-react';

export default function Spinner({ taille = 24, label = 'Chargement…' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-stone-500" role="status">
      <Loader2 size={taille} className="animate-spin text-emerald-600" aria-hidden />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </span>
  );
}
