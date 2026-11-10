# Configuration MAZIGHO pour le cloner en production

À renseigner uniquement après validation manuelle du service cloner, de son DNS et de son SSL :

```env
CLONER_ENABLED=true
CLONER_SERVICE_URL=https://cloner.mazigho.ch
CLONER_API_KEY=xxx
```

`CLONER_API_KEY` doit être la même clé secrète que celle attendue par le reverse proxy ou le service cloner. Elle ne doit jamais être exposée dans le frontend, dans Git ou dans une réponse API.

## Stockage média actuel

Le code MAZIGHO existant utilise principalement Vercel Blob via `BLOB_READ_WRITE_TOKEN` ou `BLOB_STORE_ID`, avec un proxy de stockage historique basé sur `BUILT_IN_FORGE_API_URL` et `BUILT_IN_FORGE_API_KEY`. L’audit n’a pas trouvé de bucket AWS S3 actuellement configuré dans MAZIGHO.

Le cloner possède donc une intégration S3/S3-compatible prête à être activée, mais l’activation du bucket et du CDN doit être faite après une décision d’architecture explicite. Tant qu’un bucket n’est pas validé, le cloner doit rester en mode local de test ou utiliser le chemin de stockage officiellement choisi par MAZIGHO.

## Contrôles avant activation

Vérifier que l’URL est joignable depuis le runtime MAZIGHO, que le service répond à `/health`, que le header d’authentification est accepté et que le service ne peut créer qu’une boutique `setup` privée. Vérifier également la séparation des données entre les utilisateurs et l’absence de données de paiement, clients ou commandes dans le payload.
