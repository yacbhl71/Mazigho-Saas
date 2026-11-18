export type OperationalRunbookSection = {
  id: string;
  title: string;
  summary: string;
  steps: readonly string[];
  criticalRule: string;
};

export const STUDIO_SANDBOX_TO_PRODUCTION_RUNBOOK: readonly OperationalRunbookSection[] = [
  {
    id: "sandbox-rehearsal",
    title: "1. Recette préalable en environnement Test / Sandbox",
    summary: "Aucune boutique ne bascule en Production sans un paiement de test complet validé et journalisé.",
    steps: [
      "Vérifier dans l’Espace Propriétaire > Paiements que le connecteur Stripe (sk_test_ + whsec_) ou PayPal Sandbox est actif avec isTestMode = true.",
      "Exécuter le bouton « Tester la connexion » et contrôler l’entrée info (« Test de connexion réussi ») dans le journal de paiement.",
      "Passer une commande test réelle sur la vitrine publique (avec livraison et code promo) et vérifier le passage de la commande à « Payée / En préparation » ainsi que la décrémentation du stock.",
    ],
    criticalRule: "La checklist de livraison bloque formellement la remise tant que succeededTestPayments === 0.",
  },
  {
    id: "byok-live-switch",
    title: "2. Bascule BYOK Propriétaire (Stripe Live / PayPal Live)",
    summary: "L’acheteur saisit lui-même ses clés de production depuis sa session propriétaire après transfert.",
    steps: [
      "L’acheteur connecté à son compte propriétaire ouvre l’onglet Paiements et remplace les clés Sandbox par ses identifiants Live (Stripe sk_live_ + whsec_ live, ou PayPal Live Client ID + Secret).",
      "L’acheteur décoche « Mode Test / Sandbox » (isTestMode = false) et enregistre : l’événement payment_config.upsert est signé avec son actorUserId.",
      "L’acheteur lance « Tester la connexion » en mode Production : le service vérifie la cohérence mode/clé (rejet automatique MODE_KEY_MISMATCH si une clé test est fournie en mode Live).",
    ],
    criticalRule: "Si les clés ont été enregistrées par un opérateur Studio avant transfert, la checklist signale « Clés enregistrées avant le transfert » et bloque la livraison.",
  },
  {
    id: "stripe-connect-live-gate",
    title: "3. Bascule Stripe Connect Plateforme (si applicable)",
    summary: "Les environnements Stripe Connect Test et Production utilisent des variables serveur strictement isolées.",
    steps: [
      "Conserver STRIPE_SECRET_KEY (sk_test_) et STRIPE_WEBHOOK_SECRET pour les répétitions.",
      "Renseigner séparément STRIPE_LIVE_SECRET_KEY (sk_live_) et STRIPE_LIVE_WEBHOOK_SECRET sur l’environnement de production.",
      "Activer simultanément MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT=true et MAZIGHO_ENABLE_STRIPE_LIVE_CHECKOUT=true uniquement après validation de l’onboarding Connect Live du marchand.",
    ],
    criticalRule: "Le webhook Live (/api/stripe/webhook/live) refuse toute session livemode=false et exige un compte connecté acct_* valide.",
  },
] as const;

export const STUDIO_SECRET_ROTATION_RUNBOOK: readonly OperationalRunbookSection[] = [
  {
    id: "byok-tenant-keys",
    title: "1. Rotation des clés BYOK Stripe / PayPal d’une boutique",
    summary: "Procédure sans interruption de service en cas de renouvellement périodique ou de suspicion de compromission.",
    steps: [
      "Dans le tableau de bord Stripe ou PayPal du marchand, générer une nouvelle clé secrète / nouveau secret d’application.",
      "Depuis la session du propriétaire de la boutique, ouvrir Paiements, saisir la nouvelle clé et cliquer sur « Enregistrer » puis « Tester la connexion ».",
      "Révoquer immédiatement l’ancienne clé dans le tableau de bord Stripe ou PayPal et vérifier dans le journal de paiement l’entrée « Clés enregistrées ».",
    ],
    criticalRule: "Aucune clé secrète BYOK n’est jamais renvoyée par l’API ni injectée dans le HTML public de la vitrine.",
  },
  {
    id: "payment-bridge-token",
    title: "2. Rotation du jeton inter-services (PAYMENT_SERVICE_TOKEN)",
    summary: "Sécurise le pont interne (/api/internal/payment/*) entre MAZIGHO et le microservice de paiement.",
    steps: [
      "Générer un nouveau jeton aléatoire d’au moins 32 caractères haute entropie (ex. openssl rand -hex 32).",
      "Mettre à jour PAYMENT_SERVICE_TOKEN simultanément dans les variables d’environnement du service de paiement et de l’application principale MAZIGHO.",
      "Redéployer les deux services et vérifier avec un test de connexion connecteur que le pont répond HTTP 200 (comparaison en temps constant crypto.timingSafeEqual).",
    ],
    criticalRule: "Tout jeton de moins de 32 caractères désactive automatiquement le pont (HTTP 503 PAYMENT_BRIDGE_NOT_CONFIGURED).",
  },
  {
    id: "platform-core-secrets",
    title: "3. Rotation des secrets plateforme (JWT_SECRET & OWNER_AI_ENCRYPTION_KEY)",
    summary: "Gestion des sessions propriétaires et du chiffrement AES-256-GCM des clés IA locales.",
    steps: [
      "Pour JWT_SECRET : planifier la rotation en fenêtre de maintenance courte ; la mise à jour invalide instantanément tous les cookies de session et jetons d’impersonation support actifs.",
      "Pour OWNER_AI_ENCRYPTION_KEY : si la clé maîtresse doit être remplacée, réinitialiser les clés IA propriétaires chiffrées et inviter les propriétaires concernés à réenregistrer leur clé API IA.",
      "Pour les webhooks Stripe (STRIPE_WEBHOOK_SECRET / STRIPE_LIVE_WEBHOOK_SECRET) : ajouter un nouveau secret de signature dans Stripe Dashboard, mettre à jour la variable d’environnement, redéployer puis supprimer l’ancien secret.",
    ],
    criticalRule: "Ne jamais commiter de fichier .env contenant des secrets réels dans Git ; utiliser exclusivement les gestionnaires de secrets Vercel / Cloud Run.",
  },
] as const;

