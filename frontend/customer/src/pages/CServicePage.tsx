import { Link } from 'react-router-dom';
import { useLanguageStore, translations } from '../store/languageStore';

export default function CustomerServicePage() {
  const { language } = useLanguageStore();
  const t = translations[language] || translations['EN'];

  const helpCategories = [
    {
      title: 'Your Orders',
      description: 'Track packages, edit or cancel orders',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      title: 'Returns & Refunds',
      description: 'Return or exchange items, print return labels',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4 2 4-2 4 2z" />
        </svg>
      )
    },
    {
      title: 'Manage Addresses',
      description: 'Update your shipping addresses',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: 'Payment Settings',
      description: 'Add or edit payment methods, update expired cards',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      title: 'Account Settings',
      description: 'Change your email or password',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: 'Digital Services & Device Support',
      description: 'Troubleshoot device issues, manage content',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <div className="bg-gray-50 border-b border-gray-200 py-10">
        <div className="max-w-[1000px] mx-auto px-4 text-center">
          <h1 className="text-3xl font-medium text-gray-900 mb-6">Hello. What can we help you with?</h1>
          
          <div className="max-w-2xl mx-auto relative group">
            <input 
              type="text" 
              placeholder="Search our help topics" 
              className="w-full px-10 py-3 border border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Some things you can do here</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpCategories.map((cat, index) => (
            <div 
              key={index}
              className="flex items-start p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer group shadow-sm bg-white"
            >
              <div className="mr-4 shrink-0">
                {cat.icon}
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Search our Help Library</h2>
            <div className="space-y-4">
              {[
                'Shipping & Delivery',
                'Prime',
                'Payment, Pricing & Promotions',
                'Returns & Refunds',
                'Ordering',
                'Managing Your Account',
                'Devices & Digital Solutions',
                'Other topics & Help sites'
              ].map((topic, i) => (
                <Link 
                  key={i} 
                  to="#" 
                  className="block text-[15px] text-blue-700 hover:text-orange-600 hover:underline flex items-center justify-between group"
                >
                  {topic}
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 self-start">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              If you can't find what you're looking for, our customer service team is here to help. We are available 24/7.
            </p>
            <div className="space-y-3">
              <button className="w-full py-2 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-md shadow-sm transition-colors text-sm">
                Chat with us
              </button>
              <button className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-md shadow-sm transition-colors text-sm">
                Call me
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center uppercase tracking-wider">Quick Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-bold mb-3 text-gray-800">Where's my stuff?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                You can track your package in <Link to="/orders" className="text-blue-600 hover:underline">Your Orders</Link>. If the tracking information hasn't updated, please allow 24 hours for it to refresh.
              </p>
            </div>
            <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-bold mb-3 text-gray-800">Change or cancel an order</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                You can change the shipping address or cancel an order as long as it hasn't entered the shipping process. Go to <Link to="/orders" className="text-blue-600 hover:underline">Your Orders</Link> to make changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
