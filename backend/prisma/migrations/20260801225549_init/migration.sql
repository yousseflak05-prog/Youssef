-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(60) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "telephone" VARCHAR(30),
    "email" VARCHAR(150),
    "adresse" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "telephone" VARCHAR(30),
    "email" VARCHAR(150),
    "adresse" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "categorie" VARCHAR(80),
    "prix_achat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_vente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "seuil_alerte" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "client_id" INTEGER,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'payee',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vente_items" (
    "id" SERIAL NOT NULL,
    "vente_id" INTEGER NOT NULL,
    "produit_id" INTEGER,
    "designation" VARCHAR(150) NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "vente_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achats" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "fournisseur_id" INTEGER,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_ht" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achat_items" (
    "id" SERIAL NOT NULL,
    "achat_id" INTEGER NOT NULL,
    "produit_id" INTEGER,
    "designation" VARCHAR(150) NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "achat_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "clients_nom_idx" ON "clients"("nom");

-- CreateIndex
CREATE INDEX "fournisseurs_nom_idx" ON "fournisseurs"("nom");

-- CreateIndex
CREATE INDEX "produits_categorie_idx" ON "produits"("categorie");

-- CreateIndex
CREATE UNIQUE INDEX "ventes_numero_key" ON "ventes"("numero");

-- CreateIndex
CREATE INDEX "ventes_client_id_idx" ON "ventes"("client_id");

-- CreateIndex
CREATE INDEX "ventes_date_idx" ON "ventes"("date");

-- CreateIndex
CREATE INDEX "vente_items_vente_id_idx" ON "vente_items"("vente_id");

-- CreateIndex
CREATE INDEX "vente_items_produit_id_idx" ON "vente_items"("produit_id");

-- CreateIndex
CREATE UNIQUE INDEX "achats_numero_key" ON "achats"("numero");

-- CreateIndex
CREATE INDEX "achats_fournisseur_id_idx" ON "achats"("fournisseur_id");

-- CreateIndex
CREATE INDEX "achats_date_idx" ON "achats"("date");

-- CreateIndex
CREATE INDEX "achat_items_achat_id_idx" ON "achat_items"("achat_id");

-- CreateIndex
CREATE INDEX "achat_items_produit_id_idx" ON "achat_items"("produit_id");

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vente_items" ADD CONSTRAINT "vente_items_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vente_items" ADD CONSTRAINT "vente_items_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achats" ADD CONSTRAINT "achats_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achat_items" ADD CONSTRAINT "achat_items_achat_id_fkey" FOREIGN KEY ("achat_id") REFERENCES "achats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achat_items" ADD CONSTRAINT "achat_items_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Contraintes métier (ajoutées manuellement : Prisma ne génère pas de CHECK)
-- ─────────────────────────────────────────────────────────────────────────────

-- Un stock ne peut jamais devenir négatif : filet de sécurité au niveau base,
-- même si une vente contourne la vérification applicative.
ALTER TABLE "produits" ADD CONSTRAINT "produits_stock_positif" CHECK ("stock" >= 0);
ALTER TABLE "produits" ADD CONSTRAINT "produits_prix_achat_positif" CHECK ("prix_achat" >= 0);
ALTER TABLE "produits" ADD CONSTRAINT "produits_prix_vente_positif" CHECK ("prix_vente" >= 0);
ALTER TABLE "produits" ADD CONSTRAINT "produits_seuil_positif" CHECK ("seuil_alerte" >= 0);
ALTER TABLE "produits" ADD CONSTRAINT "produits_nom_non_vide" CHECK (length(btrim("nom")) > 0);

ALTER TABLE "clients" ADD CONSTRAINT "clients_nom_non_vide" CHECK (length(btrim("nom")) > 0);
ALTER TABLE "fournisseurs" ADD CONSTRAINT "fournisseurs_nom_non_vide" CHECK (length(btrim("nom")) > 0);

-- Une ligne de facture porte toujours au moins une unité, à un prix positif.
ALTER TABLE "vente_items" ADD CONSTRAINT "vente_items_quantite_positive" CHECK ("quantite" > 0);
ALTER TABLE "vente_items" ADD CONSTRAINT "vente_items_prix_positif" CHECK ("prix_unitaire" >= 0);
ALTER TABLE "achat_items" ADD CONSTRAINT "achat_items_quantite_positive" CHECK ("quantite" > 0);
ALTER TABLE "achat_items" ADD CONSTRAINT "achat_items_prix_positif" CHECK ("prix_unitaire" >= 0);

ALTER TABLE "ventes" ADD CONSTRAINT "ventes_totaux_positifs" CHECK ("total_ht" >= 0 AND "tva" >= 0 AND "total" >= 0);
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_statut_valide" CHECK ("statut" IN ('payee', 'en_attente', 'annulee'));
ALTER TABLE "achats" ADD CONSTRAINT "achats_totaux_positifs" CHECK ("total_ht" >= 0 AND "tva" >= 0 AND "total" >= 0);

ALTER TABLE "users" ADD CONSTRAINT "users_role_valide" CHECK ("role" IN ('admin', 'user'));
