import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useAdminAuthStore from '../store/adminAuthStore';
import RoleBadge from '../components/ui/RoleBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../lib/api';

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const INPUT_ERR_CLS = 'w-full px-3 py-2 border border-red-400 bg-red-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

export default function SettingsPage() {
  const { admin } = useAdminAuthStore();
  const [changingPassword, setChangingPassword] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState(60);
  const [updatingDuration, setUpdatingDuration] = useState(false);

  useEffect(() => {
    const fetchDuration = async () => {
      try {
        const res = await api.get('/admin/settings/auction-duration');
        setAuctionDuration(res.data.data.duration);
      } catch (err) {
        console.error('Failed to fetch duration:', err);
      }
    };
    fetchDuration();
  }, []);

  const onUpdateDuration = async () => {
    if (!auctionDuration || auctionDuration <= 0) {
      toast.error('Duration must be a positive number');
      return;
    }
    setUpdatingDuration(true);
    try {
      await api.put('/admin/settings/auction-duration', { duration: auctionDuration });
      toast.success('Auction duration updated successfully');
    } catch {
      toast.error('Failed to update duration');
    } finally {
      setUpdatingDuration(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onChangePassword = async (data: PasswordForm) => {
    try {
      await api.post('/admin/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Password changed successfully');
      reset();
      setChangingPassword(false);
    } catch {
      toast.error('Failed to change password. Check your current password.');
    }
  };

  if (!admin) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Settings</h2>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Admin Profile</h3>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-xl font-bold text-blue-700 uppercase">
            {admin.name.charAt(0)}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold text-gray-900">{admin.name}</h4>
              <RoleBadge role={admin.role} />
            </div>
            <p className="text-sm text-gray-500">{admin.email}</p>
            <p className="text-xs text-gray-400">
              Member since {new Date(admin.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Role</p>
            <RoleBadge role={admin.role} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Account Status</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Change Password</h3>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Change
            </button>
          )}
        </div>

        {changingPassword ? (
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                {...register('current_password')}
                className={errors.current_password ? INPUT_ERR_CLS : INPUT_CLS}
                placeholder="Enter current password"
              />
              {errors.current_password && (
                <p className="text-red-500 text-xs mt-1">{errors.current_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                {...register('new_password')}
                className={errors.new_password ? INPUT_ERR_CLS : INPUT_CLS}
                placeholder="Minimum 8 characters"
              />
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                {...register('confirm_password')}
                className={errors.confirm_password ? INPUT_ERR_CLS : INPUT_CLS}
                placeholder="Re-enter new password"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isSubmitting && <LoadingSpinner size="sm" />}
                Update Password
              </button>
              <button
                type="button"
                onClick={() => { reset(); setChangingPassword(false); }}
                className="px-5 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            Your password was last changed on{' '}
            {admin.last_login ? new Date(admin.last_login).toLocaleDateString('en-IN') : 'an unknown date'}.
          </p>
        )}
      </div>
      {/* Auction Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Auction Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Auction Duration (Minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(parseInt(e.target.value, 10))}
                className={INPUT_CLS}
                placeholder="Enter duration in minutes"
              />
              <button
                onClick={onUpdateDuration}
                disabled={updatingDuration}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {updatingDuration && <LoadingSpinner size="sm" />}
                Save
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This setting controls how long each bidding slot lasts before moving to the next item.
            </p>
          </div>
        </div>
      </div>


      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-medium text-blue-800">Security Notice</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Admin accounts have access to sensitive business data. Use a strong, unique password and never share your credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
