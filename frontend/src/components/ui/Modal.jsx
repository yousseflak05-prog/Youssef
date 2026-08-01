import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const LARGEURS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

/**
 * Fenêtre modale : ferme sur Échap, verrouille le défilement de la page et
 * ignore les clics sur le contenu (seul le fond ferme).
 */
export default function Modal({ ouvert, onFermer, titre, sousTitre, largeur = 'md', pied, children }) {
  useEffect(() => {
    if (!ouvert) return undefined;

    const surTouche = (e) => e.key === 'Escape' && onFermer();
    document.addEventListener('keydown', surTouche);

    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', surTouche);
      document.body.style.overflow = overflowInitial;
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/40 p-4 backdrop-blur-sm animate-fade-in sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onFermer()}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      <div
        className={`card my-auto w-full ${LARGEURS[largeur]} animate-slide-up shadow-pop`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900">{titre}</h2>
            {sousTitre && <p className="mt-0.5 text-sm text-stone-500">{sousTitre}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-5 py-5">{children}</div>

        {pied && (
          <footer className="flex justify-end gap-2 rounded-b-xl border-t border-stone-200 bg-stone-50 px-5 py-3.5">
            {pied}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
