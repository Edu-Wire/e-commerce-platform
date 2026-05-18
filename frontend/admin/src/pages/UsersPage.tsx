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

const userSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['owner', 'manager', 'inventory_staff', 'viewer'] as const),
});
type UserForm = z.infer<typeof userSchema>;

const INPUT_CLS = 'w-full px-3 py-1.5 border border-[#888c8c] rounded-[3px] text-sm focus:outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)] bg-white text-[#0f1111] transition-shadow';

export default function UsersPage() {
  const { admin: currentAdmin } = useAdminAuthStore();
  const navigate = useNavigate();

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
    <div className="w-full pb-12 px-2 sm:px-0 space-y-6">
      {/* Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-300 p-4 rounded shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">
            User Permissions
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Manage access and roles for your seller account.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => { reset(); setModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded-md shadow-sm transition-colors"
          >
            Add a New User
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
          <h3 className="text-sm font-bold text-[#0f1111]">Current Users</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left border-collapse">
            <thead className="bg-[#f7fafa] border-b border-gray-300">
              <tr>
                {['Name / Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2 font-bold text-[#0f1111] whitespace-nowrap border-r border-gray-300 last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="hover:bg-[#f7fafa]">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3 border-r border-gray-200 last:border-r-0">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (users ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500 font-medium">No users found.</td>
                    </tr>
                  ) : (
                    (users ?? []).map((user) => {
                      const isSelf = user.id === currentAdmin?.id;
                      return (
                        <tr key={user.id} className="hover:bg-[#f7fafa] bg-white">
                          <td className="px-4 py-2 border-r border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold uppercase border ${
                                isSelf ? 'bg-amazon-orange/10 text-amazon-orange border-amazon-orange' : 'bg-gray-100 text-[#0f1111] border-gray-300'
                              }`}>
                                {user.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#0f1111] truncate">
                                  {user.name} {isSelf && <span className="text-xs text-amazon-orange ml-1">(you)</span>}
                                </div>
                                <div className="text-xs text-gray-600 truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 border-r border-gray-200">
                            {isSelf ? (
                              <RoleBadge role={user.role} />
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) => void handleRoleChange(user, e.target.value as AdminRole)}
                                className={INPUT_CLS}
                              >
                                <option value="owner">Owner</option>
                                <option value="manager">Manager</option>
                                <option value="inventory_staff">Inventory Staff</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-2 border-r border-gray-200">
                            <span className={`px-2 py-1 rounded-[3px] text-xs font-bold border whitespace-nowrap ${
                              user.is_active ? 'bg-green-50 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                            {user.last_login ? new Date(user.last_login).toLocaleString('en-IN', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              }) : 'Never'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {!isSelf && user.role !== 'owner' && (
                              <button
                                onClick={() => void handleToggleActive(user)}
                                className="w-full sm:w-auto px-3 py-1 text-xs font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded hover:bg-[#f7fafa] shadow-sm transition-colors text-center"
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
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Full Name</label>
            <input {...register('name')} className={INPUT_CLS} placeholder="e.g. John Doe" />
            {errors.name && <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Email Address</label>
            <input type="email" {...register('email')} className={INPUT_CLS} placeholder="e.g. user@store.com" />
            {errors.email && <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Password</label>
            <input type="password" {...register('password')} className={INPUT_CLS} placeholder="At least 8 characters" />
            {errors.password && <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Role</label>
            <select {...register('role')} className={INPUT_CLS}>
              <option value="viewer">Viewer (Read-only)</option>
              <option value="inventory_staff">Inventory Staff</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner (Full Access)</option>
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded hover:bg-[#f7fafa] shadow-sm transition-colors text-center order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded shadow-sm disabled:opacity-60 transition-colors order-1 sm:order-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
