import { Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { success, error } from '../../utils/helpers';

export async function getAuctionProducts(req: Request, res: Response): Promise<void> {
  try {
    const products = await query(
      `SELECT id, name, sku, stock_quantity, is_auction_ready, auction_priority 
       FROM products 
       ORDER BY is_auction_ready DESC, auction_priority ASC, id DESC`
    );
    res.json(success(products));
  } catch (err) {
    console.error('getAuctionProducts error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function updateProductAuctionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_auction_ready, auction_priority } = req.body;

    const existing = await queryOne('SELECT id FROM products WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Product not found'));
      return;
    }

    await query(
      `UPDATE products SET 
         is_auction_ready = $1, 
         auction_priority = $2 
       WHERE id = $3`,
      [
        is_auction_ready !== undefined ? is_auction_ready : false,
        auction_priority !== undefined ? parseInt(auction_priority, 10) : 0,
        id
      ]
    );

    res.json(success({ message: 'Product auction status updated successfully' }));
  } catch (err) {
    console.error('updateProductAuctionStatus error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getRunningAuctions(req: Request, res: Response): Promise<void> {
  try {
    const auctions = await query(
      `SELECT a.*, p.name as product_name, p.sku as product_sku
       FROM auctions a 
       JOIN products p ON a.product_id = p.id 
       WHERE a.status = 'active'
       ORDER BY a.end_time ASC`
    );
    res.json(success(auctions));
  } catch (err) {
    console.error('getRunningAuctions error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function deleteAuction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const existing = await queryOne('SELECT id FROM auctions WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Auction not found'));
      return;
    }
    
    await query('DELETE FROM auctions WHERE id = $1', [id]);
    
    res.json(success({ message: 'Auction deleted successfully' }));
  } catch (err) {
    console.error('deleteAuction error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getClosedAuctions(req: Request, res: Response): Promise<void> {
  try {
    const auctions = await query(
      `SELECT a.*, p.name as product_name, p.sku as product_sku,
              c.name as winner_name, c.email as winner_email,
              (SELECT COUNT(*)::integer FROM auction_bids WHERE auction_id = a.id) as total_bids
       FROM auctions a 
       JOIN products p ON a.product_id = p.id 
       LEFT JOIN customers c ON a.highest_bidder_id = c.id
       WHERE a.status = 'completed'
       ORDER BY a.end_time DESC`
    );
    res.json(success(auctions));
  } catch (err) {
    console.error('getClosedAuctions error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getAuctionBidders(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const bids = await query(
      `SELECT b.id, b.bid_amount, b.created_at,
              c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM auction_bids b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.auction_id = $1
       ORDER BY b.bid_amount DESC, b.created_at ASC`,
      [id]
    );
    res.json(success(bids));
  } catch (err) {
    console.error('getAuctionBidders error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
