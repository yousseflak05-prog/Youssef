# Atlas — Site vitrine

Site de l'agence Atlas (marketing digital pour entreprises marocaines).
Refonte éditoriale complète : identité vert pin / or alignée sur le portail
client, section tarifs supprimée, méthode en 4 étapes, et aperçu du portail
de résultats en direct comme argument différenciant.

## Structure

- Héro : thèse en Newsreader italique + ligne de crête animée (montagnes de l'Atlas)
- Services (4) : Instagram, TikTok & Reels, Publicité Meta, Stratégie & Contenu
- Méthode : séquence 01–04, de l'audit gratuit aux résultats en direct
- Portail client : maquette animée du tableau de bord (compteurs, mini graphique)
- Pourquoi Atlas : citation + 4 arguments
- CTA WhatsApp (wa.me/212666845288) — sans section tarifs

## Développement

```bash
node build.mjs   # génère dist/index.html (autonome) et dist/artifact.html
```

- `src/index.html` — source (styles, contenu, scripts ; placeholders de polices)
- `assets/` — Newsreader (roman + italique) et Archivo en woff2, embarquées en data URI
- `dist/index.html` — page complète autonome, ouvrable directement dans un navigateur

Aucune dépendance externe : polices embarquées, icônes SVG inline, JS vanilla
(révélations au défilement + compteurs, avec respect de `prefers-reduced-motion`).
