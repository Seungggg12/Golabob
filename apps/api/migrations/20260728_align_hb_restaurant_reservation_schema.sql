ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
ADD CONSTRAINT reservations_status_check
CHECK (
  status IN (
    'pending',
    'confirmed',
    'rejected',
    'completed',
    'canceled'
  )
);
