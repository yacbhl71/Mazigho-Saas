CREATE TABLE IF NOT EXISTS `studioVisualProjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerUserId` int NOT NULL,
  `title` varchar(180) NOT NULL,
  `mode` varchar(24) NOT NULL DEFAULT 'blank',
  `project` mediumtext NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `studio_visual_projects_owner_updated_idx` (`ownerUserId`, `updatedAt`)
);
