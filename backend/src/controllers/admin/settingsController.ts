import { Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { success, error } from '../../utils/helpers';

export async function getAuctionDuration(req: Request, res: Response): Promise<void> {
  try {
    const setting = await queryOne<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'auction_duration_minutes'"
    );
    
    if (!setting) {
      res.json(success({ duration: 60 }));
      return;
    }
    
    res.json(success({ duration: parseInt(setting.value, 10) }));
  } catch (err) {
    console.error('getAuctionDuration error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function updateAuctionDuration(req: Request, res: Response): Promise<void> {
  try {
    const { duration } = req.body;

    if (duration === undefined || typeof duration !== 'number' || duration <= 0) {
      res.status(400).json(error('Duration must be a positive number of minutes'));
      return;
    }

    await query(
      `INSERT INTO system_settings (key, value) 
       VALUES ('auction_duration_minutes', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [duration.toString()]
    );

    res.json(success({ message: 'Auction duration updated successfully', duration }));
  } catch (err) {
    console.error('updateAuctionDuration error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
