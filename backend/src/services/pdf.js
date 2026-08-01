import PDFDocument from 'pdfkit';

import config from '../lib/config.js';
import { formatMoney } from '../lib/money.js';

// Palette alignée sur l'interface (stone / emerald).
const COULEURS = {
  encre: '#1c1917', // stone-900
  texte: '#44403c', // stone-700
  discret: '#78716c', // stone-500
  trait: '#e7e5e4', // stone-200
  fond: '#fafaf9', // stone-50
  accent: '#059669', // emerald-600
};

const MARGE = 50;
const LARGEUR_UTILE = 595.28 - MARGE * 2; // A4 portrait

const COLONNES = [
  { cle: 'designation', titre: 'Désignation', largeur: 236, align: 'left' },
  { cle: 'quantite', titre: 'Qté', largeur: 50, align: 'right' },
  { cle: 'prixUnitaire', titre: 'P.U. HT', largeur: 100, align: 'right' },
  { cle: 'totalLigne', titre: 'Total HT', largeur: 109, align: 'right' },
];

const LIBELLES_STATUT = {
  payee: 'PAYÉE',
  en_attente: 'EN ATTENTE',
  annulee: 'ANNULÉE',
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Position horizontale du début de chaque colonne. */
function xDeColonne(index) {
  return MARGE + COLONNES.slice(0, index).reduce((sum, col) => sum + col.largeur, 0);
}

function enTete(doc, vente) {
  doc
    .fillColor(COULEURS.encre)
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(config.company.name, MARGE, MARGE);

  doc.font('Helvetica').fontSize(9).fillColor(COULEURS.discret);
  const infos = [
    config.company.address,
    [config.company.phone, config.company.email].filter(Boolean).join('  ·  '),
    config.company.ice ? `ICE : ${config.company.ice}` : null,
  ].filter(Boolean);
  infos.forEach((ligne) => doc.text(ligne, MARGE, doc.y, { width: 280 }));

  // Bloc « FACTURE » aligné à droite.
  doc
    .font('Helvetica-Bold')
    .fontSize(26)
    .fillColor(COULEURS.accent)
    .text('FACTURE', MARGE, MARGE, { width: LARGEUR_UTILE, align: 'right' });

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COULEURS.encre)
    .text(vente.numero, MARGE, MARGE + 32, { width: LARGEUR_UTILE, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COULEURS.discret)
    .text(`Date : ${formatDate(vente.date)}`, MARGE, MARGE + 48, {
      width: LARGEUR_UTILE,
      align: 'right',
    })
    .text(`Statut : ${LIBELLES_STATUT[vente.statut] ?? vente.statut}`, MARGE, doc.y, {
      width: LARGEUR_UTILE,
      align: 'right',
    });

  const y = Math.max(doc.y, MARGE + 76) + 14;
  doc.moveTo(MARGE, y).lineTo(MARGE + LARGEUR_UTILE, y).lineWidth(1).strokeColor(COULEURS.trait).stroke();
  doc.y = y + 20;
}

function blocClient(doc, vente) {
  const y = doc.y;
  const client = vente.client;

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(COULEURS.discret)
    .text('FACTURÉ À', MARGE, y, { characterSpacing: 0.6 });

  doc.font('Helvetica-Bold').fontSize(12).fillColor(COULEURS.encre);
  doc.text(client?.nom ?? 'Client de passage', MARGE, doc.y + 4, { width: 280 });

  if (client) {
    doc.font('Helvetica').fontSize(9).fillColor(COULEURS.texte);
    [client.adresse, client.telephone, client.email]
      .filter(Boolean)
      .forEach((ligne) => doc.text(ligne, MARGE, doc.y + 1, { width: 280 }));
  }

  doc.y = Math.max(doc.y, y) + 26;
}

function enTeteTableau(doc) {
  const y = doc.y;

  doc.rect(MARGE, y, LARGEUR_UTILE, 24).fill(COULEURS.fond);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COULEURS.discret);

  COLONNES.forEach((col, i) => {
    doc.text(col.titre.toUpperCase(), xDeColonne(i) + 8, y + 8, {
      width: col.largeur - 16,
      align: col.align,
      characterSpacing: 0.5,
    });
  });

  doc.y = y + 24;
  return doc.y;
}

