# Dossier photos

Déposer ici les images du cabinet. Le site les charge automatiquement, sans
modification du code, dès qu'un fichier porte le nom attendu :

| Fichier                 | Emplacement sur le site                    | Format conseillé          |
|-------------------------|--------------------------------------------|---------------------------|
| `dr-oudrhiri.jpg`       | Section « Le cabinet » — portrait du praticien | portrait, ≥ 900 × 1200 px |

Tant que le fichier est absent, une illustration de remplacement s'affiche
(aucune image cassée).

## Cadrage du portrait

Le cadre n'affiche que le haut de la photo (visage et épaules) : le bas de
l'image est volontairement rogné, ce qui supprime tout texte incrusté en bas
du visuel. Le niveau de zoom se règle dans `index.html`, sur la balise `<img>` :

```html
<img src="photos/dr-oudrhiri.jpg" ... style="--photo-zoom:1.42">
```

- valeur plus grande (1.6) → cadrage plus serré sur le visage, on coupe plus bas
- valeur plus petite (1.15) → cadrage plus large, on voit davantage la photo

## Galerie

Les visuels de la galerie sont des illustrations SVG intégrées. Pour utiliser
des photos réelles, remplacer le bloc `<svg>…</svg>` de chaque `.g-item` par :

```html
<img src="photos/salle-de-soins.jpg" alt="Salle de soins" loading="lazy"
     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
```

Compresser les images avant mise en ligne (JPEG ou WebP, largeur 1600 px,
moins de 300 Ko par fichier) pour garder un site rapide.
