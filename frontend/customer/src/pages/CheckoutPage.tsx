import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useCreateOrder, buildOrderPayload } from '../hooks/useOrders';

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
  const { items: cartItems, buyNowItem, clearCart, setBuyNowItem } = useCartStore();
  const customer = useAuthStore(s => s.customer);
  
  const savedAddress = (customer?.address as any)?.addresses?.[0] || customer?.address;
  const [showAddressForm, setShowAddressForm] = useState(!savedAddress?.name && !savedAddress?.street);
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express' | 'schedule'>('standard');

  const items = buyNowItem ? [buyNowItem] : cartItems;

  const totalMrp = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryCharge = deliveryOption === 'express' ? 149 : 0;
  const totalPrice = subtotal + deliveryCharge;
  const totalSavings = totalMrp - subtotal;

  useEffect(() => {
    return () => {
      setBuyNowItem(null);
    };
  }, [setBuyNowItem]);

  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: 'India',
      payment_method: 'upi',
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
            <p className="text-2xl font-black text-green-700">#{confirmedOrder.order_number}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/orders/${confirmedOrder.id}`}
              className="px-8 py-3.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Track Order
            </Link>
            <Link
              to="/"
              className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
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
          <Link to="/category/all" className="inline-block px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-sm transition-all">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (values: AddressForm) => {
    if (!items || items.length === 0) {
      toast.error('No items in cart');
      return;
    }

    if (!values.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    
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
      toast.success('Order placed successfully!');
      setConfirmedOrder({ id: order.id, order_number: order.order_number });
      if (buyNowItem) {
        setBuyNowItem(null);
      } else {
        clearCart();
      }
    } catch (err: unknown) {
      console.error('Order creation error:', err);
      let message = 'Failed to place order';
      if (err instanceof Error) message = err.message;
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">ShopNow</span>
            </Link>
            <Link to="/cart" className="text-green-600 font-bold text-sm hover:underline flex items-center gap-1">
              ← Continue Shopping
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">✓</div>
              Cart
            </div>
            <div className="w-12 h-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <div className="w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center text-xs">2</div>
              Checkout
            </div>
            <div className="w-12 h-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">3</div>
              Payment
            </div>
            <div className="w-12 h-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">4</div>
              Confirmation
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            100% Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <form 
          id="checkout-form" 
          onSubmit={handleSubmit(handlePlaceOrder)} 
          className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8"
        >
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* 1. Delivery Address */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex gap-4 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose where you want your items to be delivered</p>
                </div>
              </div>

              {!showAddressForm ? (
                <div className="ml-12 relative z-10">
                  <div className="border border-green-600 bg-green-50 rounded-2xl p-5 flex items-start gap-4 relative md:w-2/3">
                    <div className="text-green-700 mt-1 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-sm">{getValues('name') || 'Guest User'}</span>
                        <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-bold rounded-full">Default</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {getValues('address_line1')} {getValues('address_line2')}, {getValues('city')}, {getValues('state')} {getValues('pincode')}, {getValues('country')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Phone: {getValues('phone')}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowAddressForm(true)}
                      className="absolute right-5 top-5 text-green-700 font-bold text-xs hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => setShowAddressForm(true)}
                    className="mt-4 flex items-center gap-2 text-green-700 font-bold text-sm hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add New Address
                  </button>
                </div>
              ) : (
                <div className="ml-12 space-y-4 max-w-xl relative z-10">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                      <input {...register('name')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                      <input {...register('phone')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Address Line 1</label>
                    <input {...register('address_line1')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                    {errors.address_line1 && <p className="text-red-500 text-xs mt-1">{errors.address_line1.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Address Line 2 (Optional)</label>
                    <input {...register('address_line2')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                      <input {...register('city')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                      <input {...register('state')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                      <input {...register('pincode')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none" />
                      {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={async () => {
                        const isValid = await trigger(['name', 'phone', 'address_line1', 'city', 'state', 'pincode']);
                        if (isValid) setShowAddressForm(false);
                      }} 
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Decorative map illustration on right */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block opacity-60">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full text-green-100" viewBox="0 0 200 200" fill="currentColor">
                    <path d="M45.7,117.8c-7.9-10.4-15.6-25-10.2-37.1c4.5-10.1,16.4-15.3,27.1-18.7c17.5-5.5,35.4-9.6,53.2-12.7 c10.3-1.8,21.5-3.3,31-8.1c9.4-4.8,16.1-13.8,21.1-23.3c3.4-6.5,5.9-13.6,11.2-18.7c4.8-4.7,12.2-7.1,18.5-4.5 c8,3.3,10.6,13.6,9.1,21.9c-2,10.7-9.4,19.3-16.7,27.5c-14.8,16.6-32.9,30.3-51.5,42.5c-20.9,13.7-44.1,25-68.5,29.9 C60,118.2,49.2,122.4,45.7,117.8z" opacity="0.3"/>
                  </svg>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                    <path d="M40,110 Q80,140 120,90 T180,40" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6,6" />
                  </svg>
                  <div className="absolute top-[30px] right-[15px] w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Options */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Options</h2>
                  <p className="text-sm text-gray-500 mt-1">Select how you want your order delivered</p>
                </div>
              </div>

              <div className="ml-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div onClick={() => setDeliveryOption('standard')} className={`border rounded-2xl p-5 cursor-pointer transition-all ${deliveryOption === 'standard' ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-green-300'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full border-4 flex shrink-0 ${deliveryOption === 'standard' ? 'border-green-600 bg-white' : 'border-gray-300 bg-white'}`}></div>
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-gray-900">Standard Delivery</p>
                  <p className="text-xs text-gray-500 mt-0.5">3-5 business days</p>
                  <p className="text-xs font-bold text-green-700 mt-2">FREE</p>
                </div>

                <div onClick={() => setDeliveryOption('express')} className={`border rounded-2xl p-5 cursor-pointer transition-all ${deliveryOption === 'express' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full border-4 flex shrink-0 ${deliveryOption === 'express' ? 'border-orange-500 bg-white' : 'border-gray-300 bg-white'}`}></div>
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-gray-900">Express Delivery</p>
                  <p className="text-xs text-gray-500 mt-0.5">1-2 business days</p>
                  <p className="text-xs font-bold text-orange-500 mt-2">₹149</p>
                </div>

                <div onClick={() => setDeliveryOption('schedule')} className={`border rounded-2xl p-5 cursor-pointer transition-all ${deliveryOption === 'schedule' ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-300'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full border-4 flex shrink-0 ${deliveryOption === 'schedule' ? 'border-purple-600 bg-white' : 'border-gray-300 bg-white'}`}></div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-gray-900">Schedule Delivery</p>
                  <p className="text-xs text-gray-500 mt-0.5">Choose preferred date</p>
                  <p className="text-xs font-bold text-green-700 mt-2">FREE</p>
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose a payment option that works for you</p>
                </div>
              </div>

              <div className="ml-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                  {[
                    { id: 'upi', title: 'UPI / QR', desc: 'Pay using any UPI app', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> },
                    { id: 'card', title: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
                    { id: 'netbanking', title: 'Net Banking', desc: 'All major banks', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg> },
                    { id: 'cod', title: 'Cash on Delivery', desc: 'Pay when you receive', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                  ].map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => setValue('payment_method', opt.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === opt.id ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-green-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-4 flex shrink-0 ${paymentMethod === opt.id ? 'border-green-600 bg-white' : 'border-gray-300 bg-white'}`}></div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === opt.id ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'}`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{opt.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <input type="hidden" {...register('payment_method')} />
                {errors.payment_method && <p className="text-red-500 text-xs mt-2 ml-1">{errors.payment_method.message}</p>}

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-600 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="font-medium text-center sm:text-left">You will be securely redirected to the payment gateway to complete your transaction.</span>
                </div>
              </div>
            </div>

            {/* Footer Features Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Secure Payments</p><p className="text-[10px] text-gray-500">Your data is protected</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Easy Returns</p><p className="text-[10px] text-gray-500">7 days return policy</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">100% Original</p><p className="text-[10px] text-gray-500">Genuine products</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Customer Support</p><p className="text-[10px] text-gray-500">We're here to help</p></div>
              </div>
            </div>

          </div>

          {/* Right Column (Sticky Sidebar) */}
          <div className="w-full">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
              
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl p-1 flex items-center justify-center shrink-0 border border-gray-100">
                      <img src={item.image || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply" alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{item.name}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-gray-500 font-medium">Qty: {item.quantity}</span>
                        <span className="text-xs font-bold text-gray-900">{fmt(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-gray-100 my-6"></div>

              <h3 className="text-base font-bold text-gray-900 mb-4">Price Details</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal ({items.length} item)</span>
                  <span className="font-bold text-gray-900">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Delivery Charges</span>
                  <span className="font-bold text-green-600">{deliveryCharge === 0 ? 'FREE' : fmt(deliveryCharge)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Discount</span>
                    <span className="font-bold text-green-600">− {fmt(totalSavings)}</span>
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-gray-100 my-4"></div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-green-700">{fmt(totalPrice)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-green-700 justify-center mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  You are saving {fmt(totalSavings)} on this order
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm shadow-md shadow-green-700/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>

              <p className="text-[10px] text-gray-500 text-center px-4 leading-relaxed">
                By placing this order, you agree to our <span className="text-green-700 font-medium hover:underline cursor-pointer">Terms & Conditions</span> and <span className="text-green-700 font-medium hover:underline cursor-pointer">Privacy Policy</span>
              </p>

              <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-xs text-gray-900">Shop with Confidence</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Safe, secure and hassle-free shopping experience.</p>
                </div>
              </div>

            </div>
          </div>

        </form>
      </div>
      
    </div>
  );
}
