import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const TONS = {
  succes: { Icone: CheckCircle2, couleur: 'text-emerald-600', bord: 'border-l-emerald-500' },
  erreur: { Icone: AlertCircle, couleur: 'text-red-600', bord: 'border-l-red-500' },
  info: { Icone: Info, couleur: 'text-sky-600', bord: 'border-l-sky-500' },
};

/** Pile de notifications, rendue au-dessus de tout via un portail. */
export default function Toasts({ messages, onFermer }) {
  if (!messages.length) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {messages.map(({ id, texte, ton }) => {
        const { Icone, couleur, bord } = TONS[ton] ?? TONS.info;
        return (
          <div
            key={id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-stone-200 ${bord}
                        border-l-4 bg-white px-4 py-3 shadow-pop animate-slide-up`}
          >
            <Icone size={18} className={`mt-0.5 shrink-0 ${couleur}`} aria-hidden />
            <p className="flex-1 text-sm leading-snug text-stone-700">{texte}</p>
            <button
              type="button"
              onClick={() => onFermer(id)}
              aria-label="Fermer la notification"
              className="-mr-1 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
