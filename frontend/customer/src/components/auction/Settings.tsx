import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

type TabType = 'Account Profile' | 'Security & Privacy' | 'Notifications' | 'Payment Methods' | 'Auction Preferences';

export default function Settings() {
  const { customer, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Account Profile');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
  });

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    security: {
      two_factor: false,
    },
    auction_preferences: {
      auto_bid: false,
      max_bid_alerts: true,
    },
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        dob: customer.dob ? customer.dob.split('T')[0] : '',
      });
      if (customer.settings) {
        setSettings({
          notifications: { ...settings.notifications, ...(customer.settings.notifications || {}) },
          security: { ...settings.security, ...(customer.settings.security || {}) },
          auction_preferences: { ...settings.auction_preferences, ...(customer.settings.auction_preferences || {}) },
        });
      }
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, [customer]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      const data = res.data.data;
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        dob: data.dob ? data.dob.split('T')[0] : '',
      });
      if (data.settings) {
        setSettings({
          notifications: { ...settings.notifications, ...(data.settings.notifications || {}) },
          security: { ...settings.security, ...(data.settings.security || {}) },
          auction_preferences: { ...settings.auction_preferences, ...(data.settings.auction_preferences || {}) },
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleNotification = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleToggleSecurity = (key: keyof typeof settings.security) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key],
      },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        settings: settings,
      });
      toast.success('Settings updated successfully');
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        dob: customer.dob ? customer.dob.split('T')[0] : '',
      });
      if (customer.settings) {
        setSettings({
          notifications: { ...settings.notifications, ...(customer.settings.notifications || {}) },
          security: { ...settings.security, ...(customer.settings.security || {}) },
          auction_preferences: { ...settings.auction_preferences, ...(customer.settings.auction_preferences || {}) },
        });
      }
    }
    toast.success('Changes discarded');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const tabs: { id: TabType; icon: React.ReactNode }[] = [
    { id: 'Account Profile', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: 'Security & Privacy', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg> },
    { id: 'Notifications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { id: 'Payment Methods', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { id: 'Auction Preferences', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ];

  return (
    <div className="min-h-screen font-sans">
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-2">
          <Link to="/" className="hover:text-blue-600">Home</Link> <span className="mx-1">&gt;</span> <span className="text-slate-700">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, notification preferences, and security settings.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Navigation Sidebar */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sticky top-6">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${activeTab === tab.id ? 'bg-orange-50 text-orange-600 font-bold' : 'hover:bg-slate-50 text-slate-600 font-semibold'}`}
                >
                  {tab.icon}
                  {tab.id}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-slate-50 px-3 pb-3">
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 font-bold text-sm hover:bg-red-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Settings Content */}
        <div className="xl:col-span-9 space-y-6 pb-12">
          {/* Account Profile Section */}
          {activeTab === 'Account Profile' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-slate-50">
                 <h3 className="font-bold text-slate-900 text-base">Account Profile</h3>
                 <p className="text-xs text-slate-500 mt-1">Update your personal information and profile picture.</p>
              </div>
              <div className="p-8">
                 <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-white shadow-md overflow-hidden">
                         <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=f97316&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-orange-600 transition-colors">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">Full Name</label>
                          <input 
                            type="text" 
                            name="name"
                            value={formData.name} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-800" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">Email Address</label>
                          <input 
                            type="email" 
                            name="email"
                            value={formData.email} 
                            disabled
                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm transition-all font-medium text-slate-500 cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">Phone Number</label>
                          <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-800" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">Date of Birth</label>
                          <input 
                            type="date" 
                            name="dob"
                            value={formData.dob} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium text-slate-800" 
                          />
                       </div>
                    </div>
                 </div>

                 <div className="mt-12 flex justify-end gap-4">
                    <button 
                      onClick={handleDiscard}
                      className="px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Discard Changes
                    </button>
                    <button 
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeTab === 'Security & Privacy' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="font-bold text-slate-900 text-base">Security Settings</h3>
                    <p className="text-xs text-slate-500 mt-1">Keep your account secure with these settings.</p>
                 </div>
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    Account Secured
                 </span>
              </div>
              <div className="p-6 space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">Two-Factor Authentication</h4>
                          <p className="text-[11px] text-slate-500">Secure your account with 2FA protection</p>
                       </div>
                    </div>
                    <div 
                      onClick={() => handleToggleSecurity('two_factor')}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.security.two_factor ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                       <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.security.two_factor ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-500 shadow-sm border border-slate-100">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">Update Password</h4>
                          <p className="text-[11px] text-slate-500">Change your password regularly</p>
                       </div>
                    </div>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">Change Password</button>
                 </div>
                 
                 <div className="mt-12 flex justify-end gap-4">
                    <button 
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                      {saving ? 'Saving...' : 'Save Security Settings'}
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeTab === 'Notifications' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-slate-50">
                 <h3 className="font-bold text-slate-900 text-base">Notification Preferences</h3>
                 <p className="text-xs text-slate-500 mt-1">Control how you receive alerts and updates.</p>
              </div>
              <div className="p-6">
                 <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-slate-800 text-xs">Email Notifications</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Receive auction updates and promotional emails.</p>
                       </div>
                       <div 
                          onClick={() => handleToggleNotification('email')}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.notifications.email ? 'bg-orange-500' : 'bg-slate-200'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.notifications.email ? 'right-0.5' : 'left-0.5'}`}></div>
                       </div>
                    </div>
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-slate-800 text-xs">Push Notifications</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Real-time alerts for bids and won auctions.</p>
                       </div>
                       <div 
                          onClick={() => handleToggleNotification('push')}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.notifications.push ? 'bg-orange-500' : 'bg-slate-200'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.notifications.push ? 'right-0.5' : 'left-0.5'}`}></div>
                       </div>
                    </div>
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-slate-800 text-xs">SMS Alerts</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Important account and security alerts via SMS.</p>
                       </div>
                       <div 
                          onClick={() => handleToggleNotification('sms')}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.notifications.sms ? 'bg-orange-500' : 'bg-slate-200'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.notifications.sms ? 'right-0.5' : 'left-0.5'}`}></div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-12 flex justify-end gap-4">
                    <button 
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                      {saving ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* Payment Methods Section */}
          {activeTab === 'Payment Methods' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="font-bold text-slate-900 text-base">Payment Methods</h3>
                    <p className="text-xs text-slate-500 mt-1">Manage your saved cards and UPI IDs.</p>
                 </div>
                 <button className="px-4 py-2 bg-orange-500 text-white rounded-xl text-[11px] font-bold hover:bg-orange-600 transition-colors shadow-sm">Add New Method</button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center border border-slate-200 overflow-hidden">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="w-8 h-8 object-contain" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">Visa ending in 4242</h4>
                          <p className="text-[11px] text-slate-500">Expires 12/28</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">Default</span>
                       <button className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                       </button>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center border border-slate-200 overflow-hidden">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="w-8 h-8 object-contain" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">Mastercard ending in 8899</h4>
                          <p className="text-[11px] text-slate-500">Expires 05/26</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button className="text-[10px] font-bold text-orange-600 hover:underline">Set as Default</button>
                       <button className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Auction Preferences Section */}
          {activeTab === 'Auction Preferences' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-slate-50">
                 <h3 className="font-bold text-slate-900 text-base">Auction Preferences</h3>
                 <p className="text-xs text-slate-500 mt-1">Customize your bidding experience.</p>
              </div>
              <div className="p-6">
                 <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-slate-800 text-xs">Auto-Bidding (Global)</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Automatically place bids up to your limit on all auctions.</p>
                       </div>
                       <div 
                          onClick={() => setSettings(prev => ({ ...prev, auction_preferences: { ...prev.auction_preferences, auto_bid: !prev.auction_preferences.auto_bid } }))}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.auction_preferences.auto_bid ? 'bg-orange-500' : 'bg-slate-200'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.auction_preferences.auto_bid ? 'right-0.5' : 'left-0.5'}`}></div>
                       </div>
                    </div>
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-slate-800 text-xs">Max Bid Alerts</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Get notified when an auction exceeds your set maximum bid.</p>
                       </div>
                       <div 
                          onClick={() => setSettings(prev => ({ ...prev, auction_preferences: { ...prev.auction_preferences, max_bid_alerts: !prev.auction_preferences.max_bid_alerts } }))}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.auction_preferences.max_bid_alerts ? 'bg-orange-500' : 'bg-slate-200'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.auction_preferences.max_bid_alerts ? 'right-0.5' : 'left-0.5'}`}></div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-12 flex justify-end gap-4">
                    <button 
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                      {saving ? 'Saving...' : 'Save Auction Preferences'}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
