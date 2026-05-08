-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner','manager','inventory_staff','viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (self-referencing for unlimited nesting)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Category Specification Templates
CREATE TABLE IF NOT EXISTS category_spec_templates (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  spec_key VARCHAR(100) NOT NULL,
  spec_label VARCHAR(255) NOT NULL,
  spec_type VARCHAR(50) NOT NULL CHECK (spec_type IN ('text','number','select','boolean')),
  spec_options JSONB,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_spec_templates_category ON category_spec_templates(category_id);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  customer_type VARCHAR(10) NOT NULL DEFAULT 'b2c' CHECK (customer_type IN ('b2c','b2b')),
  company_name VARCHAR(255),
  gst_number VARCHAR(20),
  address JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  brand VARCHAR(255),
  mrp NUMERIC(12,2) NOT NULL,
  buying_price NUMERIC(12,2) NOT NULL,
  selling_price NUMERIC(12,2) NOT NULL,
  discount_percentage NUMERIC(5,2) GENERATED ALWAYS AS (ROUND(((mrp - selling_price) / mrp * 100), 2)) STORED,
  condition VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (condition IN ('new','new_with_minor_damage','new_with_defect')),
  damage_description TEXT,
  defect_description TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock_alert INTEGER NOT NULL DEFAULT 5,
  is_b2b_available BOOLEAN DEFAULT false,
  is_b2c_available BOOLEAN DEFAULT true,
  b2b_price NUMERIC(12,2),
  b2b_minimum_quantity INTEGER DEFAULT 1,
  images JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  weight_grams INTEGER,
  dimensions_cm JSONB,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INTEGER REFERENCES admin_users(id)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('b2b','b2c')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total_mrp NUMERIC(12,2) NOT NULL,
  total_selling_price NUMERIC(12,2) NOT NULL,
  total_savings NUMERIC(12,2) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  shipping_address JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Bulk Upload Logs
CREATE TABLE IF NOT EXISTS bulk_upload_logs (
  id SERIAL PRIMARY KEY,
  uploaded_by INTEGER REFERENCES admin_users(id),
  filename VARCHAR(500) NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
