-- BYOK checkout: the browser basket is mirrored into the customer's server
-- cart before payment. The selected owner variant is kept on the cart line and
-- the payment intent remembers which server cart it was created from.
ALTER TABLE `cartItems`
  ADD COLUMN IF NOT EXISTS `variantId` int NULL;

ALTER TABLE `paymentIntents`
  ADD COLUMN IF NOT EXISTS `cartId` int NULL;
