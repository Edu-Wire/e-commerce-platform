export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export function getPaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit)) || 20));
  return { page, limit, cursor: query.cursor ? String(query.cursor) : undefined };
}

export function getPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const total_pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
