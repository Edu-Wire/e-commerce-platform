-- Add DOB and settings to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  },
  "security": {
    "two_factor": false
  },
  "auction_preferences": {
    "auto_bid": false,
    "max_bid_alerts": true
  }
}';
