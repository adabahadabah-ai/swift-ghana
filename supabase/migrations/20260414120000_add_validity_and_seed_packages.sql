-- Add validity column to global_package_settings
ALTER TABLE public.global_package_settings
  ADD COLUMN IF NOT EXISTS validity text NOT NULL DEFAULT 'No Expiry';

-- Seed all packages from mock-data if not already present
INSERT INTO public.global_package_settings (network, package_size, public_price, agent_price, is_unavailable, validity)
VALUES
  ('MTN',       '1GB',  5,    4,    false, 'No Expiry'),
  ('MTN',       '2GB',  9,    7.5,  false, 'No Expiry'),
  ('MTN',       '5GB',  20,   16,   false, 'No Expiry'),
  ('MTN',       '10GB', 35,   28,   false, 'No Expiry'),
  ('MTN',       '20GB', 60,   48,   false, 'No Expiry'),
  ('MTN',       '50GB', 120,  96,   false, 'No Expiry'),
  ('AirtelTigo','1GB',  4.5,  3.5,  false, 'No Expiry'),
  ('AirtelTigo','2GB',  8,    6.5,  false, 'No Expiry'),
  ('AirtelTigo','5GB',  18,   14.5, false, 'No Expiry'),
  ('AirtelTigo','10GB', 32,   26,   false, 'No Expiry'),
  ('AirtelTigo','20GB', 55,   44,   false, 'No Expiry'),
  ('Telecel',   '1GB',  4.8,  3.8,  false, 'No Expiry'),
  ('Telecel',   '2GB',  8.5,  7,    false, 'No Expiry'),
  ('Telecel',   '5GB',  19,   15,   false, 'No Expiry'),
  ('Telecel',   '10GB', 33,   27,   false, 'No Expiry'),
  ('Telecel',   '15GB', 45,   36,   false, 'No Expiry')
ON CONFLICT (id) DO NOTHING;
