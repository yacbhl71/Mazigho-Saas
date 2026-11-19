ALTER TABLE `studioVisualProjects`
  ADD COLUMN `category` varchar(32) NOT NULL DEFAULT 'autre' AFTER `title`;
