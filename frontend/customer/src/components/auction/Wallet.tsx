import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import {
  useWalletSummary,
  useWalletTransactions,
  usePaymentMethods,
  useWalletMutations,
  type WalletTransaction,
  type PaymentMethod,
  type WalletSummary,
} from '../../hooks/useWallet';
import { api } from '../../lib/api';

const INR = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  deposit: { label: 'Deposit', className: 'bg-green-50 text-green-600' },
  withdrawal: { label: 'Withdrawal', className: 'bg-slate-100 text-slate-600' },
  payment: { label: 'Payment', className: 'bg-red-50 text-red-600' },
  refund: { label: 'Refund', className: 'bg-blue-50 text-blue-600' },
  hold: { label: 'Hold', className: 'bg-orange-50 text-orange-600' },
  payout: { label: 'Payout', className: 'bg-purple-50 text-purple-600' },
};

type ModalType = 'deposit' | 'withdraw' | 'payment-methods' | 'limits' | null;
type TxTab = 'all' | 'holds' | 'refunds' | 'payouts';
type GatewayStep = 'form' | 'processing' | 'success';

export default function Wallet() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [modal, setModal] = useState<ModalType>(null);
  const [txTab, setTxTab] = useState<TxTab>('all');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<number | undefined>();
  const [gatewayStep, setGatewayStep] = useState<GatewayStep>('form');
  const [lastGatewayRef, setLastGatewayRef] = useState('');

  const enabled = !!token;
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useWalletSummary(enabled);
  const { data: txData, isLoading: txLoading } = useWalletTransactions(txTab, enabled);
  const { data: paymentMethods = [] } = usePaymentMethods(enabled);
  const { deposit, withdraw, addPaymentMethod, removePaymentMethod } = useWalletMutations();

  const transactions = txData?.transactions ?? [];
  const limits = summary?.limits;

  const dailyDepositPct = limits
    ? Math.min(100, (limits.daily_deposit_used / limits.daily_deposit_limit) * 100)
    : 0;
  const dailyWithdrawPct = limits
    ? Math.min(100, (limits.daily_withdrawal_used / limits.daily_withdrawal_limit) * 100)
    : 0;
  const monthlyDepositPct = limits
    ? Math.min(100, (limits.monthly_deposit_used / limits.monthly_deposit_limit) * 100)
    : 0;

  const defaultMethod = useMemo(
    () => paymentMethods.find((m) => m.is_default) || paymentMethods[0],
    [paymentMethods]
  );

  const openDeposit = () => {
    setDepositAmount('');
    setSelectedMethodId(defaultMethod?.id);
    setGatewayStep('form');
    setModal('deposit');
  };

  const openWithdraw = () => {
    setWithdrawAmount('');
    setSelectedMethodId(defaultMethod?.id);
    setGatewayStep('form');
    setModal('withdraw');
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/wallet/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wallet-transactions.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Transactions exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const processDemoDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount (min ₹1)');
      return;
    }
    setGatewayStep('processing');
    try {
      const result = await deposit.mutateAsync({ amount, payment_method_id: selectedMethodId });
      setLastGatewayRef(result.gateway_ref || '');
      setGatewayStep('success');
      toast.success('Funds added successfully!');
      refetchSummary();
    } catch (err: unknown) {
      setGatewayStep('form');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Payment failed');
    }
  };

  const processWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount (min ₹1)');
      return;
    }
    setGatewayStep('processing');
    try {
      const result = await withdraw.mutateAsync({ amount, payment_method_id: selectedMethodId });
      setLastGatewayRef(result.gateway_ref || '');
      setGatewayStep('success');
      toast.success('Withdrawal successful!');
      refetchSummary();
    } catch (err: unknown) {
      setGatewayStep('form');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Withdrawal failed');
    }
  };

  const handleAddDemoCard = async () => {
    try {
      await addPaymentMethod.mutateAsync({
        type: 'card',
        label: 'Visa',
        last_four: String(Math.floor(1000 + Math.random() * 9000)),
        set_default: paymentMethods.length === 0,
      });
      toast.success('Demo card added');
    } catch {
      toast.error('Failed to add card');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen font-sans">
        <SignInPrompt navigate={navigate} />
      </div>
    );
  }

  if (summaryLoading) {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-2">
          <Link to="/live-auction" className="hover:text-blue-600">Home</Link>
          <span className="mx-1">&gt;</span>
          <span className="text-slate-700">Wallet</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your balance, transactions, and payment methods.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <BalanceSection
            summary={summary}
            balanceVisible={balanceVisible}
            onToggleVisibility={() => setBalanceVisible((v) => !v)}
            onAddFunds={openDeposit}
          />

          <TransactionsSection
            txTab={txTab}
            setTxTab={setTxTab}
            txLoading={txLoading}
            transactions={transactions}
            total={txData?.total ?? 0}
            onExport={handleExport}
            onAddFunds={openDeposit}
          />
        </div>

        <Sidebar
          onDeposit={openDeposit}
          onWithdraw={openWithdraw}
          onPaymentMethods={() => setModal('payment-methods')}
          onShowLimits={() => setModal('limits')}
          limits={limits}
          dailyDepositPct={dailyDepositPct}
          dailyWithdrawPct={dailyWithdrawPct}
          monthlyDepositPct={monthlyDepositPct}
        />
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          {modal === 'deposit' && (
            <DemoGatewayModal
              title="Add Funds — Demo Gateway"
              step={gatewayStep}
              amount={depositAmount}
              setAmount={setDepositAmount}
              paymentMethods={paymentMethods}
              selectedMethodId={selectedMethodId}
              setSelectedMethodId={setSelectedMethodId}
              onAddCard={handleAddDemoCard}
              onPay={processDemoDeposit}
              onClose={() => setModal(null)}
              gatewayRef={lastGatewayRef}
              presets={[500, 1000, 2500, 5000]}
              processing={deposit.isPending}
            />
          )}
          {modal === 'withdraw' && (
            <DemoGatewayModal
              title="Withdraw Funds"
              step={gatewayStep}
              amount={withdrawAmount}
              setAmount={setWithdrawAmount}
              paymentMethods={paymentMethods}
              selectedMethodId={selectedMethodId}
              setSelectedMethodId={setSelectedMethodId}
              onAddCard={handleAddDemoCard}
              onPay={processWithdraw}
              onClose={() => setModal(null)}
              gatewayRef={lastGatewayRef}
              presets={[]}
              processing={withdraw.isPending}
              isWithdraw
              maxAmount={summary?.available}
            />
          )}
          {modal === 'payment-methods' && (
            <PaymentMethodsModal
              methods={paymentMethods}
              onAdd={handleAddDemoCard}
              onRemove={(id) => removePaymentMethod.mutate(id)}
              onClose={() => setModal(null)}
              adding={addPaymentMethod.isPending}
            />
          )}
          {modal === 'limits' && limits && <LimitsModal limits={limits} onClose={() => setModal(null)} />}
        </ModalOverlay>
      )}
    </div>
  );
}

