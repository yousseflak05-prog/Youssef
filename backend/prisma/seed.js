/**
 * Seed de démonstration.
 *
 * Rejoue un mois d'activité type d'une petite entreprise : catalogue produits,
 * clients, fournisseurs, quelques achats puis quelques ventes. Les stocks sont
 * recalculés à partir des mouvements pour que la base reste cohérente
 * (stock affiché = stock initial + achats − ventes).
 *
 * Idempotent : `npm run seed` peut être relancé, il repart d'une base vide.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const TVA_RATE = Number(process.env.TVA_RATE ?? 0.2);

const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Date relative à aujourd'hui, pour que la démo reste « fraîche ». */
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 30, 0, 0);
  return d;
};

const CLIENTS = [
  { nom: 'Atlas Distribution', telephone: '+212 6 61 23 45 67', email: 'contact@atlas-dist.ma', adresse: '45 Rue Ibn Batouta, Casablanca' },
  { nom: 'Menara Électroménager', telephone: '+212 6 62 88 14 03', email: 'achats@menara-elec.ma', adresse: '12 Avenue Hassan II, Marrakech' },
  { nom: 'Sahara Textile', telephone: '+212 5 28 84 22 10', email: 'commandes@saharatextile.ma', adresse: 'Zone Industrielle, Agadir' },
  { nom: 'Cabinet Bennani', telephone: '+212 6 70 45 90 12', email: 'a.bennani@cabinet-bennani.ma', adresse: '8 Boulevard Zerktouni, Rabat' },
  { nom: 'Rif Café', telephone: '+212 6 55 30 77 41', email: 'gerance@rifcafe.ma', adresse: '3 Place Uta El Hammam, Chefchaouen' },
  { nom: 'Souss Agrifood', telephone: '+212 5 28 33 61 90', email: 'direction@souss-agrifood.ma', adresse: 'Route de Taroudant, Agadir' },
];

const FOURNISSEURS = [
  { nom: 'Global Import SARL', telephone: '+212 5 22 44 18 00', email: 'ventes@globalimport.ma', adresse: 'Port de Casablanca, Hangar 7' },
  { nom: 'TechnoMaroc', telephone: '+212 5 37 71 09 55', email: 'pro@technomaroc.ma', adresse: '22 Avenue Fal Ould Oumeir, Rabat' },
  { nom: 'Papeterie du Nord', telephone: '+212 5 39 94 62 30', email: 'commande@papeterienord.ma', adresse: '17 Rue de Fès, Tanger' },
  { nom: 'Mobilier Pro', telephone: '+212 5 22 60 33 27', email: 'devis@mobilierpro.ma', adresse: 'Sidi Maarouf, Casablanca' },
];

// stockInitial = stock avant les mouvements rejoués plus bas.
const PRODUITS = [
  { nom: 'Ordinateur portable 15"', categorie: 'Informatique', prixAchat: 6200, prixVente: 8400, stockInitial: 12, seuilAlerte: 4 },
  { nom: 'Écran 24" IPS', categorie: 'Informatique', prixAchat: 1150, prixVente: 1690, stockInitial: 20, seuilAlerte: 6 },
  { nom: 'Clavier mécanique', categorie: 'Informatique', prixAchat: 340, prixVente: 590, stockInitial: 24, seuilAlerte: 10 },
  { nom: 'Souris sans fil', categorie: 'Informatique', prixAchat: 95, prixVente: 189, stockInitial: 45, seuilAlerte: 15 },
  { nom: 'Imprimante laser', categorie: 'Bureautique', prixAchat: 1850, prixVente: 2650, stockInitial: 5, seuilAlerte: 4 },
  { nom: 'Ramette papier A4 (500 f.)', categorie: 'Bureautique', prixAchat: 38, prixVente: 62, stockInitial: 120, seuilAlerte: 40 },
  { nom: 'Toner noir compatible', categorie: 'Bureautique', prixAchat: 210, prixVente: 380, stockInitial: 25, seuilAlerte: 8 },
  { nom: 'Chaise de bureau ergonomique', categorie: 'Mobilier', prixAchat: 980, prixVente: 1490, stockInitial: 14, seuilAlerte: 5 },
  { nom: 'Bureau 140x70 cm', categorie: 'Mobilier', prixAchat: 1320, prixVente: 1950, stockInitial: 0, seuilAlerte: 3 },
  { nom: 'Armoire métallique', categorie: 'Mobilier', prixAchat: 1650, prixVente: 2400, stockInitial: 6, seuilAlerte: 4 },
  { nom: 'Onduleur 650 VA', categorie: 'Informatique', prixAchat: 420, prixVente: 720, stockInitial: 18, seuilAlerte: 6 },
  { nom: 'Câble HDMI 2 m', categorie: 'Informatique', prixAchat: 25, prixVente: 65, stockInitial: 80, seuilAlerte: 25 },
];

// Réapprovisionnements (incrémentent le stock).
const ACHATS = [
  { fournisseur: 'Global Import SARL', jours: 26, lignes: [['Ordinateur portable 15"', 6], ['Écran 24" IPS', 10]] },
  { fournisseur: 'TechnoMaroc', jours: 19, lignes: [['Onduleur 650 VA', 8], ['Câble HDMI 2 m', 40], ['Souris sans fil', 20]] },
  { fournisseur: 'Papeterie du Nord', jours: 12, lignes: [['Ramette papier A4 (500 f.)', 60], ['Toner noir compatible', 12]] },
  { fournisseur: 'Mobilier Pro', jours: 6, lignes: [['Chaise de bureau ergonomique', 6], ['Bureau 140x70 cm', 4]] },
];

