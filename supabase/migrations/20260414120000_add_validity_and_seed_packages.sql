-- Add validity column to global_package_settings
ALTER TABLE public.global_package_settings
  ADD COLUMN IF NOT EXISTS validity text NOT NULL DEFAULT '30 days';

-- Seed all packages from mock-data if not already present
INSERT INTO public.global_package_settings (network, package_size, public_price, agent_price, is_unavailable, validity)
VALUES
  ('MTN',       '1GB',  5,    4,    false, '30 days'),
  ('MTN',       '2GB',  9,    7.5,  false, '30 days'),
  ('MTN',       '5GB',  20,   16,   false, '30 days'),
  ('MTN',       '10GB', 35,   28,   false, '30 days'),
  ('MTN',       '20GB', 60,   48,   false, '30 days'),
  ('MTN',       '50GB', 120,  96,   false, '30 days'),
  ('AirtelTigo','1GB',  4.5,  3.5,  false, '30 days'),
  ('AirtelTigo','2GB',  8,    6.5,  false, '30 days'),
  ('AirtelTigo','5GB',  18,   14.5, false, '30 days'),
  ('AirtelTigo','10GB', 32,   26,   false, '30 days'),
  ('AirtelTigo','20GB', 55,   44,   false, '30 days'),
  ('Telecel',   '1GB',  4.8,  3.8,  false, '30 days'),
  ('Telecel',   '2GB',  8.5,  7,    false, '30 days'),
  ('Telecel',   '5GB',  19,   15,   false, '30 days'),
  ('Telecel',   '10GB', 33,   27,   false, '30 days'),
  ('Telecel',   '15GB', 45,   36,   false, '30 days')
ON CONFLICT (id) DO NOTHING;
