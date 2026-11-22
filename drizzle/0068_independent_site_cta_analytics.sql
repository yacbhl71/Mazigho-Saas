-- Migration 0068: clics anonymisés sur les actions principales des sites indépendants.
-- Les événements existants page_view restent inchangés.
ALTER TABLE `independentSiteAnalyticsEvents`
  MODIFY COLUMN `eventType` enum('page_view','cta_click') NOT NULL DEFAULT 'page_view';
