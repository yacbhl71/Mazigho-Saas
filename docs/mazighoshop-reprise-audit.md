# MAZIGOSHOP — reprise contrôlée

**Branche :** `mazighoshop-reprise-audit-2026-11-21`  
**Point de départ :** `main` au commit `fb51562`  
**Statut :** audit et préparation uniquement

## Décision d’architecture

MAZIGOSHOP est traité comme une boutique externe actuellement servie par un déploiement distinct. Le domaine `mazighoshop.com` ne doit pas être remplacé par MAZIGHO tant que le catalogue, les contenus, les parcours client et le checkout n’ont pas été comparés et validés.

La reprise cible réutilisera les composants storefront et l’architecture multi-boutiques de MAZIGHO. Elle devra être créée dans une boutique de test distincte, avec un `storeId` propre, avant toute réflexion sur le domaine public.

## Correspondance existante

La page d’accueil MAZIGHO appelle déjà les données publiques par les procédures `products.getAll`, `products.getFeatured`, `categories.getAll`, `storefront.getAvailability`, `storefront.getMarketSettings`, `content.getActiveBanners`, `design.get` et `design.getPublishedBuilder`.

Les pages déjà réutilisables sont :

- `client/src/pages/Home.tsx` pour la vitrine et les sections éditoriales ;
- `client/src/pages/Shop.tsx` et `client/src/pages/Category.tsx` pour le catalogue ;
- `client/src/pages/Product.tsx` pour les fiches ;
- `client/src/pages/Cart.tsx` pour le panier ;
- `client/src/pages/Checkout.tsx` pour le checkout ;
- `client/src/pages/OrderTracking.tsx` pour le suivi ;
- `client/src/pages/Contact.tsx`, `FAQ.tsx` et les pages légales pour les contenus de confiance.

Les briques d’administration existantes couvrent déjà les produits, catégories, commandes, retours, avis, promotions, marketing, SEO, thèmes, bannières, traductions et import/export CSV.

## Contenu à reprendre après obtention d’une source fiable

Le site public actuel présente les catégories High-Tech & Gadgets, Maison & Organisation, Beauté & Bien-Être, Sport & Fitness et Auto & Accessoires. Il affiche aussi une promesse de livraison Suisse & Europe, les retours gratuits sous 30 jours et une expédition annoncée sous 24–48 heures.

Ces éléments sont des références de contenu public, pas encore des données à injecter automatiquement. Les produits, prix, variantes, stocks, images, avis, commandes et paramètres de paiement devront provenir d’un export ou d’une sauvegarde validée.

## Sources possibles à demander ou à retrouver

1. Export catalogue de la boutique actuelle, idéalement CSV avec produits, variantes, prix, images, stock et collections.
2. Export ou sauvegarde des contenus de la page d’accueil, catégories, pages légales et menus.
3. Inventaire séparé des images originales et de leurs droits d’utilisation.
4. Confirmation du prestataire qui héberge le backend actuel et de l’existence ou non d’un export de base de données.
5. Preuve distincte d’une ancienne boutique Shopify si une migration historique doit être tentée.

## Garde-fous

Cette branche ne modifie pas `main`, `origin/main`, la production publique, Vercel, Hostinger, le DNS, les paiements, les commandes, les stocks ou les secrets. Aucun import Shopify et aucune reconnexion externe ne sont exécutés dans cette étape.

La prochaine modification de code devra rester limitée à un environnement de test et être précédée d’un jeu de données clairement marqué comme reprise MAZIGOSHOP. La publication du domaine public ne pourra intervenir qu’après validation visuelle, fonctionnelle et commerciale séparée.

## Vérification du storefront historique

Le bundle public de `mazighoshop.com` embarque un client Supabase et référence les tables `products`, `product_variants`, `collections`, `collection_products` et `product_reviews`. Le code public filtre notamment les produits disponibles à la vente et charge leurs variantes séparément.

Une lecture strictement publique et non destructive de ces tables a été tentée avec l’accès anonyme exposé par le frontend. Les quatre tables catalogue interrogées ont répondu correctement, mais sans ligne exploitable. Cela prouve l’existence de cette architecture Supabase dans le bundle, mais ne permet pas de récupérer le catalogue réel avec l’accès public actuel. Aucune tentative de contournement, d’authentification ou d’écriture n’a été effectuée.

La reprise doit donc accepter une source autorisée supplémentaire : export catalogue, sauvegarde Supabase fournie par le propriétaire, ou export depuis le panneau d’administration de l’ancienne boutique.
