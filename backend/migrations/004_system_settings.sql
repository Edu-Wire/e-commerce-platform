-- Up Migration
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default duration (60 minutes)
INSERT INTO system_settings (key, value) 
VALUES ('auction_duration_minutes', '60') 
ON CONFLICT (key) DO NOTHING;
