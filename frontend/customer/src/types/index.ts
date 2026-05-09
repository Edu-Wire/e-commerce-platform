export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number | null;
  children?: Category[];
}

export type ProductCondition = 'new' | 'new_with_minor_damage' | 'new_with_defect';

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  sku: string;
  condition: ProductCondition;
  condition_description?: string;
  mrp: number;
  selling_price: number;
  discount_percentage: number;
  b2b_price?: number;
  b2b_min_quantity?: number;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  category_id: number;
  category?: Category;
  images: ProductImage[];
  specifications?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  customer_type: 'b2c' | 'b2b';
  company_name?: string;
  gst_number?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  sku: string;
  condition: ProductCondition;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ShippingAddress {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: Customer;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  subtotal_mrp: number;
  subtotal_price: number;
  discount_amount: number;
  shipping_charge: number;
  total_amount: number;
  shipping_address: ShippingAddress;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  slug: string;
  image?: string;
  mrp: number;
  price: number;
  quantity: number;
  condition: ProductCondition;
  sku: string;
  stock_quantity: number;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  notes?: string;
  payment_method: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  condition?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  page?: number;
  limit?: number;
  is_featured?: boolean;
}
