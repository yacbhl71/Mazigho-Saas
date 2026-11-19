CREATE TABLE IF NOT EXISTS `studioProjectMembers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('family_admin','president','secretary','treasurer','event_coordinator','inventory_manager','moderator','member') NOT NULL DEFAULT 'member',
  `status` enum('invited','active','blocked') NOT NULL DEFAULT 'invited',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `studio_project_members_project_user_unique` (`projectId`,`userId`),
  KEY `studio_project_members_project_idx` (`projectId`),
  KEY `studio_project_members_user_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `studioFamilyAnnouncements` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `createdByUserId` int NOT NULL,
  `eventType` enum('death','memory','marriage','birth','engagement','other') NOT NULL DEFAULT 'other',
  `title` varchar(180) NOT NULL,
  `body` mediumtext NOT NULL,
  `visibility` enum('public','family_members','close_family','invited','private') NOT NULL DEFAULT 'private',
  `status` enum('draft','pending_consent','pending_review','published','withdrawn') NOT NULL DEFAULT 'draft',
  `consentConfirmed` tinyint NOT NULL DEFAULT 0,
  `consentConfirmedByUserId` int NULL,
  `eventAt` timestamp NULL,
  `publishUntil` timestamp NULL,
  `invitedUserIds` mediumtext NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `studio_family_announcements_project_idx` (`projectId`,`status`),
  KEY `studio_family_announcements_creator_idx` (`createdByUserId`)
);
