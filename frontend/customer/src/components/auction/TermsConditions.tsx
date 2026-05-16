import { Link } from 'react-router-dom';

export default function TermsConditions() {
  return (
    <div className="min-h-screen font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-2">
            <Link to="/" className="hover:text-blue-600">Home</Link> <span className="mx-1">&gt;</span> <span className="text-slate-700">Terms & Conditions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Terms & Conditions</h1>
          <p className="text-sm text-slate-500 mt-1 mb-2">Please read these terms and conditions carefully before using AuctionPro.</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Last Updated: May 14, 2025
          </p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
        
        {/* Left Sidebar Navigation */}
        <div className="xl:col-span-3 hidden xl:block">
          <div className="sticky top-6">
            <h3 className="font-bold text-slate-900 mb-4 text-sm">On this page</h3>
            <nav className="space-y-1 relative before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-100 pl-4">
              <a href="#intro" className="block py-2 text-xs font-bold text-orange-500 relative before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-[17px] before:w-0.5 before:h-full before:bg-orange-500 before:rounded-r">
                1. Introduction
              </a>
              <a href="#user-accounts" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                2. User Accounts
              </a>
              <a href="#bidding" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                3. Bidding and Auctions
              </a>
              <a href="#payments" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                4. Payments and Fees
              </a>
              <a href="#shipping" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                5. Shipping and Delivery
              </a>
              <a href="#returns" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                6. Returns and Refunds
              </a>
              <a href="#prohibited" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                7. Prohibited Activities
              </a>
              <a href="#intellectual" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                8. Intellectual Property
              </a>
              <a href="#liability" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                9. Limitation of Liability
              </a>
              <a href="#termination" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                10. Termination
              </a>
              <a href="#governing" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                11. Governing Law
              </a>
              <a href="#changes" className="block py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                12. Changes to Terms
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-6 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative pb-24">
           <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
              <section id="intro">
                 <h2 className="text-lg font-bold text-slate-900 mb-3">1. Introduction</h2>
                 <p>Welcome to AuctionPro. These Terms and Conditions govern your access to and use of our website, mobile application, and related services (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms.</p>
              </section>

              <section id="user-accounts">
                 <h2 className="text-lg font-bold text-slate-900 mb-3">2. User Accounts</h2>
                 <p>To participate in auctions, you must create an account. You agree to provide accurate, current, and complete information and to update it as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              </section>

              <section id="bidding">
                 <h2 className="text-lg font-bold text-slate-900 mb-3">3. Bidding and Auctions</h2>
                 <ul className="list-disc pl-5 space-y-2 marker:text-slate-300">
                    <li>All auctions are subject to the rules and specific terms displayed on the auction page.</li>
                    <li>Placing a bid is a legal and binding offer to purchase the item if you are the winning bidder.</li>
                    <li>AuctionPro reserves the right to cancel, suspend, or modify any auction at any time.</li>
                    <li>We are not responsible for any technical issues that may affect your ability to place a bid.</li>
                 </ul>
              </section>

              <section id="payments">
                 <h2 className="text-lg font-bold text-slate-900 mb-3">4. Payments and Fees</h2>
                 <p>All payments must be made in full through the accepted payment methods on our Platform. Applicable fees, including buyer's premium and processing fees, will be shown before you confirm your payment.</p>
              </section>

              <section id="shipping">
                 <h2 className="text-lg font-bold text-slate-900 mb-3">5. Shipping and Delivery</h2>
                 <p>Sellers are responsible for shipping items as described in their listings. Estimated delivery times are provided by sellers and are not guaranteed by AuctionPro.</p>
              </section>

              <section id="returns">
                 <h2 className="text-lg font-bold text-slate-900 mb-3">6. Returns and Refunds</h2>
                 <p>Returns and refunds are subject to the seller's return policy. Please review the return policy on the item page before bidding.</p>
              </section>
              
              {/* Fade out for "View More" effect */}
              <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-white via-white to-transparent pointer-events-none rounded-b-2xl"></div>
              
              <div className="absolute bottom-10 left-0 w-full flex justify-center z-10">
                 <button className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-6 rounded-full shadow-sm text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors">
                   View More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                 </button>
              </div>
           </div>
           
           {/* Sticky Agreement Bar */}
           <div className="absolute -bottom-16 left-0 w-full bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white border border-orange-200 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                 </div>
                 <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                   By using AuctionPro, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
                 </p>
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-8 rounded-xl transition-colors shadow-sm shadow-orange-200 text-sm whitespace-nowrap">
                I Agree
              </button>
           </div>
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Why These Terms Matter */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 text-sm">Why These Terms Matter</h3>
            <div className="mb-6 flex justify-center">
               <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18"/><path d="M5 21V7"/><path d="M19 21V7"/><path d="M3 7h18"/><circle cx="12" cy="14" r="2"/></svg>
               </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-6 text-center leading-relaxed">
              Our Terms & Conditions help protect both buyers and sellers by setting clear expectations and guidelines for a safe and trusted auction experience.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0 mt-0.5">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Fair & Transparent</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed">We ensure a fair and transparent environment for all users.</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0 mt-0.5">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Secure Transactions</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed">Your payments and personal information are protected.</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0 mt-0.5">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-[11px] mb-0.5">Trusted Community</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed">We promote responsible behavior and a trusted marketplace.</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Need Help? */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex gap-4">
             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
             </div>
             <div>
               <h4 className="font-bold text-slate-900 text-sm mb-1">Need Help?</h4>
               <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">If you have any questions about these Terms & Conditions, our support team is here to help.</p>
               <button className="border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 w-full py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">Contact Support</button>
             </div>
          </div>

          {/* Related Policies */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
             <div className="px-5 py-4 border-b border-slate-100">
               <h3 className="font-bold text-slate-900 text-sm">Related Policies</h3>
             </div>
             <div className="divide-y divide-slate-100 p-2">
               <a href="#" className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group">
                 <div className="flex gap-3 items-center">
                   <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                   </div>
                   <span className="font-semibold text-slate-700 text-[11px]">Privacy Policy</span>
                 </div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
               </a>
               <a href="#" className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group">
                 <div className="flex gap-3 items-center">
                   <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                   </div>
                   <span className="font-semibold text-slate-700 text-[11px]">Refund Policy</span>
                 </div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
               </a>
               <a href="#" className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group">
                 <div className="flex gap-3 items-center">
                   <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                   </div>
                   <span className="font-semibold text-slate-700 text-[11px]">Shipping Policy</span>
                 </div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
               </a>
               <a href="#" className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group">
                 <div className="flex gap-3 items-center">
                   <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                   </div>
                   <span className="font-semibold text-slate-700 text-[11px]">Cookies Policy</span>
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
