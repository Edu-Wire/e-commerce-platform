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
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 py-12">
      <div className="w-full max-w-[350px]">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">ShopNow</span>
          </Link>
        </div>

        <div className="border border-gray-300 rounded-lg p-6 shadow-sm">
          {step === 'identifier' && (
            <>
              <h1 className="text-2xl font-normal text-gray-900 mb-4">Sign in or create account</h1>
              <form onSubmit={handleContinue} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Enter mobile number or email</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder=""
                      className="w-full rounded border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-black"
                    />
                    {identifier && (
                      <button
                        type="button"
                        onClick={() => setIdentifier('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checking}
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-normal rounded-md border border-yellow-500 transition-colors disabled:opacity-60 text-sm"
                >
                  {checking ? 'Checking...' : 'Continue'}
                </button>
              </form>

              <p className="text-xs text-gray-600 mt-4">
                By continuing, you agree to ShopNow's <a href="#" className="text-blue-700 hover:text-orange-600 hover:underline">Conditions of Use</a> and <a href="#" className="text-blue-700 hover:text-orange-600 hover:underline">Privacy Notice</a>.
              </p>
            </>
          )}

          {step === 'register_prompt' && (
            <>
              <h1 className="text-2xl font-normal text-gray-900 mb-2">It looks like you are new to ShopNow</h1>
              <p className="text-sm text-gray-900 mb-4">
                {identifier} <button onClick={() => setStep('identifier')} className="text-blue-700 hover:text-orange-600 hover:underline text-sm ml-1">Change</button>
              </p>
              <p className="text-sm text-gray-900 mb-4">Let's create an account using your mobile number or email</p>
              
              <Link
                to={`/register?identifier=${encodeURIComponent(identifier)}`}
                className="block w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-center font-normal rounded-md border border-yellow-500 transition-colors text-sm"
              >
                Proceed to create an account
              </Link>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="text-sm text-gray-900">
                <p className="font-bold mb-2">Already a customer?</p>
                <button onClick={() => setStep('identifier')} className="text-blue-700 hover:text-orange-600 hover:underline text-sm">
                  Sign in with another email or mobile number
                </button>
              </div>
            </>
          )}

          {step === 'signin' && (
            <>
              <h1 className="text-2xl font-normal text-gray-900 mb-2">Sign in</h1>
              <p className="text-sm text-gray-900 mb-4">
                {identifier} <button onClick={() => setStep('identifier')} className="text-blue-700 hover:text-orange-600 hover:underline text-sm ml-1">Change</button>
              </p>
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-bold text-gray-900">Password</label>
                    <a href="#" className="text-sm text-blue-700 hover:text-orange-600 hover:underline">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full rounded border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-normal rounded-md border border-yellow-500 transition-colors disabled:opacity-60 text-sm"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-2 text-xs text-gray-500">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="space-y-2">
                <button className="w-full py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-50 text-black">Sign in with a passkey</button>
                <button className="w-full py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-50 text-black">Sign in with ShopNow app</button>
                <button className="w-full py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-50 text-black">Sign in with an OTP</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
