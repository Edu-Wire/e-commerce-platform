import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore, translations } from '../store/languageStore';

export default function AccountPage() {
  const { customer } = useAuthStore();
  const { language } = useLanguageStore();
  const t = translations[language] || translations['EN'];


  const accountCards = [
    {
      title: 'Your Orders',
      description: 'Track, return, or buy things again',
      link: '/orders',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      title: 'Login & Security',
      description: 'Edit login, name, and mobile number',
      link: '#',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'Prime',
      description: 'View benefits and payment settings',
      link: '#',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      title: 'Your Addresses',
      description: 'Edit addresses for orders and gifts',
      link: '#',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: 'Payment options',
      description: 'Edit or add payment methods',
      link: '#',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      title: 'ShopNow Pay balance',
      description: 'Add money to your balance',
      link: '#',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Contact Us',
      description: 'Customer service, FAQs, and more',
      link: '#',
      icon: (
        <svg className="w-12 h-12 text-[#232f3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 min-h-screen bg-gray-50/30">
      {/* Breadcrumbs */}
      <nav className="flex text-xs mb-4 text-gray-600">
        <Link to="/" className="hover:text-orange-600 hover:underline">{t.yourAccount || 'Your Account'}</Link>
      </nav>

      <h1 className="text-3xl font-medium text-gray-900 mb-6">{t.yourAccount || 'Your Account'}</h1>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all group bg-white shadow-sm"
          >
            <div className="flex-shrink-0 mr-4">
              {card.icon}
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-snug">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Digital content and devices</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Apps and more</Link></li>
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Content and devices</Link></li>
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Digital gifts you've received</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Email alerts, messages, and ads</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Advertising preferences</Link></li>
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Communication preferences</Link></li>
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Message Center</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">More ways to pay</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Default Purchase Settings</Link></li>
              <li><Link to="#" className="hover:text-orange-600 hover:underline">Shop with Points</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
