CREATE TABLE IF NOT EXISTS `storeCmsPages` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `handle` varchar(180) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(24) NOT NULL DEFAULT 'à vérifier',
  `sourceUrl` varchar(1000),
  `blocks` text NOT NULL,
  `reviewRequired` int NOT NULL DEFAULT 1,
  `status` varchar(24) NOT NULL DEFAULT 'draft',
  `originalUpdatedAt` varchar(80),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `store_cms_pages_store_handle_unique` (`storeId`, `handle`),
  KEY `store_cms_pages_store_category_idx` (`storeId`, `category`),
  KEY `store_cms_pages_store_status_idx` (`storeId`, `status`)
);