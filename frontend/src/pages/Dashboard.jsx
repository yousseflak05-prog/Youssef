import { Link } from 'react-router-dom';
import {
  Wallet,
  Users,
  Boxes,
  TriangleAlert,
  ArrowRight,
  ReceiptText,
  Clock3,
  Trophy,
} from 'lucide-react';

import api from '../lib/api.js';
import useFetch from '../hooks/useFetch.js';
import { montant, montantCompact, nombre, date, moisCourt, STATUTS_VENTE } from '../lib/format.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import BarChart from '../components/charts/BarChart.jsx';

export default function Dashboard() {
  const { donnees: stats, chargement, erreur } = useFetch(() => api.get('/dashboard/stats'));
  const { donnees: serie } = useFetch(() => api.get('/dashboard/ca-mensuel', { mois: 6 }));
  const { donnees: top } = useFetch(() => api.get('/dashboard/top-produits', { limit: 5 }));

  if (chargement) {
    return (
      <div className="flex justify-center py-24">
        <Spinner taille={28} />
      </div>
    );
  }

  if (erreur) {
    return <EmptyState ton="erreur" titre="Tableau de bord indisponible" description={erreur} />;
  }

  return (
    <>
      <PageHeader
        titre="Tableau de bord"
        description="Vue d'ensemble de l'activité commerciale"
      />

      {/* Indicateurs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          libelle="Chiffre d'affaires"
          valeur={montantCompact(stats.ca.total)}
          icone={Wallet}
          ton="emerald"
          detail={`${nombre(stats.compteurs.ventes)} factures`}
        />
        <StatCard
          libelle="CA du mois"
          valeur={montantCompact(stats.ca.mois)}
          icone={ReceiptText}
          ton="blue"
          evolution={stats.ca.evolution}
          detail="vs mois précédent"
        />
        <StatCard
          libelle="Clients"
          valeur={nombre(stats.compteurs.clients)}
          icone={Users}
          ton="stone"
          detail={`panier moyen ${montantCompact(stats.ca.panierMoyen)}`}
        />
        <StatCard
          libelle="Stock total"
          valeur={`${nombre(stats.stock.total)} u.`}
          icone={Boxes}
          ton={stats.stock.nbAlertes > 0 ? 'amber' : 'stone'}
          detail={`valorisé ${montantCompact(stats.stock.valeurAchat)}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Évolution du CA */}
        <section className="card p-5 lg:col-span-2">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-stone-900">
                Chiffre d'affaires mensuel
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">TTC, 6 derniers mois</p>
            </div>
            {serie && (
              <span className="text-right text-xs text-stone-500">
                Cumul
                <span className="tabular ml-1.5 text-sm font-semibold text-stone-700">
                  {montantCompact(serie.reduce((somme, point) => somme + point.total, 0))}
                </span>
              </span>
            )}
          </div>

          {serie ? (
            <BarChart
              donnees={serie.map((point) => ({
                cle: point.mois,
                libelle: moisCourt(point.mois),
                valeur: point.total,
              }))}
            />
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <Spinner />
            </div>
          )}
        </section>

        {/* Alertes de stock */}
        <section className="card flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-stone-900">Alertes de stock</h2>
            {stats.stock.nbAlertes > 0 && (
              <Badge ton="amber" point>
                {stats.stock.nbAlertes}
              </Badge>
            )}
          </div>

          {stats.alertesStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Aucun produit sous son seuil.
            </p>
          ) : (
            <ul className="flex-1 divide-y divide-stone-100">
              {stats.alertesStock.map((produit) => (
                <li key={produit.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{produit.nom}</p>
                    <p className="text-xs text-stone-500">{produit.categorie ?? 'Sans catégorie'}</p>
                  </div>
                  <Badge ton={produit.rupture ? 'red' : 'amber'}>
                    <span className="tabular">
                      {produit.rupture ? 'Rupture' : `${produit.stock} / ${produit.seuilAlerte}`}
                    </span>
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/produits?stockFaible=true"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Voir les produits
            <ArrowRight size={15} aria-hidden />
          </Link>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dernières factures */}
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
            <h2 className="text-base font-bold tracking-tight text-stone-900">Dernières factures</h2>
            <Link
              to="/ventes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Tout voir
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>

          {stats.dernieresVentes.length === 0 ? (
            <EmptyState
              titre="Aucune facture"
              description="Les factures créées apparaîtront ici."
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {stats.dernieresVentes.map((vente) => {
                const statut = STATUTS_VENTE[vente.statut] ?? STATUTS_VENTE.payee;
                return (
                  <li key={vente.id}>
                    <Link
                      to={`/ventes/${vente.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-stone-50"
                    >
                      <div className="min-w-0">
                        <p className="tabular text-sm font-semibold text-stone-800">{vente.numero}</p>
                        <p className="truncate text-xs text-stone-500">
                          {vente.client?.nom ?? 'Client de passage'} · {date(vente.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge ton={statut.ton}>{statut.libelle}</Badge>
                        <span className="tabular text-sm font-semibold text-stone-900">
                          {montant(vente.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Impayés */}
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 size={16} className="text-amber-600" aria-hidden />
              <h2 className="text-base font-bold tracking-tight text-stone-900">
                Factures en attente
              </h2>
            </div>
            <p className="tabular text-2xl font-bold text-stone-900">
              {montant(stats.impayees.montant)}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {stats.impayees.nombre} facture{stats.impayees.nombre > 1 ? 's' : ''} non encaissée
              {stats.impayees.nombre > 1 ? 's' : ''}
            </p>
          </section>

          {/* Meilleures ventes */}
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-emerald-600" aria-hidden />
              <h2 className="text-base font-bold tracking-tight text-stone-900">
                Meilleures ventes
              </h2>
            </div>

            {!top?.length ? (
              <p className="py-4 text-sm text-stone-500">Pas encore de ventes.</p>
            ) : (
              <ol className="space-y-2.5">
                {top.map((produit, index) => (
                  <li key={produit.produitId ?? produit.designation} className="flex items-center gap-3">
                    <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 text-xs font-bold text-stone-500">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
                      {produit.designation}
                    </span>
                    <span className="tabular shrink-0 text-sm font-semibold text-stone-900">
                      {montantCompact(produit.ca)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Marge */}
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <TriangleAlert size={16} className="text-stone-400" aria-hidden />
              <h2 className="text-base font-bold tracking-tight text-stone-900">Ventes − achats</h2>
            </div>
            <p
              className={`tabular text-2xl font-bold ${stats.marge >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
            >
              {montant(stats.marge)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Écart brut entre {montantCompact(stats.ca.total)} de ventes et{' '}
              {montantCompact(stats.achats.total)} d'achats.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
