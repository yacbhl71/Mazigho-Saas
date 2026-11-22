# Nouveautés MAZIGHO (`feat/nouveautes-mazigho`)

Synthèse technique des améliorations visuelles, fonctionnelles et ergonomiques livrées sur la branche dédiée **`feat/nouveautes-mazigho`** (sans modification de `main`, sans déploiement et sans impact sur les données existantes).

---

## 1. Console Studio MAZIGHO (`AdminStudioControlCenter`)

- **Palette de commandes rapide (`Cmd+K` / `Ctrl+K` + bouton `Navigation rapide ⌘K`)** :
  - Recherche instantanée de n’importe quelle boutique SaaS du portefeuille (sélection directe) et accès clavier rapide aux modules Studio (`/admin/studio`, `/constructeur-sites`, `/admin/orders`, `/admin/products`, `/admin/studio/production`, `/admin/studio/domaines`, `/admin/studio/sante`, `/admin/audit`).
  - Navigation complète au clavier (`↑` / `↓`, `Entrée`, `Échap`).
- **Morning Pulse — Priorités exécutives (interactif)** :
  - Synthèse sobre en haut du Centre de contrôle avec chiffres alignés (`tabular-nums`).
  - Filtrage en un clic du portefeuille : *Toutes*, *À surveiller* (stocks / attention requise), *Prêtes à livrer* (remise au propriétaire).

## 2. Site Portail MAZIGHO (`MazighoSaasLanding`)

- **Section d’orientation clarifiée (« Quel est votre projet avec MAZIGHO ? »)** :
  - Distinction immédiate entre **Boutique en ligne & Commerce** (paiement carte, COD Algérie, multi-devises CHF/EUR/DZD, Studio) et **Site vitrine, association ou famille** (constructeur visuel indépendant, administration isolée par site et par rôle).
  - Liens directs vers l’exemple **Association familiale ATH VAHLOUL** (`/sites/association-familiale-ath-vahloul`) et vers le **Constructeur de sites** (`/constructeur-sites`).
- **Bandeau Souveraineté Suisse & Internationale** :
  - Rappel clair sous les deux parcours : *nLPD Suisse & RGPD · Zéro cookie publicitaire · Multi-devises CHF / EUR / DZD · Propriété totale des données*.

## 3. Constructeur Visuel Indépendant (`isolatedSiteBuilder` & `IndependentSiteBuilderPage`)

- **4 nouvelles sections composées prêtes à l’emploi (100 % sans e-commerce)** :
  1. `section-trombinoscope-bureau` — **Trombinoscope Bureau / Équipe** (`Cartes & Grilles`)
  2. `section-chronologie-histoire` — **Chronologie & Histoire** (`Confiance & Contenu`)
  3. `section-galerie-evenements` — **Galerie d’événements par année** (`Images & Médias`)
  4. `section-adhesion-dons` — **Appel aux dons & Adhésions (IBAN / CCP)** (`Contact & Décoration`, purement informatif, aucun encaissement)
- **Aperçu simultané « Côte à côte » (Ordinateur 1280 px + Mobile 375 px)** :
  - Nouveau bouton `Côte à côte` dans la barre responsive du constructeur.
  - Synchronise l’état live de GrapesJS sans démonter l’éditeur (historique Annuler/Rétablir et modifications en cours intégralement préservés au retour).

## 4. Espace d’Administration Client Dédié (`IndependentSiteAdminPage` + backend isolé)

- **Correction et enrichissement des statistiques privées** :
  - `recordPageView` enregistre désormais correctement les visites des sites indépendants en brouillon comme publiés (via `resolveIndependentSiteIdForAnalytics`, sans jamais exposer de données privées ni de cookies publicitaires).
  - `getAnalyticsSummary` renvoie désormais `dailyViews` (tendance sur les **7 derniers jours glissants** en UTC) et `lastRecordedAt` (horodatage de la dernière visite).
  - Nouveau graphique à barres 7 jours + horodatage de dernière visite + rafraîchissement automatique à l’ouverture de l’onglet *Statistiques* et bouton *Actualiser les données*.
- **Boîte de réception enrichie (Mini-CRM isolé par site)** :
  - Nouvelle mutation `updateFormSubmissionStatus` (`new` / `read` / `archived`) protégée par contrôle strict d’accès et d’isolation par site.
  - Actions directes sur chaque message : **Répondre par e-mail** (`mailto:` pré-rempli), **Marquer comme lu**, **Archiver**, **Restaurer**, et **Export CSV UTF-8** (compatible Excel).
  - Statuts affichés en français clair (*Nouveau*, *Lu*, *Archivé*).
- **Vue d’ensemble & personnalisation marque blanche** :
  - En-tête personnalisé `Espace de gestion · {Titre du site}`.
  - Bloc **Derniers messages reçus** dans la vue d’ensemble avec lien direct vers la boîte de réception + raccourcis rapides vers *Boîte de réception* et *Statistiques*.

---

## Étapes volontairement différées (nécessitant votre validation / intervention)

- **Déploiement & fusion sur `main`** : non exécutés conformément à vos consignes (`main` est intact).
- **Test d’envoi réel d’e-mails Brevo / SMTP** : requiert vos identifiants / boîte de réception de test en production.
- **Test de paiement réel Stripe / COD & changements DNS** : volontairement exclus du périmètre.
- **Modification ou publication d’ATH VAHLOUL** : aucune donnée ni statut d’ATH VAHLOUL n’a été modifié.
