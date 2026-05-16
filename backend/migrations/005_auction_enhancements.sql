-- Add minimum spread and quantity to auctions table
ALTER TABLE auctions ADD COLUMN minimum_spread DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE auctions ADD COLUMN quantity INTEGER DEFAULT 1;
