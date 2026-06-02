import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../config/database';
import { success, error } from '../utils/helpers';
import { recordTransaction } from '../services/walletService';
import { PoolClient } from 'pg';

/** Ensure a customer has a loyalty balance record. Give them 100 welcome coins! */
async function ensureLoyaltyBalance(customerId: number, client?: PoolClient): Promise<any> {
  const run = client
    ? (sql: string, params: unknown[]) => client.query(sql, params)
    : (sql: string, params: unknown[]) => query(sql, params);

  const row = await queryOne<any>(
    'SELECT * FROM loyalty_balances WHERE customer_id = $1',
    [customerId]
  );

  if (!row) {
    // Insert with 100 welcome coins!
    const newRow = await queryOne<any>(
      `INSERT INTO loyalty_balances (customer_id, points_balance, streak_count, last_check_in)
       VALUES ($1, 100, 0, NULL)
       RETURNING *`,
      [customerId]
    );

    // Record welcome bonus transaction
    await run(
      `INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
       VALUES ($1, 100, 'welcome_bonus', 'Welcome Reward Coins!')`,
      [customerId]
    );

    return newRow;
  }
  return row;
}

export async function getLoyaltyStatus(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const balanceInfo = await ensureLoyaltyBalance(customerId);

    // Check if user checked in today
    let checkedInToday = false;
    if (balanceInfo.last_check_in) {
      const lastCheckDate = new Date(balanceInfo.last_check_in).toDateString();
      const todayDate = new Date().toDateString();
      checkedInToday = lastCheckDate === todayDate;
    }

    // Get transaction history
    const history = await query(
      `SELECT * FROM loyalty_transactions 
       WHERE customer_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [customerId]
    );

    res.json(
      success({
        points_balance: balanceInfo.points_balance,
        streak_count: balanceInfo.streak_count,
        last_check_in: balanceInfo.last_check_in,
        checked_in_today: checkedInToday,
        history,
      })
    );
  } catch (err) {
    console.error('getLoyaltyStatus error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function dailyCheckIn(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    
    const result = await withTransaction(async (client: PoolClient) => {
      const balanceInfo = await ensureLoyaltyBalance(customerId, client);

      const now = new Date();
      const todayStr = now.toDateString();

      if (balanceInfo.last_check_in) {
        const lastCheckDate = new Date(balanceInfo.last_check_in);
        if (lastCheckDate.toDateString() === todayStr) {
          throw new Error('ALREADY_CHECKED_IN');
        }

        // Calculate if it's consecutive (yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastCheckDate.toDateString() === yesterdayStr) {
          balanceInfo.streak_count = (balanceInfo.streak_count % 7) + 1;
        } else {
          balanceInfo.streak_count = 1;
        }
      } else {
        balanceInfo.streak_count = 1;
      }

      // Point values per day in streak
      const pointsByDay = [10, 20, 30, 40, 50, 75, 100];
      const earnedPoints = pointsByDay[balanceInfo.streak_count - 1] || 10;

      const newBalance = balanceInfo.points_balance + earnedPoints;

      // Update loyalty balance
      await client.query(
        `UPDATE loyalty_balances 
         SET points_balance = $1, streak_count = $2, last_check_in = $3, updated_at = NOW()
         WHERE customer_id = $4`,
        [newBalance, balanceInfo.streak_count, now, customerId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
         VALUES ($1, $2, 'daily_check_in', $3)`,
        [customerId, earnedPoints, `Checked in for Day ${balanceInfo.streak_count} of streak`]
      );

      return {
        earnedPoints,
        streak_count: balanceInfo.streak_count,
        points_balance: newBalance,
      };
    });

    res.json(success(result));
  } catch (err: any) {
    if (err.message === 'ALREADY_CHECKED_IN') {
      res.status(400).json(error('You have already checked in today! Come back tomorrow.'));
      return;
    }
    console.error('dailyCheckIn error:', err);
    res.status(500).json(error('Failed to complete check-in'));
  }
}

