import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const b2cSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().regex(/^\d{10}$/, 'Enter valid 10-digit phone').optional().or(z.literal('')),
  customer_type: z.literal('b2c'),
  company_name: z.string().optional(),
  gst_number: z.string().optional()
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const b2bSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().regex(/^\d{10}$/, 'Enter valid 10-digit phone').optional().or(z.literal('')),
  customer_type: z.literal('b2b'),
  company_name: z.string().min(2, 'Company name is required'),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter valid GST number')
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type B2CForm = z.infer<typeof b2cSchema>;
type B2BForm = z.infer<typeof b2bSchema>;
type FormData = B2CForm | B2BForm;

export default function RegisterPage() {
  const [customerType, setCustomerType] = useState<'b2c' | 'b2b'>('b2c');
  const { register: authRegister, customer, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isB2BRequest = params.get('type') === 'b2b';

    // Only redirect if NOT specifically requesting a B2B account
    if (customer && !isB2BRequest) {
      navigate('/', { replace: true });
    }

    if (isB2BRequest) {
      setCustomerType('b2b');
    }
  }, [customer, navigate]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(customerType === 'b2c' ? b2cSchema : b2bSchema) as never,
    defaultValues: { customer_type: 'b2c' }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('identifier');
    if (id) {
      if (id.includes('@')) {
        setValue('email', id);
      } else {
        setValue('phone', id);
      }
    }
  }, [setValue]);

  const handleTypeChange = (type: 'b2c' | 'b2b') => {
    setCustomerType(type);
    reset({ customer_type: type } as FormData);

    // Update URL query param nicely without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('type', type);
    window.history.pushState({}, '', url.toString());
  };

  const onSubmit = async (data: FormData) => {
    try {
      const { confirmPassword: _confirm, ...payload } = data as FormData & { confirmPassword: string };
      await authRegister(payload);
      toast.success('Account created successfully! Welcome!');
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      {/* Simplified Header */}
      <header className="bg-white text-gray-800 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 md:px-10 lg:px-16 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center rounded-md hover:opacity-90 transition-all flex-shrink-0">
            <svg className="w-8 h-8 text-brand-primary mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6V5a4 4 0 0 0-8 0v1H4v13a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V6h-4zM9 5a3 3 0 0 1 6 0v1H9V5zm9 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8h12v11z" />
              <path d="M9 10a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm4 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
            </svg>
            <div className="flex items-start text-gray-800">
              <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-[#222]">ShopNow</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] font-bold leading-none ml-0.5 mt-0.5">TM</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">Already have an account?</span>
            <Link to="/login" className="border border-brand-primary text-brand-primary font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-[#EBF7F2] hover:border-brand-primaryHover transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="min-h-[calc(100vh-73px)] bg-gray-50/50 flex items-center py-5 md:py-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12">

          {/* Left Column: Benefits & Value Props */}
          <div className="w-full lg:w-[450px] flex flex-col justify-between py-2 lg:sticky lg:top-24">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
                Join <span className="text-brand-primary">ShopNow</span><br />
                and enjoy the best<br />
                shopping experience
              </h2>
              <p className="text-xs text-gray-500 mt-2 mb-4">
                Create an account and unlock exciting benefits
              </p>

              {/* Benefits list */}
              <div className="space-y-4 max-w-md">
                {/* Benefit 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF7F2] flex items-center justify-center text-brand-primary shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Faster Checkout</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Save your details and shop in seconds</p>
                  </div>
                </div>

                {/* Benefit 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF7F2] flex items-center justify-center text-brand-primary shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Wishlist & Save</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Save your favorite products</p>
                  </div>
                </div>

                {/* Benefit 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF7F2] flex items-center justify-center text-brand-primary shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 0 0 1.591 0l4.318-4.318a1.125 1.125 0 0 0 0-1.591l-9.581-9.581A2.25 2.25 0 0 0 9.568 3Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Exclusive Offers</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Get access to special deals & discounts</p>
                  </div>
                </div>

                {/* Benefit 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF7F2] flex items-center justify-center text-brand-primary shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Secure & Safe</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Your information is always protected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Illustration */}
            <div className="mt-6 hidden lg:block">
              <svg viewBox="0 0 400 230" className="w-full h-auto max-w-[260px]">
                {/* Shadow */}
                <ellipse cx="200" cy="210" rx="140" ry="10" fill="#EBF7F2" />

                {/* Shopping Bag */}
                <g transform="translate(110, 30)">
                  <path d="M35,30 C35,5 75,5 75,30" fill="none" stroke="#0FA86E" strokeWidth="5" strokeLinecap="round" />
                  <path d="M10,30 L100,30 C105,30 110,34 108,40 L95,160 C93,170 85,175 75,175 L35,175 C25,175 17,170 15,160 L2,40 C0,34 5,30 10,30 Z" fill="#0FA86E" />
                  <path d="M40,90 C45,105 65,105 70,90" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="45" cy="80" r="3.5" fill="#ffffff" />
                  <circle cx="65" cy="80" r="3.5" fill="#ffffff" />
                </g>

                {/* Gift Box */}
                <g transform="translate(215, 130)">
                  <rect x="0" y="10" width="70" height="65" rx="8" fill="#FCE5A2" />
                  <rect x="-3" y="5" width="76" height="15" rx="4" fill="#FBD561" />
                  <rect x="30" y="5" width="10" height="70" fill="#0FA86E" />
                  <rect x="-3" y="32" width="76" height="10" fill="#0FA86E" />
                  <path d="M25,5 C15,-5 25,-15 35,5 C45,-15 55,-5 45,5 Z" fill="#0FA86E" />
                </g>

                {/* Decorative Sparkles */}
                <g stroke="#0FA86E" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6">
                  <path d="M70,50 L80,50 M75,45 L75,55" />
                  <path d="M310,90 L320,90 M315,85 L315,95" />
                  <path d="M50,150 L60,150 M55,145 L55,155" />
                </g>
              </svg>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="w-full lg:w-[530px] bg-white rounded-2xl border border-gray-150 shadow-lg p-5 md:p-6">

            {/* Card Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#EBF7F2] flex items-center justify-center text-brand-primary shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Your Account</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Fill in the details below to get started</p>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-4" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <input type="hidden" {...register('customer_type')} value={customerType} />

              {/* Account Type Selector */}
              <div>
                <span className="block text-[10px] font-bold text-gray-500 tracking-wide mb-1.5">Account Type</span>
                <div className="grid grid-cols-2 gap-3">
                  {/* B2C Button */}
                  <button
                    type="button"
                    onClick={() => handleTypeChange('b2c')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition-all border ${customerType === 'b2c'
                        ? 'border-brand-primary bg-[#EBF7F2]/40 text-brand-primary border-2 shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span>Personal (B2C)</span>
                    {customerType === 'b2c' && (
                      <svg className="w-4 h-4 text-brand-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* B2B Button */}
                  <button
                    type="button"
                    onClick={() => handleTypeChange('b2b')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition-all border ${customerType === 'b2b'
                        ? 'border-brand-primary bg-[#EBF7F2]/40 text-brand-primary border-2 shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.4V14.15m16.5 0c0-1.228-.799-2.285-1.966-2.658L16.5 10.5V7.5a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 7.5 7.5v3m9 0V10.5m-9 0h9M5.216 11.5c-1.167.373-1.966 1.43-1.966 2.658m0 0v.5" />
                    </svg>
                    <span>Business (B2B)</span>
                    {customerType === 'b2b' && (
                      <svg className="w-4 h-4 text-brand-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {customerType === 'b2b' && (
                <div className="bg-[#EBF7F2] border border-[#D5E6CD] rounded-xl p-3 text-[11px] text-[#0d9561] flex gap-2 items-start">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-bold">B2B Premium Benefits Enabled:</span> Wholesale pricing, bulk quantity models, and tax invoice support.
                  </div>
                </div>
              )}

              {/* Form fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <div className="relative group/input">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <input
                      {...register('name')}
                      placeholder="Enter your full name"
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <div className="relative group/input">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.145-3.878-6.702-6.702l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <input
                      {...register('phone')}
                      placeholder="10-digit mobile number"
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <div className="relative group/input">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Passwords grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                  <div className="relative group/input">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative group/input">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">At least 8 characters with a number and symbol</p>

              {/* B2B Fields */}
              {customerType === 'b2b' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                    <div className="relative group/input">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5V6a.75.75 0 0 0-.75-.75H7.5A.75.75 0 0 0 6.75 6v15z" />
                        </svg>
                      </div>
                      <input
                        {...register('company_name')}
                        placeholder="Your Company Pvt Ltd"
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                      />
                    </div>
                    {(errors as { company_name?: { message?: string } }).company_name && (
                      <p className="text-red-500 text-xs mt-1">{(errors as { company_name?: { message?: string } }).company_name?.message}</p>
                    )}
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST Number *</label>
                    <div className="relative group/input">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
                        </svg>
                      </div>
                      <input
                        {...register('gst_number')}
                        placeholder="27AAPFU0939F1ZV"
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-mono transition-all"
                      />
                    </div>
                    {(errors as { gst_number?: { message?: string } }).gst_number && (
                      <p className="text-red-500 text-xs mt-1">{(errors as { gst_number?: { message?: string } }).gst_number?.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Checkbox: Terms & Privacy */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 mt-0.5 border-gray-300 rounded text-brand-primary focus:ring-brand-primary/20 accent-brand-primary"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-500 leading-normal select-none">
                  I agree to the{' '}
                  <a href="#" className="text-brand-primary font-semibold hover:underline">Terms of Use</a>{' '}
                  and{' '}
                  <a href="#" className="text-brand-primary font-semibold hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-xs shadow-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Social login divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-gray-150" />
              <span className="absolute text-[9px] text-gray-400 bg-white px-3 uppercase tracking-wider font-semibold">or sign up with</span>
            </div>

            {/* Social signup buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button type="button" className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-[11px] font-semibold text-gray-700 shadow-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="hidden sm:inline">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-[11px] font-semibold text-gray-700 shadow-xs">
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="hidden sm:inline">Facebook</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-[11px] font-semibold text-gray-700 shadow-xs">
                <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.95-.42-1.9-.45-2.9 0-1.2.55-2.02.43-2.92-.4C7.2 19.33 5.48 16.5 5.48 12.7c0-3.9 2.5-6 4.95-6 1.25.02 2.38.56 3.1.58.98.02 2.3-.65 3.75-.5 1.55.15 2.82.78 3.58 1.9-3.2 1.9-2.7 6.1.52 7.4-.7 1.72-1.6 3.45-3.33 4.2zM12.03 6.25c-.2-.07-.38-.13-.53-.13.04-.84.42-1.68.95-2.3.66-.78 1.6-1.32 2.52-1.32.06 0 .1.02.16.02-.02.93-.43 1.83-1.02 2.44-.6.65-1.44 1.18-2.08 1.29z" />
                </svg>
                <span className="hidden sm:inline">Apple</span>
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
