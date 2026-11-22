import type { SiteTrainingGuideConfig } from "./guideTypes";

export const BUILDER_GUIDE_CONFIG: SiteTrainingGuideConfig = {
  audience: "owner-builder",
  modalTitle: "Guide privé du constructeur MAZIGHO",
  modalSubtitle:
    "Atelier privé réservé au propriétaire MAZIGHO — création, contrôle qualité et livraison de sites indépendants.",
  audienceLabel: "Guide privé · Propriétaire MAZIGHO",
  steps: [
    {
      id: "builder-01-select-site",
      number: 1,
      category: "Démarrage",
      title: "Sélectionner un site existant",
      summary:
        "Ouvrez le panneau « Créer un site / Mes sites » dans la barre supérieure et cliquez sur le projet à ouvrir (ex. Association familiale ATH VAHLOUL).",
      actions: [
        "Ouvrez la barre d’actions rapides puis cliquez sur « Créer un site / Mes sites ».",
        "Sélectionnez le projet souhaité dans la liste de vos sites indépendants.",
        "Vérifiez que son titre apparaît dans l’en-tête principal du constructeur.",
      ],
      detailedHelp:
        "Chaque site indépendant dispose de ses propres pages, de sa bibliothèque média et de son historique. Assurez-vous d’avoir sélectionné le bon projet avant toute édition.",
      illustration: "builder-site-selector",
      caption:
        "Sélection du site actif depuis l’en-tête privé du constructeur MAZIGHO.",
    },
    {
      id: "builder-02-verify-site-id",
      number: 2,
      category: "Démarrage",
      title: "Vérifier le site actif (siteId)",
      summary:
        "Confirmez que le paramètre ?siteId= est présent dans l’URL et correspond au projet affiché : cette synchronisation garantit la persistance après actualisation.",
      actions: [
        "Contrôlez la présence du paramètre ?siteId= dans la barre d’adresse.",
        "Après un rechargement complet (F5), vérifiez que le même projet reste sélectionné.",
        "Toutes les actions (sauvegarde, réparation des liens, publication) ciblent cet identifiant exact.",
      ],
      detailedHelp:
        "La sélection du site actif est conservée conjointement dans l’URL (?siteId=) et dans sessionStorage afin d’éviter toute désynchronisation entre le canvas et les mutations serveur.",
      illustration: "builder-site-id",
      caption:
        "Vérification de la persistance du siteId dans l’URL et sessionStorage.",
    },
    {
      id: "builder-03-select-page",
      number: 3,
      category: "Pages",
      title: "Choisir une page",
      summary:
        "Ouvrez l’onglet « Pages » pour basculer entre Accueil, Notre Famille, Événements, Contact ou toute autre page du projet.",
      actions: [
        "Cliquez sur « Pages » dans la colonne d’outils de gauche.",
        "Sélectionnez la page à charger dans le canvas visuel.",
        "Vérifiez le libellé « Page active » dans la barre supérieure.",
      ],
      detailedHelp:
        "Le changement de page synchronise immédiatement le HTML, le CSS et les réglages SEO de la page sélectionnée dans le canvas GrapesJS.",
      illustration: "builder-pages",
      caption:
        "Sélection rapide d’une page dans le panneau latéral du constructeur.",
    },
    {
      id: "builder-04-edit-text",
      number: 4,
      category: "Contenu",
      title: "Modifier un texte",
      summary:
        "Double-cliquez directement sur un titre, un sous-titre, un paragraphe ou un bouton dans le canvas pour modifier le texte en conservant la mise en page.",
      actions: [
        "Assurez-vous que le mode « 1. Modifier (actif) » est activé.",
        "Double-cliquez sur le texte à corriger dans le canvas.",
        "Validez votre saisie puis utilisez Annuler / Rétablir si nécessaire.",
      ],
      detailedHelp:
        "L’édition directe préserve automatiquement les styles, tailles responsives et contrastes définis sur le thème du site.",
      illustration: "builder-edit-text",
      caption:
        "Édition directe en place sur un titre ou paragraphe dans le canvas.",
    },
    {
      id: "builder-05-replace-image",
      number: 5,
      category: "Médias",
      title: "Remplacer une image",
      summary:
        "Sélectionnez une image dans le canvas ou depuis la médiathèque du site, remplacez son visuel et renseignez toujours son texte alternatif (alt).",
      actions: [
        "Ouvrez l’onglet « Médias » ou cliquez sur l’image dans le canvas.",
        "Choisissez une image de la bibliothèque dédiée à ce site ou ajoutez un nouveau visuel.",
        "Renseignez un texte alternatif descriptif pour l’accessibilité et le référencement.",
      ],
      detailedHelp:
        "Le remplacement depuis la médiathèque permet de mettre à jour une image sur la page active ou de la propager proprement sur l’ensemble des pages du site.",
      illustration: "builder-replace-image",
      caption:
        "Remplacement d’un visuel depuis la bibliothèque dédiée au projet actif.",
    },
    {
      id: "builder-06-add-section",
      number: 6,
      category: "Structure",
      title: "Ajouter une section",
      summary:
        "Insérez une section prête à l’emploi (bannière Hero, grille de cartes, actualités, contact ou pied de page) déjà calibrée pour le responsive.",
      actions: [
        "Ouvrez l’onglet « Modules / Sections » dans la bibliothèque.",
        "Choisissez la section adaptée au besoin de la page.",
        "Insérez-la puis personnalisez ses titres, textes et images.",
      ],
      detailedHelp:
        "Les sections fournies respectent les règles responsive du constructeur : grille fluide sur ordinateur et colonne unique sans débordement sur mobile 320 px.",
      illustration: "builder-add-section",
      caption:
        "Insertion d’une section structurée et responsive depuis la bibliothèque.",
    },
    {
      id: "builder-07-add-block",
      number: 7,
      category: "Structure",
      title: "Ajouter un bloc",
      summary:
        "Ajoutez un bloc élémentaire (titre, texte, image, bouton d’action, carte) pour compléter une section existante avec précision.",
      actions: [
        "Cliquez sur « Ajouter un bloc » dans la barre d’actions rapides.",
        "Sélectionnez la catégorie de bloc souhaitée.",
        "Placez le bloc dans la zone cible puis ajustez son contenu.",
      ],
      detailedHelp:
        "Utilisez les blocs pour les ajustements ponctuels et privilégiez les sections complètes pour conserver une harmonie visuelle d’ensemble.",
      illustration: "builder-add-block",
      caption:
        "Ajout d’un bloc élémentaire dans une section existante du canvas.",
    },
    {
      id: "builder-08-add-page",
      number: 8,
      category: "Pages",
      title: "Ajouter une page",
      summary:
        "Créez une nouvelle page depuis l’onglet Pages : le slug (/adresse) est généré automatiquement et la page peut être affichée dans le menu.",
      actions: [
        "Cliquez sur « + Ajouter une page » dans la barre rapide ou le panneau Pages.",
        "Indiquez le titre de la page et choisissez un socle de départ si utile.",
        "Vérifiez l’adresse (/slug), le titre SEO et l’ordre d’affichage dans le menu.",
      ],
      detailedHelp:
        "Chaque nouvelle page reçoit un slug unique normalisé, évitant tout conflit d’URL ou lien cassé dans la navigation.",
      illustration: "builder-add-page",
      caption:
        "Création d’une nouvelle page avec slug automatique et intégration au menu.",
    },
    {
      id: "builder-09-preview",
      number: 9,
      category: "Contrôle",
      title: "Prévisualiser le site",
      summary:
        "Utilisez « 2. Prévisualiser (Privé) » pour parcourir le site tel que le verront les visiteurs, sans publier votre brouillon.",
      actions: [
        "Sauvegardez vos changements récents si besoin.",
        "Cliquez sur « 2. Prévisualiser (Privé) » dans l’en-tête.",
        "Naviguez entre les pages pour vérifier les enchaînements et la lisibilité.",
      ],
      detailedHelp:
        "L’aperçu privé est totalement distinct de la mise en ligne publique : aucun visiteur externe ne voit un site en brouillon.",
      illustration: "builder-preview",
      caption:
        "Ouverture de l’aperçu privé pour contrôler le rendu réel avant mise en ligne.",
    },
    {
      id: "builder-10-responsive",
      number: 10,
      category: "Contrôle",
      title: "Vérifier les vues ordinateur, tablette et mobile",
      summary:
        "Testez systématiquement les profils 1440 px, 1024 px, 768 px, 414 px et 320 px pour garantir une colonne propre sur mobile et zéro débordement.",
      actions: [
        "Basculez entre les vues Ordinateur, Tablette et Mobile dans la barre du canvas.",
        "Vérifiez que les cartes s’affichent en une seule colonne sur mobile (414 et 320 px).",
        "Contrôlez la lisibilité du pied de page et l’absence de débordement horizontal.",
      ],
      detailedHelp:
        "Un contrôle systématique sur petit écran (320 px) garantit que le site livré reste confortable pour tous les membres sur smartphone.",
      illustration: "builder-responsive",
      caption:
        "Contrôle multi-écrans du canvas sur ordinateur, tablette et mobile étroit.",
    },
    {
      id: "builder-11-save",
      number: 11,
      category: "Sauvegarde",
      title: "Enregistrer les modifications",
      summary:
        "Cliquez sur « Sauvegarder » dans la barre supérieure pour enregistrer votre travail sur le serveur tout en gardant le contrôle de la publication.",
      actions: [
        "Cliquez sur le bouton « Sauvegarder » dès qu’une étape est terminée.",
        "Attendez la confirmation visuelle « Toutes les modifications sont enregistrées ».",
        "Contrôlez l’horodatage de la dernière sauvegarde affiché sous l’en-tête.",
      ],
      detailedHelp:
        "La sauvegarde persiste l’ensemble des pages côté serveur et protège votre session sans modifier le statut publié/brouillon du site.",
      illustration: "builder-save",
      caption:
        "Enregistrement sécurisé des modifications côté serveur avec horodatage.",
    },
    {
      id: "builder-12-check-links",
      number: 12,
      category: "Qualité",
      title: "Vérifier les liens internes",
      summary:
        "Consultez le panneau de contrôle des liens internes pour repérer immédiatement toute destination introuvable dans les pages du site.",
      actions: [
        "Ouvrez la section Qualité / Liens internes du projet actif.",
        "Lisez le nombre exact de liens valides et de liens cassés détectés.",
        "Inspectez la liste détaillée par page avant d’appliquer une réparation.",
      ],
      detailedHelp:
        "L’analyse parcourt l’ensemble des pages du projet actif afin qu’aucun bouton ou lien de pied de page ne mène vers une page inexistante.",
      illustration: "builder-links-check",
      caption:
        "Diagnostic des liens internes du projet actif avant réparation.",
    },
    {
      id: "builder-13-repair-known-links",
      number: 13,
      category: "Qualité",
      title: "Utiliser le bouton « Corriger les liens connus »",
      summary:
        "Lancez « Corriger les liens connus » pour réparer automatiquement les anciens chemins reconnus par la liste autorisée sur le siteId actif.",
      actions: [
        "Vérifiez que le bon site est actif (siteId synchronisé).",
        "Cliquez sur « Corriger les liens connus ».",
        "Lisez le compte-rendu de réparation et vérifiez le recalcul immédiat du compteur.",
      ],
      detailedHelp:
        "Seuls les liens connus de l’allowlist existante (ex. /a-propos, /histoire, /membres, /charte → /notre-famille ; /participer → /contact) sont corrigés automatiquement.",
      illustration: "builder-links-repair",
      caption:
        "Exécution de la réparation contrôlée des liens connus sur le site actif.",
    },
    {
      id: "builder-14-unknown-links",
      number: 14,
      category: "Qualité",
      title: "Comprendre les liens inconnus restants",
      summary:
        "Les liens qui ne figurent pas dans la liste autorisée restent volontairement signalés et ne sont jamais remplacés à l’aveugle.",
      actions: [
        "Repérez chaque lien inconnu encore listé après réparation.",
        "Décidez s’il faut créer la page manquante ou corriger manuellement la cible.",
        "Sauvegardez puis vérifiez que le taux de liens internes atteint 100 %.",
      ],
      detailedHelp:
        "Ce garde-fou évite de rediriger par erreur un lien métier spécifique vers une mauvaise page.",
      illustration: "builder-links-unknown",
      caption:
        "Arbitrage manuel des liens inconnus conservés en alerte par sécurité.",
    },
    {
      id: "builder-15-history",
      number: 15,
      category: "Historique",
      title: "Consulter l’historique des versions",
      summary:
        "Accédez à l’onglet Historique pour voir toutes les sauvegardes datées et créer un point de repère nommé avant une refonte.",
      actions: [
        "Ouvrez le panneau « Historique » du projet.",
        "Parcourez les versions enregistrées avec leur date et leur libellé.",
        "Créez un point de sauvegarde nommé avant toute modification majeure.",
      ],
      detailedHelp:
        "Chaque version conserve une photographie complète des pages du site pour sécuriser votre travail au fil des itérations.",
      illustration: "builder-history",
      caption:
        "Consultation de l’historique daté et création de points de repère nommés.",
    },
    {
      id: "builder-16-restore",
      number: 16,
      category: "Historique",
      title: "Restaurer une version",
      summary:
        "Sélectionnez une version antérieure validée et confirmez la restauration pour rétablir instantanément le contenu dans le canvas.",
      actions: [
        "Identifiez la version de référence dans l’historique.",
        "Cliquez sur « Restaurer » puis validez la demande de confirmation.",
        "Vérifiez que le canvas et les pages affichent bien l’état restauré.",
      ],
      detailedHelp:
        "Une restauration est toujours confirmée explicitement et l’état précédent reste disponible dans l’historique.",
      illustration: "builder-restore",
      caption:
        "Restauration réversible d’une version antérieure après confirmation.",
    },
    {
      id: "builder-17-publish",
      number: 17,
      category: "Mise en ligne",
      title: "Publier et dépublier le site",
      summary:
        "Utilisez « 3. Publier » pour rendre le site accessible à son adresse publique, ou repassez-le en brouillon privé si des ajustements sont requis.",
      actions: [
        "Vérifiez que les dernières modifications sont enregistrées.",
        "Cliquez sur « 3. Publier » pour passer le site au statut En ligne.",
        "Si besoin, repassez le site en brouillon privé à tout moment.",
      ],
      detailedHelp:
        "La publication en ligne est protégée côté serveur et réservée aux rôles Propriétaire et Administrateur.",
      illustration: "builder-publish",
      caption:
        "Passage contrôlé entre le statut Brouillon privé et le statut Publié en ligne.",
    },
    {
      id: "builder-18-final-check",
      number: 18,
      category: "Livraison",
      title: "Effectuer un contrôle final avant livraison client",
      summary:
        "Avant de remettre le site au client, vérifiez la qualité complète puis invitez le client exclusivement sur son espace /administration-site.",
      actions: [
        "Confirmez 100 % de liens internes valides et zéro débordement sur 1440 à 320 px.",
        "Vérifiez que les textes de démonstration sont personnalisés et les images munies d’un alt.",
        "Créez l’accès client sur /administration-site sans jamais donner accès à /constructeur-sites.",
      ],
      detailedHelp:
        "Le constructeur global reste strictement privé et réservé au propriétaire MAZIGHO. Le client n’administre que son propre site via /administration-site.",
      illustration: "builder-delivery-check",
      caption:
        "Checklist finale avant livraison de l’espace d’administration client.",
    },
  ],
  video: {
    title: "Vidéo de présentation — Constructeur privé MAZIGHO",
    subtitle:
      "Visite complète en 12 chapitres de la création au contrôle final avant livraison (site de démonstration Association familiale ATH VAHLOUL).",
    mp4Src: "/guides/video-constructeur-mazigho.mp4",
    vttSrc: "/guides/video-constructeur-mazigho.vtt",
    posterSrc: "/guides/poster-constructeur.png",
    durationLabel: "3 min 00",
    resolutionLabel: "1280 × 720 HD",
    chapters: [
      {
        index: 1,
        startSec: 0,
        durationSec: 15,
        timecode: "00:00",
        title: "Bienvenue dans le constructeur MAZIGHO",
        summary: "Présentation de l’atelier privé séparé de la boutique.",
        narration:
          "Bienvenue dans le constructeur indépendant MAZIGHO, votre atelier privé pour concevoir et livrer des sites complets.",
      },
      {
        index: 2,
        startSec: 15,
        durationSec: 15,
        timecode: "00:15",
        title: "Sélection d’un site actif",
        summary: "Choisir le projet et vérifier la persistance du siteId.",
        narration:
          "Sélectionnez le site à modifier dans le menu principal. Son identifiant siteId reste synchronisé même après rechargement.",
      },
      {
        index: 3,
        startSec: 30,
        durationSec: 15,
        timecode: "00:30",
        title: "Découverte de l’interface",
        summary: "Barre haute, panneaux latéraux et canvas GrapesJS.",
        narration:
          "L’interface réunit la barre d’actions en haut, les outils de pages et blocs à gauche, et le canvas visuel au centre.",
      },
      {
        index: 4,
        startSec: 45,
        durationSec: 15,
        timecode: "00:45",
        title: "Sélection et modification d’une page",
        summary: "Changer de page et régler son titre, son slug et son SEO.",
        narration:
          "Sélectionnez la page souhaitée dans le panneau Pages pour afficher immédiatement son contenu dans le canvas.",
      },
      {
        index: 5,
        startSec: 60,
        durationSec: 15,
        timecode: "01:00",
        title: "Modification d’un texte dans le canvas",
        summary: "Double-clic en place avec préservation des styles.",
        narration:
          "Double-cliquez sur n’importe quel titre ou paragraphe dans le canvas pour mettre à jour le texte en conservant la mise en forme.",
      },
      {
        index: 6,
        startSec: 75,
        durationSec: 15,
        timecode: "01:15",
        title: "Ajout d’une section ou d’un bloc",
        summary: "Composer la page avec des modules responsives prêts à l’emploi.",
        narration:
          "Ajoutez une section ou un bloc depuis la bibliothèque pour enrichir la page sans casser l’alignement.",
      },
      {
        index: 7,
        startSec: 90,
        durationSec: 15,
        timecode: "01:30",
        title: "Remplacement d’une image",
        summary: "Utiliser la médiathèque et renseigner le texte alternatif.",
        narration:
          "Utilisez la bibliothèque médias du site pour remplacer une image et renseigner son texte alternatif.",
      },
      {
        index: 8,
        startSec: 105,
        durationSec: 15,
        timecode: "01:45",
        title: "Aperçu responsive multi-écrans",
        summary: "Vérifier les rendus ordinateur, tablette et mobile (320 px).",
        narration:
          "Basculez entre les vues ordinateur, tablette et mobile pour vérifier l’équilibre des cartes et l’absence de débordement.",
      },
      {
        index: 9,
        startSec: 120,
        durationSec: 15,
        timecode: "02:00",
        title: "Vérification et réparation des liens internes",
        summary: "Corriger les liens connus et vérifier les liens inconnus.",
        narration:
          "Lancez la vérification des liens internes puis cliquez sur Corriger les liens connus. Les liens inconnus restent signalés.",
      },
      {
        index: 10,
        startSec: 135,
        durationSec: 15,
        timecode: "02:15",
        title: "Sauvegarde des modifications",
        summary: "Persister le projet en brouillon avec confirmation visuelle.",
        narration:
          "Cliquez sur Enregistrer pour sauvegarder vos modifications en toute sécurité avant de passer à la publication.",
      },
      {
        index: 11,
        startSec: 150,
        durationSec: 15,
        timecode: "02:30",
        title: "Historique et restauration d’une version",
        summary: "Créer des points de repère et restaurer après confirmation.",
        narration:
          "Consultez l’historique pour créer un point de repère ou restaurer une version précédente après confirmation.",
      },
      {
        index: 12,
        startSec: 165,
        durationSec: 15,
        timecode: "02:45",
        title: "Publication et contrôle final avant livraison",
        summary: "Publier le site validé et livrer l’accès client dédié.",
        narration:
          "Après votre contrôle final, publiez le site et invitez le client dans son espace d’administration privé.",
      },
    ],
  },
};
