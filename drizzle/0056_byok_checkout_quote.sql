-- BYOK checkout: delivery country, promotion and legal acceptance chosen at
-- checkout are kept on the server cart so the payment service, the payment
-- amount and the final order use the same checkout engine as Stripe Connect.
ALTER TABLE `carts`
  ADD COLUMN IF NOT EXISTS `checkoutQuote` text NULL;
