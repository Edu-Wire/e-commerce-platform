import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  onBidUpdate,
  retainAuctionSocket,
  releaseAuctionSocket,
} from '../lib/auctionSocket';
import { applyBidToAuctionList } from '../lib/applyBidUpdate';

export interface MyBidAuction {
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
  minimum_spread: string | null;
  highest_bidder_id: number | null;
  total_bids: number;
  user_highest_bid: string;
}

export function useMyBids(enabled = true, customerId?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    retainAuctionSocket();
    const unsub = onBidUpdate((data) => {
      queryClient.setQueryData<MyBidAuction[]>(['auctions', 'my-bids'], (old) => {
        if (!old?.length) return old;
        return applyBidToAuctionList(old, data, customerId);
      });
    });
    return () => {
      unsub();
      releaseAuctionSocket();
    };
  }, [enabled, customerId, queryClient]);

  return useQuery({
    queryKey: ['auctions', 'my-bids'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MyBidAuction[] }>('/auctions/my-bids');
      return res.data.data;
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
