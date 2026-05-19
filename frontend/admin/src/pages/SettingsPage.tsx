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

const INPUT_CLS = 'w-full px-3 py-1.5 border border-[#888c8c] rounded-[3px] text-sm focus:outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)] bg-white text-[#0f1111] transition-shadow';
const INPUT_ERR_CLS = 'w-full px-3 py-1.5 border border-[#c40000] rounded-[3px] text-sm focus:outline-none focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)] bg-[#fff7f7] text-[#0f1111] transition-shadow';

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
    <div className="w-full pb-12 px-2 sm:px-0 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-4 rounded shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">Account Settings</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Manage your profile, security, and global platform preferences.</p>
      </div>

      {/* Info Card */}
      <div className="bg-[#f7fafa] border border-[#d5d9d9] rounded p-4 flex items-start gap-3">
        <span className="text-xl">ℹ️</span>
        <div>
          <p className="text-sm font-bold text-[#0f1111]">Security Notice</p>
          <p className="text-xs text-gray-700 mt-0.5">
            Admin accounts have access to sensitive business data. Use a strong, unique password and never share your credentials.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
          <h3 className="text-sm font-bold text-[#0f1111]">Admin Profile</h3>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-amazon-orange/10 border border-amazon-orange rounded-full flex items-center justify-center text-xl font-bold text-amazon-orange uppercase">
              {admin.name.charAt(0)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-[#0f1111]">{admin.name}</h4>
                <RoleBadge role={admin.role} />
              </div>
              <p className="text-sm text-[#0f1111]">{admin.email}</p>
              <p className="text-xs text-gray-500">
                Member since {new Date(admin.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Role</p>
              <RoleBadge role={admin.role} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Account Status</p>
              <span className="inline-flex items-center px-2 py-1 rounded-[3px] text-xs font-bold bg-green-50 text-green-800 border border-green-300">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f1111]">Login Settings</h3>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="text-sm text-[#007185] hover:text-[#c40000] hover:underline font-medium"
            >
              Edit Password
            </button>
          )}
        </div>
        <div className="p-5">
          {changingPassword ? (
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-bold text-[#0f1111] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  {...register('current_password')}
                  className={errors.current_password ? INPUT_ERR_CLS : INPUT_CLS}
                />
                {errors.current_password && (
                  <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.current_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0f1111] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  {...register('new_password')}
                  className={errors.new_password ? INPUT_ERR_CLS : INPUT_CLS}
                  placeholder="At least 8 characters"
                />
                {errors.new_password && (
                  <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0f1111] mb-1">
                  Re-enter New Password
                </label>
                <input
                  type="password"
                  {...register('confirm_password')}
                  className={errors.confirm_password ? INPUT_ERR_CLS : INPUT_CLS}
                />
                {errors.confirm_password && (
                  <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.confirm_password.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => { reset(); setChangingPassword(false); }}
                  className="w-full sm:w-auto px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded hover:bg-[#f7fafa] shadow-sm transition-colors text-center order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded shadow-sm disabled:opacity-60 transition-colors order-1 sm:order-2"
                >
                  {isSubmitting && <LoadingSpinner size="sm" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0f1111]">Password:</span>
              <span className="text-sm text-gray-700">********</span>
              <span className="text-xs text-gray-500 ml-4">
                (Last updated: {admin.last_login ? new Date(admin.last_login).toLocaleDateString('en-IN') : 'Unknown'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Auction Settings */}
      <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
          <h3 className="text-sm font-bold text-[#0f1111]">Global Preferences</h3>
        </div>
        <div className="p-5">
          <div className="max-w-md">
            <label className="block text-sm font-bold text-[#0f1111] mb-1">
              Default Auction Duration (Minutes)
            </label>
            <p className="text-xs text-gray-600 mb-3">
              This setting controls the default active bidding period for new auction items.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(parseInt(e.target.value, 10))}
                className={INPUT_CLS}
              />
              <button
                onClick={onUpdateDuration}
                disabled={updatingDuration}
                className="flex items-center gap-2 px-6 py-1.5 text-sm font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded hover:bg-[#f7fafa] shadow-sm disabled:opacity-60 transition-colors"
              >
                {updatingDuration && <LoadingSpinner size="sm" />}
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
