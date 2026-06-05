import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, Product, PaginationMeta } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  condition?: string;
  stock_status?: string;
  availability?: string;
  is_active?: string;
}

interface ProductListResponse {
  products: Product[];
  meta: PaginationMeta;
}

export function useAdminProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const res = await api.get<ApiResponse<ProductListResponse>>(`/admin/products?${params}`);
      return res.data;
    },
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'products', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Product>>(`/admin/products/${id}`);
      return res.data.data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const res = await api.post<ApiResponse<Product>>('/admin/products', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products', vars.id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.delete('/admin/products/bulk', { data: { ids } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useToggleProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await api.patch<ApiResponse<Product>>(`/admin/products/${id}/status`, {
        is_active,
      });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}
