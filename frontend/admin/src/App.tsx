import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import ProductViewPage from './pages/ProductViewPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import AuctionsPage from './pages/AuctionsPage';
import RunningAuctionsPage from './pages/RunningAuctionsPage';
import BulkUploadPage from './pages/BulkUploadPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import SettingsPage from './pages/SettingsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import QueuePage from './pages/QueuePage';
import ClosedAuctionsPage from './pages/ClosedAuctionsPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductViewPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/auctions/running" element={<RunningAuctionsPage />} />
        <Route path="/auctions/history" element={<ClosedAuctionsPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/bulk-upload" element={<BulkUploadPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/reports/:type" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
