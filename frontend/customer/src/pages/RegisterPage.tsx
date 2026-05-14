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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">ShopNow</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of happy customers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => handleTypeChange('b2c')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                customerType === 'b2c'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Personal (B2C)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('b2b')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                customerType === 'b2b'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Business (B2B)
            </button>
          </div>

          {customerType === 'b2b' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-sm text-blue-700">
              B2B customers get exclusive wholesale pricing and bulk order discounts.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('customer_type')} value={customerType} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  {...register('phone')}
                  placeholder="10-digit mobile"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* B2B Fields */}
            {customerType === 'b2b' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
                  <input
                    {...register('company_name')}
                    placeholder="Your Company Pvt Ltd"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {(errors as { company_name?: { message?: string } }).company_name && (
                    <p className="text-red-500 text-xs mt-1">{(errors as { company_name?: { message?: string } }).company_name?.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Number *</label>
                  <input
                    {...register('gst_number')}
                    placeholder="27AAPFU0939F1ZV"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {(errors as { gst_number?: { message?: string } }).gst_number && (
                    <p className="text-red-500 text-xs mt-1">{(errors as { gst_number?: { message?: string } }).gst_number?.message}</p>
                  )}
                </div>
              </>
            )}
{/* test h */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
