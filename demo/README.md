# Démo — site de clinique dentaire

Page vitrine complète pour un cabinet dentaire marocain, à présenter comme
démonstration commerciale. Un seul fichier, aucune dépendance, aucune requête
réseau : `demo/index.html` s'ouvre directement dans un navigateur, se dépose sur
n'importe quel hébergement statique et s'envoie par e-mail tel quel.

## Ce qu'elle contient

- **Trois langues** — français (par défaut), arabe avec passage complet en RTL,
  anglais. Le choix est mémorisé dans le navigateur.
- **Prise de rendez-vous en quatre étapes** — motif, praticien, date, créneau,
  coordonnées, puis récapitulatif et lien WhatsApp pré-rempli. Les créneaux sont
  générés à partir de la date du jour, avec pause déjeuner, samedi écourté,
  dimanche fermé et créneaux passés grisés.
- **Carte « prochaines disponibilités »** dans l'en-tête, cliquable : elle amène
  directement au créneau choisi dans le formulaire.
- **Comparateur avant / après** dessiné en SVG (aucune photo de patient, donc
  aucune question de droit à l'image pour une démo).
- Grille tarifaire en dirhams, équipe, parcours de soin, avis, FAQ dépliante,
  horaires avec le jour courant mis en évidence, plan du quartier en SVG.
- Thème clair et thème sombre, mise en page responsive, barre d'action fixe sur
  mobile (appeler / WhatsApp / rendez-vous).

## Construire

`demo/index.html` est généré — ne pas l'éditer à la main.

```
python3 demo/build.py
```

Le script assemble trois sources :

| Fichier | Contenu |
|---|---|
| `src/page.html` | structure et feuille de style |
| `src/fonts.css` | polices en base64 (Marcellus, Instrument Sans, IBM Plex Mono, IBM Plex Sans Arabic) |
| `src/script.html` | comportements, contenu et traductions |

## Adapter à un cabinet

Presque tout se règle en haut de `src/script.html` :

- `CLINIC` — téléphone, WhatsApp, heure d'ouverture, durée des créneaux.
- `DATA.fr` / `DATA.ar` / `DATA.en` — soins, praticiens, tarifs, avis, FAQ,
  horaires. Les trois blocs ont la même forme : traduire ligne à ligne.
- `STR.ar` / `STR.en` — libellés d'interface. Le français est lu directement dans
  le HTML, il n'y a donc rien à dupliquer pour lui.

L'adresse, les liens `tel:` et `mailto:` et le nom de la clinique sont dans
`src/page.html`. Voir `NAMES.md` pour changer de nom.

Le contenu est fictif : chiffres, avis, praticiens et tarifs sont inventés pour
la démonstration. Le pied de page le mentionne — à retirer une fois le site
repris par un vrai cabinet, en même temps que le remplacement des contenus.
