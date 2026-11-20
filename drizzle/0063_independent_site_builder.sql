-- Migration 0063: Constructeur de Sites Internet Indépendant
-- Tables strictement préfixées `independentSite*`, sans aucune colonne `storeId`
-- ni clé étrangère vers les tables e-commerce MAZIGHO (`stores`, `products`, `orders`).

CREATE TABLE IF NOT EXISTS `independentSites` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ownerUserId` int NOT NULL,
  `slug` varchar(96) NOT NULL,
  `title` varchar(180) NOT NULL,
  `siteType` varchar(32) NOT NULL DEFAULT 'vitrine',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `templateId` varchar(80) NULL,
  `themeJson` text NOT NULL,
  `navigationJson` mediumtext NOT NULL,
  `pagesJson` mediumtext NOT NULL,
  `reusableBlocksJson` mediumtext NOT NULL,
  `publishedSnapshotJson` mediumtext NULL,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `independent_sites_slug_unique` (`slug`),
  INDEX `independent_sites_owner_status_updated_idx` (`ownerUserId`, `status`, `updatedAt`)
);

CREATE TABLE IF NOT EXISTS `independentSiteVersions` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `ownerUserId` int NOT NULL,
  `versionNumber` int NOT NULL,
  `label` varchar(160) NOT NULL,
  `snapshotJson` mediumtext NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `independent_site_versions_site_owner_idx` (`siteId`, `ownerUserId`, `versionNumber`)
);

CREATE TABLE IF NOT EXISTS `independentSiteMedia` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `ownerUserId` int NOT NULL,
  `label` varchar(160) NOT NULL,
  `altText` varchar(240) NOT NULL,
  `url` mediumtext NOT NULL,
  `mimeType` varchar(64) NOT NULL DEFAULT 'image/svg+xml',
  `transformsJson` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `independent_site_media_site_owner_idx` (`siteId`, `ownerUserId`, `createdAt`)
);

CREATE TABLE IF NOT EXISTS `independentSiteDomains` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `ownerUserId` int NOT NULL,
  `hostname` varchar(253) NOT NULL,
  `verificationStatus` enum('pending_dns','verified','active','failed') NOT NULL DEFAULT 'pending_dns',
  `verificationToken` varchar(96) NOT NULL,
  `sslStatus` enum('pending','active') NOT NULL DEFAULT 'pending',
  `isPrimary` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `independent_site_domains_hostname_unique` (`hostname`),
  INDEX `independent_site_domains_site_owner_idx` (`siteId`, `ownerUserId`)
);
