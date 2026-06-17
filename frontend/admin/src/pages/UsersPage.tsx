import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser } from '../hooks/useAdminUsers';
import useAdminAuthStore from '../store/adminAuthStore';
import RoleBadge from '../components/ui/RoleBadge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { AdminRole, AdminUser } from '../types';
import { UserPlus } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['owner', 'manager', 'inventory_staff', 'viewer'] as const),
});
type UserForm = z.infer<typeof userSchema>;

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] transition-all bg-white';

export default function UsersPage() {
  const { admin: currentAdmin } = useAdminAuthStore();
  const navigate = useNavigate();
// 
  useEffect(() => {
    if (currentAdmin && currentAdmin.role !== 'owner') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentAdmin, navigate]);

  const { data: users, isLoading } = useAdminUsers();
  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();

  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'viewer' },
  });

  const onCreateUser = async (data: UserForm) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('User created');
      reset();
      setModalOpen(false);
    } catch {
      toast.error('Failed to create user');
    }
  };

  const handleRoleChange = async (user: AdminUser, role: AdminRole) => {
    try {
      await updateMutation.mutateAsync({ id: user.id, data: { role } });
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (user.id === currentAdmin?.id) {
      toast.error("You can't deactivate yourself");
      return;
    }
    if (user.role === 'owner') {
      toast.error("Can't deactivate another owner");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: user.id, data: { is_active: !user.is_active } });
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Header / Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">User Permissions</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">
              User Permissions
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Manage access and roles for your seller account.</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => { reset(); setModalOpen(true); }}
              className="w-full sm:w-auto px-4 py-2 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add a New User</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="bg-[#F4F9F4]/30 px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Current Users</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4 w-52">Role</th>
                  <th className="px-6 py-4 w-36 text-center">Status</th>
                  <th className="px-6 py-4 w-48">Last Login</th>
                  <th className="px-6 py-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-gray-50 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : (users ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No users found.</td>
                      </tr>
                    ) : (
                      (users ?? []).map((user) => {
                        const isSelf = user.id === currentAdmin?.id;
                        return (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase border ${
                                  isSelf 
                                    ? 'bg-emerald-50 text-[#0FA86E] border-emerald-100' 
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                  {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                    {user.name} 
                                    {isSelf && (
                                      <span className="text-[9px] font-black uppercase bg-emerald-50 border border-emerald-100 text-[#0FA86E] px-1 py-0.5 rounded-sm">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-400 font-medium">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isSelf ? (
                                <RoleBadge role={user.role} />
                              ) : (
                                <select
                                  value={user.role}
                                  onChange={(e) => void handleRoleChange(user, e.target.value as AdminRole)}
                                  className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none bg-white cursor-pointer w-full"
                                >
                                  <option value="owner">Owner</option>
                                  <option value="manager">Manager</option>
                                  <option value="inventory_staff">Inventory Staff</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${
                                user.is_active 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-bold whitespace-nowrap">
                              {user.last_login ? new Date(user.last_login).toLocaleString('en-IN', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                }) : 'Never'}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              {!isSelf && user.role !== 'owner' && (
                                <button
                                  onClick={() => void handleToggleActive(user)}
                                  className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-bold text-[11px] shadow-xs transition-colors"
                                >
                                  {user.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        <Modal title="Add New User" isOpen={modalOpen} onClose={() => setModalOpen(false)} size="sm">
          <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input {...register('name')} className={INPUT_CLS} placeholder="e.g. John Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input type="email" {...register('email')} className={INPUT_CLS} placeholder="e.g. user@store.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" {...register('password')} className={INPUT_CLS} placeholder="At least 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Role</label>
              <select {...register('role')} className={INPUT_CLS}>
                <option value="viewer">Viewer (Read-only)</option>
                <option value="inventory_staff">Inventory Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner (Full Access)</option>
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-md shadow-xs transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold rounded-md shadow-xs transition-colors order-1 sm:order-2"
              >
                {isSubmitting && <LoadingSpinner size="sm" />}
                <span>Create User</span>
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
