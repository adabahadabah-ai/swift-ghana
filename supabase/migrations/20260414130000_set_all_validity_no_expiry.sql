-- Update all existing packages to No Expiry validity
UPDATE public.global_package_settings
SET validity = 'No Expiry'
WHERE validity IS NULL OR validity != 'No Expiry';

-- Also ensure the column default is No Expiry
ALTER TABLE public.global_package_settings
  ALTER COLUMN validity SET DEFAULT 'No Expiry';
