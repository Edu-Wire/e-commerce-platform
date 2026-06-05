import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Order, ApiResponse, PaginatedResponse, ShippingAddress } from '../types';
import type { CartItem } from '../types';

interface CreateOrderPayload {
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    auction_id?: number | null;
  }>;
  shipping_address: ShippingAddress;
  payment_method: string;
  notes?: string;
}

const fetchMyOrders = async (): Promise<Order[]> => {
  const res = await api.get<PaginatedResponse<Order>>('/orders/my');
  return res.data.data;
};

const fetchOrder = async (id: string): Promise<Order> => {
  const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data.data;
};

const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const res = await api.post<ApiResponse<Order>>('/orders', payload);
  return res.data.data;
};

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
    staleTime: 60 * 1000
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    enabled: !!id
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    }
  });
};

export const buildOrderPayload = (
  cartItems: CartItem[],
  shippingAddress: ShippingAddress,
  paymentMethod: string,
  notes?: string
): CreateOrderPayload => ({
  items: cartItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.price,
    auction_id: item.auction_id
  })),
  shipping_address: shippingAddress,
  payment_method: paymentMethod,
  notes
});
