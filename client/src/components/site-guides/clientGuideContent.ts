import type { SiteTrainingGuideConfig } from "./guideTypes";

export const CLIENT_ISOLATION_NOTICE =
  "Vous administrez uniquement le site qui vous a été attribué. Vous n’avez pas accès au constructeur global, aux autres sites, à la boutique MAZIGHO ni aux données internes de MAZIGHO.";

export const CLIENT_GUIDE_CONFIG: SiteTrainingGuideConfig = {
  audience: "client-admin",
  modalTitle: "Guide de prise en main — Administration de votre site",
  modalSubtitle:
    "Toutes les étapes pour gérer vos textes, vos photos, votre aperçu, vos versions et votre équipe en toute autonomie.",
  audienceLabel: "Guide client · Administration de votre site",
  isolationNotice: CLIENT_ISOLATION_NOTICE,
  steps: [
    {
      id: "client-01-home",
      number: 1,
      category: "Découverte",
      title: "Comprendre la page d’accueil de l’administration",
      summary:
        "Dès votre connexion, l’onglet Accueil rassemble l’essentiel : le nom de votre site, ses indicateurs clés et des raccourcis vers vos 5 sections de gestion.",
      actions: [
        "Vérifiez le nom de votre site dans l’en-tête supérieur.",
        "Utilisez le menu latéral (ou la barre horizontale sur mobile) pour passer d’un onglet à l’autre.",
        "Utilisez les actions rapides au centre pour modifier vos pages, gérer vos photos ou ouvrir l’aperçu.",
      ],
      detailedHelp:
        "Cet espace est conçu pour la gestion quotidienne de votre site : vous travaillez uniquement via des formulaires simples, sans outil technique complexe.",
      illustration: "client-home",
      caption:
        "Vue d’ensemble de l’accueil dédié à l’administration de votre site.",
    },
    {
      id: "client-02-site-status",
      number: 2,
      category: "Découverte",
      title: "Comprendre le statut du site",
      summary:
        "Les quatre cartes de synthèse en haut de l’Accueil vous indiquent en un coup d’œil le statut public du site, la date de dernière sauvegarde, le nombre de pages et votre rôle.",
      actions: [
        "Regardez la première carte pour savoir si votre site est en Brouillon ou En ligne (Publié).",
        "Contrôlez la date et l’heure de la dernière sauvegarde.",
        "Repérez votre rôle (Propriétaire, Administrateur ou Éditeur) dans la dernière carte.",
      ],
      detailedHelp:
        "Si vous avez des modifications non enregistrées dans un formulaire, un indicateur vous le signale immédiatement avant de quitter l’onglet.",
      illustration: "client-status",
      caption:
        "Lecture des 4 indicateurs principaux en haut du tableau de bord.",
    },
    {
      id: "client-03-draft-saved-published",
      number: 3,
      category: "Publication",
      title: "Comprendre « brouillon », « sauvegardé » et « publié »",
      summary:
        "« Sauvegardé » signifie que vos textes sont en sécurité. « Brouillon » signifie que le site reste privé pour votre équipe. « Publié » signifie qu’il est visible par le public.",
      actions: [
        "Enregistrez vos textes autant de fois que nécessaire : vos changements sont sauvegardés sans perturber le public tant que le site est en brouillon.",
        "Contrôlez le rendu via le bouton « Aperçu » avant de rendre le site public.",
        "Cliquez sur « Publier le site » (rôle Propriétaire ou Administrateur) uniquement lorsque tout est prêt.",
      ],
      detailedHelp:
        "Vous pouvez repasser votre site en brouillon privé à tout moment si vous préparez une mise à jour importante.",
      illustration: "client-states",
      caption:
        "Distinction claire entre brouillon privé, sauvegarde et mise en ligne publique.",
    },
    {
      id: "client-04-edit-title",
      number: 4,
      category: "Contenu",
      title: "Modifier un titre",
      summary:
        "Modifiez le titre principal de votre site depuis l’Accueil (bloc Identité du site), ou modifiez le titre d’une page depuis l’onglet Pages & contenus.",
      actions: [
        "Saisissez le nouveau libellé dans le champ « Titre du site » ou « Titre principal (H1) ».",
        "Cliquez sur « Enregistrer le titre » ou « Enregistrer la page ».",
        "Attendez le bandeau vert confirmant que la sauvegarde est bien enregistrée.",
      ],
      detailedHelp:
        "Chaque enregistrement crée automatiquement une trace dans l’historique afin que vous puissiez revenir en arrière si besoin.",
      illustration: "client-title",
      caption:
        "Modification sécurisée du titre principal avec bandeau de confirmation.",
    },
    {
      id: "client-05-edit-text",
      number: 5,
      category: "Contenu",
      title: "Modifier un texte",
      summary:
        "Dans « Pages & contenus », sélectionnez la page à mettre à jour, modifiez son texte de présentation et ses informations SEO, puis enregistrez.",
      actions: [
        "Ouvrez l’onglet « Pages & contenus » et choisissez la page dans la colonne de gauche.",
        "Mettez à jour le texte principal et, si besoin, le titre et la description pour les moteurs de recherche.",
        "Cliquez sur « Enregistrer la page » pour valider vos changements.",
      ],
      detailedHelp:
        "Votre mise en page, vos couleurs et la lisibilité sur mobile sont automatiquement conservées lorsque vous modifiez vos textes.",
      illustration: "client-text",
      caption:
        "Formulaire simplifié d’édition des textes et descriptions d’une page.",
    },
    {
      id: "client-06-add-section",
      number: 6,
      category: "Contenu",
      title: "Ajouter une section simple",
      summary:
        "Publiez facilement une actualité datée ou une nouvelle section texte sur la page active grâce au bloc dédié en bas de « Pages & contenus ».",
      actions: [
        "Choisissez le type de bloc : « Actualité » (avec date) ou « Section texte ».",
        "Renseignez le titre, la date éventuelle et le contenu de votre message.",
        "Cliquez sur « Ajouter à la page » : la section est formatée et sauvegardée automatiquement.",
      ],
      detailedHelp:
        "Vous pouvez également créer une nouvelle page simple depuis le bouton « + Nouvelle page » si le sujet mérite une entrée dédiée dans votre menu.",
      illustration: "client-section",
      caption:
        "Ajout d’une actualité ou d’une section texte harmonisée sur la page active.",
    },
    {
      id: "client-07-replace-image",
      number: 7,
      category: "Médias",
      title: "Remplacer une image",
      summary:
        "Actualisez la photo principale d’une page en saisissant une nouvelle adresse d’image ou en choisissant un visuel depuis votre bibliothèque, avec son texte alternatif.",
      actions: [
        "Dans « Pages & contenus », repérez la zone « Image principale » de la page.",
        "Collez l’adresse sécurisée de la nouvelle image ou sélectionnez-la depuis « Images & médias ».",
        "Complétez le texte alternatif (description courte de la photo) puis enregistrez.",
      ],
      detailedHelp:
        "Le texte alternatif décrit l’image pour les personnes utilisant un lecteur d’écran et améliore la compréhension de votre site par les moteurs de recherche.",
      illustration: "client-replace-image",
      caption:
        "Mise à jour de l’image principale d’une page avec description accessible.",
    },
    {
      id: "client-08-manage-media",
      number: 8,
      category: "Médias",
      title: "Gérer la bibliothèque médias",
      summary:
        "L’onglet « Images & médias » centralise toutes les photos de votre site : ajoutez des visuels, remplacez une image sur toutes les pages ou retirez une photo inutilisée.",
      actions: [
        "Ajoutez une image avec un libellé clair, un texte alternatif et son adresse.",
        "Cliquez sur « Modifier / Remplacer » pour actualiser un visuel existant.",
        "Pour retirer une photo, cliquez sur « Retirer » puis confirmez dans le bandeau prévu.",
      ],
      detailedHelp:
        "Aucune suppression d’image n’est exécutée sans votre confirmation explicite.",
      illustration: "client-media-library",
      caption:
        "Gestion complète de la bibliothèque d’images dédiée à votre site.",
    },
    {
      id: "client-09-preview",
      number: 9,
      category: "Contrôle",
      title: "Prévisualiser en mode ordinateur, tablette et mobile",
      summary:
        "Cliquez sur le bouton « Aperçu » en haut de l’écran pour vérifier exactement comment votre page s’affiche sur ordinateur, tablette et téléphone avant publication.",
      actions: [
        "Cliquez sur « Aperçu » dans la barre supérieure.",
        "Basculez entre « Ordinateur », « Tablette » et « Mobile ».",
        "Vérifiez vos titres, paragraphes et photos avant de fermer l’aperçu et de publier.",
      ],
      detailedHelp:
        "L’aperçu reflète immédiatement vos modifications en cours, même avant leur publication officielle.",
      illustration: "client-preview",
      caption:
        "Fenêtre d’aperçu intégré avec bascule Ordinateur, Tablette et Mobile.",
    },
    {
      id: "client-10-history",
      number: 10,
      category: "Historique",
      title: "Consulter l’historique des versions",
      summary:
        "Dans l’onglet « Historique », retrouvez toutes les sauvegardes classées par date et créez un point de repère nommé avant une série de modifications.",
      actions: [
        "Ouvrez l’onglet « Historique ».",
        "Donnez un nom clair (ex. « Avant assemblée générale ») puis cliquez sur « Créer un point de sauvegarde ».",
        "Consultez la liste chronologique de toutes les versions enregistrées.",
      ],
      detailedHelp:
        "Créer un point de sauvegarde nommé avant une mise à jour saisonnière vous permet de retrouver cet état exact en quelques secondes.",
      illustration: "client-history",
      caption:
        "Suivi chronologique des sauvegardes et création de points de repère.",
    },
    {
      id: "client-11-restore",
      number: 11,
      category: "Historique",
      title: "Restaurer une version",
      summary:
        "Si une modification ne vous convient plus, cliquez sur « Restaurer » sur la version souhaitée puis confirmez pour rétablir votre site à cet instant précis.",
      actions: [
        "Repérez la version souhaitée dans l’onglet « Historique ».",
        "Cliquez sur « Restaurer » puis validez « Restaurer cette version » dans le bandeau de confirmation.",
        "Vérifiez le bandeau vert de confirmation et contrôlez vos pages.",
      ],
      detailedHelp:
        "La restauration demande toujours une confirmation et n’efface pas votre historique : l’opération reste réversible.",
      illustration: "client-restore",
      caption:
        "Restauration sécurisée d’une version antérieure avec confirmation inline.",
    },
    {
      id: "client-12-team",
      number: 12,
      category: "Équipe",
      title: "Gérer l’équipe",
      summary:
        "L’onglet « Équipe & rôles » affiche toutes les personnes autorisées à accéder à votre site ainsi que les invitations en attente.",
      actions: [
        "Ouvrez l’onglet « Équipe & rôles ».",
        "Consultez la liste des membres actifs, leur adresse e-mail et leur rôle.",
        "Vérifiez régulièrement que seules les personnes de confiance disposent d’un accès actif.",
      ],
      detailedHelp:
        "Tous les membres voient la synthèse des rôles ; l’invitation, le changement de rôle et la révocation sont réservés au Propriétaire du site.",
      illustration: "client-team",
      caption:
        "Vue d’ensemble des membres autorisés sur votre site.",
    },
    {
      id: "client-13-roles",
      number: 13,
      category: "Équipe",
      title: "Comprendre les rôles Propriétaire, Administrateur et Éditeur",
      summary:
        "Trois rôles encadrent les droits de votre équipe : le Propriétaire gère tout y compris l’équipe, l’Administrateur modifie et publie, et l’Éditeur met à jour les contenus en brouillon.",
      actions: [
        "Propriétaire : modifie les contenus, publie le site, invite et révoque les membres.",
        "Administrateur : modifie les textes, images et versions, et peut publier ou dépublier le site.",
        "Éditeur : modifie les textes, pages et médias en brouillon, sans publier ni gérer l’équipe.",
      ],
      detailedHelp:
        "Ces autorisations sont vérifiées automatiquement sur le serveur à chaque action pour protéger votre site.",
      illustration: "client-roles",
      caption:
        "Répartition claire des droits entre Propriétaire, Administrateur et Éditeur.",
    },
    {
      id: "client-14-invite",
      number: 14,
      category: "Équipe",
      title: "Inviter un membre",
      summary:
        "En tant que Propriétaire, renseignez l’adresse e-mail d’un collaborateur, choisissez son rôle (Administrateur ou Éditeur) et générez son lien d’invitation sécurisé.",
      actions: [
        "Dans « Équipe & rôles », saisissez l’adresse e-mail exacte du membre à inviter.",
        "Sélectionnez le rôle « Éditeur » ou « Administrateur » et la durée de validité du lien.",
        "Cliquez sur « Créer l’invitation » puis copiez le lien sécurisé à transmettre à la personne.",
      ],
      detailedHelp:
        "Le lien d’invitation est nominatif, valable uniquement pour votre site et limité dans le temps.",
      illustration: "client-invite",
      caption:
        "Création et copie d’un lien d’invitation sécurisé réservé à votre site.",
    },
    {
      id: "client-15-revoke",
      number: 15,
      category: "Équipe",
      title: "Révoquer un accès",
      summary:
        "Lorsqu’un membre quitte l’équipe ou qu’une invitation n’est plus utile, cliquez sur « Révoquer » et confirmez : son accès est coupé immédiatement.",
      actions: [
        "Repérez le membre ou l’invitation concernée dans « Équipe & rôles ».",
        "Cliquez sur « Révoquer » puis confirmez « Révoquer l’accès » dans le bandeau.",
        "Vérifiez le message confirmant que l’accès et le lien associé ont été désactivés.",
      ],
      detailedHelp:
        "La révocation prend effet immédiatement côté serveur et invalide automatiquement tout lien d’invitation associé.",
      illustration: "client-revoke",
      caption:
        "Révocation immédiate d’un accès membre ou d’une invitation en attente.",
    },
    {
      id: "client-16-access-limits",
      number: 16,
      category: "Sécurité",
      title: "Comprendre les limites d’accès à son seul site",
      summary: CLIENT_ISOLATION_NOTICE,
      actions: [
        "Votre compte ouvre exclusivement le site qui vous a été attribué.",
        "Aucun membre client ne peut accéder au constructeur visuel global ni aux autres projets.",
        "Pour créer un nouveau site ou faire évoluer la structure technique, contactez votre référent.",
      ],
      detailedHelp:
        "Cette séparation stricte garantit la confidentialité de vos contenus et évite toute manipulation technique accidentelle.",
      illustration: "client-isolation",
      caption:
        "Périmètre cloisonné : accès strictement limité à votre propre site.",
    },
    {
      id: "client-17-logout",
      number: 17,
      category: "Sécurité",
      title: "Savoir se déconnecter proprement",
      summary:
        "Une fois vos modifications sauvegardées, cliquez sur le bouton « Se déconnecter » en haut à droite pour fermer votre session en toute sécurité.",
      actions: [
        "Vérifiez qu’aucune modification n’est en attente d’enregistrement.",
        "Cliquez sur « Se déconnecter » dans la barre supérieure.",
        "Vous êtes redirigé vers la page dédiée /connexion-administration.",
      ],
      detailedHelp:
        "La déconnexion efface également votre sélection de session locale, ce qui est particulièrement recommandé sur un ordinateur partagé.",
      illustration: "client-logout",
      caption:
        "Déconnexion propre depuis la barre supérieure de l’administration.",
    },
    {
      id: "client-18-errors",
      number: 18,
      category: "Assistance",
      title: "Savoir quoi faire en cas d’erreur",
      summary:
        "Si un message d’erreur s’affiche, lisez l’explication dans le bandeau, cliquez sur « Réessayer » ou reconnectez-vous : vos versions sauvegardées restent en sécurité.",
      actions: [
        "Lisez le bandeau d’alerte en haut de la page : il précise si un champ manque ou si la session a expiré.",
        "En cas de perte de connexion, rechargez la page ou reconnectez-vous sur /connexion-administration.",
        "Si une modification pose problème, restaurez une version précédente dans l’onglet « Historique » ou contactez votre référent.",
      ],
      detailedHelp:
        "Ne partagez jamais votre mot de passe par e-mail. Indiquez simplement à votre référent le nom de votre site, l’onglet concerné et le message affiché.",
      illustration: "client-errors",
      caption:
        "Bons réflexes en cas d’erreur : lecture du message, reconnexion et historique.",
    },
  ],
  video: {
    title: "Vidéo de prise en main — Administration de votre site",
    subtitle:
      "Guide vidéo clair en 10 chapitres pour administrer votre site au quotidien (exemple : Association familiale ATH VAHLOUL).",
    mp4Src: "/guides/video-administration-client.mp4",
    vttSrc: "/guides/video-administration-client.vtt",
    posterSrc: "/guides/poster-client.png",
    durationLabel: "2 min 10",
    resolutionLabel: "1280 × 720 HD",
    chapters: [
      {
        index: 1,
        startSec: 0,
        durationSec: 13,
        timecode: "00:00",
        title: "Bienvenue dans l’administration de votre site",
        summary: "Présentation de votre espace simple et dédié uniquement à votre site.",
        narration:
          "Bienvenue dans l’espace d’administration dédié à votre site. Vous y gérez vos contenus simplement et en toute sécurité.",
      },
      {
        index: 2,
        startSec: 13,
        durationSec: 13,
        timecode: "00:13",
        title: "Présentation du tableau de bord",
        summary: "Statut du site, dernière sauvegarde, pages et rôle en un coup d’œil.",
        narration:
          "Depuis l’accueil, vérifiez d’un coup d’œil le statut en ligne, la dernière sauvegarde, le nombre de pages et votre rôle.",
      },
      {
        index: 3,
        startSec: 26,
        durationSec: 13,
        timecode: "00:26",
        title: "Modifier un titre, un texte ou une actualité",
        summary: "Mettre à jour une page ou publier une nouvelle actualité sans risque.",
        narration:
          "Dans Pages et contenus, choisissez la page à modifier, mettez à jour vos textes ou ajoutez une actualité puis enregistrez.",
      },
      {
        index: 4,
        startSec: 39,
        durationSec: 13,
        timecode: "00:39",
        title: "Remplacer une image et gérer vos médias",
        summary: "Changer une photo et renseigner le texte alternatif.",
        narration:
          "Remplacez l’image d’une page ou organisez vos photos depuis l’onglet Images et médias avec aperçu instantané.",
      },
      {
        index: 5,
        startSec: 52,
        durationSec: 13,
        timecode: "00:52",
        title: "Vérifier l’aperçu avant publication",
        summary: "Contrôler le rendu sur ordinateur, tablette et mobile.",
        narration:
          "Cliquez sur Aperçu pour visualiser le rendu de votre site sur ordinateur, tablette et mobile avant publication.",
      },
      {
        index: 6,
        startSec: 65,
        durationSec: 13,
        timecode: "01:05",
        title: "Comprendre Brouillon, Sauvegardé et Publié",
        summary: "Savoir quand vos modifications sont privées ou visibles du public.",
        narration:
          "Sauvegarder protège votre travail en privé. Publier rend votre site visible à tous vos visiteurs.",
      },
      {
        index: 7,
        startSec: 78,
        durationSec: 13,
        timecode: "01:18",
        title: "Consulter l’historique et restaurer une version",
        summary: "Créer un point de repère et revenir en arrière après confirmation.",
        narration:
          "Dans Historique, créez des points de sauvegarde nommés et restaurez une version précédente en toute sécurité.",
      },
      {
        index: 8,
        startSec: 91,
        durationSec: 13,
        timecode: "01:31",
        title: "Inviter un membre et gérer les rôles",
        summary: "Propriétaire, Administrateur, Éditeur, invitation et révocation.",
        narration:
          "Depuis Équipe et rôles, le propriétaire invite un administrateur ou un éditeur et peut révoquer un accès immédiatement.",
      },
      {
        index: 9,
        startSec: 104,
        durationSec: 13,
        timecode: "01:44",
        title: "Rappel de sécurité et d’isolation de votre espace",
        summary: "Accès strictement limité au site qui vous a été attribué.",
        narration:
          "Vous administrez uniquement le site qui vous a été attribué, sans accès au constructeur global ni aux autres projets.",
      },
      {
        index: 10,
        startSec: 117,
        durationSec: 13,
        timecode: "01:57",
        title: "Déconnexion propre et assistance en cas de besoin",
        summary: "Se déconnecter proprement et réagir sereinement en cas d’erreur.",
        narration:
          "Une fois vos modifications enregistrées, cliquez sur Se déconnecter en haut à droite pour fermer votre session.",
      },
    ],
  },
};
