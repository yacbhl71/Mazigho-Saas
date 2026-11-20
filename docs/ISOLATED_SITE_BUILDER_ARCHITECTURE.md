# Rapport d’Analyse Technique & d’Architecture — Constructeur de Sites Internet Indépendant

- **Branche dédiée** : `isolated-visual-builder-2026-11-19`
- **Commit de départ (`origin/main`)** : `5c94963effd70d8822bfa081cb2af2afc6fbc3df` (`feat(studio): add visual cards block and close dependency audit`)
- **Statut de `main` et des branches existantes** : **Intactes et verrouillées** (aucune modification sur `main`, `audit-constructeur-visuel-2026-11-18`, `ai-studio-project-modes-2026-11-19`, `ath-vahloul-site-modules-2026-11-19`, `security-dependency-updates-2026-11-19`).

---

## 0. Vérifications Préalables (État des branches & Emplacement du produit)

1. **Commit de départ** :
   - `5c94963effd70d8822bfa081cb2af2afc6fbc3df`
2. **État de `main`** :
   - `origin/main` = `5c94963effd70d8822bfa081cb2af2afc6fbc3df` (non modifiée).
3. **État des branches existantes sur `origin`** :
   - `main` : `5c94963effd70d8822bfa081cb2af2afc6fbc3df`
   - `security-dependency-updates-2026-11-19` : `5c94963effd70d8822bfa081cb2af2afc6fbc3df`
   - `ai-studio-project-modes-2026-11-19` : `2c4ba501a36354ab484e35b2d60553725f8756da`
   - `ath-vahloul-site-modules-2026-11-19` : `294535cef7ab114335b68a234d1b76af8aa24bde`
   - `audit-constructeur-visuel-2026-11-18` : `d60abbce9b1c4e5338f6c46a6a7d62ea20eb0d82`
4. **Emplacement exact du nouveau produit** :
   - **Domaine fonctionnel & modèles partagés** : `shared/isolatedSiteBuilder.ts`
   - **Persistance & base de données isolée** : `drizzle/0063_independent_site_builder.sql` et `server/isolatedSiteBuilderDb.ts`
   - **API tRPC dédiée** : `server/isolatedSiteBuilderRouter.ts` (montée sous `trpc.independentSiteBuilder`)
   - **Interface utilisateur du produit indépendant** :
     - `client/src/pages/site-builder/IndependentSiteBuilderPage.tsx` (route `/constructeur-sites`)
     - `client/src/pages/site-builder/IndependentSitePublicPreviewPage.tsx` (routes `/constructeur-sites/apercu/:slug` et `/sites/:slug`)
   - **Suite de tests dédiée** : `server/isolatedSiteBuilder.test.ts`
5. **Stratégie de dépôt (Nouveau dépôt GitHub vs Espace isolé)** :
   - Le token GitHub fourni précédemment ayant une portée limitée au dépôt `yacbhl71/Mazigho-Saas.git` (sans droit de création de nouveau dépôt `Administration:write` sur le compte), le nouveau produit est logé dans un **espace modulaire strictement cloisonné** (`client/src/pages/site-builder/`, `server/isolatedSiteBuilder*`, `shared/isolatedSiteBuilder.ts`) sur la branche dédiée `isolated-visual-builder-2026-11-19`.
   - Grâce à l’absence totale d’import depuis `AdminStudioVisualBuilder.tsx`, `adminRouter.ts` ou `shopRouter.ts`, ce dossier est **extractible en 1 commande** vers un dépôt GitHub indépendant (ex. `yacbhl71/Mazigho-Site-Builder`) dès que souhaité.

---

## 1. Architecture Proposée

