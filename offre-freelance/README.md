# Proposition freelance — Création de site web

Document commercial simple, en votre nom propre (pas d'agence) : création d'un
site web à **5 000 DH** et **800 DH / an** pour le domaine .com, l'hébergement
et la maintenance (1ʳᵉ année incluse).

- `out/Proposition-Site-Web.pdf` — le PDF A4, 2 pages, à envoyer au client
- `dist/index.html` — la même proposition en page web autonome

## Structure

Tarifs (tableau) · Ce qui est compris · Déroulement en 4 étapes ·
Exemple de réalisation (JH Sud Travaux) · Conditions · Signature

Aucune promesse de délai : la date de livraison est fixée après le premier
échange.

## À personnaliser

Le document ne contient aucun nom ni coordonnée vous concernant. L'exemple de
réalisation, lui, est nominatif (JH Sud Travaux). Ajoutez ce que vous voulez
dans `src/index.html` :

- L'en-tête indique « Création de sites web · Maroc » — vous pouvez y mettre
  votre nom ou celui de votre structure
- Un bloc de contact en bas, si vous souhaitez en afficher un
- Les montants, les conditions de paiement (50 / 50) et la validité (30 jours)

## Régénérer

```bash
node build.mjs
```

puis imprimer `dist/index.html` en PDF depuis un navigateur (format A4,
marges 14 mm, arrière-plans activés).
