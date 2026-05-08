export type AdminRole = 'owner' | 'manager' | 'inventory_staff' | 'viewer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon_url: string | null;
  is_active: boolean;
  created_at: string;
  children?: Category[];
}

export type SpecType = 'text' | 'number' | 'select' | 'boolean';

export interface SpecTemplate {
  id: string;
  category_id: string;
  spec_key: string;
  spec_label: string;
  spec_type: SpecType;
  spec_options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

export type ProductCondition = 'new' | 'new_with_minor_damage' | 'new_with_defect';

export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductSpec {
  spec_key: string;
  spec_label: string;
  spec_value: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  category_id: string;
  category_name: string;
  description: string | null;
  condition: ProductCondition;
  damage_description: string | null;
  defect_description: string | null;
  mrp: number;
  buying_price: number;
  selling_price: number;
  discount_percent: number;
  is_b2c_available: boolean;
  is_b2b_available: boolean;
  b2b_price: number | null;
  b2b_min_quantity: number | null;
  stock_quantity: number;
  minimum_stock_alert: number;
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  images: ProductImage[];
  specs: ProductSpec[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderType = 'b2c' | 'b2b';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  condition: ProductCondition;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  items: OrderItem[];
  shipping_address: ShippingAddress | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  total_orders: number;
  total_spent: number;
}

export interface BulkUploadLog {
  id: string;
  filename: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: BulkUploadError[];
  uploaded_by: string;
  created_at: string;
}

export interface BulkUploadError {
  row: number;
  sku: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface DashboardStats {
  total_products: number;
  active_products: number;
  low_stock_items: number;
  todays_orders: number;
  total_revenue: number;
  total_customers: number;
  sales_by_category: { category: string; revenue: number }[];
  orders_last_30_days: { date: string; orders: number; revenue: number }[];
  condition_breakdown: { condition: ProductCondition; count: number }[];
  recent_orders: {
    id: string;
    order_number: string;
    customer_name: string;
    order_type: OrderType;
    total_amount: number;
    status: OrderStatus;
    created_at: string;
  }[];
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name: string;
  image_url: string | null;
  stock_quantity: number;
  minimum_stock_alert: number;
  buying_price: number;
  selling_price: number;
  updated_at: string;
}