function SignInPrompt({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm max-w-md mx-auto mt-12">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💼</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to access your wallet</h2>
      <p className="text-sm text-slate-500 mb-6">Add funds, track transactions, and manage payment methods.</p>
      <button
        type="button"
        onClick={() => navigate('/login', { state: { from: '/live-auction/wallet' } })}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm"
      >
        Sign In
      </button>
    </div>
  );
}

function BalanceSection({
  summary,
  balanceVisible,
  onToggleVisibility,
  onAddFunds,
}: {
  summary?: WalletSummary;
  balanceVisible: boolean;
  onToggleVisibility: () => void;
  onAddFunds: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1 bg-[#1E293B] rounded-2xl p-6 text-white shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-300 font-medium">Total Wallet Balance</p>
            <button type="button" onClick={onToggleVisibility} className="text-slate-400 hover:text-white" aria-label="Toggle balance">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={onAddFunds}
            className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
          >
            + Add Funds
          </button>
        </div>
        <h2 className="text-3xl font-bold mb-8">{balanceVisible ? INR(summary?.balance ?? 0) : '••••••'}</h2>
        <div className="flex justify-between text-xs border-t border-slate-700 pt-4">
          <div>
            <p className="text-slate-400 mb-1 text-[10px]">Available to Bid</p>
            <p className="font-bold">{balanceVisible ? INR(summary?.available ?? 0) : '••••'}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 mb-1 text-[10px]">In Hold</p>
            <p className="font-bold text-orange-400">{balanceVisible ? INR(summary?.held ?? 0) : '••••'}</p>
          </div>
        </div>
      </div>
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <StatMini label="Total Added" value={INR(summary?.stats.total_added ?? 0)} sub="All time" color="green" />
        <StatMini label="Total Spent" value={`-${INR(summary?.stats.total_spent ?? 0)}`} sub="All time" color="red" />
        <StatMini label="Refunds Received" value={INR(summary?.stats.winnings_received ?? 0)} sub="All time" color="green" />
        <StatMini
          label="Pending Refunds"
          value={INR(summary?.stats.pending_refunds ?? 0)}
          sub={`${summary?.stats.pending_refund_count ?? 0} Refund(s)`}
          color="orange"
        />
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: 'green' | 'red' | 'orange';
}) {
  const bg = { green: 'bg-green-50 text-green-500', red: 'bg-red-50 text-red-500', orange: 'bg-orange-50 text-orange-500' }[color];
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
          <span className="text-sm font-bold">{color === 'green' ? '↑' : color === 'red' ? '↓' : '⏳'}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-medium">{label}</p>
          <p className="font-bold text-slate-900 text-[15px]">{value}</p>
          <p className="text-[9px] text-slate-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function TransactionsSection({
  txTab,
  setTxTab,
  txLoading,
  transactions,
  total,
  onExport,
  onAddFunds,
}: {
  txTab: TxTab;
  setTxTab: (t: TxTab) => void;
  txLoading: boolean;
  transactions: WalletTransaction[];
  total: number;
  onExport: () => void;
  onAddFunds: () => void;
}) {
  const tabs: { key: TxTab; label: string }[] = [
    { key: 'all', label: 'Transaction History' },
    { key: 'holds', label: 'Bid Holds' },
    { key: 'refunds', label: 'Refunds' },
    { key: 'payouts', label: 'Payouts' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex border-b border-slate-100 px-6 pt-4 gap-8 overflow-x-auto">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTxTab(key)}
            className={`pb-3 text-sm whitespace-nowrap border-b-2 ${
              txTab === key ? 'border-orange-500 text-slate-900 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs text-slate-500">{total} transaction{total === 1 ? '' : 's'}</p>
          <button type="button" onClick={onExport} className="border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50">
            Export CSV
          </button>
        </div>
        {txLoading ? (
          <p className="text-center text-slate-400 py-12 text-sm">Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm mb-3">No transactions yet</p>
            <button type="button" onClick={onAddFunds} className="text-orange-500 font-bold text-sm hover:underline">
              Add your first funds
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="pb-3 text-left font-semibold">Date</th>
                  <th className="pb-3 text-left font-semibold">Description</th>
                  <th className="pb-3 text-left font-semibold">Type</th>
                  <th className="pb-3 text-left font-semibold">Amount</th>
                  <th className="pb-3 text-left font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: WalletTransaction }) {
  const amt = parseFloat(tx.amount);
  const isCredit = amt > 0;
  const typeInfo = TYPE_LABELS[tx.type] || { label: tx.type, className: 'bg-slate-100 text-slate-600' };
  const statusStyle = STATUS_STYLES[tx.status] || STATUS_STYLES.completed;
  const d = new Date(tx.created_at);

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="py-4">
        <p className="font-semibold text-slate-800">{d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <p className="text-[10px] text-slate-500">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
      </td>
      <td className="py-4 pr-4">
        <p className="font-bold text-slate-900">{tx.title}</p>
        {tx.description && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{tx.description}</p>}
      </td>
      <td className="py-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeInfo.className}`}>{typeInfo.label}</span>
      </td>
      <td className={`py-4 font-bold ${isCredit ? 'text-green-600' : 'text-slate-900'}`}>
        {isCredit ? '+' : ''}
        {INR(Math.abs(amt))}
      </td>
      <td className="py-4">
        <span className={`font-semibold text-[11px] flex items-center gap-1 capitalize ${statusStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {tx.status.replace('_', ' ')}
        </span>
      </td>
      <td className="py-4 text-right font-bold text-slate-700">{INR(parseFloat(tx.balance_after))}</td>
    </tr>
  );
}

const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  completed: { text: 'text-green-600', dot: 'bg-green-500' },
  pending: { text: 'text-yellow-600', dot: 'bg-yellow-500' },
  on_hold: { text: 'text-orange-500', dot: 'bg-orange-500' },
  failed: { text: 'text-red-600', dot: 'bg-red-500' },
};

function Sidebar({
  onDeposit,
  onWithdraw,
  onPaymentMethods,
  onShowLimits,
  limits,
  dailyDepositPct,
  dailyWithdrawPct,
  monthlyDepositPct,
}: {
  onDeposit: () => void;
  onWithdraw: () => void;
  onPaymentMethods: () => void;
  onShowLimits: () => void;
  limits?: WalletSummary['limits'];
  dailyDepositPct: number;
  dailyWithdrawPct: number;
  monthlyDepositPct: number;
}) {
  return (
    <div className="xl:col-span-4 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 text-sm">Quick Actions</h3>
        <div className="space-y-2">
          <QuickAction title="Add Funds" sub="Demo payment gateway" onClick={onDeposit} />
          <QuickAction title="Withdraw Funds" sub="Withdraw to bank" onClick={onWithdraw} />
          <QuickAction title="Payment Methods" sub="Cards & UPI" onClick={onPaymentMethods} />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-5 text-sm">Wallet Limits</h3>
        <LimitBar label="Daily Deposit" used={limits?.daily_deposit_used ?? 0} max={limits?.daily_deposit_limit ?? 5000} pct={dailyDepositPct} />
        <LimitBar label="Daily Withdrawal" used={limits?.daily_withdrawal_used ?? 0} max={limits?.daily_withdrawal_limit ?? 2000} pct={dailyWithdrawPct} />
        <LimitBar label="Monthly Deposit" used={limits?.monthly_deposit_used ?? 0} max={limits?.monthly_deposit_limit ?? 20000} pct={monthlyDepositPct} />
        <button type="button" onClick={onShowLimits} className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-[11px] font-bold hover:bg-slate-50">
          View All Limits
        </button>
      </div>
      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 text-[11px] text-amber-800">
        <strong>Demo mode:</strong> No real payments. All transactions use a simulated gateway (ref: DEMO_*).
      </div>
    </div>
  );
}

function QuickAction({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left border border-transparent hover:border-slate-100">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg">💳</div>
      <div>
        <p className="font-bold text-slate-800 text-[13px]">{title}</p>
        <p className="text-[10px] text-slate-500">{sub}</p>
      </div>
    </button>
  );
}

function LimitBar({ label, used, max, pct }: { label: string; used: number; max: number; pct: number }) {
  return (
    <div className="mb-4 text-[11px]">
      <div className="flex justify-between mb-1.5">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold">
          {INR(used)} <span className="text-slate-400 font-normal">/ {INR(max)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function DemoGatewayModal({
  title,
  step,
  amount,
  setAmount,
  paymentMethods,
  selectedMethodId,
  setSelectedMethodId,
  onAddCard,
  onPay,
  onClose,
  gatewayRef,
  presets,
  processing,
  isWithdraw,
  maxAmount,
}: {
  title: string;
  step: GatewayStep;
  amount: string;
  setAmount: (v: string) => void;
  paymentMethods: PaymentMethod[];
  selectedMethodId?: number;
  setSelectedMethodId: (id?: number) => void;
  onAddCard: () => void;
  onPay: () => void;
  onClose: () => void;
  gatewayRef: string;
  presets: number[];
  processing: boolean;
  isWithdraw?: boolean;
  maxAmount?: number;
}) {
  if (step === 'processing') {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4" />
        <p className="font-bold text-slate-900">Processing payment...</p>
        <p className="text-xs text-slate-500 mt-2">Demo Gateway • Please wait</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h3 className="font-bold text-lg text-slate-900 mb-2">Success!</h3>
        <p className="text-sm text-slate-500 mb-2">Transaction completed via demo gateway.</p>
        {gatewayRef && <p className="text-[10px] font-mono text-slate-400 mb-6">{gatewayRef}</p>}
        <button type="button" onClick={onClose} className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-3 mb-4 flex items-center gap-2">
        <span className="text-lg">🔒</span>
        <div>
          <p className="text-[10px] text-slate-400">Secured by</p>
          <p className="text-sm font-bold">DemoPay Gateway</p>
        </div>
        <span className="ml-auto text-[9px] bg-orange-500 px-2 py-0.5 rounded font-bold">TEST MODE</span>
      </div>

      <label className="block text-xs font-bold text-slate-700 mb-1">Amount (INR)</label>
      <input
        type="number"
        min="1"
        max={isWithdraw ? maxAmount : undefined}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={isWithdraw ? `Max ${INR(maxAmount ?? 0)}` : 'Enter amount'}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-3 focus:ring-2 focus:ring-orange-500 outline-none"
      />

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold hover:bg-orange-50 hover:border-orange-200"
            >
              {INR(p)}
            </button>
          ))}
        </div>
      )}

      <label className="block text-xs font-bold text-slate-700 mb-2">Payment Method</label>
      {paymentMethods.length === 0 ? (
        <button type="button" onClick={onAddCard} className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 mb-4 hover:border-orange-300">
          + Add demo card
        </button>
      ) : (
        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
          {paymentMethods.map((pm) => (
            <label
              key={pm.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                selectedMethodId === pm.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="pm"
                checked={selectedMethodId === pm.id}
                onChange={() => setSelectedMethodId(pm.id)}
              />
              <span className="text-sm font-medium">
                {pm.label} {pm.last_four ? `**** ${pm.last_four}` : ''}
              </span>
            </label>
          ))}
          <button type="button" onClick={onAddCard} className="text-xs text-blue-600 font-bold hover:underline">
            + Add another card
          </button>
        </div>
      )}

      {!isWithdraw && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 mb-2">Demo card details (any values work)</p>
          <input placeholder="Card number" defaultValue="4242 4242 4242 4242" className="w-full text-xs border rounded px-2 py-1.5 mb-2" readOnly />
          <div className="flex gap-2">
            <input placeholder="MM/YY" defaultValue="12/28" className="flex-1 text-xs border rounded px-2 py-1.5" readOnly />
            <input placeholder="CVV" defaultValue="123" className="w-16 text-xs border rounded px-2 py-1.5" readOnly />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onPay}
        disabled={processing}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm disabled:opacity-50"
      >
        {isWithdraw ? 'Withdraw Now' : `Pay ${amount ? INR(parseFloat(amount) || 0) : ''}`}
      </button>
    </div>
  );
}

function PaymentMethodsModal({
  methods,
  onAdd,
  onRemove,
  onClose,
  adding,
}: {
  methods: PaymentMethod[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onClose: () => void;
  adding: boolean;
}) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Payment Methods</h3>
        <button type="button" onClick={onClose} className="text-slate-400 text-xl">×</button>
      </div>
      {methods.length === 0 ? (
        <p className="text-sm text-slate-500 mb-4">No saved methods. Add a demo card to get started.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {methods.map((pm) => (
            <li key={pm.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <span className="text-sm font-medium">
                {pm.label} {pm.last_four ? `**** ${pm.last_four}` : ''}
                {pm.is_default && <span className="ml-2 text-[9px] bg-orange-100 text-orange-600 px-1 rounded">Default</span>}
              </span>
              <button type="button" onClick={() => onRemove(pm.id)} className="text-xs text-red-500 font-bold hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={adding}
        className="w-full py-2.5 border border-orange-500 text-orange-500 rounded-lg font-bold text-sm hover:bg-orange-50 disabled:opacity-50"
      >
        {adding ? 'Adding...' : '+ Add Demo Card'}
      </button>
      <button type="button" onClick={onClose} className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-700">
        Close
      </button>
    </div>
  );
}

function LimitsModal({
  limits,
  onClose,
}: {
  limits: WalletSummary['limits'];
  onClose: () => void;
}) {
  return (
    <div className="p-6">
      <h3 className="font-bold text-lg mb-4">Wallet Limits</h3>
      <ul className="space-y-3 text-sm">
        <li className="flex justify-between">
          <span>Daily deposit</span>
          <span className="font-bold">
            {INR(limits.daily_deposit_used)} / {INR(limits.daily_deposit_limit)}
          </span>
        </li>
        <li className="flex justify-between">
          <span>Daily withdrawal</span>
          <span className="font-bold">
            {INR(limits.daily_withdrawal_used)} / {INR(limits.daily_withdrawal_limit)}
          </span>
        </li>
        <li className="flex justify-between">
          <span>Monthly deposit</span>
          <span className="font-bold">
            {INR(limits.monthly_deposit_used)} / {INR(limits.monthly_deposit_limit)}
          </span>
        </li>
      </ul>
      <button type="button" onClick={onClose} className="w-full mt-6 py-2.5 bg-slate-100 rounded-lg font-bold text-sm">
        Close
      </button>
    </div>
  );
}
