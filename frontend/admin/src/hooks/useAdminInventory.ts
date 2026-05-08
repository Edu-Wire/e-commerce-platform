import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, InventoryItem, PaginationMeta } from '../types';

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  low_stock?: boolean;
}

interface InventoryListResponse {
  items: InventoryItem[];
  meta: PaginationMeta;
}

export function useAdminInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'inventory', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const res = await api.get<ApiResponse<InventoryListResponse>>(`/admin/inventory?${params}`);
      return res.data;
    },
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, stock_quantity }: { productId: string; stock_quantity: number }) => {
      const res = await api.patch<ApiResponse<InventoryItem>>(
        `/admin/inventory/${productId}/stock`,
        { stock_quantity }
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
  });
}
