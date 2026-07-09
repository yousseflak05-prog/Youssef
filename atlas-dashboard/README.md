# Atlas — Portail Client

Tableau de bord white-label pour les clients d'Atlas (acquisition de patients
pour cliniques dentaires au Maroc). Chaque clinique se connecte et suit ses
résultats marketing en direct : leads, RDV, coûts, ROI et répartition par canal
(Meta Ads / Landing Page / WhatsApp) — en remplacement des rapports PDF mensuels.

## Démo

Prototype autonome en un seul fichier HTML (React + Recharts compilés et
polices embarquées) : `dist/index.html`. Ouvrez-le directement dans un
navigateur, aucun serveur requis.

Deux cliniques fictives avec données réalistes : **Centre Dentaire Exemple**
(Casablanca) et **Clinique Sourire** (Rabat). La connexion est simulée — aucun
mot de passe requis.

## Fonctionnalités

- Bascule « Ce mois-ci » / « Depuis le début »
- 6 indicateurs : leads, RDV confirmés, taux de conversion, dépenses, coût par
  lead, coût par RDV (avec variations vs mois précédent)
- Graphique 12 semaines (barres = leads, ligne = RDV) avec infobulle au survol
- Répartition des leads par canal
- ROI estimé avec valeur moyenne d'un patient modifiable en direct
- Thèmes clair & sombre, adapté au mobile, entièrement en français

## Développement

```bash
npm install
node build.mjs   # génère dist/index.html
```

- `src/app.jsx` — application React (données d'exemple incluses)
- `src/styles.css` — jetons de design (palette vert nuit / or Atlas) et styles
- `assets/` — polices Marcellus & Archivo (woff2, embarquées en data URI)
- `build.mjs` — bundle esbuild + assemblage du HTML final
