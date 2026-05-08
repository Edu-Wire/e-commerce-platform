export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSKU(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.toUpperCase()}-${result}`;
}

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...(meta ? { meta } : {}) };
}

export function error(message: string, code?: number) {
  return { success: false as const, error: message, ...(code ? { code } : {}) };
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100 * 100) / 100;
}
