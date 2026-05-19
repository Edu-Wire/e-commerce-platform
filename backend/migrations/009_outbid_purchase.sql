-- Up Migration
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS outbid_purchase_markup_percent NUMERIC(5,2) DEFAULT NULL;
