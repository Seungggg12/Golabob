-- Keyset pagination and the mobile list screens use these exact leading columns.
-- Keep this as a separate migration so existing environments receive the indexes.
CREATE INDEX IF NOT EXISTS idx_dining_requests_user_id_desc
ON dining_requests(user_id, id DESC);

CREATE INDEX IF NOT EXISTS idx_dining_requests_open_schedule
ON dining_requests(dining_date ASC, dining_time ASC, id ASC)
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_offers_request_price_id
ON offers(dining_request_id, price_per_person ASC, id DESC);

CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id_desc
ON offers(restaurant_id, id DESC);

CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id_id
ON restaurants(owner_id, id);
