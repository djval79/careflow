-- Add subscription price and currency to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP';

COMMENT ON COLUMN tenants.subscription_price IS 'Custom subscription price for the tenant';
COMMENT ON COLUMN tenants.currency IS 'Currency code for the subscription price (e.g., GBP, USD)';