```text
Constructeur de Sites Internet Indépendant (/constructeur-sites)
├── Éditeur visuel GrapesJS (@grapesjs/react + grapesjs)
├── Pages (multi-pages, slugs, SEO par page, menus et sous-menus hiérarchiques)
├── Blocs (24 blocs éditoriaux : Header, Footer, Hero, Bannières, Textes, Images transformables, Cartes visuelles "+", Galeries, FAQ, Étapes, Témoignages, Statistiques, CTA, Formulaires, Vidéos, Séparateurs)
├── Médias (bibliothèque personnelle par projet + transformations : rotation, inclinaison, retournement H/V, zoom, position libre)
├── Calques (arborescence DOM/sections : monter, descendre, verrouiller, masquer, dupliquer, supprimer)
├── Styles & Propriétés (couleurs, typographies, espacements, bordures, ombres, attributs HTML/liens)
├── Modules (8 modules fonctionnels : Événements/Calendrier, Formulaire de contact, Galerie, Témoignages, Membres & Rôles, Actualités/Annonces avec consentement, Annuaire/Matériel, Coordonnées)
├── Socles (9 structures de pages prêtes à personnaliser : Accueil, Association, Famille, Entreprise, Services, Contact, Événements, Équipe, Actualités)
├── Modèles (3 sites complets multi-pages prêts à l’emploi, dont « Association familiale ATH VAHLOUL »)
├── Gestion Responsive (aperçu temps réel Ordinateur 100 %, Tablette 768 px, Mobile 375 px)
├── Projets & Brouillons (statuts : Brouillon, Publié, Archivé + duplication + composants réutilisables inter-pages)
├── Versions & Historique (snapshots horodatés + restauration en un clic)
├── Prévisualisation & Publication indépendante (/constructeur-sites/apercu/:slug et /sites/:slug)
├── Domaines personnalisés (enregistrement hostname, jeton DNS TXT, statut SSL, domaine principal)
└── Espace utilisateur indépendant (filtré par ownerUserId, sans compte boutique ni rôle admin requis)
```

---

## 2. Stratégie de Séparation avec Studio MAZIGHO

1. **Séparation des routes Frontend** :
   - Studio MAZIGHO conserve `/admin/studio/constructeur-visuel` (`AdminStudioVisualBuilder.tsx`).
   - Le nouveau produit utilise `/constructeur-sites`, `/constructeur-sites/apercu/:slug` et `/sites/:slug`.
2. **Séparation des routes Backend (tRPC)** :
   - Studio MAZIGHO conserve `trpc.admin.studio.*` dans `server/adminRouter.ts`.
   - Le nouveau produit utilise son propre routeur `trpc.independentSiteBuilder.*` dans `server/isolatedSiteBuilderRouter.ts`.
3. **Séparation des données** :
   - Aucune lecture ni écriture dans `stores`, `storeSettings`, `storeCmsPages`, `products`, `categories`, `orders`, `carts`, `paymentIntents` ni même dans `studioVisualProjects`.
   - Toutes les données résident dans 4 tables préfixées `independentSite*`.

---

## 3. Dépendances avec le Constructeur Actuel

- **Dépendance applicative directe** : **Aucune (0)**. Le nouveau produit n’importe rien depuis `AdminStudioVisualBuilder.tsx` ni depuis `server/adminRouter.ts`.
- **Dépendances techniques partagées (librairies npm standard)** :
  - `grapesjs` et `@grapesjs/react` (moteur d’édition visuelle) ;
  - Composants UI génériques (`@/components/ui/button`, `card`, `badge`, `lucide-react`) ;
  - Utilitaires purs d’assainissement d’URL et de balises `alt` (`normalizeBuilderHref`, `sanitizeBuilderAlt`).

---

## 4. Fichiers Réutilisables sans Risque

- `client/src/lib/visualBuilderSafety.ts` (`normalizeBuilderHref`, `sanitizeBuilderAlt` uniquement en lecture).
- `client/src/components/ui/*` (composants atomiques Shadcn/Tailwind : `Button`, `Card`, `Badge`).
- `server/_core/trpc.ts` (`router`, `protectedProcedure`, `publicProcedure`).

---

## 5. Fichiers Extraits / Créés pour le Nouveau Produit

Plutôt que de découper ou risquer de casser le fichier monolithique `client/src/pages/admin/AdminStudioVisualBuilder.tsx` (1 529 lignes), nous créons une architecture modulaire dédiée :
1. `shared/isolatedSiteBuilder.ts` : référentiel extensible des types de sites, des 24 Blocs (incluant les Cartes visuelles avec bouton `+` et transformations d’image), des 8 Modules, des 9 Socles de page, des 3 Modèles multi-pages (dont **« Association familiale ATH VAHLOUL »**), du générateur HTML/CSS multi-pages et des gardes de sécurité (`assertNoSecretsInIndependentSite`, `assertZeroEcommerceInIndependentSite`).
2. `drizzle/0063_independent_site_builder.sql` : migration SQL additive créant `independentSites`, `independentSiteVersions`, `independentSiteMedia` et `independentSiteDomains`.
3. `server/isolatedSiteBuilderDb.ts` : couche d’accès aux données strictement filtrée par `ownerUserId`.
4. `server/isolatedSiteBuilderRouter.ts` : routeur tRPC indépendant.
5. `client/src/pages/site-builder/IndependentSiteBuilderPage.tsx` : espace utilisateur + éditeur GrapesJS complet avec onglets séparés (*Pages*, *Blocs*, *Médias*, *Calques*, *Modules*, *Socles*, *Modèles*, *Versions*, *Domaines*).
6. `client/src/pages/site-builder/IndependentSitePublicPreviewPage.tsx` : page de prévisualisation publique et rendu des sites publiés.
7. `server/isolatedSiteBuilder.test.ts` : suite de tests unitaires et d’intégration dédiée.

