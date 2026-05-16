export interface RawOrderItem {
  product_id?: number;
  sku?: string;
  name?: string;
  quantity?: number;
  mrp?: number;
  selling_price?: number;
}

export function parseOrderItems(items: unknown): RawOrderItem[] {
  if (!items) return [];
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;
  return Array.isArray(parsed) ? parsed : [];
}

export function firstProductImage(images: unknown): string | null {
  if (!images) return null;
  const parsed = typeof images === 'string' ? JSON.parse(images) : images;
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0];
    return typeof first === 'string' ? first : null;
  }
  if (typeof parsed === 'string') return parsed;
  return null;
}

export function mapOrderForCustomer(order: Record<string, unknown>) {
  const items = parseOrderItems(order.items).map((item, idx) => ({
    id: item.product_id ?? idx,
    product_id: item.product_id,
    product_name: item.name || 'Product',
    product_slug: '',
    product_image: null as string | null,
    quantity: item.quantity ?? 1,
    unit_price: item.selling_price ?? 0,
    mrp: item.mrp ?? 0,
  }));

  return {
    ...order,
    order_number: String(order.id),
    total_amount: parseFloat(String(order.total_selling_price ?? 0)),
    subtotal_mrp: parseFloat(String(order.total_mrp ?? 0)),
    subtotal_price: parseFloat(String(order.total_selling_price ?? 0)),
    discount_amount: parseFloat(String(order.total_savings ?? 0)),
    shipping_charge: 0,
    payment_status: order.status === 'pending' ? 'pending' : 'paid',
    items,
    shipping_address: order.shipping_address || {},
  };
}
