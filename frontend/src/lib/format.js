/** Formatage francophone, devise marocaine (dirham). */

const DEVISE = 'DH';

const nombreFr = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const entierFr = new Intl.NumberFormat('fr-FR');

/** 12345.5 → "12 345,50 DH" */
export function montant(valeur, { avecDevise = true } = {}) {
  const nombre = Number(valeur ?? 0);
  const formate = nombreFr.format(nombre);
  return avecDevise ? `${formate} ${DEVISE}` : formate;
}

/** Version compacte pour les tuiles d'indicateurs : 1 234 567 → "1,23 M DH" */
export function montantCompact(valeur) {
  const nombre = Number(valeur ?? 0);
  if (Math.abs(nombre) >= 1_000_000) {
    return `${(nombre / 1_000_000).toFixed(2).replace('.', ',')} M ${DEVISE}`;
  }
  if (Math.abs(nombre) >= 10_000) {
    return `${(nombre / 1000).toFixed(1).replace('.', ',')} k ${DEVISE}`;
  }
  return montant(nombre);
}

export function nombre(valeur) {
  return entierFr.format(Number(valeur ?? 0));
}

/** "2026-07-11T10:30:00Z" → "11/07/2026" */
export function date(valeur) {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "11 juil. 2026 à 10:30" */
export function dateHeure(valeur) {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Valeur d'un <input type="date"> à partir d'une date ISO. */
export function dateInput(valeur = new Date()) {
  const d = new Date(valeur);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "2026-07" → "juil. 26" (axe des graphiques) */
export function moisCourt(cle) {
  const [annee, mois] = cle.split('-');
  const d = new Date(Number(annee), Number(mois) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

export function pourcentage(valeur) {
  if (valeur === null || valeur === undefined) return null;
  const signe = valeur > 0 ? '+' : '';
  return `${signe}${Number(valeur).toFixed(1).replace('.', ',')} %`;
}

/** Initiales pour les pastilles d'avatar : "Atlas Distribution" → "AD" */
export function initiales(nom = '') {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}

export const STATUTS_VENTE = {
  payee: { libelle: 'Payée', ton: 'emerald' },
  en_attente: { libelle: 'En attente', ton: 'amber' },
  annulee: { libelle: 'Annulée', ton: 'stone' },
};
