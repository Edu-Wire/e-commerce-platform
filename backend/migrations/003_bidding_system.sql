-- Up Migration
CREATE TABLE IF NOT EXISTS auctions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  reserve_price NUMERIC(12,2),
  current_highest_bid NUMERIC(12,2),
  highest_bidder_id INTEGER REFERENCES customers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auction_bids (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id),
  bid_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add auction flags to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_auction_ready BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auction_priority INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_product ON auctions(product_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);
