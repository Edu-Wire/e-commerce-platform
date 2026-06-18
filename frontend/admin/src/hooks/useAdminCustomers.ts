import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { Customer, ApiResponse } from '../types';

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin_customers'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Customer[]>>('/admin/customers');
      return data.data;
    },
  });
}
