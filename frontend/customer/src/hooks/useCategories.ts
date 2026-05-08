import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Category, ApiResponse } from '../types';

const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get<ApiResponse<Category[]>>('/categories');
  return res.data.data;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000
  });
};
