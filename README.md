# Registre — ERP pour petite entreprise

Application de gestion commerciale : clients, fournisseurs, catalogue produits,
facturation avec génération de PDF, achats et suivi de stock. Alternative
simplifiée à un logiciel type Sage, pensée pour une TPE.

```
/backend    API REST — Express + Prisma + PostgreSQL
/frontend   Interface — React (Vite) + Tailwind CSS + React Router
```

## Fonctionnalités

- **Authentification JWT** — compte administrateur unique, routes protégées par
  un middleware, jeton conservé côté navigateur et revalidé au chargement.
- **Tableau de bord** — chiffre d'affaires (total, mois courant, évolution),
  compteurs, valorisation du stock, alertes de rupture, factures impayées,
  série mensuelle et meilleures ventes.
- **Clients / Fournisseurs** — CRUD complet avec recherche.
- **Produits** — CRUD, catégories, seuil d'alerte par produit, ajustement
  manuel de stock, filtres (catégorie, stock faible).
- **Facturation** — création multi-lignes, calcul HT / TVA 20 % / TTC,
  numérotation automatique `FAC-AAAA-NNNN`, **décrément du stock dans la même
  transaction**, statuts (payée / en attente / annulée), annulation qui
  restitue le stock, **export PDF**.
- **Achats** — même mécanique en sens inverse : le stock est incrémenté.

## Prérequis

- Node.js ≥ 18
- PostgreSQL ≥ 14

## Installation

### 1. Base de données

```bash
sudo -u postgres psql -c "CREATE USER erp WITH PASSWORD 'erp_dev_password' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE erp_db OWNER erp;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # ajustez DATABASE_URL et JWT_SECRET
npm install
npm run prisma:migrate      # crée les tables
npm run seed                # jeu de données de démonstration
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Le serveur de développement Vite relaie `/api` vers `http://localhost:4000`
(variable `VITE_API_PROXY` pour pointer ailleurs) : aucune configuration CORS
n'est nécessaire en local.

**Connexion :** `admin` / `admin123` (défini par `ADMIN_USERNAME` et
`ADMIN_PASSWORD` dans `.env`, appliqué au seed).

## Schéma de données

Huit tables, clés étrangères et contraintes `CHECK` (stock ≥ 0, quantités > 0,
montants positifs, statuts validés) :

| Table | Rôle |
|---|---|
| `users` | comptes (hash bcrypt, rôle) |
| `clients` / `fournisseurs` | fiches tiers |
| `produits` | catalogue, prix d'achat/vente, stock, seuil d'alerte |
| `ventes` / `vente_items` | factures et leurs lignes |
| `achats` / `achat_items` | approvisionnements et leurs lignes |

Deux choix structurants :

- Supprimer un client ou un produit ne détruit **jamais** un document
  comptable : la clé étrangère passe à `NULL` (`ON DELETE SET NULL`) et la
  désignation, recopiée sur la ligne au moment de la vente, garde la facture
  lisible. Les lignes, elles, suivent leur document (`ON DELETE CASCADE`).
- Les montants sont en `DECIMAL(12,2)`, jamais en flottant.

## API

Toutes les routes sauf `/api/health`, `/api/config` et `/api/auth/login`
exigent l'en-tête `Authorization: Bearer <jeton>`.

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | renvoie un JWT |
| `GET` | `/api/auth/me` | profil courant |
| `GET` | `/api/dashboard/stats` | indicateurs, alertes, 5 dernières ventes |
| `GET` | `/api/dashboard/ca-mensuel?mois=6` | série mensuelle du CA |
| `GET` | `/api/dashboard/top-produits?limit=5` | meilleures ventes |
| `GET POST` | `/api/clients`, `/api/fournisseurs`, `/api/produits` | liste / création |
| `GET PUT DELETE` | `…/:id` | détail / modification / suppression |
| `POST` | `/api/produits/:id/ajuster-stock` | entrée ou sortie manuelle |
| `GET POST` | `/api/ventes` | liste (filtres client, statut, dates) / création |
| `GET DELETE` | `/api/ventes/:id` | détail / annulation avec retour en stock |
| `PATCH` | `/api/ventes/:id/statut` | encaissement, mise en attente |
| `GET` | `/api/ventes/:id/pdf` | facture PDF |
| `GET POST` | `/api/achats` | liste / création |
| `GET DELETE` | `/api/achats/:id` | détail / annulation |

La suppression d'un tiers ou d'un produit rattaché à des documents renvoie un
`409` décrivant l'impact ; rejouer l'appel avec `?force=true` confirme.

### Cohérence du stock

La création d'une facture s'exécute dans une transaction unique. Le stock est
décrémenté par une mise à jour conditionnelle :

```sql
UPDATE produits SET stock = stock - :quantite
WHERE id = :id AND stock >= :quantite
```

Si aucune ligne n'est touchée, le stock est devenu insuffisant entre
l'affichage et l'envoi : la transaction est annulée et l'API renvoie un `409`.
Aucune facture ne peut donc exister sans son mouvement de stock, ni
l'inverse — y compris si deux utilisateurs vendent le dernier article en même
temps. La contrainte `CHECK (stock >= 0)` sert de dernier filet côté base.

## Scripts

| Emplacement | Commande | Effet |
|---|---|---|
| `backend` | `npm run dev` | API en rechargement automatique |
| `backend` | `npm run prisma:migrate` | applique les migrations |
| `backend` | `npm run seed` | réinitialise et recharge les données de démo |
| `backend` | `npm run db:reset` | remet la base à zéro puis rejoue le seed |
| `frontend` | `npm run dev` | serveur de développement |
| `frontend` | `npm run build` | build de production dans `dist/` |

## Mise en production

1. `JWT_SECRET` aléatoire (`openssl rand -hex 32`) et mot de passe admin changé.
2. `NODE_ENV=production`, `npm run prisma:deploy` plutôt que `migrate dev`.
3. `frontend/dist` servi par un serveur statique, avec `/api` relayé vers le
   backend — ou `CORS_ORIGIN` renseigné si les deux sont sur des domaines
   distincts.
