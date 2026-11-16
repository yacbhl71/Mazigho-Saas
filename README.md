# MAZIGHO SaaS

Plateforme SaaS **multi-boutiques** pour créer, gérer et faire tourner des boutiques e-commerce (vitrine, catalogue, panier, paiement, commandes, retours), avec un **Studio** d'administration et un espace **propriétaire** par boutique.

> Code propriétaire — tous droits réservés. Voir [LICENSE](./LICENSE). Toute réutilisation, copie ou redistribution est interdite sans accord écrit.

## Sommaire

1. [Fonctionnalités](#1-fonctionnalités)
2. [Architecture](#2-architecture)
3. [Prérequis & installation](#3-prérequis--installation)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Commandes](#5-commandes)
6. [Base de données & migrations](#6-base-de-données--migrations)
7. [Paiements](#7-paiements)
8. [Déploiement](#8-déploiement)
9. [Tests & règle de livraison](#9-tests--règle-de-livraison)
10. [Sécurité](#10-sécurité)

## 1. Fonctionnalités

| Domaine | Contenu |
| --- | --- |
| Vitrine | Accueil, catalogue filtrable, fiches produit (variantes, galerie, avis), nouveautés, promotions, pages légales, multilingue (fr, de, it, en, es, nl, ar) |
| Panier & commande | Panier navigateur, **commande sans compte** (nom + e-mail, lien de suivi `/suivi-commande` envoyé par e-mail), livraison par pays, codes promo, acceptation des CGV versionnée, multi-devises (CHF, EUR, USD, GBP, CAD, MAD, DZD) |
| Paiement | Stripe Connect (Test / Production), **BYOK** (chaque boutique branche son Stripe ou PayPal), paiement à la livraison (Algérie) |
| Propriétaire | `/gestion-boutique` : produits, variantes, stock, commandes, préparation, retours, paiements de la boutique et **journal des paiements** (ouvertures, paiements confirmés/refusés, tests de connexion, erreurs — 180 jours, sans aucune clé) |
| Studio | `/admin/studio` : création et préparation de boutiques, import de catalogue, copie de boutique, génération d'images, assistance, **liste de contrôle avant remise** d'une boutique vendue ou offerte |
| SaaS | Plans et facturation Lemon Squeezy, quotas, domaines personnalisés |
| Fournisseurs | CJ Dropshipping, BigBuy, AliExpress (snapshots immuables par commande) |

## 2. Architecture

```
client/        React 19 + Vite + Tailwind + shadcn/ui (routage wouter, appels tRPC)
server/        Express + tRPC (routers métier, webhooks, pont de paiement)
  _core/       démarrage, authentification, contexte tRPC
  db.ts        accès MySQL/TiDB via Drizzle ORM (toutes les requêtes sont filtrées par storeId)
  services/    règles métier isolées et testées
shared/        types et règles partagés client / serveur
drizzle/       schéma Drizzle et migrations SQL versionnées
api/           point d'entrée serverless Vercel
scripts/       migrations au build, outils d'exploitation
```

Principes :

- **Isolation multi-boutiques** : chaque lecture/écriture est bornée à la boutique résolue depuis le domaine.
- **Montants calculés côté serveur** : le navigateur n'envoie que des identifiants et des quantités.
- **Secrets jamais exposés** : clés de paiement chiffrées, jamais renvoyées au navigateur.

## 3. Prérequis & installation

- Node.js 20+ et npm
- Une base MySQL compatible (TiDB / MySQL 8) pour un fonctionnement réel. Sans `DATABASE_URL`, un mode démonstration en mémoire est utilisé.

```bash
npm install --legacy-peer-deps
cp .env.example .env   # si présent, sinon créer .env (voir section 4)
npm run dev            # http://localhost:3000
```

## 4. Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion MySQL/TiDB |
| `SESSION_SECRET` / `JWT_SECRET` | Signature des sessions (obligatoire en production) |
| `PAYMENT_SERVICE_PUBLIC_URL` | URL du service de paiement BYOK |
| `PAYMENT_SERVICE_TOKEN` | Jeton partagé (32 caractères minimum) entre MAZIGHO et le service de paiement |
| `STRIPE_*` | Clés Stripe Connect Test / Production et secrets de webhook |
| `LEMONSQUEEZY_*` | Facturation SaaS |
| `GEMINI_API_KEY`, `OPENAI_API_KEY` | Fonctions d'IA du Studio |
| `CLONER_ENABLED`, `CLONER_SERVICE_URL`, `CLONER_API_KEY` | Service d'import / clonage |
| `SENTRY_DSN` | Suivi des erreurs serveur (facultatif : désactivé si absent) |
| `VITE_SENTRY_DSN` | Suivi des erreurs navigateur (facultatif : désactivé si absent, lu au build) |

Ne jamais committer de fichier `.env`. `npm run security:secrets` vérifie l'absence de secrets dans le dépôt.

## 5. Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur Express + Vite en développement |
| `npm run check` | Vérification TypeScript |
| `npm test` | Tests Vitest |
| `npm run build` | Build client (Vite) + serveur (esbuild) |
| `npm start` | Démarrage du build de production |
| `npm run security:secrets` | Détection de secrets |

## 6. Base de données & migrations

- Schéma : `drizzle/schema.ts`.
- Les migrations SQL postérieures au journal Drizzle sont listées dans `scripts/apply-schema-migrations.mjs` et appliquées **pendant le build Vercel**, avant le déploiement. Une migration en échec bloque le déploiement.
- Ajouter une migration : créer `drizzle/00NN_nom.sql` (idempotente : `IF NOT EXISTS`), puis l'ajouter à la liste du script.

## 7. Paiements

- **Stock** : pour les paiements en ligne (Stripe Connect et BYOK), le stock est retiré **uniquement quand le paiement est confirmé**, une seule fois, jamais sous zéro. Un paiement abandonné ne bloque aucun article. Le paiement à la livraison (Algérie) réserve le stock à la confirmation de la commande et le libère si elle est annulée.
- **Stripe Connect** : sessions Checkout hébergées (30 min), webhooks signés `/api/stripe/webhook` et `/api/stripe/live-webhook`.
- **BYOK** : le service autonome `ecommerce-payment-connectors` gère les clés de chaque boutique. MAZIGHO expose un pont interne protégé par `PAYMENT_SERVICE_TOKEN` (`server/paymentHostBridge.ts`) : boutique, produits, panier serveur, intentions de paiement, commande, notifications.
  - Au paiement, le panier du navigateur est recopié dans le panier serveur du client, puis le service de paiement crée la session chez Stripe ou PayPal.
  - Retour client : `/checkout/success` (vérification du paiement, capture PayPal) et `/checkout/cancel`.
- **Paiement à la livraison** : Algérie, par wilaya.

## 8. Déploiement

- Application : **Vercel** (`vercel.json` — migrations puis build, API servie par `api/`).
- Service de paiement BYOK : **Render** (dépôt séparé), à redéployer après chaque mise à jour du service.

## 9. Tests & règle de livraison

L'intégration continue GitHub Actions (`.github/workflows/ci.yml`) exécute à chaque envoi sur `main` et à chaque demande de fusion : détection de secrets, vérification TypeScript, tests et build. La branche `main` exige que ce contrôle `verify` réussisse.

Avant de déclarer une modification terminée, exécuter et réussir :

```bash
npm run check
npm test -- --run
npm run build
git diff --check
```

Détails : [AI_STUDIO_VALIDATION.md](./AI_STUDIO_VALIDATION.md) et [CONTRIBUTING.md](./CONTRIBUTING.md).

## 10. Sécurité

Signaler une vulnérabilité : voir [SECURITY.md](./SECURITY.md). Ne jamais ouvrir de ticket public pour une faille.

---

© Yacine Bahloul — Tous droits réservés.
