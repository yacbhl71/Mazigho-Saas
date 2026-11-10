# Changelog

## 2026-11-10

- Ajout de l’endpoint serveur `POST /api/import/clone` pour recevoir les projets du microservice MAZIGHO Site Cloner en brouillon.
- Ajout d’une validation stricte, d’une authentification `x-cloner-api-key`, d’un contrôle de l’utilisateur cible et d’un import transactionnel isolé par boutique.
- Les produits et variantes importés sont créés sans stock réel et en statut brouillon ; aucun paiement, client, commande ou secret n’est cloné.
