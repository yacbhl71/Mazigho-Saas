export type HandoverStatus = "ok" | "todo" | "warning" | "info";
export type HandoverItem = { key: string; label: string; status: HandoverStatus; detail: string };

export type StoreHandoverFacts = {
  store: { id: number; displayName: string; primaryDomain: string; status: string };
  buyer: { email: string | null; name: string | null; activated: boolean } | null;
  /** Active memberships other than the buyer's (previous owner, staff, MAZIGHO operators). */
  otherAccess: Array<{ email: string | null; role: string; platformStaff: boolean }>;
  /** Latest saved keys per connector: true = saved by the buyer, null = author unknown. */
  connectorKeys: Array<{ provider: string; savedByBuyer: boolean | null }>;
  legal: { operatorName: string; complete: boolean; sameAsPlatform: boolean };
  delivery: { ready: boolean };
  paymentRoute: string;
  sellableProducts: number;
  succeededTestPayments: number;
  succeededLivePayments: number;
};

export type HandoverPaymentOption = { provider: string; label: string; isTestMode: boolean };

const PROVIDER_LABEL: Record<string, string> = { stripe: "Stripe", paypal: "PayPal" };
const KEYED_PROVIDERS = new Set(["stripe", "paypal"]);
const ROLE_LABEL: Record<string, string> = {
  owner: "propriétaire",
  manager: "gérant",
  catalog_editor: "catalogue",
  support_agent: "support",
  order_operator: "commandes",
  accountant: "comptabilité",
  viewer: "lecture",
};

const providerNames = (providers: string[]) => providers.map(provider => PROVIDER_LABEL[provider] ?? provider).join(", ");

function teamAccessItem(facts: StoreHandoverFacts): HandoverItem {
  const label = "Accès de l’ancienne équipe retirés";
  if (facts.otherAccess.length === 0) return { key: "team_access", label, status: "ok", detail: "Seul l’acheteur a accès à la gestion de la boutique." };
  const list = facts.otherAccess.slice(0, 5).map(access => `${access.email ?? "compte sans e-mail"} (${ROLE_LABEL[access.role] ?? access.role}${access.platformStaff ? ", MAZIGHO" : ""})`).join(", ");
  const more = facts.otherAccess.length > 5 ? "…" : "";
  return { key: "team_access", label, status: "todo", detail: `${facts.otherAccess.length} accès encore actif(s) : ${list}${more}. Retirez l’ancien propriétaire et l’équipe avant la remise.` };
}

function keyOwnershipItem(facts: StoreHandoverFacts, options: HandoverPaymentOption[]): HandoverItem {
  const label = "Clés de paiement de l’acheteur";
  if (!facts.buyer) return { key: "payment_keys", label, status: "todo", detail: "Transférez d’abord la boutique : l’acheteur enregistrera ensuite ses propres clés." };
  const providers = Array.from(new Set(options.map(option => option.provider))).filter(provider => KEYED_PROVIDERS.has(provider));
  const savedByBuyer = (provider: string) => facts.connectorKeys.find(key => key.provider === provider)?.savedByBuyer ?? null;
  const foreign = providers.filter(provider => savedByBuyer(provider) === false);
  if (foreign.length > 0) {
    return { key: "payment_keys", label, status: "todo", detail: `Clés ${providerNames(foreign)} enregistrées par une autre personne que l’acheteur : supprimez-les dans « Paiements », puis l’acheteur enregistre les siennes.` };
  }
  const unknown = providers.filter(provider => savedByBuyer(provider) === null);
  if (unknown.length > 0) {
    return { key: "payment_keys", label, status: "warning", detail: `Auteur des clés ${providerNames(unknown)} inconnu : vérifiez qu’elles appartiennent au compte de l’acheteur, sinon supprimez-les.` };
  }
  return { key: "payment_keys", label, status: "ok", detail: "Clés enregistrées par l’acheteur lui-même : les paiements arrivent sur son compte." };
}

