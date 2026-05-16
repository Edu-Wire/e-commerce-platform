import { Link } from 'react-router-dom';

export default function HelpSupport() {
  return (
    <div className="min-h-screen font-sans">
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-2">
          <Link to="/" className="hover:text-blue-600">Home</Link> <span className="mx-1">&gt;</span> <span className="text-slate-700">Help & Support</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="text-sm text-slate-500 mt-1">We're here to help you with everything you need.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Content (Left) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Search Header Section */}
          <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
             </div>
             <div className="relative z-10 max-w-xl">
               <h2 className="text-xl font-bold text-slate-900 mb-4">How can we help you today?</h2>
               
               <div className="relative mb-4 shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                 </div>
                 <input type="text" className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Search for help articles, topics or questions..." />
               </div>

               <div className="flex items-center gap-3 text-xs">
                 <span className="text-slate-500 font-medium">Popular Searches:</span>
                 <div className="flex gap-2">
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm">How to place a bid</span>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm">Payments</span>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm">Auto Bid</span>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm">Refunds</span>
                 </div>
               </div>
             </div>
          </div>

          {/* Browse by Topic */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4">Browse by Topic</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               {/* Topic 1 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14 13-3 3 2 2 3-3-2-2z"/><path d="m21 21-3-3"/><path d="M16 11l4-4a2.8 2.8 0 0 0-4-4l-4 4"/><path d="M9 13l-4 4a2.8 2.8 0 0 0 4 4l4-4"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">Bidding & Auctions</h4>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">Learn how auctions work and how to place bids.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-auto pt-3 border-t border-slate-50">
                    <span>12 Articles</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
               </div>

               {/* Topic 2 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">Payments & Wallet</h4>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">Manage payments, wallet, and transactions.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-auto pt-3 border-t border-slate-50">
                    <span>10 Articles</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
               </div>

               {/* Topic 3 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">Winning & Shipping</h4>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">Everything about winning auctions and shipping.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-auto pt-3 border-t border-slate-50">
                    <span>8 Articles</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
               </div>

               {/* Topic 4 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">Account & Security</h4>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">Manage your account and security settings.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-auto pt-3 border-t border-slate-50">
                    <span>9 Articles</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
               </div>

               {/* Topic 5 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-4 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">General</h4>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">General questions and platform information.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-auto pt-3 border-t border-slate-50">
                    <span>6 Articles</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* FAQs */}
             <div>
                <h3 className="font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
                  <button className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 transition-colors rounded-t-2xl group">
                    <span className="font-semibold text-slate-800 text-xs">How do I place a bid on an auction?</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-slate-600"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 transition-colors group">
                    <span className="font-semibold text-slate-800 text-xs">What happens if I am outbid?</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-slate-600"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 transition-colors group">
                    <span className="font-semibold text-slate-800 text-xs">How does the Auto Bid feature work?</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-slate-600"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 transition-colors group">
                    <span className="font-semibold text-slate-800 text-xs">When and how do I pay if I win an auction?</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-slate-600"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 transition-colors group">
                    <span className="font-semibold text-slate-800 text-xs">Can I cancel my bid?</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-slate-600"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <button className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 transition-colors group">
                    <span className="font-semibold text-slate-800 text-xs">How do refunds work?</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-slate-600"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <div className="p-3 text-center bg-slate-50/50 rounded-b-2xl">
                    <button className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 mx-auto w-full py-2">
                       View All FAQs <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
             </div>

             {/* Guides & Resources */}
             <div>
                <h3 className="font-bold text-slate-900 mb-4">Guides & Resources</h3>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 space-y-1">
                  <a href="#" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Getting Started Guide</h4>
                      <p className="text-[10px] text-slate-500">A step-by-step guide for new users</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-blue-500"><path d="m9 18 6-6-6-6"/></svg>
                  </a>

                  <a href="#" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">How Auctions Work</h4>
                      <p className="text-[10px] text-slate-500">Understand the auction process</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-blue-500"><path d="m9 18 6-6-6-6"/></svg>
                  </a>

                  <a href="#" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Auto Bid Explained</h4>
                      <p className="text-[10px] text-slate-500">Maximize your winning chances</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-blue-500"><path d="m9 18 6-6-6-6"/></svg>
                  </a>

                  <a href="#" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Payment & Fees</h4>
                      <p className="text-[10px] text-slate-500">All about payments and fees</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-blue-500"><path d="m9 18 6-6-6-6"/></svg>
                  </a>

                  <a href="#" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Shipping Information</h4>
                      <p className="text-[10px] text-slate-500">Delivery and shipping details</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-blue-500"><path d="m9 18 6-6-6-6"/></svg>
                  </a>

                  <div className="p-1 pt-2 text-center bg-slate-50/50 rounded-b-xl mt-1 border-t border-slate-100">
                    <button className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 mx-auto w-full py-2">
                       View All Guides <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               </div>
               <div>
                 <h4 className="font-bold text-slate-900 text-sm mb-0.5">Can't find what you're looking for?</h4>
                 <p className="text-[11px] text-slate-600">Send us a message and we'll get back to you.</p>
               </div>
             </div>
             <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-xs flex items-center gap-2">
               Submit a Request <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
             </button>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Contact Support */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-1 text-sm">Contact Support</h3>
            <p className="text-[11px] text-slate-500 mb-5">Choose the best way to reach us</p>
            
            <div className="space-y-3">
              <a href="#" className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors flex-shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold text-slate-900 text-xs">Live Chat</h4>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-0.5 font-medium">Chat with our support team</p>
                  <p className="text-[10px] text-slate-400">Instant response</p>
                </div>
              </a>

              <a href="#" className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-xs mb-0.5">Email Support</h4>
                  <p className="text-[11px] text-slate-600 mb-0.5 font-medium">support@auctionpro.com</p>
                  <p className="text-[10px] text-slate-400">Response within 24 hours</p>
                </div>
              </a>

              <a href="#" className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-xs mb-0.5">Phone Support</h4>
                  <p className="text-[11px] text-slate-600 mb-0.5 font-medium">+91 98765 43210</p>
                  <p className="text-[10px] text-slate-400">Mon - Fri, 9:00 AM - 6:00 PM IST</p>
                </div>
              </a>

              <a href="#" className="flex gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors flex-shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-xs mb-0.5">WhatsApp Support</h4>
                  <p className="text-[11px] text-slate-600 mb-0.5 font-medium">+91 98765 43210</p>
                  <p className="text-[10px] text-slate-400">Mon - Fri, 9:00 AM - 6:00 PM IST</p>
                </div>
              </a>
            </div>
          </div>

          {/* Need more help */}
          <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 flex flex-col justify-between h-48 relative overflow-hidden">
             <div className="absolute right-[-20px] top-[-10px] opacity-10">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
             </div>
             <div className="relative z-10 w-2/3">
               <h3 className="font-bold text-slate-900 mb-2 text-[15px]">Need more help?</h3>
               <p className="text-[11px] text-slate-600 leading-relaxed mb-4 font-medium">Our support team is ready to assist you.</p>
               <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm shadow-orange-200 text-xs flex items-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                 Start Live Chat
               </button>
             </div>
             <div className="relative z-10 mt-2">
               <p className="text-[9px] text-slate-500 font-medium">Average response time: 1 min</p>
             </div>
             <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <img src="https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80" alt="Support" className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" />
             </div>
          </div>

          {/* Support Center */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
             <div className="px-5 py-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-900 text-sm">Support Center</h3>
             </div>
             <div className="divide-y divide-slate-100">
               <a href="#" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
                 <div className="flex gap-3 items-center">
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">System Status</h4>
                     <p className="text-[10px] text-slate-500">All systems operational</p>
                   </div>
                 </div>
                 <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                 </div>
               </a>

               <a href="#" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
                 <div className="flex gap-3 items-center">
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Report an Issue</h4>
                     <p className="text-[10px] text-slate-500">Let us know about a problem</p>
                   </div>
                 </div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
               </a>

               <a href="#" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
                 <div className="flex gap-3 items-center">
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Feature Request</h4>
                     <p className="text-[10px] text-slate-500">Share your suggestions</p>
                   </div>
                 </div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
               </a>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