export function buildBuyerStoreHandoverMarkdown(input: {
  displayName: string;
  primaryDomain: string;
  buyerEmail?: string | null;
}): string {
  const storeName = input.displayName.trim() || "Votre boutique";
  const domain = input.primaryDomain.trim() || "votre-domaine.ch";
  const ownerUrl = `https://${domain}/espace-proprietaire`;
  const loginUrl = `https://${domain}/connexion-proprietaire`;
  const buyerLine = input.buyerEmail?.trim() ? `Compte propriétaire désigné : **${input.buyerEmail.trim()}**` : "Compte propriétaire : **votre adresse e-mail d’exploitant**";

  return `# Guide de prise en main Propriétaire — ${storeName}

Bienvenue dans votre boutique clé en main **${storeName}** (\`https://${domain}\`).
${buyerLine}

---

## 1. Connexion & Sécurité de votre accès

1. **Première connexion** : ouvrez votre lien d’activation ou rendez-vous sur \`${loginUrl}\` pour définir votre mot de passe personnel.
2. **Accès à votre tableau de bord** : une fois connecté, accédez à tout moment à \`${ownerUrl}\`.
3. **Contrôle des accès (onglet Équipe)** :
   - Vérifiez que vous apparaissez bien avec le rôle **Propriétaire**.
   - Tout accès temporaire de préparation MAZIGHO Studio a été révoqué avant la remise.
   - Si vous invitez un collaborateur, attribuez-lui uniquement le rôle nécessaire (*Gérant*, *Éditeur* ou *Lecteur*).

---

## 2. Vos clés d’encaissement Stripe & PayPal (BYOK)

Votre boutique encaisse directement sur vos propres comptes marchands sans intermédiaire :

1. Ouvrez **Espace Propriétaire > Paiements**.
2. **Mode Test / Sandbox** : permet de vérifier le parcours d’achat sans débiter de vraie carte.
3. **Passage en Production (Live)** :
   - Pour **Stripe** : renseignez votre clé secrète Live (\`sk_live_...\`) et votre secret de webhook Live (\`whsec_...\`), décochez *Mode Test*, enregistrez puis cliquez sur **Tester la connexion**.
   - Pour **PayPal** : renseignez votre *Client ID* et votre *Secret* d’application **Live**, décochez *Mode Test*, enregistrez puis cliquez sur **Tester la connexion**.
4. **Rotation de sécurité** : si vous renouvelez une clé chez Stripe ou PayPal, mettez-la immédiatement à jour dans cet onglet puis cliquez sur **Tester la connexion**. Ne transmettez jamais vos clés secrètes par e-mail ou dans un ticket de support.

---

## 3. Personnalisation de votre vitrine & de vos produits

- **Thèmes & Styles (onglet Thèmes de vitrine)** :
  - Prévisualisez votre boutique en temps réel sur **Ordinateur, Tablette et Mobile** avec vos vrais produits et contenus.
  - Ajustez votre couleur principale, votre typographie (*Classique*, *Moderne* ou *Éditoriale*) et l’ordre ou la visibilité des sections d’accueil, puis cliquez sur **Appliquer les styles** ou **Enregistrer l’agencement**.
- **Textes, images & bannières libres (onglet Vitrine)** :
  - Modifiez votre logo, votre image principale (Hero), vos textes d’histoire, vos arguments de réassurance et vos blocs libres sans jamais écraser votre catalogue.
- **Catalogue, variantes & stocks (onglets Catalogue & Stock)** :
  - Créez ou modifiez vos catégories, produits, prix, tailles/couleurs et quantités disponibles.
  - Le stock est déduit automatiquement uniquement lorsqu’un paiement client est confirmé.

---

## 4. Gestion quotidienne des commandes, livraisons & retours

1. **Commandes payées** : chaque commande confirmée apparaît dans l’onglet **Commandes** avec le détail des articles, l’adresse de livraison et le montant encaissé.
2. **Expédition** : préparez le colis, indiquez le transporteur et le numéro/lien de suivi, puis passez la commande au statut **Expédiée**.
3. **Mentions légales & Livraison** : maintenez à jour votre raison sociale, vos pays desservis, vos tarifs de livraison et vos conditions de retour dans les réglages de la boutique.
`;
}