// Factures (décrémentent le stock).
const VENTES = [
  { client: 'Atlas Distribution', jours: 24, statut: 'payee', lignes: [['Ordinateur portable 15"', 3], ['Souris sans fil', 3], ['Câble HDMI 2 m', 5]] },
  { client: 'Cabinet Bennani', jours: 21, statut: 'payee', lignes: [['Imprimante laser', 1], ['Ramette papier A4 (500 f.)', 20], ['Toner noir compatible', 4]] },
  { client: 'Menara Électroménager', jours: 16, statut: 'payee', lignes: [['Écran 24" IPS', 6], ['Clavier mécanique', 6]] },
  { client: 'Sahara Textile', jours: 11, statut: 'en_attente', lignes: [['Bureau 140x70 cm', 4], ['Chaise de bureau ergonomique', 8]] },
  { client: 'Rif Café', jours: 7, statut: 'payee', lignes: [['Armoire métallique', 2], ['Ramette papier A4 (500 f.)', 15]] },
  { client: 'Souss Agrifood', jours: 1, statut: 'payee', lignes: [['Ordinateur portable 15"', 2], ['Écran 24" IPS', 4], ['Onduleur 650 VA', 4]] },
  { client: 'Atlas Distribution', jours: 0, statut: 'en_attente', lignes: [['Clavier mécanique', 10], ['Souris sans fil', 10], ['Câble HDMI 2 m', 12]] },
];

function totauxDepuisLignes(lignes) {
  const totalHt = round2(
    lignes.reduce((sum, l) => sum + round2(Number(l.prixUnitaire) * l.quantite), 0)
  );
  const tva = round2(totalHt * TVA_RATE);
  return { totalHt, tva, total: round2(totalHt + tva) };
}

async function main() {
  console.log('→ Nettoyage de la base…');
  // L'ordre respecte les dépendances de clés étrangères.
  await prisma.venteItem.deleteMany();
  await prisma.achatItem.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.achat.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.client.deleteMany();
  await prisma.fournisseur.deleteMany();
  await prisma.user.deleteMany();

  console.log('→ Compte administrateur…');
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
    },
  });
  console.log(`   identifiants : ${username} / ${password}`);

  console.log('→ Clients & fournisseurs…');
  await prisma.client.createMany({ data: CLIENTS });
  await prisma.fournisseur.createMany({ data: FOURNISSEURS });
  const clients = await prisma.client.findMany();
  const fournisseurs = await prisma.fournisseur.findMany();

  console.log('→ Catalogue produits…');
  for (const p of PRODUITS) {
    await prisma.produit.create({
      data: {
        nom: p.nom,
        categorie: p.categorie,
        prixAchat: p.prixAchat,
        prixVente: p.prixVente,
        stock: p.stockInitial,
        seuilAlerte: p.seuilAlerte,
      },
    });
  }
  const produits = await prisma.produit.findMany();
  const parNom = new Map(produits.map((p) => [p.nom, p]));

  console.log('→ Achats fournisseurs…');
  let numeroAchat = 1;
  for (const achat of ACHATS) {
    const date = daysAgo(achat.jours);
    const lignes = achat.lignes.map(([nom, quantite]) => {
      const produit = parNom.get(nom);
      return {
        produitId: produit.id,
        designation: produit.nom,
        quantite,
        prixUnitaire: Number(produit.prixAchat),
      };
    });
    const totaux = totauxDepuisLignes(lignes);

    await prisma.achat.create({
      data: {
        numero: `ACH-${date.getFullYear()}-${String(numeroAchat++).padStart(4, '0')}`,
        fournisseurId: fournisseurs.find((f) => f.nom === achat.fournisseur).id,
        date,
        ...totaux,
        items: { create: lignes },
      },
    });

    for (const ligne of lignes) {
      await prisma.produit.update({
        where: { id: ligne.produitId },
        data: { stock: { increment: ligne.quantite } },
      });
    }
  }

  console.log('→ Factures clients…');
  let numeroVente = 1;
  for (const vente of VENTES) {
    const date = daysAgo(vente.jours);
    const lignes = vente.lignes.map(([nom, quantite]) => {
      const produit = parNom.get(nom);
      return {
        produitId: produit.id,
        designation: produit.nom,
        quantite,
        prixUnitaire: Number(produit.prixVente),
      };
    });
    const totaux = totauxDepuisLignes(lignes);

    await prisma.vente.create({
      data: {
        numero: `FAC-${date.getFullYear()}-${String(numeroVente++).padStart(4, '0')}`,
        clientId: clients.find((c) => c.nom === vente.client).id,
        date,
        statut: vente.statut,
        ...totaux,
        items: { create: lignes },
      },
    });

    for (const ligne of lignes) {
      await prisma.produit.update({
        where: { id: ligne.produitId },
        data: { stock: { decrement: ligne.quantite } },
      });
    }
  }

  const [nbVentes, nbAchats, stockTotal, ca] = await Promise.all([
    prisma.vente.count(),
    prisma.achat.count(),
    prisma.produit.aggregate({ _sum: { stock: true } }),
    prisma.vente.aggregate({ _sum: { total: true } }),
  ]);

  console.log('\n✔ Seed terminé');
  console.log(`   ${CLIENTS.length} clients · ${FOURNISSEURS.length} fournisseurs · ${PRODUITS.length} produits`);
  console.log(`   ${nbVentes} factures · ${nbAchats} achats`);
  console.log(`   Stock total : ${stockTotal._sum.stock} unités · CA TTC : ${Number(ca._sum.total).toFixed(2)} DH`);
}

main()
  .catch((error) => {
    console.error('✖ Échec du seed :', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
