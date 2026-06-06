import { Request, Response } from 'express';
import { query } from '../config/database';
import { success, error } from '../utils/helpers';

export interface NotificationRow {
  id: number;
  customer_id: number;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: Date;
}

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    const notifications = await query<NotificationRow>(
      `SELECT * FROM notifications 
       WHERE customer_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [customerId]
    );

    res.json(success(notifications));
  } catch (err) {
    console.error('getMyNotifications error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    const { id } = req.params;

    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND customer_id = $2`,
      [id, customerId]
    );

    res.json(success({ message: 'Notification marked as read' }));
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE customer_id = $1`,
      [customerId]
    );

    res.json(success({ message: 'All notifications marked as read' }));
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
