import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Product, PaginatedResponse, ApiResponse, ProductFilters } from '../types';

const fetchProducts = async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const res = await api.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
  return res.data;
};

const fetchProduct = async (slug: string): Promise<Product> => {
  const res = await api.get<ApiResponse<Product>>(`/products/${slug}`);
  return res.data.data;
};

export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 2 * 60 * 1000
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000
  });
};