function paymentItems(facts: StoreHandoverFacts, options: HandoverPaymentOption[] | null): HandoverItem[] {
  if (facts.paymentRoute !== "byok" && facts.paymentRoute !== "both") {
    return [{ key: "payment_connector", label: "Paiement encaissé par l’acheteur", status: "warning", detail: "Le parcours de paiement n’utilise pas les clés de l’acheteur. Pour une boutique vendue ou offerte, choisissez « Connecteurs BYOK »." }];
  }
  if (options === null) {
    return [{ key: "payment_connector", label: "Paiement encaissé par l’acheteur", status: "warning", detail: "Le service de paiement ne répond pas pour le moment. Réessayez dans un instant." }];
  }
  if (options.length === 0) {
    return [{ key: "payment_connector", label: "Paiement encaissé par l’acheteur", status: "todo", detail: "L’acheteur doit enregistrer ses propres clés Stripe ou PayPal dans « Paiements » de sa boutique." }];
  }
  const names = Array.from(new Set(options.map(option => PROVIDER_LABEL[option.provider] ?? option.label))).join(", ");
  const live = options.some(option => !option.isTestMode);
  return [
    { key: "payment_connector", label: "Paiement encaissé par l’acheteur", status: "ok", detail: `Connecteur actif : ${names}.` },
    keyOwnershipItem(facts, options),
    live
      ? { key: "payment_live", label: "Paiement en production", status: "ok", detail: "Au moins un connecteur encaisse de vrais paiements." }
      : { key: "payment_live", label: "Paiement en production", status: "warning", detail: "Les connecteurs sont encore en mode Test : passez-les en Production avant la remise." },
  ];
}

/** Checklist shown in Studio before a store is sold or offered to its buyer. */
export function buildStoreHandoverChecklist(facts: StoreHandoverFacts, paymentOptions: HandoverPaymentOption[] | null) {
  const { buyer, legal, store } = facts;
  const items: HandoverItem[] = [
    !buyer
      ? { key: "buyer_owner", label: "Boutique transférée à l’acheteur", status: "todo", detail: "Aucun propriétaire acheteur : invitez l’acheteur comme propriétaire de la boutique." }
      : buyer.activated
        ? { key: "buyer_owner", label: "Boutique transférée à l’acheteur", status: "ok", detail: `Propriétaire : ${buyer.name || buyer.email}.` }
        : { key: "buyer_owner", label: "Boutique transférée à l’acheteur", status: "warning", detail: `${buyer.email ?? "L’acheteur"} n’a pas encore activé son compte ni ouvert de session.` },
    teamAccessItem(facts),
    !legal.complete
      ? { key: "legal_identity", label: "Mentions légales au nom de l’acheteur", status: "todo", detail: "Exploitant, statut, pays, e-mail de contact et politique de retours doivent être renseignés." }
      : legal.sameAsPlatform
        ? { key: "legal_identity", label: "Mentions légales au nom de l’acheteur", status: "warning", detail: `Les mentions sont encore au nom de ${legal.operatorName} : l’acheteur doit indiquer sa propre identité.` }
        : { key: "legal_identity", label: "Mentions légales au nom de l’acheteur", status: "ok", detail: `Exploitant : ${legal.operatorName}.` },
    facts.delivery.ready
      ? { key: "delivery_terms", label: "Livraison et retours", status: "ok", detail: "Pays desservis, délai et retours sont publiés." }
      : { key: "delivery_terms", label: "Livraison et retours", status: "todo", detail: "Indiquez les pays desservis, le délai de livraison et le résumé des retours." },
    facts.sellableProducts > 0
      ? { key: "catalogue", label: "Catalogue vendable", status: "ok", detail: `${facts.sellableProducts} produit(s) actif(s) avec un prix.` }
      : { key: "catalogue", label: "Catalogue vendable", status: "todo", detail: "Aucun produit actif avec un prix." },
    ...paymentItems(facts, paymentOptions),
    facts.succeededTestPayments + facts.succeededLivePayments > 0
      ? { key: "test_payment", label: "Paiement de test réussi", status: "ok", detail: `${facts.succeededTestPayments + facts.succeededLivePayments} paiement(s) confirmé(s) sur cette boutique.` }
      : { key: "test_payment", label: "Paiement de test réussi", status: "todo", detail: "Passez une commande complète en mode Test, jusqu’à la page de confirmation." },
    /\.mazigho\.(ch|com)$/i.test(store.primaryDomain)
      ? { key: "domain", label: "Domaine", status: "info", detail: `Adresse MAZIGHO (${store.primaryDomain}) : à conserver ou à remplacer par le domaine de l’acheteur.` }
      : { key: "domain", label: "Domaine", status: "ok", detail: `Domaine propre : ${store.primaryDomain}.` },
  ];
  return {
    store,
    items,
    readyCount: items.filter(item => item.status === "ok").length,
    blockingCount: items.filter(item => item.status === "todo" || item.status === "warning").length,
  };
}
