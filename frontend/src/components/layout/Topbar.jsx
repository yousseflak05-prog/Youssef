import { useEffect, useRef, useState } from 'react';
import { Menu, LogOut, ChevronDown, UserRound } from 'lucide-react';

import { useAuth } from '../../context/AuthContext.jsx';
import { initiales } from '../../lib/format.js';

/** Barre supérieure : ouverture du menu mobile et menu utilisateur. */
export default function Topbar({ onOuvrirMenu }) {
  const { utilisateur, deconnexion } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const conteneur = useRef(null);

  // Ferme le menu au clic extérieur.
  useEffect(() => {
    if (!menuOuvert) return undefined;
    const surClic = (e) => {
      if (conteneur.current && !conteneur.current.contains(e.target)) setMenuOuvert(false);
    };
    document.addEventListener('mousedown', surClic);
    return () => document.removeEventListener('mousedown', surClic);
  }, [menuOuvert]);

  const aujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOuvrirMenu}
          aria-label="Ouvrir le menu"
          className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <p className="hidden text-sm capitalize text-stone-500 sm:block">{aujourdhui}</p>
      </div>

      <div className="relative" ref={conteneur}>
        <button
          type="button"
          onClick={() => setMenuOuvert((o) => !o)}
          aria-expanded={menuOuvert}
          aria-haspopup="menu"
          className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 transition hover:bg-stone-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            {initiales(utilisateur?.username ?? 'Admin')}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold text-stone-800">{utilisateur?.username}</span>
            <span className="block text-[11px] capitalize text-stone-500">{utilisateur?.role}</span>
          </span>
          <ChevronDown size={15} className="text-stone-400" aria-hidden />
        </button>

        {menuOuvert && (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-pop animate-slide-up"
          >
            <div className="flex items-center gap-2.5 border-b border-stone-100 px-4 py-3">
              <UserRound size={16} className="text-stone-400" aria-hidden />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-stone-800">{utilisateur?.username}</p>
                <p className="text-xs text-stone-500">Connecté</p>
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={deconnexion}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={16} aria-hidden />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
