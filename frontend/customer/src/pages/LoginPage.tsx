import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export default function LoginPage() {
  const { login, customer, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [step, setStep] = useState<'identifier' | 'register_prompt' | 'signin'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (customer) navigate(redirect, { replace: true });
  }, [customer, navigate, redirect]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Enter mobile number or email');
      return;
    }
    
    setChecking(true);
    try {
      const res = await api.post<{ success: boolean; data: { exists: boolean } }>('/auth/check', { identifier: identifier.trim() });
      if (res.data.data.exists) {
        setStep('signin');
      } else {
        setStep('register_prompt');
      }
    } catch (err) {
      toast.error('Failed to check user. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Enter your password');
      return;
    }
    
    try {
      await login(identifier.trim(), password);
      toast.success('Welcome back!');
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid password';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-[#F0FDF4] via-[#F8FAFC] to-[#ECFDF5] text-gray-800 relative overflow-hidden">
      
      {/* Decorative Dotted Pattern */}
      <div className="absolute top-20 left-20 opacity-20 pointer-events-none hidden md:block">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <pattern id="dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-brand-primary" />
          </pattern>
          <rect width="60" height="60" fill="url(#dots)" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-20 opacity-20 pointer-events-none hidden md:block">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <pattern id="dots2" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-brand-primary" />
          </pattern>
          <rect width="60" height="60" fill="url(#dots2)" />
        </svg>
      </div>

      {/* Header */}
      <div className="w-full flex flex-col items-center pt-6 md:pt-8 pb-4 z-10 px-4 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-md shadow-brand-primary/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <span className="text-2xl font-black text-[#0F172A] tracking-tight">ShopNow</span>
        </Link>
        <h1 className="text-3xl md:text-[34px] font-extrabold text-[#0F172A] mb-3 tracking-tight">Welcome back</h1>
        <p className="text-[#64748B] text-sm md:text-base font-medium">Log in to your account and continue shopping</p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto flex items-center justify-center gap-12 lg:gap-24 px-4 z-10">
        
        {/* Center Column - Card */}
        <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-10">
          
          {step === 'identifier' && (
            <>
              {/* Icon Heading */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 bg-brand-primaryLight rounded-full flex items-center justify-center mb-5 ring-4 ring-brand-primaryLight/50">
                  <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Log in with your email</h2>
                <p className="text-xs font-medium text-gray-500">Enter your email address to access your account</p>
              </div>

              <form onSubmit={handleContinue} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 mb-1.5">Email address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-gray-900 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer" defaultChecked />
                    <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-[13px] font-semibold text-brand-primary hover:text-brand-primaryHover transition-colors">Forgot email?</a>
                </div>

                <button
                  type="submit"
                  disabled={checking}
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-xl transition-all disabled:opacity-70 text-[13px] shadow-md shadow-brand-primary/20 active:scale-[0.98] mt-2"
                >
                  {checking ? 'Checking...' : 'Continue'}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="w-full border-t border-gray-100"></div>
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-gray-400">or</span>
              </div>

              <div className="text-center">
                <span className="text-[13px] font-medium text-gray-500">Don't have an account? </span>
                <Link to={`/register?identifier=${encodeURIComponent(identifier)}`} className="text-[13px] font-bold text-brand-primary hover:text-brand-primaryHover transition-colors">
                  Create account
                </Link>
              </div>
            </>
          )}

          {step === 'register_prompt' && (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 bg-brand-primaryLight rounded-full flex items-center justify-center mb-5 ring-4 ring-brand-primaryLight/50">
                  <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">New to ShopNow?</h2>
                <p className="text-xs font-medium text-gray-500">Let's create an account with</p>
                <div className="bg-gray-50 px-4 py-1.5 rounded-full mt-3 border border-gray-100 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{identifier}</span>
                  <button onClick={() => setStep('identifier')} className="text-xs font-bold text-brand-primary hover:text-brand-primaryHover transition-colors">Change</button>
                </div>
              </div>

              <Link
                to={`/register?identifier=${encodeURIComponent(identifier)}`}
                className="flex items-center justify-center w-full py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-xl transition-all text-[13px] shadow-md shadow-brand-primary/20 active:scale-[0.98]"
              >
                Proceed to create account
              </Link>

              <div className="relative flex items-center justify-center my-6">
                <div className="w-full border-t border-gray-100"></div>
              </div>

              <div className="text-center">
                <span className="text-[13px] font-medium text-gray-500">Already a customer? </span>
                <button onClick={() => setStep('identifier')} className="text-[13px] font-bold text-brand-primary hover:text-brand-primaryHover transition-colors">
                  Sign in instead
                </button>
              </div>
            </>
          )}

          {step === 'signin' && (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 bg-brand-primaryLight rounded-full flex items-center justify-center mb-5 ring-4 ring-brand-primaryLight/50">
                  <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back</h2>
                <div className="bg-gray-50 px-4 py-1.5 rounded-full mt-1 border border-gray-100 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{identifier}</span>
                  <button onClick={() => setStep('identifier')} className="text-xs font-bold text-brand-primary hover:text-brand-primaryHover transition-colors">Change</button>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[13px] font-bold text-gray-800">Password</label>
                    <a href="#" className="text-[12px] font-semibold text-brand-primary hover:text-brand-primaryHover transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-gray-900 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-xl transition-all disabled:opacity-70 text-[13px] shadow-md shadow-brand-primary/20 active:scale-[0.98] mt-2"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="w-full border-t border-gray-100"></div>
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-gray-400">or sign in with</span>
              </div>

              <div className="space-y-2.5">
                <button className="w-full py-2.5 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Passkey</button>
                <button className="w-full py-2.5 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">OTP via Email</button>
              </div>
            </>
          )}

        </div>

      </div>

      {/* Footer */}
      <div className="w-full text-center pb-4 pt-4 z-10">
        <p className="text-[12px] text-[#94A3B8] font-medium">© 2026 ShopNow. All rights reserved.</p>
      </div>

    </div>
  );
}
