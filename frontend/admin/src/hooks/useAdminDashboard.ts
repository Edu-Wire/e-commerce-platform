import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, DashboardStats } from '../types';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
