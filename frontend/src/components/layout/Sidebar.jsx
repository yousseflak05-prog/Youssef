import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  ReceiptText,
  ShoppingCart,
  BookOpen,
  X,
} from 'lucide-react';

const RUBRIQUES = [
  {
    titre: 'Pilotage',
    liens: [{ to: '/', libelle: 'Tableau de bord', icone: LayoutDashboard, exact: true }],
  },
  {
    titre: 'Commercial',
    liens: [
      { to: '/ventes', libelle: 'Factures', icone: ReceiptText },
      { to: '/clients', libelle: 'Clients', icone: Users },
    ],
  },
  {
    titre: 'Approvisionnement',
    liens: [
      { to: '/produits', libelle: 'Produits', icone: Package },
      { to: '/achats', libelle: 'Achats', icone: ShoppingCart },
      { to: '/fournisseurs', libelle: 'Fournisseurs', icone: Truck },
    ],
  },
];

/**
 * Navigation principale. Fixe à partir de `lg`, en tiroir sur mobile
 * (`ouvert` piloté par la barre supérieure).
 */
export default function Sidebar({ ouvert, onFermer }) {
  const lienClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
     ${
       isActive
         ? 'bg-stone-800 text-white'
         : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-100'
     }`;

  return (
    <>
      {/* Voile de fond, mobile uniquement */}
      {ouvert && (
        <div
          className="fixed inset-0 z-30 bg-stone-900/50 backdrop-blur-sm lg:hidden"
          onClick={onFermer}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-stone-900 transition-transform duration-200
                    lg:translate-x-0 ${ouvert ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-stone-800 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <BookOpen size={17} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight text-white">Registre</p>
              <p className="text-[11px] text-stone-500">Gestion commerciale</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le menu"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-800 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {RUBRIQUES.map((rubrique) => (
            <div key={rubrique.titre}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-600">
                {rubrique.titre}
              </p>
              <div className="space-y-0.5">
                {rubrique.liens.map(({ to, libelle, icone: Icone, exact }) => (
                  <NavLink key={to} to={to} end={exact} className={lienClasses} onClick={onFermer}>
                    <Icone size={17} aria-hidden />
                    {libelle}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-stone-800 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-stone-600">
            Registre ERP · v1.0
            <br />
            Démonstration
          </p>
        </div>
      </aside>
    </>
  );
}
