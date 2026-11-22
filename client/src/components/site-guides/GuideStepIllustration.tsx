import type { GuideIllustrationKind } from "./guideTypes";

interface GuideStepIllustrationProps {
  kind: GuideIllustrationKind;
  caption: string;
}

function CalloutBadge({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1e3a2f]/20 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs">
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1e3a2f] text-[10px] font-bold text-white tabular-nums">
        {n}
      </span>
      <span>{label}</span>
    </span>
  );
}

interface DiagramSpec {
  windowTitle: string;
  topBarHighlight?: string;
  sidebarItems: { label: string; active?: boolean }[];
  mainHeader: string;
  mainSub: string;
  calloutA: string;
  calloutB: string;
  calloutC: string;
  statusTag: string;
  statusTone?: "forest" | "amber" | "slate" | "rose";
  variant:
    | "selector"
    | "editor"
    | "media"
    | "responsive"
    | "links"
    | "history"
    | "team"
    | "security"
    | "checklist";
}

const DIAGRAM_SPECS: Record<GuideIllustrationKind, DiagramSpec> = {
  "builder-site-selector": {
    windowTitle: "Atelier privé · /constructeur-sites",
    topBarHighlight: "Association familiale ATH VAHLOUL",
    sidebarItems: [
      { label: "Mes sites", active: true },
      { label: "Pages" },
      { label: "Blocs" },
      { label: "Liens" },
    ],
    mainHeader: "Sélecteur du projet actif",
    mainSub: "Choisissez le site à éditer avant toute modification de page.",
    calloutA: "Ouvrir « Mes sites »",
    calloutB: "Cliquer sur le projet cible",
    calloutC: "Nom actif affiché en haut",
    statusTag: "Site actif",
    statusTone: "forest",
    variant: "selector",
  },
  "builder-site-id": {
    windowTitle: "/constructeur-sites?siteId=1001",
    topBarHighlight: "siteId=1001 synchronisé",
    sidebarItems: [
      { label: "Projet actif", active: true },
      { label: "URL ?siteId=" },
      { label: "sessionStorage" },
      { label: "Liens internes" },
    ],
    mainHeader: "Vérification de l’identifiant actif (siteId)",
    mainSub: "L’URL et sessionStorage conservent le site même après actualisation.",
    calloutA: "Paramètre ?siteId= présent",
    calloutB: "Persistance après F5",
    calloutC: "Actions ciblées sur ce site",
    statusTag: "Synchronisé",
    statusTone: "forest",
    variant: "selector",
  },
  "builder-pages": {
    windowTitle: "Constructeur · Panneau Pages",
    topBarHighlight: "Page active : Accueil (/)",
    sidebarItems: [
      { label: "Accueil (/)", active: true },
      { label: "Notre famille" },
      { label: "Événements" },
      { label: "Contact" },
    ],
    mainHeader: "Navigation entre les pages du site",
    mainSub: "Sélectionnez une page pour charger son contenu dans le canvas.",
    calloutA: "Ouvrir l’onglet Pages",
    calloutB: "Cliquer sur la page",
    calloutC: "Canvas mis à jour",
    statusTag: "7 pages",
    statusTone: "slate",
    variant: "editor",
  },
  "builder-edit-text": {
    windowTitle: "Canvas visuel · Édition de texte",
    topBarHighlight: "Mode 1. Modifier (actif)",
    sidebarItems: [
      { label: "Pages" },
      { label: "Texte H1", active: true },
      { label: "Paragraphes" },
      { label: "Boutons" },
    ],
    mainHeader: "Édition directe d’un titre ou paragraphe",
    mainSub: "Double-cliquez dans le canvas pour modifier le texte en place.",
    calloutA: "Double-cliquer sur le texte",
    calloutB: "Saisir le nouveau contenu",
    calloutC: "Annuler / Rétablir disponible",
    statusTag: "Édition en place",
    statusTone: "forest",
    variant: "editor",
  },
  "builder-replace-image": {
    windowTitle: "Constructeur · Médiathèque du site",
    topBarHighlight: "Texte alternatif (alt) renseigné",
    sidebarItems: [
      { label: "Images", active: true },
      { label: "Bannière" },
      { label: "Cartes (3)" },
      { label: "Accessibilité" },
    ],
    mainHeader: "Remplacement d’une image du site",
    mainSub: "Remplacez un visuel et indiquez toujours un texte alternatif clair.",
    calloutA: "Sélectionner l’image",
    calloutB: "Choisir le nouveau visuel",
    calloutC: "Compléter le texte alt",
    statusTag: "Médias isolés",
    statusTone: "forest",
    variant: "media",
  },
  "builder-add-section": {
    windowTitle: "Constructeur · Bibliothèque de sections",
    topBarHighlight: "Sections prêtes à l’emploi",
    sidebarItems: [
      { label: "Hero" },
      { label: "3 Cartes", active: true },
      { label: "Actualités" },
      { label: "Contact" },
    ],
    mainHeader: "Ajout d’une section structurée",
    mainSub: "Insérez une section responsive déjà alignée sur la charte du site.",
    calloutA: "Ouvrir Sections / Modules",
    calloutB: "Cliquer pour insérer",
    calloutC: "Adapter texte et visuel",
    statusTag: "Responsive prêt",
    statusTone: "forest",
    variant: "editor",
  },
  "builder-add-block": {
    windowTitle: "Constructeur · Blocs réutilisables",
    topBarHighlight: "Grilles, boutons, encarts",
    sidebarItems: [
      { label: "Blocs", active: true },
      { label: "Titre + texte" },
      { label: "Bouton action" },
      { label: "Pied de page" },
    ],
    mainHeader: "Insertion d’un bloc élémentaire",
    mainSub: "Ajoutez un bloc ciblé dans une zone précise sans casser la grille.",
    calloutA: "Ouvrir l’onglet Blocs",
    calloutB: "Glisser ou insérer le bloc",
    calloutC: "Ajuster le contenu",
    statusTag: "Modulaire",
    statusTone: "slate",
    variant: "editor",
  },
  "builder-add-page": {
    windowTitle: "Constructeur · Nouvelle page",
    topBarHighlight: "Slug généré automatiquement",
    sidebarItems: [
      { label: "Accueil" },
      { label: "Notre famille" },
      { label: "+ Nouvelle page", active: true },
      { label: "Menu" },
    ],
    mainHeader: "Création d’une nouvelle page",
    mainSub: "Définissez le titre, le slug (/adresse) et sa présence au menu.",
    calloutA: "Cliquer sur + Nouvelle page",
    calloutB: "Nommer la page",
    calloutC: "Vérifier l’ordre du menu",
    statusTag: "Slug unique",
    statusTone: "forest",
    variant: "selector",
  },
  "builder-preview": {
    windowTitle: "Constructeur · 2. Prévisualiser (Privé)",
    topBarHighlight: "Aperçu privé avant publication",
    sidebarItems: [
      { label: "1. Modifier" },
      { label: "2. Prévisualiser", active: true },
      { label: "3. Publier" },
    ],
    mainHeader: "Prévisualisation fidèle avant mise en ligne",
    mainSub: "Vérifiez la navigation et le rendu réel sans exposer le brouillon.",
    calloutA: "Cliquer sur Prévisualiser",
    calloutB: "Tester les liens de page",
    calloutC: "Revenir éditer si besoin",
    statusTag: "Aperçu privé",
    statusTone: "amber",
    variant: "responsive",
  },
  "builder-responsive": {
    windowTitle: "Contrôle multi-écrans · 1440 / 768 / 320 px",
    topBarHighlight: "Ordinateur · Tablette · Mobile",
    sidebarItems: [
      { label: "1440 px Desktop" },
      { label: "768 px Tablette" },
      { label: "414 px Mobile" },
      { label: "320 px Étroit", active: true },
    ],
    mainHeader: "Vérification Ordinateur, Tablette et Mobile",
    mainSub: "Assurez-vous qu’aucune carte ni aucun lien de pied de page ne déborde.",
    calloutA: "Basculer le profil d’écran",
    calloutB: "Contrôler 1 colonne sur mobile",
    calloutC: "Vérifier 0 débordement",
    statusTag: "0 overflow",
    statusTone: "forest",
    variant: "responsive",
  },
  "builder-save": {
    windowTitle: "Constructeur · Enregistrement serveur",
    topBarHighlight: "Sauvegardé en brouillon privé",
    sidebarItems: [
      { label: "Brouillon" },
      { label: "Sauvegarder", active: true },
      { label: "Horodatage" },
      { label: "Publier" },
    ],
    mainHeader: "Enregistrement sécurisé des modifications",
    mainSub: "Sauvegardez régulièrement : cela persiste votre travail sans publier.",
    calloutA: "Cliquer sur Sauvegarder",
    calloutB: "Attendre la confirmation",
    calloutC: "Vérifier l’horodatage",
    statusTag: "Sauvegardé",
    statusTone: "forest",
    variant: "selector",
  },
  "builder-links-check": {
    windowTitle: "Audit qualité · Liens internes",
    topBarHighlight: "Analyse de toutes les pages",
    sidebarItems: [
      { label: "Qualité" },
      { label: "Liens internes", active: true },
      { label: "Connus" },
      { label: "Inconnus" },
    ],
    mainHeader: "Vérification automatique des liens internes",
    mainSub: "Le diagnostic détecte chaque lien cassé et le classe avant action.",
    calloutA: "Ouvrir le panneau Liens",
    calloutB: "Lire le compteur détecté",
    calloutC: "Identifier la page concernée",
    statusTag: "Diagnostic actif",
    statusTone: "amber",
    variant: "links",
  },
  "builder-links-repair": {
    windowTitle: "Réparation contrôlée · Liste autorisée",
    topBarHighlight: "Corriger les liens connus",
    sidebarItems: [
      { label: "/histoire → /notre-famille", active: true },
      { label: "/participer → /contact" },
      { label: "Recalcul auto" },
    ],
    mainHeader: "Utilisation de « Corriger les liens connus »",
    mainSub: "Répare uniquement les liens reconnus sur le siteId actif et recalcule le score.",
    calloutA: "Vérifier le siteId actif",
    calloutB: "Cliquer Corriger les liens connus",
    calloutC: "Confirmer 100 % valides",
    statusTag: "Réparation sûre",
    statusTone: "forest",
    variant: "links",
  },
  "builder-links-unknown": {
    windowTitle: "Contrôle manuel · Liens inconnus",
    topBarHighlight: "Aucun remplacement aveugle",
    sidebarItems: [
      { label: "Liens valides" },
      { label: "Liens inconnus", active: true },
      { label: "Correction manuelle" },
    ],
    mainHeader: "Traitement des liens inconnus restants",
    mainSub: "Un lien absent de la liste autorisée reste signalé pour arbitrage humain.",
    calloutA: "Consulter la liste signalée",
    calloutB: "Créer la page ou corriger le lien",
    calloutC: "Relancer la vérification",
    statusTag: "Arbitrage humain",
    statusTone: "amber",
    variant: "links",
  },
  "builder-history": {
    windowTitle: "Constructeur · Historique des versions",
    topBarHighlight: "Points de sauvegarde nommés",
    sidebarItems: [
      { label: "v3 · Avant livraison", active: true },
      { label: "v2 · Liens corrigés" },
      { label: "v1 · Structure initiale" },
    ],
    mainHeader: "Consultation de l’historique du projet",
    mainSub: "Chaque sauvegarde ou point de repère reste consultable dans le temps.",
    calloutA: "Ouvrir l’onglet Historique",
    calloutB: "Nommer un point de repère",
    calloutC: "Comparer date et auteur",
    statusTag: "Traçabilité",
    statusTone: "slate",
    variant: "history",
  },
  "builder-restore": {
    windowTitle: "Historique · Restauration confirmée",
    topBarHighlight: "Confirmation obligatoire avant action",
    sidebarItems: [
      { label: "Choisir version" },
      { label: "Confirmation", active: true },
      { label: "Rechargement canvas" },
    ],
    mainHeader: "Restauration sécurisée d’une version",
    mainSub: "Revenez à un état validé ; l’état précédent reste préservé dans l’historique.",
    calloutA: "Cliquer sur Restaurer",
    calloutB: "Valider la confirmation",
    calloutC: "Vérifier le rendu restauré",
    statusTag: "Réversible",
    statusTone: "amber",
    variant: "history",
  },
  "builder-publish": {
    windowTitle: "Constructeur · 3. Publier / Dépublier",
    topBarHighlight: "Réservé Propriétaire / Admin",
    sidebarItems: [
      { label: "Brouillon privé" },
      { label: "En ligne (Publié)", active: true },
      { label: "Retour brouillon" },
    ],
    mainHeader: "Mise en ligne et dépublication maîtrisées",
    mainSub: "Publiez une fois l’aperçu validé, ou repassez en brouillon à tout moment.",
    calloutA: "Cliquer sur 3. Publier",
    calloutB: "Vérifier le statut En ligne",
    calloutC: "Option retour brouillon",
    statusTag: "Publié / Brouillon",
    statusTone: "forest",
    variant: "checklist",
  },
  "builder-delivery-check": {
    windowTitle: "Contrôle final avant livraison client",
    topBarHighlight: "Checklist pré-livraison",
    sidebarItems: [
      { label: "Liens 100 % OK", active: true },
      { label: "Responsive 320 px" },
      { label: "Images + alt" },
      { label: "Invitation client" },
    ],
    mainHeader: "Contrôle final avant remise au client",
    mainSub: "Validez textes, liens, responsive puis invitez le client dans /administration-site.",
    calloutA: "Vérifier 0 lien cassé",
    calloutB: "Tester l’aperçu mobile",
    calloutC: "Envoyer l’accès /administration-site",
    statusTag: "Prêt à livrer",
    statusTone: "forest",
    variant: "checklist",
  },

  // --- CLIENT ADMIN ILLUSTRATIONS (18 steps) ---
  "client-home": {
    windowTitle: "Administration de votre site · Accueil",
    topBarHighlight: "Association familiale ATH VAHLOUL",
    sidebarItems: [
      { label: "Accueil", active: true },
      { label: "Pages & contenus" },
      { label: "Images & médias" },
      { label: "Historique" },
      { label: "Équipe & rôles" },
    ],
    mainHeader: "Tableau de bord de votre site",
    mainSub: "Retrouvez vos indicateurs clés et vos raccourcis d’édition dès la connexion.",
    calloutA: "Nom de votre site en haut",
    calloutB: "5 onglets simples à gauche",
    calloutC: "Actions rapides au centre",
    statusTag: "Votre espace",
    statusTone: "forest",
    variant: "selector",
  },
  "client-status": {
    windowTitle: "Accueil · Statut et synthèse",
    topBarHighlight: "Statut · Sauvegarde · Pages · Rôle",
    sidebarItems: [
      { label: "Accueil", active: true },
      { label: "Pages & contenus" },
      { label: "Images & médias" },
    ],
    mainHeader: "Lecture immédiate du statut du site",
    mainSub: "Les 4 cartes du haut indiquent si le site est en ligne et à jour.",
    calloutA: "Statut en ligne ou brouillon",
    calloutB: "Date de dernière sauvegarde",
    calloutC: "Votre rôle sur ce site",
    statusTag: "Vue claire",
    statusTone: "forest",
    variant: "checklist",
  },
  "client-states": {
    windowTitle: "Cycle de publication · 3 états",
    topBarHighlight: "Brouillon → Sauvegardé → Publié",
    sidebarItems: [
      { label: "Brouillon" },
      { label: "Sauvegardé", active: true },
      { label: "Publié en ligne" },
    ],
    mainHeader: "Différence entre Brouillon, Sauvegardé et Publié",
    mainSub: "Sauvegarder protège vos textes ; Publier les rend visibles à vos visiteurs.",
    calloutA: "Brouillon : visible par votre équipe",
    calloutB: "Sauvegardé : enregistré en sécurité",
    calloutC: "Publié : visible par le public",
    statusTag: "Sans risque",
    statusTone: "amber",
    variant: "checklist",
  },
  "client-title": {
    windowTitle: "Accueil · Identité du site",
    topBarHighlight: "Modifier le titre principal",
    sidebarItems: [
      { label: "Accueil", active: true },
      { label: "Identité du site" },
      { label: "Enregistrer" },
    ],
    mainHeader: "Modification du titre principal du site",
    mainSub: "Saisissez le nouveau nom puis cliquez sur « Enregistrer le titre ».",
    calloutA: "Champ « Titre du site »",
    calloutB: "Cliquer Enregistrer le titre",
    calloutC: "Bandeau vert de confirmation",
    statusTag: "Mise à jour directe",
    statusTone: "forest",
    variant: "editor",
  },
  "client-text": {
    windowTitle: "Pages & contenus · Édition de texte",
    topBarHighlight: "Titre H1 · Paragraphe · SEO",
    sidebarItems: [
      { label: "Accueil" },
      { label: "Pages & contenus", active: true },
      { label: "Images & médias" },
    ],
    mainHeader: "Modification d’un titre ou texte de page",
    mainSub: "Sélectionnez votre page à gauche, ajustez vos textes et enregistrez.",
    calloutA: "Choisir la page à modifier",
    calloutB: "Modifier titre et introduction",
    calloutC: "Cliquer Enregistrer la page",
    statusTag: "Mise en page préservée",
    statusTone: "forest",
    variant: "editor",
  },
  "client-section": {
    windowTitle: "Pages & contenus · Ajouter une section",
    topBarHighlight: "Actualité ou section texte",
    sidebarItems: [
      { label: "Actualité datée", active: true },
      { label: "Section texte" },
      { label: "Nouvelle page" },
    ],
    mainHeader: "Ajout d’une actualité ou section simple",
    mainSub: "Remplissez le titre, la date éventuelle et le message, puis ajoutez.",
    calloutA: "Choisir Actualité ou Section",
    calloutB: "Rédiger titre et contenu",
    calloutC: "Enregistré automatiquement",
    statusTag: "Format harmonisé",
    statusTone: "forest",
    variant: "editor",
  },
  "client-replace-image": {
    windowTitle: "Pages & contenus · Image principale",
    topBarHighlight: "Image + texte alternatif",
    sidebarItems: [
      { label: "Pages & contenus", active: true },
      { label: "Image principale" },
      { label: "Texte alternatif" },
    ],
    mainHeader: "Remplacement de l’image d’une page",
    mainSub: "Choisissez une photo de votre bibliothèque ou collez son adresse sécurisée.",
    calloutA: "Champ URL de l’image",
    calloutB: "Description (texte alternatif)",
    calloutC: "Enregistrer puis vérifier l’aperçu",
    statusTag: "Aperçu immédiat",
    statusTone: "forest",
    variant: "media",
  },
  "client-media-library": {
    windowTitle: "Images & médias · Bibliothèque",
    topBarHighlight: "Ajouter · Remplacer · Retirer",
    sidebarItems: [
      { label: "Accueil" },
      { label: "Pages & contenus" },
      { label: "Images & médias", active: true },
    ],
    mainHeader: "Gestion de votre bibliothèque d’images",
    mainSub: "Centralisez vos visuels, remplacez une image partout ou retirez-la avec confirmation.",
    calloutA: "Ajouter une nouvelle image",
    calloutB: "Miniature visible pour chaque média",
    calloutC: "Suppression toujours confirmée",
    statusTag: "Bibliothèque dédiée",
    statusTone: "forest",
    variant: "media",
  },
  "client-preview": {
    windowTitle: "Aperçu avant publication",
    topBarHighlight: "Ordinateur · Tablette · Mobile",
    sidebarItems: [
      { label: "Ordinateur (1280px)" },
      { label: "Tablette (768px)" },
      { label: "Mobile (375px)", active: true },
    ],
    mainHeader: "Vérification sur ordinateur, tablette et mobile",
    mainSub: "Cliquez sur « Aperçu » dans l’en-tête pour contrôler vos changements en privé.",
    calloutA: "Bouton Aperçu en haut à droite",
    calloutB: "Tester les 3 formats d’écran",
    calloutC: "Fermer et publier si satisfait",
    statusTag: "Aperçu temps réel",
    statusTone: "amber",
    variant: "responsive",
  },
  "client-history": {
    windowTitle: "Historique · Versions sauvegardées",
    topBarHighlight: "Sauvegardes automatiques et manuelles",
    sidebarItems: [
      { label: "Historique", active: true },
      { label: "Point de sauvegarde" },
      { label: "Liste datée" },
    ],
    mainHeader: "Consultation de l’historique des versions",
    mainSub: "Retrouvez chaque modification datée et créez des points de repère nommés.",
    calloutA: "Ouvrir l’onglet Historique",
    calloutB: "Créer un point nommé",
    calloutC: "Lire date et libellé",
    statusTag: "Filet de sécurité",
    statusTone: "slate",
    variant: "history",
  },
  "client-restore": {
    windowTitle: "Historique · Restaurer une version",
    topBarHighlight: "Confirmation explicite requise",
    sidebarItems: [
      { label: "Version choisie" },
      { label: "Confirmation", active: true },
      { label: "Contenu rétabli" },
    ],
    mainHeader: "Restauration d’une version antérieure",
    mainSub: "Rétablissez facilement une version précédente après validation du bandeau.",
    calloutA: "Cliquer sur Restaurer",
    calloutB: "Confirmer « Restaurer cette version »",
    calloutC: "Bandeau vert de confirmation",
    statusTag: "Réversible",
    statusTone: "amber",
    variant: "history",
  },
  "client-team": {
    windowTitle: "Équipe & rôles · Membres autorisés",
    topBarHighlight: "Liste dédiée à votre site",
    sidebarItems: [
      { label: "Accueil" },
      { label: "Historique" },
      { label: "Équipe & rôles", active: true },
    ],
    mainHeader: "Gestion des membres de votre équipe",
    mainSub: "Visualisez les personnes autorisées sur ce site et leur niveau d’accès.",
    calloutA: "Ouvrir Équipe & rôles",
    calloutB: "Consulter les membres actifs",
    calloutC: "Ajuster les droits (Propriétaire)",
    statusTag: "Accès maîtrisés",
    statusTone: "forest",
    variant: "team",
  },
  "client-roles": {
    windowTitle: "Rôles · Propriétaire, Administrateur, Éditeur",
    topBarHighlight: "3 niveaux de droits clairs",
    sidebarItems: [
      { label: "Propriétaire", active: true },
      { label: "Administrateur" },
      { label: "Éditeur" },
    ],
    mainHeader: "Comprendre les rôles Propriétaire, Administrateur et Éditeur",
    mainSub: "Chaque rôle limite automatiquement les actions autorisées côté serveur.",
    calloutA: "Propriétaire : équipe + publication",
    calloutB: "Administrateur : contenus + publication",
    calloutC: "Éditeur : textes, images, brouillons",
    statusTag: "3 rôles distincts",
    statusTone: "slate",
    variant: "team",
  },
  "client-invite": {
    windowTitle: "Équipe & rôles · Inviter un membre",
    topBarHighlight: "Lien sécurisé à durée limitée",
    sidebarItems: [
      { label: "Adresse e-mail", active: true },
      { label: "Rôle choisi" },
      { label: "Lien d’invitation" },
    ],
    mainHeader: "Invitation d’un administrateur ou éditeur",
    mainSub: "Saisissez l’adresse e-mail, choisissez le rôle et partagez le lien généré.",
    calloutA: "Indiquer l’e-mail du collaborateur",
    calloutB: "Choisir Administrateur ou Éditeur",
    calloutC: "Copier le lien d’invitation sécurisé",
    statusTag: "Réservé Propriétaire",
    statusTone: "forest",
    variant: "team",
  },
  "client-revoke": {
    windowTitle: "Équipe & rôles · Révoquer un accès",
    topBarHighlight: "Effet immédiat avec confirmation",
    sidebarItems: [
      { label: "Membre ciblé" },
      { label: "Confirmation", active: true },
      { label: "Accès coupé" },
    ],
    mainHeader: "Révocation immédiate d’un accès ou d’une invitation",
    mainSub: "Retirez un accès en un clic confirmé ; le lien d’invitation devient invalide.",
    calloutA: "Cliquer sur Révoquer",
    calloutB: "Valider la confirmation inline",
    calloutC: "Accès immédiatement retiré",
    statusTag: "Sécurité active",
    statusTone: "rose",
    variant: "team",
  },
  "client-isolation": {
    windowTitle: "Sécurité · Cloisonnement strict de votre site",
    topBarHighlight: "Accès limité uniquement à votre site",
    sidebarItems: [
      { label: "Votre site", active: true },
      { label: "Autres sites (verrouillé)" },
      { label: "Constructeur (privé)" },
    ],
    mainHeader: "Limites d’accès et séparation des espaces",
    mainSub: "Votre compte administre exclusivement votre site, sans aucun autre accès.",
    calloutA: "1 seul périmètre autorisé",
    calloutB: "Constructeur global privé",
    calloutC: "Aucune donnée tierce visible",
    statusTag: "Isolation vérifiée",
    statusTone: "forest",
    variant: "security",
  },
  "client-logout": {
    windowTitle: "Sécurité · Se déconnecter",
    topBarHighlight: "Bouton Se déconnecter en haut à droite",
    sidebarItems: [
      { label: "Enregistrer vos textes" },
      { label: "Se déconnecter", active: true },
      { label: "Page de connexion" },
    ],
    mainHeader: "Procédure de déconnexion sécurisée",
    mainSub: "Terminez toujours votre session après travail, surtout sur un poste partagé.",
    calloutA: "Vérifier que tout est sauvegardé",
    calloutB: "Cliquer sur Se déconnecter",
    calloutC: "Retour à /connexion-administration",
    statusTag: "Session fermée",
    statusTone: "slate",
    variant: "security",
  },
  "client-errors": {
    windowTitle: "Assistance · En cas d’erreur ou de doute",
    topBarHighlight: "Réessayer · Historique · Référent",
    sidebarItems: [
      { label: "Lire le bandeau" },
      { label: "Réessayer / Reconnecter", active: true },
      { label: "Restaurer une version" },
    ],
    mainHeader: "Procédure simple en cas de message d’erreur",
    mainSub: "Les messages expliquent la cause ; l’historique protège toujours vos contenus.",
    calloutA: "Lire le bandeau rouge ou orange",
    calloutB: "Recharger ou se reconnecter",
    calloutC: "Contacter votre référent si besoin",
    statusTag: "Aide claire",
    statusTone: "amber",
    variant: "security",
  },
};

