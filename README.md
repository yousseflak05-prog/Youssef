# Oudrhiri — Centre de Médecine Dentaire · site vitrine

Site vitrine premium (une seule page) pour le centre de médecine dentaire
Oudrhiri à Fès, en français, orienté conversion : chaque section pousse vers la
prise de rendez-vous WhatsApp.

## Fichier

Tout le site tient dans `index.html` : HTML, CSS et JavaScript intégrés, aucune
dépendance externe, aucune police ni bibliothèque à télécharger. Il suffit de
déposer le fichier sur n'importe quel hébergement statique (Netlify, Vercel,
GitHub Pages, cPanel…) pour le mettre en ligne.

## Contenu

1. Hero — « Votre sourire mérite l'excellence » + boutons WhatsApp / Appel
2. Pourquoi nous choisir — équipement, soins personnalisés, expérience, hygiène
3. Services — implantologie, orthodontie, blanchiment, facettes, soins
   conservateurs, urgences (description + bénéfices + CTA WhatsApp dédié)
4. Le cabinet — présentation, équipe, philosophie de soin
5. Avis patients — note 4,6★ / 33 avis Google + 3 avis repris de la fiche Google
6. Galerie — mosaïque des espaces du cabinet
7. Rendez-vous — WhatsApp, téléphone et formulaire
8. Localisation — carte Google Maps intégrée, adresse et horaires
9. FAQ + pied de page

Fonctionnalités : navigation collante avec lien actif, menu mobile plein écran,
bouton WhatsApp flottant, barre d'actions fixe sur mobile, animations au défilement,
accordéon FAQ, données structurées Schema.org (`Dentist` + `FAQPage`) et balises SEO.

## Coordonnées utilisées

- Téléphone et WhatsApp : **06 65 07 18 65** (`+212665071865`)
- Adresse : Imm N°7, 3ème étage, Résidence Noujoum, Avenue Bir Anzarane, Fès 30050
- Horaires : lundi — vendredi 08:30–18:30, samedi 09:00–13:00

Pour changer le numéro, remplacer `212665071865` partout dans `index.html`
(liens `wa.me`, liens `tel:` et la constante `WA` dans le script).

## Formulaire de rendez-vous

Le formulaire n'a pas besoin de serveur : à l'envoi, les champs sont assemblés en
un message WhatsApp pré-rempli qui s'ouvre dans un nouvel onglet. Le nom et le
téléphone sont obligatoires. Pour recevoir plutôt les demandes par e-mail, il
suffit de brancher le `submit` sur un service type Formspree.

## Photos

Les visuels de la galerie et des sections sont des illustrations SVG intégrées
(rapides, sans requête réseau) qui servent de gabarits. Pour utiliser les photos
réelles du cabinet, remplacer chaque bloc `<svg>…</svg>` situé dans un
`.g-item`, `.hero-card` ou `.about-visual` par :

```html
<img src="photos/salle-de-soins.jpg" alt="Salle de soins du Cabinet Dentaire Fès"
     loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
```

Les images publiées sur la fiche Google Maps appartiennent au cabinet : téléverser
les fichiers originaux dans un dossier `photos/` plutôt que de pointer vers Google.
Format conseillé : JPEG ou WebP, largeur 1600 px, compressé (< 300 Ko par image).
