import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import AIChatbot from '../ai/AIChatbot';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!isCheckout && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <AIChatbot />
    </div>
  );
}
