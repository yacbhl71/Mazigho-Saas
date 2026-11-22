-- Migration 0065: messages et formulaires isolés par site indépendant.
CREATE TABLE IF NOT EXISTS `independentSiteFormSubmissions` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `formType` varchar(64) NOT NULL DEFAULT 'contact',
  `name` varchar(160) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(64) NULL,
  `message` text NOT NULL,
  `payloadJson` text NULL,
  `status` enum('new','read','archived') NOT NULL DEFAULT 'new',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `readAt` timestamp NULL,
  INDEX `independent_site_forms_site_status_created_idx` (`siteId`,`status`,`createdAt`)
);
