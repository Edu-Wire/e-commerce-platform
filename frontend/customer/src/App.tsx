import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import B2BDashboardPage from './pages/B2BDashboardPage';
import AccountPage from './pages/AccountPage';
import CustomerServicePage from './pages/CServicePage';





interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { customer, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;
  if (!customer) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

function AppInitializer({ children }: { children: ReactNode }) {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  return <>{children}</>;
}

export default function App() {
  return (
    <AppInitializer>
      <Routes>
        {/* Full-page auth routes (no Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* All other routes wrapped in Layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/customer-service" element={<CustomerServicePage />} />
                <Route path="/b2b" element={<B2BDashboardPage />} />


                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </AppInitializer>
  );
}
