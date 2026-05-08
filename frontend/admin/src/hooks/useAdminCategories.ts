import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, Category, SpecTemplate } from '../types';

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category[]>>('/admin/categories');
      return res.data.data;
    },
  });
}

export function useAdminCategorySpecTemplates(categoryId: string | null) {
  return useQuery({
    queryKey: ['admin', 'categories', categoryId, 'specs'],
    enabled: !!categoryId,
    queryFn: async () => {
      const res = await api.get<ApiResponse<SpecTemplate[]>>(
        `/admin/categories/${categoryId}/spec-templates`
      );
      return res.data.data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const res = await api.post<ApiResponse<Category>>('/admin/categories', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      const res = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useSaveSpecTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      templates,
    }: {
      categoryId: string;
      templates: Partial<SpecTemplate>[];
    }) => {
      const res = await api.put<ApiResponse<SpecTemplate[]>>(
        `/admin/categories/${categoryId}/spec-templates`,
        { templates }
      );
      return res.data.data;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['admin', 'categories', vars.categoryId, 'specs'] }),
  });
}
