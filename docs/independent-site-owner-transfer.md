# Préparation du transfert de propriété des sites indépendants

## Statut

Fonctionnalité préparée sur la branche `feat/independent-site-owner-transfer-guarded`. Aucun transfert réel n’a été exécuté, aucun compte de production n’a été modifié et aucun déploiement n’a été lancé.

## Modèle de données

La propriété primaire est portée par `independentSites.ownerUserId`. Les accès complémentaires sont isolés dans `independentSiteMembers` avec les rôles `owner`, `admin` et `editor`. Les versions, médias et domaines indépendants portent également un `ownerUserId`; ils doivent suivre le nouveau propriétaire de manière atomique.

Les journaux d’accès sont écrits dans `independentSiteAccessAuditLogs`. Les tables `stores` et `storeMemberships` ne sont pas utilisées et ne doivent pas être modifiées.

## Comportement préparé

La procédure serveur `transferIndependentSiteOwnership` est strictement réservée au propriétaire courant. Elle vérifie :

- l’accès owner côté serveur et le `siteId` demandé ;
- l’existence d’un compte cible actif et unique ;
- l’adresse e-mail cible normalisée ;
- l’absence de transfert vers soi-même ;
- la saisie exacte du titre du site ;
- la cohérence du propriétaire au moment de la transaction.

La transaction change d’abord `independentSites.ownerUserId` avec une condition sur l’ancien propriétaire et exige exactement une ligne affectée. Une seconde requête concurrente échoue avec `INDEPENDENT_SITE_TRANSFER_CONFLICT` avant toute modification des membres ou des ressources.

En base MySQL, la mutation s’exécute dans une transaction et déplace ensemble la propriété du site, des versions, des médias et des domaines. Le nouveau propriétaire reçoit l’accès `owner`; l’ancien propriétaire conserve un accès `admin`. L’action est journalisée avec l’ancien propriétaire, la cible et l’adresse e-mail.

Le chemin mémoire utilisé par les tests reproduit la même règle d’accès et vérifie qu’il n’existe qu’un seul owner après transfert.

## Interface

L’administration client contient désormais une section de transfert visible uniquement lorsque le rôle serveur est `owner`. Elle demande :

1. l’adresse e-mail du nouveau propriétaire ;
2. la saisie exacte du nom du site ;
3. une confirmation finale avant l’appel de la mutation.

La section indique explicitement que l’opération concerne uniquement le site courant, conserve l’accès de l’ancien propriétaire comme administrateur et ne touche pas les boutiques. Les rôles `admin` et `editor` ne voient pas cette section.

## Tests effectués

- TypeScript : OK.
- Tests ciblés `server/independentSiteAccess.test.ts` et `server/isolatedSiteBuilder.test.ts` : **38/38 réussis**.
- Suite Vitest complète : **198 fichiers et 848 tests réussis**.
- Build Vite + bundle serveur : OK.
- `git diff --check` : OK.
- Scan des secrets : OK, 1 250 fichiers suivis contrôlés.

Les avertissements du build concernent des règles CSS existantes et la taille de certains bundles; ils ne constituent pas des erreurs de compilation.

## Points non exécutés

- Aucun transfert vers `byaci1971@gmail.com`.
- Aucune invitation réelle créée ou modifiée.
- Aucun changement du contenu ou de la publication ATH VAHLOUL.
- Aucun déploiement ou changement de domaine/DNS.
- Aucune modification de MAZIGOSHOP, paiements, commandes, stocks, Shopify, Odoo ou secrets.

## Validation humaine requise avant usage réel

Avant tout transfert réel, vérifier l’identité et l’adresse cible, confirmer la politique métier de conservation de l’accès `admin` de l’ancien propriétaire, puis réaliser un contrôle live contrôlé et réversible. La mutation ne doit être appelée qu’après cette validation explicite.
