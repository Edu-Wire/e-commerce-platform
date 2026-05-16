import { Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { success, error } from '../utils/helpers';
import {
  ensureWallet,
  getHeldAmount,
  getWalletBalance,
  getLimitUsage,
  getLimits,
  recordTransaction,
} from '../services/walletService';

function demoGatewayRef(): string {
  return `DEMO_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function getWalletSummary(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    await ensureWallet(customerId);

    const balance = await getWalletBalance(customerId);
    const held = await getHeldAmount(customerId);
    const limits = getLimits();
    const usage = await getLimitUsage(customerId);

    const stats = await queryOne<{
      total_added: string;
      total_spent: string;
      winnings_received: string;
      pending_refunds: string;
      pending_refund_count: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) AS total_added,
         COALESCE(SUM(CASE WHEN type = 'payment' AND status = 'completed' THEN ABS(amount) ELSE 0 END), 0) AS total_spent,
         COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0) AS winnings_received,
         COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'pending' THEN amount ELSE 0 END), 0) AS pending_refunds,
         COUNT(CASE WHEN type = 'refund' AND status = 'pending' THEN 1 END)::int AS pending_refund_count
       FROM wallet_transactions
       WHERE customer_id = $1`,
      [customerId]
    );

    res.json(
      success({
        balance,
        held,
        available: Math.max(0, Math.round((balance - held) * 100) / 100),
        stats: {
          total_added: parseFloat(stats?.total_added || '0'),
          total_spent: parseFloat(stats?.total_spent || '0'),
          winnings_received: parseFloat(stats?.winnings_received || '0'),
          pending_refunds: parseFloat(stats?.pending_refunds || '0'),
          pending_refund_count: parseInt(stats?.pending_refund_count || '0', 10),
        },
        limits: { ...limits, ...usage },
      })
    );
  } catch (err) {
    console.error('getWalletSummary error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const tab = (req.query.tab as string) || 'all';
    const typeFilter = req.query.type as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
    const offset = parseInt(String(req.query.offset || '0'), 10);

    let typeClause = '';
    const params: unknown[] = [customerId];

    if (tab === 'holds') {
      typeClause = ` AND t.type = 'hold'`;
    } else if (tab === 'refunds') {
      typeClause = ` AND t.type = 'refund'`;
    } else if (tab === 'payouts') {
      typeClause = ` AND t.type IN ('withdrawal', 'payout')`;
    } else if (typeFilter && typeFilter !== 'all') {
      params.push(typeFilter);
      typeClause = ` AND t.type = $${params.length}`;
    }

    const rows = await query(
      `SELECT t.*, pm.label AS payment_method_label, pm.type AS payment_method_type, pm.last_four
       FROM wallet_transactions t
       LEFT JOIN wallet_payment_methods pm ON pm.id = t.payment_method_id
       WHERE t.customer_id = $1${typeClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countRes = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM wallet_transactions t WHERE t.customer_id = $1${typeClause}`,
      params
    );

    res.json(success(rows, { total: parseInt(countRes?.count || '0', 10), limit, offset }));
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function demoDeposit(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const { amount, payment_method_id } = req.body;

    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount < 1) {
      res.status(400).json(error('Minimum deposit is ₹1'));
      return;
    }
    if (depositAmount > 50000) {
      res.status(400).json(error('Maximum single deposit is ₹50,000'));
      return;
    }

    const limits = getLimits();
    const usage = await getLimitUsage(customerId);

    if (usage.daily_deposit_used + depositAmount > limits.daily_deposit_limit) {
      res.status(400).json(error(`Daily deposit limit of ₹${limits.daily_deposit_limit} exceeded`));
      return;
    }
    if (usage.monthly_deposit_used + depositAmount > limits.monthly_deposit_limit) {
      res.status(400).json(error(`Monthly deposit limit of ₹${limits.monthly_deposit_limit} exceeded`));
      return;
    }

    let methodLabel = 'Demo Payment Gateway';
    if (payment_method_id) {
      const pm = await queryOne<{ label: string; last_four: string }>(
        'SELECT label, last_four FROM wallet_payment_methods WHERE id = $1 AND customer_id = $2',
        [payment_method_id, customerId]
      );
      if (!pm) {
        res.status(400).json(error('Payment method not found'));
        return;
      }
      methodLabel = pm.last_four ? `${pm.label} **** ${pm.last_four}` : pm.label;
    }

    // Simulate demo gateway processing
    const gatewayRef = demoGatewayRef();
    await new Promise((r) => setTimeout(r, 800));

    const result = await recordTransaction(customerId, {
      type: 'deposit',
      amount: depositAmount,
      title: 'Funds Added',
      description: `Via ${methodLabel}`,
      status: 'completed',
      payment_method_id: payment_method_id || undefined,
      reference_id: gatewayRef,
    });

    res.json(
      success({
        message: 'Payment successful',
        gateway_ref: gatewayRef,
        balance_after: result.balance_after,
        transaction_id: result.transaction_id,
      })
    );
  } catch (err) {
    console.error('demoDeposit error:', err);
    res.status(500).json(error('Payment failed. Please try again.'));
  }
}

