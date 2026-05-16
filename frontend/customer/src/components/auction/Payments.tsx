import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import {
  usePendingPayments,
  usePayAuctionOrder,
  type PendingPayment,
} from '../../hooks/usePayments';
import {
  useWalletSummary,
  usePaymentMethods,
  useWalletMutations,
} from '../../hooks/useWallet';

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '';

function parseImageUrl(raw: string | null | undefined): string {
  if (!raw) return '/placeholder.png';
  if (raw.startsWith('http') || raw.startsWith('/')) return raw;
  return `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function getExpiryRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
}

type PayStep = 'choose' | 'processing' | 'success';

export default function Payments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightAuctionId = searchParams.get('auction');
  const token = useAuthStore((s) => s.token);
  const enabled = !!token;

  const { data: payments = [], isLoading, error, refetch } = usePendingPayments(enabled);
  const { data: summary } = useWalletSummary(enabled);
  const { data: paymentMethods = [] } = usePaymentMethods(enabled);
  const payOrder = usePayAuctionOrder();
  const { deposit } = useWalletMutations();

  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [payStep, setPayStep] = useState<PayStep>('choose');
  const [paySource, setPaySource] = useState<'wallet' | 'demo'>('wallet');
  const [selectedMethodId, setSelectedMethodId] = useState<number | undefined>();
  const [gatewayRef, setGatewayRef] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');

  const defaultMethod = useMemo(
    () => paymentMethods.find((m) => m.is_default) || paymentMethods[0],
    [paymentMethods]
  );

  const available = summary?.available ?? 0;

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (defaultMethod) setSelectedMethodId(defaultMethod.id);
  }, [defaultMethod?.id]);

  const openPayModal = (order: PendingPayment) => {
    setSelected(order);
    setPayStep('choose');
    setPaySource('wallet');
    setSelectedMethodId(defaultMethod?.id);
    setTopUpAmount(String(Math.max(1, Math.ceil(order.total_amount - available))));
  };

  useEffect(() => {
    if (!highlightAuctionId || isLoading || selected) return;
    const match = payments.find(
      (p) => String(p.auction_id) === highlightAuctionId || String(p.id) === highlightAuctionId
    );
    if (match && !match.is_expired) {
      openPayModal(match);
      setSearchParams({}, { replace: true });
    } else if (!isLoading && payments.length === 0) {
      void refetch();
    }
  }, [highlightAuctionId, isLoading, payments, selected, setSearchParams, refetch]);

  const closeModal = () => {
    setSelected(null);
    setPayStep('choose');
    setGatewayRef('');
  };

  const processPayment = async () => {
    if (!selected) return;
    setPayStep('processing');
    try {
      const result = await payOrder.mutateAsync({
        orderId: selected.id,
        source: paySource,
        payment_method_id: selectedMethodId,
      });
      setGatewayRef(result.gateway_ref || '');
      setPayStep('success');
      toast.success('Payment successful! Your order is confirmed.');
      refetch();
    } catch (err: unknown) {
      setPayStep('choose');
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Payment failed');
    }
  };

  const quickTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount < 1) {
      toast.error('Enter a valid top-up amount');
      return;
    }
    try {
      await deposit.mutateAsync({ amount, payment_method_id: selectedMethodId });
      toast.success('Funds added to wallet');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Top-up failed');
    }
  };

  if (!token) {
    return (
      <Centered>
        <h3 className="font-bold text-slate-800 text-lg">Sign in to view payments</h3>
        <p className="text-sm text-slate-500 mt-2">Log in to complete payment for your auction wins.</p>
        <Link
          to="/login"
          className="inline-block mt-4 bg-orange-500 text-white font-bold py-2 px-6 rounded-xl hover:bg-orange-600"
        >
          Sign in
        </Link>
      </Centered>
    );
  }

  if (isLoading) {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <p className="text-red-500 text-sm">Failed to load pending payments.</p>
        <button type="button" onClick={() => refetch()} className="mt-4 text-sm text-blue-600 hover:underline">
          Retry
        </button>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-2">
          <Link to="/live-auction/payments" className="hover:text-blue-600">
            Payments
          </Link>{' '}
          <span className="mx-1">&gt;</span> <span className="text-slate-700">Complete Payment</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Complete Payment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your auction-winning orders and complete payment within 6 hours.
        </p>
        {summary && (
          <p className="text-xs text-slate-600 mt-2">
            Wallet available:{' '}
            <span className="font-bold text-green-600">
              ₹{available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {' · '}
            <Link to="/live-auction/wallet" className="text-blue-600 hover:underline">
              Manage wallet
            </Link>
          </p>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
          <h3 className="font-bold text-slate-800 text-lg">No pending payments</h3>
          <p className="text-sm text-slate-500 mt-2">You have no auction wins awaiting payment.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Link to="/live-auction" className="text-sm text-blue-600 hover:underline">
              Go to Live Auctions
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/live-auction/winning" className="text-sm text-blue-600 hover:underline">
              View Winning
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {payments.map((order) => {
            const item = order.items[0];
            const expired = order.is_expired || getExpiryRemaining(order.expires_at) === 'Expired';
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm ${
                  expired ? 'border-red-100 opacity-75' : 'border-slate-100'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-20 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
                      {item?.product_image ? (
                        <img
                          src={parseImageUrl(item.product_image)}
                          alt={item.product_name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="text-slate-300 text-xs">No Image</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight">
                        {item?.product_name || 'Auction Item'}
                      </h4>
                      <p className="text-[11px] text-slate-500">Order# {order.order_number}</p>
                      <div className="text-[12px] text-slate-700 mt-2">
                        <span className="text-slate-500">Winning Bid:</span>{' '}
                        <span className="font-bold text-green-600">
                          ₹{Number(item?.unit_price ?? order.total_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Payment Expires In</p>
                      <p className={`font-bold text-lg mt-1 ${expired ? 'text-slate-400' : 'text-red-500'}`}>
                        {getExpiryRemaining(order.expires_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        disabled={expired}
                        onClick={() => !expired && openPayModal(order)}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-xl transition-colors"
                      >
                        Pay ₹{Number(order.total_amount).toLocaleString('en-IN')}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View order details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <PayModal
          selected={selected}
          payStep={payStep}
          paySource={paySource}
          setPaySource={setPaySource}
          available={available}
          paymentMethods={paymentMethods}
          selectedMethodId={selectedMethodId}
          setSelectedMethodId={setSelectedMethodId}
          topUpAmount={topUpAmount}
          setTopUpAmount={setTopUpAmount}
          gatewayRef={gatewayRef}
          onClose={closeModal}
          onPay={processPayment}
          onTopUp={quickTopUp}
          isPaying={payOrder.isPending || deposit.isPending}
          onSuccessClose={() => {
            closeModal();
            navigate(`/orders/${selected.id}`);
          }}
        />
      )}
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center">{children}</div>
  );
}

function Spinner() {
  return <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />;
}

function PayModal({
  selected,
  payStep,
  paySource,
  setPaySource,
  available,
  paymentMethods,
  selectedMethodId,
  setSelectedMethodId,
  topUpAmount,
  setTopUpAmount,
  gatewayRef,
  onClose,
  onPay,
  onTopUp,
  isPaying,
  onSuccessClose,
}: {
  selected: PendingPayment;
  payStep: PayStep;
  paySource: 'wallet' | 'demo';
  setPaySource: (s: 'wallet' | 'demo') => void;
  available: number;
  paymentMethods: { id: number; label: string; last_four: string | null; type: string }[];
  selectedMethodId: number | undefined;
  setSelectedMethodId: (id: number | undefined) => void;
  topUpAmount: string;
  setTopUpAmount: (v: string) => void;
  gatewayRef: string;
  onClose: () => void;
  onPay: () => void;
  onTopUp: () => void;
  isPaying: boolean;
  onSuccessClose: () => void;
}) {
  const item = selected.items[0];
  const shortfall = Math.max(0, selected.total_amount - available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {payStep === 'processing' && (
          <div className="py-12 text-center">
            <Spinner />
            <p className="font-bold text-slate-900 mt-4">Processing payment...</p>
          </div>
        )}

        {payStep === 'success' && (
          <div className="py-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-bold text-slate-900 text-lg">Payment successful</h3>
            <p className="text-sm text-slate-500 mt-2">Order #{selected.order_number} is confirmed.</p>
            {gatewayRef && (
              <p className="text-[10px] text-slate-400 mt-2 font-mono">Ref: {gatewayRef}</p>
            )}
            <button
              type="button"
              onClick={onSuccessClose}
              className="mt-6 w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600"
            >
              View order
            </button>
          </div>
        )}

        {payStep === 'choose' && (
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-900">Pay for auction win</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">
                ×
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-1">{item?.product_name}</p>
            <p className="text-2xl font-bold text-orange-600 mb-4">
              ₹{selected.total_amount.toLocaleString('en-IN')}
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="paySource"
                  checked={paySource === 'wallet'}
                  onChange={() => setPaySource('wallet')}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Wallet</p>
                  <p className="text-xs text-slate-500">
                    Available: ₹{available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {shortfall > 0 && paySource === 'wallet' && (
                      <span className="text-red-500 block">Need ₹{shortfall.toFixed(2)} more</span>
                    )}
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="paySource"
                  checked={paySource === 'demo'}
                  onChange={() => setPaySource('demo')}
                />
                <div>
                  <p className="text-sm font-semibold">Demo card / gateway</p>
                  <p className="text-xs text-slate-500">Pay without wallet balance</p>
                </div>
              </label>
            </div>

            {paymentMethods.length > 0 ? (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Payment method</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {paymentMethods.map((pm) => (
                    <label
                      key={pm.id}
                      className="flex items-center gap-2 text-sm p-2 border rounded-lg cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="pm"
                        checked={selectedMethodId === pm.id}
                        onChange={() => setSelectedMethodId(pm.id)}
                      />
                      {pm.label}
                      {pm.last_four ? ` **** ${pm.last_four}` : ''}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-4">
                <Link to="/live-auction/wallet" className="text-blue-600 hover:underline">
                  Add a payment method
                </Link>{' '}
                in your wallet (optional for demo card pay).
              </p>
            )}

            {paySource === 'wallet' && shortfall > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-800 mb-2">Quick top-up (demo)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="flex-1 border rounded-lg px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={onTopUp}
                    disabled={isPaying}
                    className="text-xs font-bold bg-amber-500 text-white px-3 rounded-lg disabled:opacity-50"
                  >
                    Add funds
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isPaying || (paySource === 'wallet' && shortfall > 0)}
              onClick={onPay}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl"
            >
              Confirm payment
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-3">Demo mode — no real charges.</p>
          </>
        )}
      </div>
    </div>
  );
}
