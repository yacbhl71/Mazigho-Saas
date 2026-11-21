-- Migration 0064: accès multi-client du constructeur de sites indépendants.
-- Strictement indépendant de users.role, des boutiques, paiements et commandes.
CREATE TABLE IF NOT EXISTS `independentSiteMembers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `userId` int NULL,
  `email` varchar(320) NOT NULL,
  `role` enum('owner','admin','editor') NOT NULL DEFAULT 'editor',
  `status` enum('invited','active','blocked') NOT NULL DEFAULT 'invited',
  `invitationTokenHash` varchar(64) NULL,
  `invitationExpiresAt` timestamp NULL,
  `invitationUsedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `independent_site_members_site_email_unique` (`siteId`,`email`),
  INDEX `independent_site_members_site_status_idx` (`siteId`,`status`),
  INDEX `independent_site_members_user_idx` (`userId`)
);
CREATE TABLE IF NOT EXISTS `independentSiteAccessAuditLogs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteId` int NOT NULL,
  `actorUserId` int NOT NULL,
  `action` varchar(64) NOT NULL,
  `targetUserId` int NULL,
  `targetEmail` varchar(320) NULL,
  `metadataJson` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `independent_site_access_audit_site_created_idx` (`siteId`,`createdAt`)
);
