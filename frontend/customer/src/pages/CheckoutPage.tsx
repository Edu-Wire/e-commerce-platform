import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
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

export default function CheckoutPage() {
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: number; order_number: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  const { items: cartItems, buyNowItem, clearCart, setBuyNowItem } = useCartStore();
  const customer = useAuthStore(s => s.customer);
  
  const items = buyNowItem ? [buyNowItem] : cartItems;

  const totalMrp = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalSavings = totalMrp - totalPrice;

  useEffect(() => {
    return () => {
      setBuyNowItem(null);
    };
  }, [setBuyNowItem]);

  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const savedAddress = (customer?.address as any)?.addresses?.[0] || customer?.address;

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors }
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: 'India',
      payment_method: 'cod',
      name: savedAddress?.name || customer?.name || '',
      phone: customer?.phone || '',
      address_line1: savedAddress?.details || savedAddress?.street || '',
      city: savedAddress?.city || '',
      state: savedAddress?.state || '',
      pincode: savedAddress?.pincode || '',
    }
  });

  const paymentMethod = watch('payment_method');

  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-6 text-lg">Thank you for your purchase. Your order is being processed.</p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
            <p className="text-gray-400 text-sm uppercase font-bold tracking-widest mb-1">Order Number</p>
            <p className="text-2xl font-black text-[#b12704]">#{confirmedOrder.order_number}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/orders/${confirmedOrder.id}`}
              className="px-8 py-3.5 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-bold rounded-lg shadow-sm transition-all border border-[#FCD200]"
            >
              Track Order
            </Link>
            <Link
              to="/"
              className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your checkout is empty</h2>
          <p className="text-gray-500 mb-8">Add some items to your cart to proceed with the checkout.</p>
          <Link to="/category/all" className="inline-block px-8 py-3 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-bold rounded-xl shadow-sm transition-all border border-[#FCD200]">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (values: AddressForm) => {
    setIsProcessing(true);
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
      if (buyNowItem) {
        setBuyNowItem(null);
      } else {
        clearCart();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f2]">
      {/* Checkout Header */}
      <header className="bg-[#232f3e] py-3 px-4 sm:px-10 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center">
          <span className="text-white text-2xl font-black italic tracking-tighter">ShopNow<span className="text-[#febd69]">.in</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-white text-xl sm:text-2xl font-medium">Secure checkout</h1>
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        </div>
        <Link to="/cart" className="text-white hover:text-[#febd69] transition-colors relative group">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="absolute -top-1 -right-1 bg-[#febd69] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-[#232f3e]">{items.length}</span>
        </Link>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(handlePlaceOrder)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Sections */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* 1. Delivery Address */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#0f1111]">1. Add delivery address</h2>
                {!showAddressForm && (
                  <button 
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="text-sm text-[#007185] hover:text-[#c45500] hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {!showAddressForm ? (
                <div className="pl-6">
                  <p className="font-bold text-[15px]">{getValues('name')}</p>
                  <p className="text-[14px] text-gray-600">{getValues('address_line1')}, {getValues('address_line2') && `${getValues('address_line2')}, `}{getValues('city')}, {getValues('state')}, {getValues('pincode')}</p>
                  <p className="text-[14px] text-gray-600">Phone: {getValues('phone')}</p>
                  <button 
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="mt-4 px-4 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 text-xs font-medium rounded-sm border border-[#FCD200] shadow-sm"
                  >
                    Add a new delivery address
                  </button>
                </div>
              ) : (
                <div className="pl-6 space-y-4 max-w-xl">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f1111] mb-1">Full Name</label>
                      <input
                        {...register('name')}
                        className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      />
                      {errors.name && <p className="text-[#c40000] text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f1111] mb-1">Phone</label>
                      <input
                        {...register('phone')}
                        className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      />
                      {errors.phone && <p className="text-[#c40000] text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#0f1111] mb-1">Flat, House no., Building, Company, Apartment</label>
                    <input
                      {...register('address_line1')}
                      className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                    />
                    {errors.address_line1 && <p className="text-[#c40000] text-xs mt-1">{errors.address_line1.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#0f1111] mb-1">Area, Street, Sector, Village</label>
                    <input
                      {...register('address_line2')}
                      className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f1111] mb-1">City</label>
                      <input
                        {...register('city')}
                        className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f1111] mb-1">State</label>
                      <input
                        {...register('state')}
                        className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f1111] mb-1">Pincode</label>
                      <input
                        {...register('pincode')}
                        className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-6 py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 text-[13px] font-medium rounded-sm border border-[#FCD200] shadow-sm"
                    >
                      Use this address
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-6 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-medium rounded-sm border border-gray-300 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-[#0f1111] mb-4">2. Payment method</h2>
              <div className="pl-6 space-y-4">
                <div className="space-y-3">
                  {[
                    { value: 'cod', label: 'Cash on Delivery/Pay on Delivery', desc: 'Scan & Pay using any UPI app at the time of delivery.' },
                    { value: 'upi', label: 'UPI (Paytm/Google Pay/PhonePe)', desc: 'Fastest way to pay.' },
                    { value: 'card', label: 'Credit or Debit Card', desc: 'All major cards accepted.' }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        value={opt.value} 
                        {...register('payment_method')} 
                        className="mt-1 w-4 h-4 text-[#e77600] focus:ring-[#e77600]" 
                      />
                      <div className="flex-1">
                        <span className="block text-[14px] font-bold text-[#0f1111] group-hover:text-[#c45500]">{opt.label}</span>
                        <span className="block text-[12px] text-gray-600">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Review items and shipping */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-[#0f1111] mb-4">3. Review items and shipping</h2>
              <div className="pl-6 space-y-6">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-gray-50 p-2 flex items-center justify-center rounded-sm flex-shrink-0 border border-gray-100">
                      {item.image && <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[#0f1111] line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[13px] font-bold text-[#b12704]">{fmt(item.price)}</span>
                        <span className="text-[12px] text-gray-500 line-through">{fmt(item.mrp)}</span>
                        <ConditionBadge condition={item.condition} className="scale-75 origin-left" />
                      </div>
                      <p className="text-[12px] text-gray-600 mt-1 font-medium">Quantity: {item.quantity}</p>
                      <div className="flex items-center gap-1 mt-1 text-[12px] text-[#007600] font-bold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span>Eligible for FREE Shipping</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="bg-[#f7f8f8] p-4 rounded-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                  <div>
                    <p className="text-[13px] font-bold text-[#0f1111]">How do your items ship?</p>
                    <p className="text-[12px] text-gray-600">Items from ShopNow will be delivered by our specialized courier service.</p>
                  </div>
                  <div className="text-[12px] text-[#007185] font-bold hover:text-[#c45500] hover:underline cursor-pointer">
                    Why is my order shipping in multiple packages?
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 sticky top-24">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-medium rounded-lg shadow-sm transition-all border border-[#FCD200] disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Place your order'}
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-2 px-2">
                By placing your order, you agree to ShopNow.in's <span className="text-[#007185]">privacy notice</span> and <span className="text-[#007185]">conditions of use</span>.
              </p>
              
              <div className="h-px bg-gray-200 my-4" />
              
              <h3 className="font-bold text-[16px] text-[#0f1111] mb-4">Order Summary</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-gray-700">
                  <span>Items:</span>
                  <span>{fmt(totalMrp)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery:</span>
                  <span className="text-[#007600] font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-[#b12704] font-medium">
                  <span>Total Savings:</span>
                  <span>− {fmt(totalSavings)}</span>
                </div>
                
                <div className="h-px bg-gray-200 my-2" />
                
                <div className="flex justify-between text-[18px] font-bold text-[#b12704]">
                  <span>Order Total:</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-6 bg-[#f7f8f8] p-3 rounded-sm border-t border-gray-100">
                <p className="text-[12px] font-bold text-[#0f1111] mb-1">Your payment is secure</p>
                <p className="text-[11px] text-gray-600">We use the latest industry standards to protect your private data and payment info.</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 text-[12px] text-gray-600 border border-gray-200 bg-white rounded-sm">
              <p>Need help? Check our <span className="text-[#007185]">Help Center</span> or <span className="text-[#007185]">Contact Us</span>.</p>
            </div>
          </div>

        </form>
      </div>

      {/* Footer (Simplified for Checkout) */}
      <footer className="bg-white border-t border-gray-200 py-10 mt-12">
        <div className="max-w-[1000px] mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-[11px] text-[#007185] font-medium mb-4">
            <span className="hover:underline cursor-pointer">Conditions of Use</span>
            <span className="hover:underline cursor-pointer">Privacy Notice</span>
            <span className="hover:underline cursor-pointer">Interest-Based Ads</span>
          </div>
          <p className="text-[11px] text-gray-500">© 2024-2026, ShopNow.in, Inc. or its affiliates</p>
        </div>
      </footer>
    </div>
  );
}
