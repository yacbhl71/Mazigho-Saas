-- Migration 0066: statistiques privées et anonymisées par site indépendant.
CREATE TABLE IF NOT EXISTS `independentSiteAnalyticsEvents` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `eventType` enum('page_view') NOT NULL DEFAULT 'page_view',
  `visitorKey` varchar(64) NOT NULL,
  `path` varchar(240) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `independent_site_analytics_site_created_idx` (`siteId`,`createdAt`),
  INDEX `independent_site_analytics_site_path_created_idx` (`siteId`,`path`,`createdAt`),
  INDEX `independent_site_analytics_site_visitor_created_idx` (`siteId`,`visitorKey`,`createdAt`)
);
