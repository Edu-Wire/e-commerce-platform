import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AdminRole, AdminUser, ApiResponse } from '../types';

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
      return res.data.data;
    },
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      role: AdminRole;
    }) => {
      const res = await api.post<ApiResponse<AdminUser>>('/admin/users', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { role?: AdminRole; is_active?: boolean } }) => {
      const res = await api.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
