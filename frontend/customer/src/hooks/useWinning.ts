import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  onBidUpdate,
  retainAuctionSocket,
  releaseAuctionSocket,
} from '../lib/auctionSocket';
import { applyBidToAuctionList } from '../lib/applyBidUpdate';

export interface WinningAuction {
  id: number;
  product_id: number;
  product_name: string;
  product_images: string | string[];
  product_mrp?: string;
  product_description?: string;
  start_time: string;
  end_time: string;
  status: string;
  reserve_price: string;
  current_highest_bid: string | null;
  minimum_spread?: string | null;
  highest_bidder_id: number | null;
  total_bids?: number;
  user_highest_bid?: string;
  order_id?: number | null;
  order_status?: string | null;
  order_created_at?: string | null;
  order_total?: string | null;
}

export interface WinningStats {
  live_count: number;
  won_count: number;
  pending_payment: number;
  shipped: number;
  total_won_value: number;
  total_savings: number;
}

export interface WinningDashboard {
  live_winning: WinningAuction[];
  won: WinningAuction[];
  stats: WinningStats;
}

export function useWinning(enabled = true, customerId?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    retainAuctionSocket();
    const unsub = onBidUpdate((data) => {
      queryClient.setQueryData<WinningDashboard>(['auctions', 'winning'], (old) => {
        if (!old) return old;
        return {
          ...old,
          live_winning: applyBidToAuctionList(old.live_winning, data, customerId),
        };
      });
    });
    return () => {
      unsub();
      releaseAuctionSocket();
    };
  }, [enabled, customerId, queryClient]);

  return useQuery({
    queryKey: ['auctions', 'winning'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: WinningDashboard }>('/auctions/winning');
      return res.data.data;
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
