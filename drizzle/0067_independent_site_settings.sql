-- Migration 0067: réglages éditoriaux persistants par site indépendant.
-- Ajout strictement additive : les sites existants reçoivent un objet vide.
ALTER TABLE `independentSites`
  ADD COLUMN IF NOT EXISTS `settingsJson` text NULL;
UPDATE `independentSites`
  SET `settingsJson` = '{}'
  WHERE `settingsJson` IS NULL;
ALTER TABLE `independentSites`
  MODIFY COLUMN `settingsJson` text NOT NULL;
