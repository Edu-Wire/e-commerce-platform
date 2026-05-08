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

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <button
          onClick={() => { reset(); setModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name / Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (users ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No users found.</td>
                    </tr>
                  ) : (
                    (users ?? []).map((user, i) => {
                      const isSelf = user.id === currentAdmin?.id;
                      return (
                        <tr key={user.id} className={i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium uppercase ${
                                isSelf ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">
                                  {user.name} {isSelf && <span className="text-xs text-blue-500">(you)</span>}
                                </div>
                                <div className="text-xs text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isSelf ? (
                              <RoleBadge role={user.role} />
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) => void handleRoleChange(user, e.target.value as AdminRole)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="owner">Owner</option>
                                <option value="manager">Manager</option>
                                <option value="inventory_staff">Inventory Staff</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString('en-IN') : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            {!isSelf && user.role !== 'owner' && (
                              <button
                                onClick={() => void handleToggleActive(user)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                  user.is_active
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
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
      <Modal title="Add Admin User" isOpen={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input {...register('name')} className={INPUT_CLS} placeholder="Full name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" {...register('email')} className={INPUT_CLS} placeholder="admin@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input type="password" {...register('password')} className={INPUT_CLS} placeholder="Min 8 characters" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select {...register('role')} className={INPUT_CLS}>
              <option value="viewer">Viewer</option>
              <option value="inventory_staff">Inventory Staff</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
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
