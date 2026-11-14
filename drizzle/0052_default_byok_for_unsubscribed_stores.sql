-- Toutes les boutiques MAZIGHO actuellement offertes ou hors abonnement
-- utilisent le parcours BYOK. Cette migration ne crée ni secret ni compte
-- marchand : elle ne fait que corriger la préférence de parcours.
UPDATE `storeProvisioningDrafts`
SET `paymentRoute` = 'byok'
WHERE `provisionedStoreId` IS NOT NULL
  AND (`requestedPlan` IS NULL OR `requestedPlan` = '' OR `requestedPlan` NOT IN ('pro', 'basic', 'premium', 'lifetime'));

UPDATE `storeSettings` ss
LEFT JOIN `storeProvisioningDrafts` spd ON spd.`provisionedStoreId` = ss.`storeId`
SET ss.`value` = 'byok', ss.`description` = 'Parcours BYOK : le propriétaire raccorde lui-même son prestataire de paiement.'
WHERE ss.`key` = 'payment_route'
  AND (spd.`requestedPlan` IS NULL OR spd.`requestedPlan` = '' OR spd.`requestedPlan` NOT IN ('pro', 'basic', 'premium', 'lifetime'));