export async function withdrawFunds(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const { amount, payment_method_id } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount < 1) {
      res.status(400).json(error('Minimum withdrawal is ₹1'));
      return;
    }

    const limits = getLimits();
    const usage = await getLimitUsage(customerId);
    if (usage.daily_withdrawal_used + withdrawAmount > limits.daily_withdrawal_limit) {
      res.status(400).json(error(`Daily withdrawal limit of ₹${limits.daily_withdrawal_limit} exceeded`));
      return;
    }

    const balance = await getWalletBalance(customerId);
    const held = await getHeldAmount(customerId);
    const available = balance - held;

    if (withdrawAmount > available) {
      res.status(400).json(error(`Insufficient available balance. Available: ₹${available.toFixed(2)}`));
      return;
    }

    let methodLabel = 'Bank Account';
    if (payment_method_id) {
      const pm = await queryOne<{ label: string }>(
        'SELECT label FROM wallet_payment_methods WHERE id = $1 AND customer_id = $2',
        [payment_method_id, customerId]
      );
      if (!pm) {
        res.status(400).json(error('Payment method not found'));
        return;
      }
      methodLabel = pm.label;
    }

    const gatewayRef = demoGatewayRef();
    await new Promise((r) => setTimeout(r, 600));

    const result = await recordTransaction(customerId, {
      type: 'withdrawal',
      amount: -withdrawAmount,
      title: 'Withdrawal',
      description: `To ${methodLabel}`,
      status: 'completed',
      payment_method_id: payment_method_id || undefined,
      reference_id: gatewayRef,
    });

    res.json(
      success({
        message: 'Withdrawal initiated successfully',
        gateway_ref: gatewayRef,
        balance_after: result.balance_after,
      })
    );
  } catch (err: any) {
    if (err?.message === 'INSUFFICIENT_BALANCE') {
      res.status(400).json(error('Insufficient balance'));
      return;
    }
    console.error('withdrawFunds error:', err);
    res.status(500).json(error('Withdrawal failed'));
  }
}

export async function getPaymentMethods(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const methods = await query(
      `SELECT id, type, label, last_four, is_default, created_at
       FROM wallet_payment_methods
       WHERE customer_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [customerId]
    );
    res.json(success(methods));
  } catch (err) {
    console.error('getPaymentMethods error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function addPaymentMethod(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const { type, label, last_four, set_default } = req.body;

    if (!type || !['card', 'upi', 'bank'].includes(type)) {
      res.status(400).json(error('Invalid payment method type'));
      return;
    }

    const displayLabel =
      label ||
      (type === 'card' ? 'Visa' : type === 'upi' ? 'UPI' : 'Bank Account');

    if (set_default) {
      await query(
        'UPDATE wallet_payment_methods SET is_default = false WHERE customer_id = $1',
        [customerId]
      );
    }

    const countRes = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM wallet_payment_methods WHERE customer_id = $1',
      [customerId]
    );
    const isFirst = parseInt(countRes?.count || '0', 10) === 0;

    const row = await queryOne(
      `INSERT INTO wallet_payment_methods (customer_id, type, label, last_four, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, label, last_four, is_default, created_at`,
      [
        customerId,
        type,
        displayLabel,
        last_four || (type === 'card' ? '4242' : null),
        set_default ?? isFirst,
      ]
    );

    res.status(201).json(success(row));
  } catch (err) {
    console.error('addPaymentMethod error:', err);
    res.status(500).json(error('Failed to add payment method'));
  }
}

export async function deletePaymentMethod(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;

    await query(
      'DELETE FROM wallet_payment_methods WHERE id = $1 AND customer_id = $2',
      [id, customerId]
    );

    res.json(success({ message: 'Payment method removed' }));
  } catch (err) {
    console.error('deletePaymentMethod error:', err);
    res.status(500).json(error('Failed to remove payment method'));
  }
}

export async function exportTransactions(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const rows = await query(
      `SELECT created_at, title, description, type, amount, status, balance_after, reference_id
       FROM wallet_transactions
       WHERE customer_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
      [customerId]
    );

    const header = 'Date,Title,Description,Type,Amount,Status,Balance After,Reference\n';
    const csv = rows
      .map((r: any) => {
        const date = new Date(r.created_at).toISOString();
        const esc = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
        return [
          date,
          esc(r.title),
          esc(r.description),
          r.type,
          r.amount,
          r.status,
          r.balance_after,
          esc(r.reference_id),
        ].join(',');
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=wallet-transactions.csv');
    res.send(header + csv);
  } catch (err) {
    console.error('exportTransactions error:', err);
    res.status(500).json(error('Export failed'));
  }
}
