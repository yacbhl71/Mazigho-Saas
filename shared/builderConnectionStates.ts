export type BuilderConnectionStatus = "Non connecté" | "À configurer";

export type BuilderConnectionState = {
  id: string;
  label: string;
  description: string;
  status: BuilderConnectionStatus;
};

/**
 * Les blocs restent visuels tant qu’un chantier de service dédié n’a pas été livré.
 * Aucun identifiant, secret ou donnée métier réelle ne doit être stocké ici.
 */
export const SHARED_BUILDER_CONNECTION_STATES: readonly BuilderConnectionState[] = [
  { id: "newsletter", label: "Newsletter", description: "Formulaire prêt à relier à un service autorisé.", status: "À configurer" },
  { id: "map", label: "Carte", description: "Adresse et fournisseur de carte à renseigner.", status: "À configurer" },
  { id: "hours", label: "Horaires", description: "Créneaux éditables, sans source métier connectée.", status: "À configurer" },
  { id: "contact", label: "WhatsApp et appel", description: "Téléphone et message à renseigner avant activation.", status: "À configurer" },
  { id: "catalogue", label: "Catalogue", description: "Références visuelles uniquement, aucun produit réel injecté.", status: "Non connecté" },
  { id: "countdown", label: "Compte à rebours", description: "Date cible éditoriale à renseigner si nécessaire.", status: "À configurer" },
] as const;

export function getSharedBuilderConnectionSummary(states = SHARED_BUILDER_CONNECTION_STATES) {
  return {
    total: states.length,
    notConnected: states.filter((state) => state.status === "Non connecté").length,
    toConfigure: states.filter((state) => state.status === "À configurer").length,
  };
}