function lignesTableau(doc, vente) {
  doc.font('Helvetica').fontSize(9.5);

  for (const item of vente.items) {
    // Saut de page si la ligne ne tient plus (on garde de la place pour le pied).
    if (doc.y > 700) {
      doc.addPage();
      doc.y = MARGE;
      enTeteTableau(doc);
      doc.font('Helvetica').fontSize(9.5);
    }

    const y = doc.y;
    const totalLigne = Number(item.prixUnitaire) * item.quantite;
    const valeurs = {
      designation: item.designation,
      quantite: String(item.quantite),
      prixUnitaire: formatMoney(item.prixUnitaire),
      totalLigne: formatMoney(totalLigne),
    };

    COLONNES.forEach((col, i) => {
      doc
        .fillColor(col.cle === 'designation' ? COULEURS.encre : COULEURS.texte)
        .text(valeurs[col.cle], xDeColonne(i) + 8, y + 9, {
          width: col.largeur - 16,
          align: col.align,
        });
    });

    const bas = Math.max(doc.y, y + 9) + 9;
    doc.moveTo(MARGE, bas).lineTo(MARGE + LARGEUR_UTILE, bas).lineWidth(0.5).strokeColor(COULEURS.trait).stroke();
    doc.y = bas;
  }
}

function totaux(doc, vente) {
  const largeurBloc = 220;
  const x = MARGE + LARGEUR_UTILE - largeurBloc;
  let y = doc.y + 18;

  const ligne = (libelle, montant, { gras = false, accent = false } = {}) => {
    doc
      .font(gras ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(gras ? 11 : 9.5)
      .fillColor(gras ? COULEURS.encre : COULEURS.discret)
      .text(libelle, x, y, { width: 110 });

    doc
      .font(gras ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(accent ? COULEURS.accent : gras ? COULEURS.encre : COULEURS.texte)
      .text(montant, x + 110, y, { width: largeurBloc - 110, align: 'right' });

    y += gras ? 22 : 17;
  };

  ligne('Total HT', formatMoney(vente.totalHt));
  ligne(`TVA (${Math.round(config.tvaRate * 100)} %)`, formatMoney(vente.tva));

  doc.moveTo(x, y - 4).lineTo(x + largeurBloc, y - 4).lineWidth(1).strokeColor(COULEURS.trait).stroke();
  y += 6;

  ligne('Total TTC', formatMoney(vente.total), { gras: true, accent: true });

  doc.y = y;
}

function piedDePage(doc, vente) {
  const y = 760;

  doc.moveTo(MARGE, y).lineTo(MARGE + LARGEUR_UTILE, y).lineWidth(0.5).strokeColor(COULEURS.trait).stroke();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COULEURS.discret)
    .text(
      `${config.company.name} — Facture ${vente.numero} — Document généré le ${formatDate(new Date())}`,
      MARGE,
      y + 10,
      { width: LARGEUR_UTILE, align: 'center' }
    );
}

/**
 * Écrit la facture PDF dans le flux fourni (typiquement la réponse HTTP).
 * Le document est généré en streaming : rien n'est stocké sur disque.
 */
export function genererFacturePdf(vente, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGE, bufferPages: true });
  doc.pipe(stream);

  doc.info.Title = `Facture ${vente.numero}`;
  doc.info.Author = config.company.name;

  enTete(doc, vente);
  blocClient(doc, vente);
  enTeteTableau(doc);
  lignesTableau(doc, vente);
  totaux(doc, vente);

  // Le pied est posé sur chaque page une fois la pagination connue.
  const { count } = doc.bufferedPageRange();
  for (let i = 0; i < count; i += 1) {
    doc.switchToPage(i);
    piedDePage(doc, vente);
  }

  doc.end();
  return doc;
}

export default genererFacturePdf;
