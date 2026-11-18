-- Builder projects and CMS blocks can exceed MySQL TEXT's 65,535-byte limit.
-- MEDIUMTEXT supports up to 16 MiB while preserving the existing JSON-as-text contract.
ALTER TABLE `storeSettings`
  MODIFY COLUMN `value` MEDIUMTEXT NOT NULL;

ALTER TABLE `storeCmsPages`
  MODIFY COLUMN `blocks` MEDIUMTEXT NOT NULL;
