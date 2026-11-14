-- Rattrapage des boutiques existantes hors abonnement : toutes les boutiques
-- clientes actuelles sont offertes ou hors abonnement. Aucun secret n'est écrit.
UPDATE `storeSettings` ss
INNER JOIN `stores` s ON s.`id` = ss.`storeId`
SET ss.`value` = 'byok', ss.`description` = 'Parcours BYOK : le propriétaire raccorde lui-même son prestataire de paiement.'
WHERE s.`isPlatformStore` = 0
  AND ss.`key` = 'payment_route';

INSERT INTO `storeSettings` (`storeId`, `key`, `value`, `description`)
SELECT s.`id`, 'payment_route', 'byok', 'Parcours BYOK : le propriétaire raccorde lui-même son prestataire de paiement.'
FROM `stores` s
WHERE s.`isPlatformStore` = 0
  AND NOT EXISTS (
    SELECT 1 FROM `storeSettings` existing
    WHERE existing.`storeId` = s.`id` AND existing.`key` = 'payment_route'
  );

UPDATE `storeProvisioningDrafts` spd
INNER JOIN `stores` s ON s.`id` = spd.`provisionedStoreId`
SET spd.`paymentRoute` = 'byok'
WHERE s.`isPlatformStore` = 0;
