# API d’import MAZIGHO Site Cloner

## Endpoint

`POST /api/import/clone`

La requête doit contenir l’en-tête serveur `x-cloner-api-key`, égal à `CLONER_API_KEY`. Cette clé ne doit jamais être exposée au navigateur ni engagée dans Git.

## Contrat

Le JSON accepté contient strictement `user_id`, `project_name`, `source_url`, `platform`, `theme`, `pages`, `catalog`, `navigation` et `settings`. Les champs liés aux paiements, clients, commandes, tokens, secrets, Stripe, webhooks et identifiants de facturation sont rejetés. Les scripts, iframes, attributs d’événement et URLs `javascript:` sont rejetés.

## Comportement

L’import crée une nouvelle boutique isolée avec `status=setup`, une adhésion propriétaire pour l’utilisateur ciblé, puis persiste le design, la navigation, les blocs et les métadonnées dans `storeSettings`. Les produits sont créés en `draft`, le stock et les stocks de variantes sont forcés à zéro. L’opération catalogue est transactionnelle : toute erreur annule la création de la boutique.

Les types de blocs connus sont conservés. Les autres deviennent `custom-html` avec `reviewRequired=true`; aucun HTML exécutable n’est accepté. Les images sont uniquement référencées par les URLs déjà fournies par le cloner.

## Réponse

La réponse `201` fournit `store_id`, `store_url`, `editor_url`, `preview_url` et `import_summary`. La boutique reste non publique tant qu’elle est en préparation et qu’un opérateur ne l’a pas activée.

## Erreurs

- `401` : clé absente ou incorrecte.
- `400` : contrat invalide ou contenu interdit.
- `404` : utilisateur cible introuvable.
- `503` : base de données indisponible.