export async function spinWheel(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const SPIN_COST = 20;

    const result = await withTransaction(async (client: PoolClient) => {
      const balanceInfo = await ensureLoyaltyBalance(customerId, client);

      if (balanceInfo.points_balance < SPIN_COST) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      const balanceAfterSpend = balanceInfo.points_balance - SPIN_COST;

      // Deduct points
      await client.query(
        `UPDATE loyalty_balances 
         SET points_balance = $1, updated_at = NOW()
         WHERE customer_id = $2`,
        [balanceAfterSpend, customerId]
      );

      // Log spend transaction
      await client.query(
        `INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
         VALUES ($1, $2, 'spin_wheel_spend', 'Spent to spin the wheel')`,
        [customerId, -SPIN_COST]
      );

      // Weighted Wheel Rewards selection
      const rewards = [
        { type: 'coins', value: 5, label: '5 Coins', weight: 30 },
        { type: 'coins', value: 15, label: '15 Coins', weight: 25 },
        { type: 'coins', value: 50, label: '50 Coins', weight: 15 },
        { type: 'coins', value: 100, label: '100 Coins', weight: 5 },
        { type: 'cashback', value: 5, label: '₹5 Wallet Cashback', weight: 10 },
        { type: 'cashback', value: 10, label: '₹10 Wallet Cashback', weight: 5 },
        { type: 'cashback', value: 20, label: '₹20 Wallet Cashback', weight: 3 },
        { type: 'coupon', value: 'SPINSHIPFREE', label: 'Free Shipping Coupon', weight: 7 },
      ];

      const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
      let randomVal = Math.random() * totalWeight;
      
      let selectedReward = rewards[0];
      for (const r of rewards) {
        if (randomVal < r.weight) {
          selectedReward = r;
          break;
        }
        randomVal -= r.weight;
      }

      let finalBalance = balanceAfterSpend;
      let rewardDescription = '';

      if (selectedReward.type === 'coins') {
        const coinVal = selectedReward.value as number;
        finalBalance += coinVal;
        await client.query(
          `UPDATE loyalty_balances 
           SET points_balance = $1, updated_at = NOW()
           WHERE customer_id = $2`,
          [finalBalance, customerId]
        );
        await client.query(
          `INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
           VALUES ($1, $2, 'spin_wheel_win', $3)`,
          [customerId, coinVal, `Won ${coinVal} coins from Spin Wheel!`]
        );
        rewardDescription = `Won ${coinVal} Coins!`;
      } else if (selectedReward.type === 'cashback') {
        const cashVal = selectedReward.value as number;
        // Call wallet service transaction
        await recordTransaction(
          customerId,
          {
            type: 'deposit',
            amount: cashVal,
            title: 'Spin Wheel Reward',
            description: `Won ₹${cashVal} cashback on Loyalty Spin the Wheel!`,
            status: 'completed',
          },
          client
        );
        await client.query(
          `INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
           VALUES ($1, 0, 'spin_wheel_win', $2)`,
          [customerId, `Won ₹${cashVal} Wallet Cashback!`]
        );
        rewardDescription = `Won ₹${cashVal} Cashback in your Wallet!`;
      } else if (selectedReward.type === 'coupon') {
        await client.query(
          `INSERT INTO loyalty_transactions (customer_id, points, transaction_type, description)
           VALUES ($1, 0, 'spin_wheel_win', $2)`,
          [customerId, `Won Free Shipping Coupon: ${selectedReward.value}`]
        );
        rewardDescription = `Won Free Shipping Coupon Code: ${selectedReward.value}`;
      }

      return {
        reward: selectedReward,
        points_balance: finalBalance,
        rewardDescription,
      };
    });

    res.json(success(result));
  } catch (err: any) {
    if (err.message === 'INSUFFICIENT_POINTS') {
      res.status(400).json(error('Insufficient coins. You need 20 coins to spin the wheel!'));
      return;
    }
    console.error('spinWheel error:', err);
    res.status(500).json(error('Failed to spin the wheel'));
  }
}
