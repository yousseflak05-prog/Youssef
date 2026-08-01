import { Router } from 'express';

import prisma from '../lib/prisma.js';
import serialize from '../lib/serialize.js';
import { round2 } from '../lib/money.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

/** Premier jour du mois courant, à minuit. */
function debutDuMois(offsetMois = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMois, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/dashboard/stats
 * Renvoie en une requête tout ce qu'affiche le tableau de bord : indicateurs,
 * alertes de stock, dernières factures et série mensuelle du chiffre d'affaires.
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const debutMois = debutDuMois();
    const debutMoisPrecedent = debutDuMois(-1);

    const [
      caTotal,
      caMois,
      caMoisPrecedent,
      achatsTotal,
      nbClients,
      nbFournisseurs,
      nbProduits,
      nbVentes,
      stockAgrege,
      produits,
      dernieresVentes,
      impayees,
    ] = await Promise.all([
      prisma.vente.aggregate({ _sum: { total: true }, where: { statut: { not: 'annulee' } } }),
      prisma.vente.aggregate({
        _sum: { total: true },
        where: { statut: { not: 'annulee' }, date: { gte: debutMois } },
      }),
      prisma.vente.aggregate({
        _sum: { total: true },
        where: { statut: { not: 'annulee' }, date: { gte: debutMoisPrecedent, lt: debutMois } },
      }),
      prisma.achat.aggregate({ _sum: { total: true } }),
      prisma.client.count(),
      prisma.fournisseur.count(),
      prisma.produit.count(),
      prisma.vente.count({ where: { statut: { not: 'annulee' } } }),
      prisma.produit.aggregate({ _sum: { stock: true } }),
      prisma.produit.findMany({
        select: { id: true, nom: true, categorie: true, stock: true, seuilAlerte: true, prixAchat: true, prixVente: true },
      }),
      prisma.vente.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { client: { select: { id: true, nom: true } } },
      }),
      prisma.vente.aggregate({ _sum: { total: true }, _count: true, where: { statut: 'en_attente' } }),
    ]);

    // Produits sous le seuil : la comparaison porte sur deux colonnes, donc
    // elle se fait en mémoire (le catalogue d'une TPE reste petit).
    const alertesStock = produits
      .filter((p) => p.stock <= p.seuilAlerte)
      .sort((a, b) => a.stock - b.stock)
      .map((p) => ({
        id: p.id,
        nom: p.nom,
        categorie: p.categorie,
        stock: p.stock,
        seuilAlerte: p.seuilAlerte,
        rupture: p.stock === 0,
      }));

    // Valeur du stock au prix d'achat (immobilisation) et au prix de vente.
    const valeurStockAchat = round2(
      produits.reduce((sum, p) => sum + Number(p.prixAchat) * p.stock, 0)
    );
    const valeurStockVente = round2(
      produits.reduce((sum, p) => sum + Number(p.prixVente) * p.stock, 0)
    );

    const ca = Number(caTotal._sum.total ?? 0);
    const ventesDuMois = Number(caMois._sum.total ?? 0);
    const ventesMoisPrecedent = Number(caMoisPrecedent._sum.total ?? 0);

    res.json(
      serialize({
        ca: {
          total: ca,
          mois: ventesDuMois,
          moisPrecedent: ventesMoisPrecedent,
          // Évolution en % vs mois précédent ; null si aucune base de comparaison.
          evolution:
            ventesMoisPrecedent > 0
              ? round2(((ventesDuMois - ventesMoisPrecedent) / ventesMoisPrecedent) * 100)
              : null,
          panierMoyen: nbVentes > 0 ? round2(ca / nbVentes) : 0,
        },
        achats: { total: Number(achatsTotal._sum.total ?? 0) },
        marge: round2(ca - Number(achatsTotal._sum.total ?? 0)),
        compteurs: {
          clients: nbClients,
          fournisseurs: nbFournisseurs,
          produits: nbProduits,
          ventes: nbVentes,
        },
        stock: {
          total: stockAgrege._sum.stock ?? 0,
          valeurAchat: valeurStockAchat,
          valeurVente: valeurStockVente,
          nbAlertes: alertesStock.length,
        },
        impayees: {
          nombre: impayees._count,
          montant: Number(impayees._sum.total ?? 0),
        },
        alertesStock: alertesStock.slice(0, 8),
        dernieresVentes,
      })
    );
  })
);

/**
 * GET /api/dashboard/ca-mensuel?mois=6
 * Série du chiffre d'affaires TTC des N derniers mois, pour le graphique.
 */
router.get(
  '/ca-mensuel',
  asyncHandler(async (req, res) => {
    const nbMois = Math.min(Math.max(Number(req.query.mois ?? 6), 1), 24);
    const debut = debutDuMois(-(nbMois - 1));

    const ventes = await prisma.vente.findMany({
      where: { date: { gte: debut }, statut: { not: 'annulee' } },
      select: { date: true, total: true },
    });

    // Squelette de la série : tous les mois de l'intervalle, même à zéro.
    const buckets = new Map();
    for (let i = 0; i < nbMois; i += 1) {
      const d = debutDuMois(-(nbMois - 1) + i);
      buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }

    for (const vente of ventes) {
      const cle = `${vente.date.getFullYear()}-${String(vente.date.getMonth() + 1).padStart(2, '0')}`;
      if (buckets.has(cle)) buckets.set(cle, buckets.get(cle) + Number(vente.total));
    }

    res.json([...buckets.entries()].map(([mois, total]) => ({ mois, total: round2(total) })));
  })
);

/** GET /api/dashboard/top-produits?limit=5 — meilleures ventes en chiffre d'affaires. */
router.get(
  '/top-produits',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 5), 1), 20);

    const lignes = await prisma.venteItem.findMany({
      select: { designation: true, quantite: true, prixUnitaire: true, produitId: true },
    });

    const parProduit = new Map();
    for (const ligne of lignes) {
      const cle = ligne.produitId ?? `libre:${ligne.designation}`;
      const courant = parProduit.get(cle) ?? {
        produitId: ligne.produitId,
        designation: ligne.designation,
        quantite: 0,
        ca: 0,
      };
      courant.quantite += ligne.quantite;
      courant.ca += Number(ligne.prixUnitaire) * ligne.quantite;
      parProduit.set(cle, courant);
    }

    const top = [...parProduit.values()]
      .map((p) => ({ ...p, ca: round2(p.ca) }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, limit);

    res.json(top);
  })
);

export default router;
