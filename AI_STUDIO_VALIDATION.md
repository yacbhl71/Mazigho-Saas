# Règle de livraison obligatoire — MAZIGHO SaaS

Ne jamais déclarer une fonctionnalité ou une correction « terminée », « prête » ou « validée à 100 % » tant que les contrôles suivants n'ont pas réellement été exécutés sur le dernier état du code et qu'ils ont réussi :

1. `npm run check`
2. `npm test -- --run`
3. `npm run build`
4. `git diff --check`

En cas d'échec, communiquer le nombre d'erreurs, leurs fichiers, leur impact et le plan de correction. Ne pas masquer une erreur de TypeScript avec `any`, `@ts-ignore` ou un contournement non justifié. Toute nouvelle fonctionnalité doit inclure ses dépendances, ses imports, ses types et ses tests compatibles avec les mocks existants.

Avant tout déploiement Cloud Run, consigner explicitement le hash publié et le résultat des quatre contrôles. Les déploiements ne sont autorisés que si ces contrôles sont verts, sauf décision explicite du propriétaire indiquant l'exception et le risque accepté.
