import { PoolClient } from 'pg';
import { query, queryOne, withTransaction } from '../config/database';

const DAILY_DEPOSIT_LIMIT = 5000;
const DAILY_WITHDRAWAL_LIMIT = 2000;
const MONTHLY_DEPOSIT_LIMIT = 20000;

export async function ensureWallet(customerId: number, client?: PoolClient): Promise<void> {
  const run = client
    ? (sql: string, params: unknown[]) => client.query(sql, params)
    : (sql: string, params: unknown[]) => query(sql, params);

  await run(
    `INSERT INTO customer_wallets (customer_id, balance)
     VALUES ($1, 0)
     ON CONFLICT (customer_id) DO NOTHING`,
    [customerId]
  );
}

export async function getHeldAmount(customerId: number): Promise<number> {
  const row = await queryOne<{ held: string }>(
    `SELECT COALESCE(SUM(sub.user_bid), 0)::numeric AS held
     FROM (
       SELECT MAX(b.bid_amount) AS user_bid
       FROM auction_bids b
       JOIN auctions a ON a.id = b.auction_id
       WHERE b.customer_id = $1
         AND a.status = 'active'
         AND a.start_time <= NOW()
         AND a.end_time > NOW()
         AND a.highest_bidder_id = $1
       GROUP BY b.auction_id
     ) sub`,
    [customerId]
  );
  return parseFloat(row?.held || '0');
}

export async function getWalletBalance(customerId: number): Promise<number> {
  await ensureWallet(customerId);
  const row = await queryOne<{ balance: string }>(
    'SELECT balance FROM customer_wallets WHERE customer_id = $1',
    [customerId]
  );
  return parseFloat(row?.balance || '0');
}

export function getLimits() {
  return {
    daily_deposit_limit: DAILY_DEPOSIT_LIMIT,
    daily_withdrawal_limit: DAILY_WITHDRAWAL_LIMIT,
    monthly_deposit_limit: MONTHLY_DEPOSIT_LIMIT,
  };
}

export async function getLimitUsage(customerId: number) {
  const dailyDeposit = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM wallet_transactions
     WHERE customer_id = $1
       AND type = 'deposit'
       AND status = 'completed'
       AND created_at >= CURRENT_DATE`,
    [customerId]
  );

  const dailyWithdrawal = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(ABS(amount)), 0) AS total
     FROM wallet_transactions
     WHERE customer_id = $1
       AND type = 'withdrawal'
       AND status = 'completed'
       AND created_at >= CURRENT_DATE`,
    [customerId]
  );

  const monthlyDeposit = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM wallet_transactions
     WHERE customer_id = $1
       AND type = 'deposit'
       AND status = 'completed'
       AND created_at >= date_trunc('month', CURRENT_DATE)`,
    [customerId]
  );

  return {
    daily_deposit_used: parseFloat(dailyDeposit?.total || '0'),
    daily_withdrawal_used: parseFloat(dailyWithdrawal?.total || '0'),
    monthly_deposit_used: parseFloat(monthlyDeposit?.total || '0'),
  };
}

export async function recordTransaction(
  customerId: number,
  opts: {
    type: string;
    amount: number;
    title: string;
    description?: string;
    status?: string;
    payment_method_id?: number;
    reference_id?: string;
  },
  client?: PoolClient
): Promise<{ balance_after: number; transaction_id: number }> {
  const runInTx = async (c: PoolClient) => {
    await ensureWallet(customerId, c);

    const walletRes = await c.query(
      'SELECT balance FROM customer_wallets WHERE customer_id = $1 FOR UPDATE',
      [customerId]
    );
    const currentBalance = parseFloat(walletRes.rows[0]?.balance || '0');
    const newBalance = Math.round((currentBalance + opts.amount) * 100) / 100;

    if (newBalance < 0) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    await c.query(
      'UPDATE customer_wallets SET balance = $1, updated_at = NOW() WHERE customer_id = $2',
      [newBalance, customerId]
    );

    const txRes = await c.query(
      `INSERT INTO wallet_transactions
         (customer_id, type, amount, title, description, status, balance_after, payment_method_id, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        customerId,
        opts.type,
        opts.amount,
        opts.title,
        opts.description || null,
        opts.status || 'completed',
        newBalance,
        opts.payment_method_id || null,
        opts.reference_id || null,
      ]
    );

    return { balance_after: newBalance, transaction_id: txRes.rows[0].id as number };
  };

  if (client) return runInTx(client);
  return withTransaction(runInTx);
}
