import { Request } from 'express';

export type AdminRole = 'owner' | 'manager' | 'inventory_staff' | 'viewer';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  customer_type: 'b2c' | 'b2b';
  company_name: string | null;
  gst_number: string | null;
  address: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon_url: string | null;
  is_active: boolean;
  created_at: Date;
  children?: Category[];
}

export interface SpecTemplate {
  id: number;
  category_id: number;
  spec_key: string;
  spec_label: string;
  spec_type: 'text' | 'number' | 'select' | 'boolean';
  spec_options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

export type ProductCondition = 'new' | 'new_with_minor_damage' | 'new_with_defect';

export interface ProductImage {
  url: string;
  is_primary: boolean;
  sort_order?: number;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  sku: string;
  brand: string | null;
  mrp: number;
  buying_price: number;
  selling_price: number;
  discount_percentage: number;
  condition: ProductCondition;
  damage_description: string | null;
  defect_description: string | null;
  stock_quantity: number;
  minimum_stock_alert: number;
  is_b2b_available: boolean;
  is_b2c_available: boolean;
  b2b_price: number | null;
  b2b_minimum_quantity: number;
  images: any[];
  specifications: Record<string, unknown>;
  weight_grams: number | null;
  dimensions_cm: Record<string, unknown> | null;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
}

export interface OrderItem {
  product_id: number;
  sku: string;
  name: string;
  quantity: number;
  mrp: number;
  selling_price: number;
  variant?: string;
}

export interface Order {
  id: number;
  customer_id: number | null;
  order_type: 'b2b' | 'b2c';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_mrp: number;
  total_selling_price: number;
  total_savings: number;
  items: OrderItem[];
  shipping_address: Record<string, unknown>;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BulkUploadLog {
  id: number;
  uploaded_by: number | null;
  filename: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: Array<{ row: number; error: string }>;
  created_at: Date;
}

export interface JwtCustomerPayload {
  id: number;
  email: string;
  customer_type: 'b2c' | 'b2b';
  iat?: number;
  exp?: number;
}

export interface JwtAdminPayload {
  id: number;
  email: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  next_cursor?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta | Record<string, unknown>;
}

// Express Request augmentation
declare global {
  namespace Express {
    interface Request {
      customer?: JwtCustomerPayload;
      admin?: JwtAdminPayload;
    }
  }
}

export type AuthenticatedCustomerRequest = Request & { customer: JwtCustomerPayload };
export type AuthenticatedAdminRequest = Request & { admin: JwtAdminPayload };
