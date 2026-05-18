import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

// Mock schema since we might not have a backend for this yet
const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  link_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  type: z.enum(['info', 'warning', 'success']),
  is_active: z.boolean().default(true),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

// Mock data
const mockAnnouncements = [
  {
    id: 1,
    title: 'Diwali Mega Sale 2026',
    message: 'Get up to 50% off on all electronics this Diwali. Use code DIWALI50.',
    link_url: '',
    type: 'warning',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'System Maintenance',
    message: 'The seller dashboard will be down for maintenance from 2 AM to 4 AM.',
    link_url: '',
    type: 'info',
    is_active: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

const INPUT_CLS = 'w-full px-3 py-1.5 border border-[#888c8c] rounded-[3px] text-sm focus:outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)] bg-white text-[#0f1111] transition-shadow';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { type: 'info', is_active: true }
  });

  const onSubmit = (data: AnnouncementForm) => {
    // Mock save
    const newAnnouncement = {
      id: Date.now(),
      ...data,
      link_url: data.link_url || '',
      created_at: new Date().toISOString()
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    toast.success('Announcement created successfully');
    reset();
    setModalOpen(false);
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    setAnnouncements(announcements.map(a =>
      a.id === id ? { ...a, is_active: !currentStatus } : a
    ));
    toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="w-full pb-12 px-2 sm:px-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-300 p-4 rounded shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">
            Announcements
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Manage global alerts, sales banners, and maintenance notices shown to customers.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => { reset(); setModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded-[3px] shadow-sm transition-colors"
          >
            Create Announcement
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f0f2f2] border-b border-gray-300 text-[#0f1111]">
                <th className="px-4 py-2 font-bold border-r border-gray-300">Title & Message</th>
                <th className="px-4 py-2 font-bold border-r border-gray-300">Type</th>
                <th className="px-4 py-2 font-bold border-r border-gray-300 w-24">Status</th>
                <th className="px-4 py-2 font-bold border-r border-gray-300 w-32">Created</th>
                <th className="px-4 py-2 font-bold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No announcements found.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-[#f7fafa] bg-white transition-colors">
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="font-bold text-[#0f1111]">{announcement.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{announcement.message}</div>
                      {announcement.link_url && (
                        <a href={announcement.link_url} target="_blank" rel="noreferrer" className="text-xs text-[#007185] hover:text-[#c40000] hover:underline mt-1 block truncate">
                          {announcement.link_url}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-[3px] text-xs font-bold border capitalize ${announcement.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          announcement.type === 'warning' ? 'bg-orange-50 text-orange-800 border-orange-300' :
                            'bg-green-50 text-green-800 border-green-300'
                        }`}>
                        {announcement.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200">
                      <span className={`px-2 py-1 rounded-[3px] text-xs font-bold border whitespace-nowrap ${announcement.is_active ? 'bg-green-50 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                        {announcement.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 border-r border-gray-200 whitespace-nowrap text-xs">
                      {new Date(announcement.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                        className="w-full sm:w-auto px-3 py-1 text-xs font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded-[3px] hover:bg-[#f7fafa] shadow-sm transition-colors text-center"
                      >
                        {announcement.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Announcement Modal */}
      <Modal title="Create Announcement" isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
          <div>
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Internal Title</label>
            <input {...register('title')} className={INPUT_CLS} placeholder="e.g. Summer Sale 2026" />
            {errors.title && <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Message (Shown to Customers)</label>
            <textarea {...register('message')} rows={3} className={INPUT_CLS} placeholder="e.g. Get 50% off on all items!"></textarea>
            {errors.message && <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.message.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#0f1111] mb-1">Link URL (Optional)</label>
            <input type="url" {...register('link_url')} className={INPUT_CLS} placeholder="https://shopnow.in/sale" />
            {errors.link_url && <p className="text-[#c40000] text-xs mt-1 font-medium">{errors.link_url.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#0f1111] mb-1">Theme Type</label>
              <select {...register('type')} className={INPUT_CLS}>
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Orange)</option>
                <option value="success">Success (Green)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0f1111] mb-1">Initial Status</label>
              <select {...register('is_active', { setValueAs: v => v === 'true' })} className={INPUT_CLS}>
                <option value="true">Active (Show instantly)</option>
                <option value="false">Inactive (Draft)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded-[3px] hover:bg-[#f7fafa] shadow-sm transition-colors text-center order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded-[3px] shadow-sm transition-colors order-1 sm:order-2"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
