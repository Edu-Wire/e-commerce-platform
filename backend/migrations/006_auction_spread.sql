-- Add spread column to auctions table
ALTER TABLE auctions ADD COLUMN spread DECIMAL(10,2) DEFAULT 0.00;