---

## 6. Stratégie de Stockage (Base de données & Préfixes)

- **Option Base séparée vs Base commune cloisonnée** :
  - Le module `server/isolatedSiteBuilderDb.ts` supporte une variable d’environnement dédiée `INDEPENDENT_SITES_DATABASE_URL` (permettant de pointer vers une base MySQL/TiDB physiquement distincte) avec repli contrôlé sur `DATABASE_URL`.
  - Dans le schéma SQL, toutes les tables portent le préfixe strict **`independentSite`** :
    - `independentSites`
    - `independentSiteVersions`
    - `independentSiteMedia`
    - `independentSiteDomains`
  - **Aucune colonne `storeId`** n’existe dans ces tables, rendant tout mélange avec une boutique MAZIGHO structurellement impossible.

---

## 7. Stratégie d’Authentification et Permissions

- Authentification basée sur `protectedProcedure` (`ctx.user.id`).
- Contrairement à Studio MAZIGHO (`platformProcedure` réservé à l’opérateur plateforme), l’espace utilisateur du Constructeur de Sites Indépendant est ouvert à tout utilisateur authentifié, mais **chaque requête SQL et mémoire applique la clause `WHERE ownerUserId = ctx.user.id`**.
- Un utilisateur ne peut ni lister, ni lire, ni modifier, ni dupliquer, ni publier, ni associer un domaine au projet d’un autre utilisateur (`TRPCError({ code: "NOT_FOUND" })`).

---

## 8. Stratégie de Publication

- La publication d’un site indépendant est **100 % découplée des boutiques** :
  1. Validation anti-secrets (`assertNoSecretsInIndependentSite`) et anti-artefacts e-commerce (`assertZeroEcommerceInIndependentSite`).
  2. Vérification de cohérence des pages (au moins 1 page avec HTML valide et navigation résolue).
  3. Création automatique d’un snapshot immuable dans `publishedSnapshotJson` + création d’une entrée dans `independentSiteVersions`.
  4. Mise à jour du statut du projet à `published` (`publishedAt = NOW()`).
  5. Le site devient immédiatement consultable sur `/constructeur-sites/apercu/:slug` et `/sites/:slug`.

---

## 9. Stratégie de Gestion des Domaines Personnalisés

- Table dédiée `independentSiteDomains` (séparée de `stores.primaryDomain` et du registre des domaines de boutiques).
-Validation stricte du nom d’hôte (`normalizeIndependentSiteDomain` : rejet des domaines `*.mazigho.ch`, `*.mazigho.com`, `localhost`, IPs ou formats invalides).
- Génération d’un enregistrement DNS TXT de vérification (`_mazigho-site-verify.<domaine>` -> `msite-verify-<jeton>`).
- États suivis : `pending_dns` -> `verified` -> `active` (avec état SSL `pending` / `active`).

---

## 10. Risques Techniques & Parades

- **Poids des projets multi-pages (HTML/CSS/JSON GrapesJS)** : utilisation de colonnes `MEDIUMTEXT` (jusqu’à 16 Mo) dès la migration `0063_independent_site_builder.sql`.
- **Manipulation des transformations d’image et des cartes visuelles `+`** : implémentation de contrôles déclaratifs synchronisés avec le composant sélectionné dans GrapesJS et le HTML de la page active.

---

## 11. Risques de Sécurité & Parades

- **Injection XSS / protocoles dangereux dans les liens** : assainissement systématique des URLs (`normalizeBuilderHref` bloque `javascript:`, `data:text/html`, `vbscript:`) et des attributs `alt`.
- **Fuite de secrets dans le JSON ou HTML du site** : `assertNoSecretsInIndependentSite` bloque toute sauvegarde ou publication contenant une clé privée, un token ou une clé API.
- **Accès transversal entre utilisateurs (IDOR)** : vérification systématique `project.ownerUserId === ctx.user.id` sur chaque mutation et requête privée.

---

## 12. Risques de Régression sur Studio MAZIGHO

- **Risque nul (0 %)** :
  - `client/src/pages/admin/AdminStudioVisualBuilder.tsx` : **non modifié (0 ligne touchée)**.
  - `server/adminRouter.ts` : **non modifié (0 ligne touchée)**.
  - `server/shopRouter.ts`, `server/stripeCheckout.ts`, `server/ownerRouter.ts` : **non modifiés (0 ligne touchée)**.

