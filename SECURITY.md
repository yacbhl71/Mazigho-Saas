# Politique de sécurité — MAZIGHO SaaS

## Signaler une vulnérabilité

**N'ouvrez jamais de ticket public** pour une faille de sécurité.

Écrivez à **yacbhl71@gmail.com** avec l'objet `[SECURITY] MAZIGHO` en indiquant :

- la description de la faille et son impact ;
- les étapes pour la reproduire (URL, boutique, requête) ;
- la version ou le commit concerné, si connu.

Accusé de réception sous 72 h ; un correctif est priorisé selon la gravité. Merci de ne pas divulguer la faille avant sa correction.

## Versions prises en charge

Seule la branche `main` déployée en production reçoit des correctifs de sécurité.

## Mesures en place

| Domaine | Mesure |
| --- | --- |
| Isolation | Chaque requête est bornée à la boutique (`storeId`) résolue depuis le domaine |
| Authentification | Sessions signées, limitation du nombre de tentatives de connexion |
| Paiements | Pages de paiement hébergées par Stripe / PayPal : aucune donnée de carte ne transite par MAZIGHO |
| Montants | Prix, stock et totaux recalculés côté serveur |
| Clés BYOK | Stockées chiffrées (AES-256-GCM) par le service de paiement, jamais renvoyées au navigateur |
| Pont de paiement | Routes `/api/internal/payment/*` protégées par un jeton partagé comparé en temps constant |
| Webhooks | Signatures vérifiées, traitement idempotent |
| Secrets | Variables d'environnement uniquement ; `npm run security:secrets` détecte les fuites |

## Bonnes pratiques pour les contributeurs

- Ne jamais committer de `.env`, de clé API ou de donnée client.
- Ne jamais journaliser un secret, un jeton ou une donnée de paiement.
- Renouveler immédiatement toute clé exposée par erreur.
