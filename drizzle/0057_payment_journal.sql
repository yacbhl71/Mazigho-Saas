-- Per-store payment journal shown to the owner: checkout openings, payment
-- outcomes, connector changes (with their author) and errors. Never secrets
-- nor card data.
CREATE TABLE IF NOT EXISTS `paymentJournal` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `level` varchar(16) NOT NULL,
  `source` varchar(32) NOT NULL,
  `event` varchar(64) NOT NULL,
  `provider` varchar(32) NULL,
  `reference` varchar(64) NULL,
  `amountMinor` int NULL,
  `currency` varchar(3) NULL,
  `code` varchar(64) NULL,
  `message` varchar(255) NOT NULL,
  `actorUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `paymentJournal_store_created_idx` (`storeId`, `createdAt`)
) ENGINE=InnoDB;
