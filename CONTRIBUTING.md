# Contribuer à MAZIGHO SaaS

Ce dépôt est **privé et propriétaire** (voir [LICENSE](./LICENSE)). Seules les personnes autorisées par le titulaire des droits peuvent y contribuer. En contribuant, vous acceptez que vos contributions soient cédées au titulaire des droits.

## Démarrer

```bash
npm install --legacy-peer-deps
npm run dev
```

Sans `DATABASE_URL`, l'application démarre en mode démonstration en mémoire.

## Branches & commits

- `main` est déployée automatiquement : n'y poussez qu'un code vérifié.
- Travaillez sur une branche `fix/...`, `feat/...` ou `docs/...` puis ouvrez une Pull Request.
- Messages au format [Conventional Commits](https://www.conventionalcommits.org/) : `fix(checkout): ...`, `feat(studio): ...`.

## Règles de code

- TypeScript strict : pas de `any`, `@ts-ignore` ou contournement non justifié.
- **Toute requête base de données est bornée par `storeId`** : aucune donnée ne doit fuiter d'une boutique à l'autre.
- Les montants sont toujours **recalculés côté serveur** ; ne jamais faire confiance à un prix venant du navigateur.
- Aucun secret dans le code, les tests ou les logs. Utilisez les variables d'environnement.
- Schéma de base : ajoutez une migration idempotente `drizzle/00NN_nom.sql` et inscrivez-la dans `scripts/apply-schema-migrations.mjs`.
- Toute nouvelle fonctionnalité inclut ses tests (Vitest), compatibles avec les mocks existants.

## Avant chaque Pull Request

Les quatre contrôles doivent réussir :

```bash
npm run check
npm test -- --run
npm run build
git diff --check
```

Indiquez dans la PR : le but, les fichiers touchés, les migrations éventuelles et le résultat des contrôles.

## Signaler un bug

Décrivez les étapes pour reproduire, le résultat attendu, le résultat obtenu et la boutique concernée. Pour une faille de sécurité, suivez [SECURITY.md](./SECURITY.md).
