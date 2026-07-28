# Atlas — Offre Site Web

Offre commerciale à envoyer aux prospects : création d'un site vitrine
professionnel à **5 000 DH** (paiement unique) et **800 DH / an** pour le nom de
domaine, l'hébergement et la maintenance (1ʳᵉ année incluse dans la création).

## Livrables

- `dist/index.html` — page autonome (polices et images embarquées), à héberger
  ou à ouvrir directement. C'est le lien à envoyer sur WhatsApp.
- `out/Offre-Atlas-Site-Web.pdf` — même offre en PDF A4 (7 pages), à joindre à
  un message ou à imprimer.

## Contenu de l'offre

1. Les deux prix, annoncés dès le début
2. Le détail de ce qui est inclus (création / suivi annuel)
3. Une réalisation réelle en preuve : JH Sud Travaux (Aït Amira, Souss-Massa)
4. Le déroulé en 4 étapes et les modalités de paiement (50 % à la commande,
   50 % à la mise en ligne). Aucune promesse de délai : la date de livraison
   est annoncée après le premier échange.
5. Six questions fréquentes, dont l'objection « j'ai déjà Instagram »
6. Clôture : lien direct vers le site livré (jhsudtravaux.com)

## Points à ajuster si besoin

Ces éléments ont été fixés pour que l'offre soit complète — modifiez-les dans
`src/index.html` puis relancez `node build.mjs` :

- **Lien vers la réalisation** : constante `LIEN_SITE` en haut de `build.mjs`
- **1ʳᵉ année de domaine incluse** dans les 5 000 DH (cherchez « 1ʳᵉ année incluse »)
- **Modalités de paiement** : 50 % / 50 %
- **6 modifications par an** comprises dans le suivi
- **Validité de l'offre : 30 jours** (mention en pied de page)

## Développement

```bash
node build.mjs   # génère dist/index.html et dist/artifact.html
```

Le PDF se régénère en imprimant `dist/index.html` depuis un navigateur
(la feuille de style d'impression est intégrée).
