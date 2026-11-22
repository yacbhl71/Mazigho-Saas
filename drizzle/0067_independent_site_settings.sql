-- Migration 0067: réglages éditoriaux persistants par site indépendant.
-- Ajout strictement additive : les sites existants reçoivent un objet vide,
-- que l’application complète avec ses valeurs par défaut à la lecture.
ALTER TABLE `independentSites`
  ADD COLUMN IF NOT EXISTS `settingsJson` text NOT NULL DEFAULT '{}';
