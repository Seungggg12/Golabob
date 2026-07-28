BEGIN;

DO $$
DECLARE
  dining_request_id_type TEXT;
  offer_id_type TEXT;
  offer_request_id_type TEXT;
  offer_restaurant_id_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
  INTO dining_request_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.dining_requests'::regclass
    AND a.attname = 'id'
    AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO offer_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.offers'::regclass
    AND a.attname = 'id'
    AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO offer_request_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.offers'::regclass
    AND a.attname = 'dining_request_id'
    AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO offer_restaurant_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.offers'::regclass
    AND a.attname = 'restaurant_id'
    AND NOT a.attisdropped;

  IF dining_request_id_type = 'bigint'
    AND offer_id_type = 'bigint'
    AND offer_request_id_type = 'bigint'
    AND offer_restaurant_id_type = 'uuid'
  THEN
    RAISE NOTICE 'dining_requests and offers already use the expected ID types';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM dining_requests LIMIT 1)
    OR EXISTS (SELECT 1 FROM offers LIMIT 1)
  THEN
    RAISE EXCEPTION 'Migration requires empty dining_requests and offers tables';
  END IF;

  DROP TABLE offers;
  DROP TABLE dining_requests;

  CREATE TABLE dining_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    dining_date DATE NOT NULL,
    dining_time TIME NOT NULL,
    head_count INTEGER NOT NULL CHECK (head_count >= 2),
    region TEXT NOT NULL,
    budget_per_person INTEGER NOT NULL CHECK (budget_per_person > 0),
    preferred_menu TEXT,
    required_options TEXT,
    memo TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'canceled', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE offers (
    id BIGSERIAL PRIMARY KEY,
    dining_request_id BIGINT NOT NULL REFERENCES dining_requests(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    price_per_person INTEGER NOT NULL CHECK (price_per_person > 0),
    menu_description TEXT NOT NULL,
    service_description TEXT,
    seat_description TEXT,
    available_time TIME NOT NULL,
    owner_comment TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected', 'expired', 'canceled')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_offers_request_restaurant UNIQUE (dining_request_id, restaurant_id)
  );
END
$$;

CREATE INDEX IF NOT EXISTS idx_dining_requests_user_id
ON dining_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_dining_requests_status_date
ON dining_requests(status, dining_date, dining_time);

CREATE INDEX IF NOT EXISTS idx_offers_dining_request_id
ON offers(dining_request_id);

CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id
ON offers(restaurant_id);

COMMIT;