---

## 13. Liste des Étapes de Développement

1. Créer la branche dédiée `isolated-visual-builder-2026-11-19` depuis `origin/main` (`5c94963`).
2. Rédiger le rapport d’architecture (`docs/ISOLATED_SITE_BUILDER_ARCHITECTURE.md`).
3. Créer le cœur fonctionnel et les bibliothèques (`shared/isolatedSiteBuilder.ts`) incluant les 24 Blocs, 8 Modules, 9 Socles, 3 Modèles complets (dont **« Association familiale ATH VAHLOUL »**), les transformations d’images et les cartes visuelles avec bouton `+`.
4. Créer la migration additive `drizzle/0063_independent_site_builder.sql`, l’enregistrer dans `scripts/apply-schema-migrations.mjs` et déclarer les 4 tables dans `drizzle/schema.ts`.
5. Créer la couche de persistance isolée `server/isolatedSiteBuilderDb.ts` et le routeur tRPC `server/isolatedSiteBuilderRouter.ts`, puis enregistrer `independentSiteBuilder` dans `server/routers.ts`.
6. Créer les pages Frontend `/constructeur-sites` (`IndependentSiteBuilderPage.tsx`) et `/constructeur-sites/apercu/:slug` + `/sites/:slug` (`IndependentSitePublicPreviewPage.tsx`) et déclarer ces 3 routes dans `client/src/App.tsx`.
7. Écrire la suite de tests complète `server/isolatedSiteBuilder.test.ts` et exécuter toutes les validations obligatoires (`tsc`, `vitest`, `vite build`, `check-secrets`, `git diff --check`).

---

## 14. Liste des Tests Prévus (`server/isolatedSiteBuilder.test.ts`)

1. Séparation stricte des 7 bibliothèques (*Pages*, *Blocs*, *Médias*, *Calques*, *Modules*, *Socles*, *Modèles*) et absence totale de blocs e-commerce (panier, catalogue, checkout, prix, stock).
2. Création d’un projet multi-pages avec menus et sous-menus hiérarchiques.
3. Transformations d’images (rotation, inclinaison `skewX`/`skewY`, retournement horizontal/vertical, agrandissement/réduction `scale`, positionnement libre `offsetX`/`offsetY`) et génération CSS `transform`.
4. Cartes visuelles configurables (`square`, `rectangular`, `round`, position du texte `top`/`bottom`/`inside`, bouton facultatif, duplication d’une carte, ajout dynamique via le bouton `+`).
5. Instanciation des 9 Socles de page (*Accueil*, *Association*, *Famille*, *Entreprise*, *Services*, *Contact*, *Événements*, *Équipe*, *Actualités*).
6. Instanciation des 8 Modules fonctionnels réutilisables.
7. Création et démonstration complète du site fictif **« Association familiale ATH VAHLOUL »** (multi-pages, sans boutique).
8. Sauvegarde de brouillon, duplication de projet, archivage et création/restauration de versions historiques.
9. Bibliothèque personnelle de médias isolée par projet et composants réutilisables entre plusieurs pages.
10. Publication indépendante d’une boutique et lecture de la prévisualisation publique (`/sites/:slug`).
11. Gestion des domaines personnalisés (validation hostname, rejet des domaines réservés MAZIGHO, génération du token DNS TXT, activation).
12. Isolation stricte entre utilisateurs (un utilisateur B ne peut ni lire, ni modifier, ni dupliquer, ni publier, ni supprimer le site de l’utilisateur A).
13. Rejet automatique de tout secret/clé API (`assertNoSecretsInIndependentSite`) et de tout payload e-commerce (`assertZeroEcommerceInIndependentSite`).

---

## 15. Liste des Éléments qui ne seront PAS Modifiés

- `client/src/pages/admin/AdminStudioVisualBuilder.tsx` *(0 modification)*
- `server/adminRouter.ts` *(0 modification)*
- `server/shopRouter.ts` *(0 modification)*
- `server/ownerRouter.ts` *(0 modification)*
- `server/stripeCheckout.ts` et `server/paymentServiceProxy.ts` *(0 modification)*
- Les tables `stores`, `storeSettings`, `storeCmsPages`, `products`, `categories`, `orders`, `carts`, `studioVisualProjects` *(0 modification)*
- Les branches `main`, `audit-constructeur-visuel-2026-11-18`, `ai-studio-project-modes-2026-11-19`, `ath-vahloul-site-modules-2026-11-19`, `security-dependency-updates-2026-11-19` *(0 modification)*
