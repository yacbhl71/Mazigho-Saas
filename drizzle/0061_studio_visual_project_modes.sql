ALTER TABLE `studioVisualProjects`
  ADD COLUMN `projectMode` varchar(24) NOT NULL DEFAULT 'independent' AFTER `category`;