const TONE_CLASS: Record<NonNullable<DiagramSpec["statusTone"]>, string> = {
  forest: "border-emerald-300 bg-emerald-50 text-emerald-900",
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  slate: "border-slate-300 bg-slate-100 text-slate-800",
  rose: "border-rose-300 bg-rose-50 text-rose-900",
};

export function GuideStepIllustration({ kind, caption }: GuideStepIllustrationProps) {
  const spec = DIAGRAM_SPECS[kind];
  const tone = TONE_CLASS[spec.statusTone ?? "forest"];

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {/* Barre de fenêtre anonymisée */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </span>
          <span className="truncate text-xs font-semibold text-slate-700">
            {spec.windowTitle}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
        >
          {spec.statusTag}
        </span>
      </div>

      {/* Schéma d'interface responsive */}
      <div className="p-3.5 sm:p-4">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[152px_minmax(0,1fr)]">
          {/* Colonne de navigation simulée */}
          <div className="space-y-1.5 border-b border-slate-100 pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
            <div className="flex flex-wrap gap-1.5 sm:flex-col">
              {spec.sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium ${
                    item.active
                      ? "bg-[#1e3a2f] text-white"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.active && (
                    <span
                      className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Zone principale schématisée */}
          <div className="min-w-0 space-y-3">
            {spec.topBarHighlight && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-[#1e3a2f]/20 bg-[#f4f7f5] px-2.5 py-1.5 text-[11px] font-semibold text-[#1e3a2f]">
                <span className="truncate">{spec.topBarHighlight}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#1e3a2f]/70">
                  Repère actif
                </span>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 sm:text-sm">{spec.mainHeader}</p>
              <p className="text-xs leading-relaxed text-slate-600">{spec.mainSub}</p>
            </div>

            {/* Micro-visuel dédié selon la variante */}
            {spec.variant === "responsive" && (
              <div
                className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                aria-hidden="true"
              >
                <div className="rounded border border-slate-200 bg-white p-1.5">
                  <div className="mb-1 h-1.5 w-8 rounded bg-slate-300" />
                  <div className="grid grid-cols-3 gap-1">
                    <div className="h-5 rounded bg-emerald-100" />
                    <div className="h-5 rounded bg-emerald-100" />
                    <div className="h-5 rounded bg-emerald-100" />
                  </div>
                </div>
                <div className="rounded border border-slate-200 bg-white p-1.5">
                  <div className="mb-1 h-1.5 w-6 rounded bg-slate-300" />
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-5 rounded bg-emerald-100" />
                    <div className="h-5 rounded bg-emerald-100" />
                  </div>
                </div>
                <div className="rounded border-2 border-[#1e3a2f] bg-white p-1.5">
                  <div className="mb-1 h-1.5 w-5 rounded bg-[#1e3a2f]" />
                  <div className="space-y-1">
                    <div className="h-3 rounded bg-emerald-200" />
                    <div className="h-3 rounded bg-emerald-100" />
                  </div>
                </div>
              </div>
            )}

            {spec.variant === "links" && (
              <div
                className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]"
                aria-hidden="true"
              >
                <div className="flex items-center justify-between rounded bg-white px-2 py-1 border border-emerald-200">
                  <span className="font-mono text-slate-700">/histoire → /notre-famille</span>
                  <span className="font-semibold text-emerald-700">Réparé</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white px-2 py-1 border border-amber-200">
                  <span className="font-mono text-slate-700">/lien-personnalise</span>
                  <span className="font-semibold text-amber-800">Signalé</span>
                </div>
              </div>
            )}

            {spec.variant === "media" && (
              <div
                className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                aria-hidden="true"
              >
                <div className="flex h-12 items-center justify-center rounded border-2 border-[#1e3a2f] bg-emerald-50 text-[10px] font-semibold text-[#1e3a2f]">
                  Image active
                </div>
                <div className="flex h-12 items-center justify-center rounded border border-slate-200 bg-white text-[10px] text-slate-500">
                  Photo 02
                </div>
                <div className="flex h-12 items-center justify-center rounded border border-slate-200 bg-white text-[10px] text-slate-500">
                  Photo 03
                </div>
              </div>
            )}

            {spec.variant === "history" && (
              <div
                className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]"
                aria-hidden="true"
              >
                <div className="flex items-center justify-between rounded border border-emerald-200 bg-white px-2 py-1">
                  <span className="font-medium text-slate-800">Version actuelle sauvegardée</span>
                  <span className="text-emerald-700 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-2 py-1">
                  <span className="text-slate-600">Point de sauvegarde précédent</span>
                  <span className="font-semibold text-[#1e3a2f]">Restaurer →</span>
                </div>
              </div>
            )}

            {spec.variant === "team" && (
              <div
                className="grid grid-cols-3 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px]"
                aria-hidden="true"
              >
                <div className="rounded border border-[#1e3a2f]/30 bg-white p-1.5">
                  <p className="font-bold text-[#1e3a2f]">Propriétaire</p>
                  <p className="text-slate-500">Équipe + Publier</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-1.5">
                  <p className="font-bold text-slate-800">Administrateur</p>
                  <p className="text-slate-500">Contenu + Publier</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-1.5">
                  <p className="font-bold text-slate-800">Éditeur</p>
                  <p className="text-slate-500">Brouillons</p>
                </div>
              </div>
            )}

            {spec.variant === "security" && (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-950"
                aria-hidden="true"
              >
                <span className="font-semibold">Périmètre : uniquement votre site</span>
                <span className="text-emerald-800">Autres sites et constructeur privés</span>
              </div>
            )}

            {/* 3 repères numérotés avec flèches */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <CalloutBadge n={1} label={spec.calloutA} />
              <span className="text-xs font-bold text-slate-400" aria-hidden="true">
                →
              </span>
              <CalloutBadge n={2} label={spec.calloutB} />
              <span className="text-xs font-bold text-slate-400" aria-hidden="true">
                →
              </span>
              <CalloutBadge n={3} label={spec.calloutC} />
            </div>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600">
        {caption}
      </figcaption>
    </figure>
  );
}
