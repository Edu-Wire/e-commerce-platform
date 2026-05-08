import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useCreateOrder, buildOrderPayload } from '../hooks/useOrders';
import ConditionBadge from '../components/ui/ConditionBadge';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Enter valid 10-digit phone'),
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  country: z.string().default('India'),
  notes: z.string().optional(),
  payment_method: z.string().min(1, 'Select payment method')
});

type AddressForm = z.infer<typeof addressSchema>;

type Step = 'address' | 'review' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>('address');
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: number; order_number: string } | null>(null);
  const { items, totalMrp, totalPrice, totalSavings, clearCart } = useCartStore();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'India', payment_method: 'cod' }
  });

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Your cart is empty</h2>
        <Link to="/category/all" className="text-primary-600 hover:underline">Go shopping</Link>
      </div>
    );
  }

  const onAddressSubmit = () => setStep('review');

  const handlePlaceOrder = async () => {
    const values = getValues();
    setStep('payment');
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1500));

    const payload = buildOrderPayload(
      items,
      {
        name: values.name,
        phone: values.phone,
        address_line1: values.address_line1,
        address_line2: values.address_line2,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        country: values.country
      },
      values.payment_method,
      values.notes
    );

    try {
      const order = await createOrder.mutateAsync(payload);
      setConfirmedOrder({ id: order.id, order_number: order.order_number });
      clearCart();
      setStep('confirmation');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      toast.error(message);
      setStep('review');
    }
  };

  const steps = [
    { key: 'address', label: 'Shipping' },
    { key: 'review', label: 'Review' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirmation', label: 'Confirmed' }
  ] as const;

  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              idx < stepIndex
                ? 'bg-green-500 text-white'
                : idx === stepIndex
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {idx < stepIndex ? '✓' : idx + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:block ${
              idx === stepIndex ? 'text-primary-700' : idx < stepIndex ? 'text-green-600' : 'text-gray-400'
            }`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-12 sm:w-24 h-0.5 mx-2 ${idx < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form area */}
        <div className="lg:col-span-2">
          {/* Step: Address */}
          {step === 'address' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Shipping Address</h2>
              <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      {...register('name')}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      {...register('phone')}
                      placeholder="10-digit mobile"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    {...register('address_line1')}
                    placeholder="House/Flat no, Street, Area"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.address_line1 && <p className="text-red-500 text-xs mt-1">{errors.address_line1.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    {...register('address_line2')}
                    placeholder="Landmark, Colony (optional)"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      {...register('city')}
                      placeholder="Mumbai"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      {...register('state')}
                      placeholder="Maharashtra"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      {...register('pincode')}
                      placeholder="400001"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                      { value: 'upi', label: 'UPI', icon: '📱' },
                      { value: 'card', label: 'Card', icon: '💳' }
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary-400 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 transition-colors">
                        <input type="radio" value={opt.value} {...register('payment_method')} className="text-primary-600" />
                        <span className="text-lg">{opt.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.payment_method && <p className="text-red-500 text-xs mt-1">{errors.payment_method.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Any special instructions..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
                >
                  Continue to Review
                </button>
              </form>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Review Order</h2>

              {/* Address summary */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Delivering to:</p>
                    <p className="text-gray-600">{getValues('name')} — {getValues('phone')}</p>
                    <p className="text-gray-600">{getValues('address_line1')}{getValues('address_line2') ? `, ${getValues('address_line2')}` : ''}</p>
                    <p className="text-gray-600">{getValues('city')}, {getValues('state')} — {getValues('pincode')}</p>
                  </div>
                  <button onClick={() => setStep('address')} className="text-primary-600 text-xs font-medium hover:underline">Edit</button>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-3 items-center border-b border-gray-50 pb-3 last:border-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <ConditionBadge condition={item.condition} className="mt-0.5" />
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-gray-900">{fmt(item.price * item.quantity)}</p>
                      <p className="text-gray-400">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('address')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrder.isPending}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {createOrder.isPending ? 'Placing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Processing Payment</h2>
              <p className="text-gray-500 text-sm">Please wait while we process your order...</p>
            </div>
          )}

          {/* Step: Confirmation */}
          {step === 'confirmation' && confirmedOrder && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
              <p className="text-gray-500 mb-2">Your order has been successfully placed.</p>
              <p className="text-primary-700 font-semibold text-lg mb-6">
                Order #{confirmedOrder.order_number}
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  to={`/orders/${confirmedOrder.id}`}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700"
                >
                  Track Order
                </Link>
                <Link
                  to="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.slice(0, 3).map(item => (
                <div key={item.product_id} className="flex justify-between text-gray-600">
                  <span className="truncate max-w-36">{item.name} ×{item.quantity}</span>
                  <span>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-gray-400 text-xs">+{items.length - 3} more items</p>
              )}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal MRP</span>
                <span>{fmt(totalMrp())}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>− {fmt(totalSavings())}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span>
                <span>{fmt(totalPrice())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
