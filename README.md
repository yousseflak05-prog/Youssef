# Le Pavillon du Sourire — Site vitrine

Site vitrine one-page pour le cabinet dentaire **Le Pavillon du Sourire** (Safi, Maroc).
HTML/CSS/JS statique, sans dépendance à builder — ouvrez `index.html` dans un navigateur.

## Direction artistique — « Émail & Sauge »

| Nom | Hex | Rôle |
|---|---|---|
| Porcelaine | `#F6F3EC` | Fond principal (émail chaud) |
| Sauge profonde | `#1E3A34` | Sections sombres, titres |
| Eucalyptus | `#5E9C8F` | Accent principal (fraîcheur/soin) |
| Or champagne | `#C7A876` | Accent chaud (rappel du logo) |
| Ardoise | `#293230` | Texte courant |
| Brume | `#E5EAE5` | Bordures / cartes |

- **Typo d'affichage** : Fraunces (serif à contraste doux)
- **Typo de texte** : Hanken Grotesk

## Structure

```
index.html            # Contenu du site
assets/css/styles.css # Design system + responsive
assets/js/main.js     # WhatsApp, reveal au scroll, header
assets/img/           # Logo placeholder (SVG)
```

## À personnaliser (placeholders)

1. **Logo** — remplacer les `<svg>` inline dans le header/hero/footer, ou
   `assets/img/logo-placeholder.svg`, par le vrai logo fourni.
2. **Numéro WhatsApp** — dans `assets/js/main.js`, variable `WHATSAPP_NUMBER`
   (format international sans `+` ni espaces, actuellement `212770987838`) et
   `WHATSAPP_MESSAGE` (message pré-rempli).
3. **Téléphone affiché** — liens `tel:+212770987838` dans `index.html`.
4. **Nom du praticien** — `[NOM DU PRATICIEN]` dans la section « À propos ».
5. **Horaires** — section Contact (marqués `[à confirmer]`).
6. **Carte** — remplacer le bloc `.map-card` par un `<iframe>` Google Maps.
7. **Photos** — remplacer les blocs `.hero-photo` et `.about-photo` par de vraies images.
8. **Avis** — 3 avis Google réels sont repris ; à compléter/ajuster.

## Points techniques

- Zéro débordement horizontal de 320px à grand écran (grilles en `minmax(0, 1fr)`).
- Zones de tap ≥ 44×44px, texte ≥ 16px.
- Barre d'action sticky en bas sur mobile (Appeler + WhatsApp), avec
  `padding-bottom` du body ajusté pour ne rien masquer.
- Respecte `prefers-reduced-motion`.
