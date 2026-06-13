import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie,
  Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  Download, Printer, Search, Calendar,
  TrendingUp, TrendingDown, Users, Package, Tags, ClipboardList,
  Hourglass, CreditCard, DollarSign, Percent, Bell, Shield,
  ShoppingBag, RefreshCw
} from 'lucide-react';

// Theme colors matching the premium style
const COLORS = ['#FF9900', '#232F3E', '#007600', '#CC0C39', '#0066C0', '#7E57C2', '#26A69A', '#EC407A'];

interface ReportConfig {
  title: string;
  subtitle: string;
  icon: any;
  stats: { label: string; value: string | number; change?: string; isPositive?: boolean }[];
  filters: { id: string; label: string; type: 'select' | 'text' | 'date'; options?: string[] }[];
  chartType: 'line' | 'bar' | 'area' | 'pie';
  chartKeys: string[];
  tableColumns: string[];
  tableKeys: string[];
  mockDataGenerator: () => { chartData: any[]; tableData: any[] };
}

export default function ReportsPage() {
  const { type = 'user' } = useParams<{ type: string }>();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-06-13');

  // Trigger Refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // API loading / error states
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<{ stats: any[]; chartData: any[]; tableData: any[] } | null>(null);

  // Helper to format currency
  const fmt = (n: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  // Reset filter states when report type changes
  useEffect(() => {
    setSearchQuery('');
    setFilters({});
  }, [type]);

  // Fetch report data from backend API
  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      setLoading(true);
      setErrorText(null);
      try {
        const response = await api.get(`/admin/reports/${type}`, {
          params: { startDate, endDate }
        });
        if (active) {
          if (response.data && response.data.success) {
            setFetchedData(response.data.data);
          } else {
            setErrorText(response.data?.error || 'Failed to load report data.');
          }
        }
      } catch (err: any) {
        if (active) {
          console.error('Error fetching report:', err);
          setErrorText(err.response?.data?.error || err.message || 'Failed to connect to reports API.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchReport();
    return () => {
      active = false;
    };
  }, [type, startDate, endDate, refreshKey]);

  const reportConfigs: Record<string, ReportConfig> = useMemo(() => ({
    user: {
      title: 'User Registration & Activity Report',
      subtitle: 'Analyze user registration trends, roles, status, and activity levels.',
      icon: Users,
      stats: [
        { label: 'Total Users', value: '4,850', change: '+12.4%', isPositive: true },
        { label: 'Active Users', value: '3,210', change: '+8.2%', isPositive: true },
        { label: 'New This Month', value: '342', change: '+15.1%', isPositive: true },
        { label: 'Deactivated Users', value: '48', change: '-4.1%', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
        { id: 'role', label: 'Role', type: 'select', options: ['Customer', 'Admin', 'Seller'] }
      ],
      chartType: 'line',
      chartKeys: ['Registrations', 'ActiveUsers'],
      tableColumns: ['User ID', 'Name', 'Email', 'Role', 'Status', 'Reg Date', 'Last Login'],
      tableKeys: ['id', 'name', 'email', 'role', 'status', 'regDate', 'lastLogin'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'Jan', Registrations: 310, ActiveUsers: 2100 },
          { date: 'Feb', Registrations: 380, ActiveUsers: 2400 },
          { date: 'Mar', Registrations: 450, ActiveUsers: 2600 },
          { date: 'Apr', Registrations: 512, ActiveUsers: 2850 },
          { date: 'May', Registrations: 620, ActiveUsers: 3050 },
          { date: 'Jun', Registrations: 740, ActiveUsers: 3210 },
        ],
        tableData: [
          { id: 'USR-8902', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Customer', status: 'Active', regDate: '2026-05-12', lastLogin: '2026-06-13 11:24' },
          { id: 'USR-8903', name: 'Priya Patel', email: 'priya.patel@example.com', role: 'Customer', status: 'Active', regDate: '2026-05-14', lastLogin: '2026-06-12 09:15' },
          { id: 'USR-8904', name: 'Rohan Gupta', email: 'rohan.g@seller.com', role: 'Seller', status: 'Active', regDate: '2026-05-18', lastLogin: '2026-06-13 13:02' },
          { id: 'USR-8905', name: 'Sneha Reddy', email: 'sneha.reddy@example.com', role: 'Customer', status: 'Inactive', regDate: '2026-05-20', lastLogin: '2026-06-01 15:45' },
          { id: 'USR-8906', name: 'Kabir Singh', email: 'kabir.s@admin.com', role: 'Admin', status: 'Active', regDate: '2026-01-10', lastLogin: '2026-06-13 12:50' },
          { id: 'USR-8907', name: 'Aditi Rao', email: 'aditi.rao@example.com', role: 'Customer', status: 'Active', regDate: '2026-06-01', lastLogin: '2026-06-12 18:30' },
          { id: 'USR-8908', name: 'Vikram Malhotra', email: 'vikram.m@seller.com', role: 'Seller', status: 'Inactive', regDate: '2026-06-03', lastLogin: '2026-06-05 10:11' },
          { id: 'USR-8909', name: 'Ananya Desai', email: 'ananya.d@example.com', role: 'Customer', status: 'Active', regDate: '2026-06-05', lastLogin: '2026-06-13 08:45' },
        ]
      })
    },
    product: {
      title: 'Product Catalog & Sales Velocity Report',
      subtitle: 'Track product listings, views, conversion rate, and sales velocity.',
      icon: Package,
      stats: [
        { label: 'Total Products', value: '1,420', change: '+4.5%', isPositive: true },
        { label: 'Active Listings', value: '1,290', change: '+5.1%', isPositive: true },
        { label: 'Out of Stock', value: '14', change: '-12.5%', isPositive: true },
        { label: 'Avg Product Rating', value: '4.4 / 5.0', change: '+2.1%', isPositive: true },
      ],
      filters: [
        { id: 'category', label: 'Category', type: 'select', options: ['Electronics', 'Fashion', 'Home Decor', 'Sports'] },
        { id: 'condition', label: 'Condition', type: 'select', options: ['New', 'Refurbished'] }
      ],
      chartType: 'bar',
      chartKeys: ['SalesCount', 'Views'],
      tableColumns: ['SKU', 'Product Name', 'Category', 'Price', 'Stock', 'Sales Qty', 'Status', 'Condition'],
      tableKeys: ['sku', 'name', 'category', 'price', 'stock', 'salesQty', 'status', 'condition'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'Electronics', SalesCount: 820, Views: 15400 },
          { date: 'Fashion', SalesCount: 1250, Views: 24500 },
          { date: 'Home Decor', SalesCount: 640, Views: 11200 },
          { date: 'Sports', SalesCount: 430, Views: 8900 },
          { date: 'Books', SalesCount: 910, Views: 13200 },
        ],
        tableData: [
          { sku: 'PROD-WF-990', name: 'Wireless Headphones v5.2', category: 'Electronics', price: fmt(4999), stock: 85, salesQty: 320, status: 'In Stock', condition: 'New' },
          { sku: 'PROD-TS-411', name: 'Premium Cotton Polo Shirt', category: 'Fashion', price: fmt(1299), stock: 240, salesQty: 540, status: 'In Stock', condition: 'New' },
          { sku: 'PROD-LK-082', name: 'Mechanical Gaming Keyboard', category: 'Electronics', price: fmt(3499), stock: 12, salesQty: 180, status: 'Low Stock', condition: 'Refurbished' },
          { sku: 'PROD-HD-109', name: 'Ceramic Vase Set of 3', category: 'Home Decor', price: fmt(1899), stock: 45, salesQty: 95, status: 'In Stock', condition: 'New' },
          { sku: 'PROD-SP-771', name: 'Yoga Mat Anti-Slip Extra Thick', category: 'Sports', price: fmt(999), stock: 0, salesQty: 210, status: 'Out of Stock', condition: 'New' },
          { sku: 'PROD-EL-230', name: 'Smart Fitness Band Pro', category: 'Electronics', price: fmt(2799), stock: 110, salesQty: 405, status: 'In Stock', condition: 'New' },
          { sku: 'PROD-FA-560', name: 'Unisex Leather Messenger Bag', category: 'Fashion', price: fmt(2499), stock: 32, salesQty: 88, status: 'In Stock', condition: 'Refurbished' },
        ]
      })
    },
    category: {
      title: 'Category Performance Report',
      subtitle: 'Overview of product inventory and sales distribution across various categories.',
      icon: Tags,
      stats: [
        { label: 'Total Categories', value: '18', change: '0.0%', isPositive: true },
        { label: 'Top Category', value: 'Fashion', change: 'Sales Lead', isPositive: true },
        { label: 'Avg Category Revenue', value: fmt(342000), change: '+11.8%', isPositive: true },
        { label: 'Category Count Active', value: '16', change: '+2', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Archived'] }
      ],
      chartType: 'pie',
      chartKeys: ['value'],
      tableColumns: ['ID', 'Category Name', 'Product Count', 'Total Sales Volume', 'Total Revenue', 'Growth Rate', 'Status'],
      tableKeys: ['id', 'name', 'productCount', 'salesVolume', 'revenue', 'growth', 'status'],
      mockDataGenerator: () => ({
        chartData: [
          { name: 'Fashion', value: 420000 },
          { name: 'Electronics', value: 380000 },
          { name: 'Home Decor', value: 180000 },
          { name: 'Sports', value: 120000 },
          { name: 'Others', value: 95000 },
        ],
        tableData: [
          { id: 'CAT-01', name: 'Fashion & Apparel', productCount: 420, salesVolume: 1850, revenue: fmt(420000), growth: '+15.2%', status: 'Active' },
          { id: 'CAT-02', name: 'Consumer Electronics', productCount: 280, salesVolume: 740, revenue: fmt(380000), growth: '+9.4%', status: 'Active' },
          { id: 'CAT-03', name: 'Home & Living', productCount: 310, salesVolume: 510, revenue: fmt(180000), growth: '+12.1%', status: 'Active' },
          { id: 'CAT-04', name: 'Sports & Outdoors', productCount: 150, salesVolume: 320, revenue: fmt(120000), growth: '+4.8%', status: 'Active' },
          { id: 'CAT-05', name: 'Books & Stationery', productCount: 210, salesVolume: 490, revenue: fmt(65000), growth: '-1.5%', status: 'Active' },
          { id: 'CAT-06', name: 'Beauty & Personal Care', productCount: 90, salesVolume: 180, revenue: fmt(30000), growth: '+22.4%', status: 'Active' },
        ]
      })
    },
    order: {
      title: 'Sales Orders Fulfillment Report',
      subtitle: 'Track placed order volumes, average billing, cancellation and shipping rates.',
      icon: ClipboardList,
      stats: [
        { label: 'Total Orders Placed', value: '2,940', change: '+14.2%', isPositive: true },
        { label: 'Fulfillment Rate', value: '96.2%', change: '+1.5%', isPositive: true },
        { label: 'Average Order Value', value: fmt(3250), change: '+3.4%', isPositive: true },
        { label: 'Cancellation Rate', value: '1.8%', change: '-0.5%', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Order Status', type: 'select', options: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'] },
        { id: 'type', label: 'Order Type', type: 'select', options: ['B2B', 'B2C'] }
      ],
      chartType: 'area',
      chartKeys: ['Orders', 'Delivered'],
      tableColumns: ['Order ID', 'Customer', 'Items Count', 'Total Amount', 'Order Type', 'Status', 'Date'],
      tableKeys: ['id', 'customer', 'items', 'amount', 'type', 'status', 'date'],
      mockDataGenerator: () => ({
        chartData: [
          { date: '06-08', Orders: 78, Delivered: 65 },
          { date: '06-09', Orders: 92, Delivered: 78 },
          { date: '06-10', Orders: 105, Delivered: 89 },
          { date: '06-11', Orders: 88, Delivered: 94 },
          { date: '06-12', Orders: 114, Delivered: 101 },
          { date: '06-13', Orders: 120, Delivered: 82 },
        ],
        tableData: [
          { id: '#10940', customer: 'Rohan Sharma', items: 3, amount: fmt(4598), type: 'B2C', status: 'Delivered', date: '2026-06-12' },
          { id: '#10941', customer: 'Vardhaman Traders', items: 45, amount: fmt(78500), type: 'B2B', status: 'Shipped', date: '2026-06-12' },
          { id: '#10942', customer: 'Alok Gupta', items: 1, amount: fmt(999), type: 'B2C', status: 'Confirmed', date: '2026-06-13' },
          { id: '#10943', customer: 'Kriti Sen', items: 2, amount: fmt(2499), type: 'B2C', status: 'Pending', date: '2026-06-13' },
          { id: '#10944', customer: 'Divya Khare', items: 4, amount: fmt(5400), type: 'B2C', status: 'Delivered', date: '2026-06-11' },
          { id: '#10945', customer: 'Apex Retailers', items: 120, amount: fmt(215000), type: 'B2B', status: 'Processing', date: '2026-06-13' },
          { id: '#10946', customer: 'Amit Verma', items: 2, amount: fmt(3198), type: 'B2C', status: 'Cancelled', date: '2026-06-10' },
        ]
      })
    },
    auction: {
      title: 'Live & Historic Auction Performance',
      subtitle: 'Monitor auction completion, bidder participation rates, and revenue margins.',
      icon: Hourglass,
      stats: [
        { label: 'Total Auctions Run', value: '482', change: '+22.5%', isPositive: true },
        { label: 'Active Auctions', value: '18', change: '+4', isPositive: true },
        { label: 'Avg Bids Per Auction', value: '12.4', change: '+8.1%', isPositive: true },
        { label: 'Hammer Revenue Pool', value: fmt(894500), change: '+28.9%', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Auction Status', type: 'select', options: ['Active', 'Closed', 'Scheduled'] },
        { id: 'type', label: 'Auction Type', type: 'select', options: ['Classic Bidding', 'Reserve Met'] }
      ],
      chartType: 'bar',
      chartKeys: ['Bids', 'Participants'],
      tableColumns: ['Auction ID', 'Product Item', 'Start Price', 'Current Bid', 'Total Bidders', 'Status', 'Ends At', 'Auction Type'],
      tableKeys: ['id', 'product', 'startPrice', 'currentBid', 'totalBidders', 'status', 'endsAt', 'type'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'Auction 1', Bids: 15, Participants: 6 },
          { date: 'Auction 2', Bids: 28, Participants: 12 },
          { date: 'Auction 3', Bids: 8, Participants: 4 },
          { date: 'Auction 4', Bids: 22, Participants: 9 },
          { date: 'Auction 5', Bids: 34, Participants: 15 },
        ],
        tableData: [
          { id: 'AUC-2091', product: 'Vintage Rolex Submariner (1984)', startPrice: fmt(350000), currentBid: fmt(410000), totalBidders: 14, status: 'Active', endsAt: 'Today 18:00', type: 'Classic Bidding' },
          { id: 'AUC-2092', product: 'First Edition Harry Potter Book', startPrice: fmt(15000), currentBid: fmt(24500), totalBidders: 9, status: 'Active', endsAt: 'Tomorrow 12:00', type: 'Reserve Met' },
          { id: 'AUC-2093', product: 'Autographed Dhoni Cricket Bat', startPrice: fmt(50000), currentBid: fmt(85000), totalBidders: 22, status: 'Closed', endsAt: '2026-06-12', type: 'Classic Bidding' },
          { id: 'AUC-2094', product: 'Sony PlayStation 5 Console Gold', startPrice: fmt(40000), currentBid: fmt(45000), totalBidders: 5, status: 'Closed', endsAt: '2026-06-11', type: 'Classic Bidding' },
          { id: 'AUC-2095', product: 'Original Abstract Oil Painting', startPrice: fmt(25000), currentBid: fmt(28000), totalBidders: 4, status: 'Active', endsAt: '2026-06-15', type: 'Reserve Met' },
        ]
      })
    },
    bid: {
      title: 'Bid Activity & Engagement Report',
      subtitle: 'Detailed breakdown of bids placed, winning rates, and bidding intensity.',
      icon: TrendingUp,
      stats: [
        { label: 'Total Bids Placed', value: '4,120', change: '+18.6%', isPositive: true },
        { label: 'Unique Bidders', value: '780', change: '+12.4%', isPositive: true },
        { label: 'Average Bid Step', value: fmt(1500), change: '+5.7%', isPositive: true },
        { label: 'Bid Conversion Rate', value: '74.2%', change: '+2.1%', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Bid Status', type: 'select', options: ['Winning', 'Outbid', 'Won', 'Lost'] }
      ],
      chartType: 'line',
      chartKeys: ['BidsPlaced', 'Winners'],
      tableColumns: ['Bid ID', 'Auction Item', 'Bidder Name', 'Bid Amount', 'Increment', 'Status', 'Time'],
      tableKeys: ['id', 'item', 'bidder', 'amount', 'increment', 'status', 'time'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'Mon', BidsPlaced: 120, Winners: 12 },
          { date: 'Tue', BidsPlaced: 180, Winners: 15 },
          { date: 'Wed', BidsPlaced: 220, Winners: 18 },
          { date: 'Thu', BidsPlaced: 290, Winners: 24 },
          { date: 'Fri', BidsPlaced: 420, Winners: 31 },
          { date: 'Sat', BidsPlaced: 580, Winners: 45 },
          { date: 'Sun', BidsPlaced: 620, Winners: 52 },
        ],
        tableData: [
          { id: 'BID-99081', item: 'Vintage Rolex Submariner', bidder: 'Vikram Malhotra', amount: fmt(410000), increment: fmt(10000), status: 'Winning', time: '13:14:02' },
          { id: 'BID-99080', item: 'Vintage Rolex Submariner', bidder: 'Aarav Sharma', amount: fmt(400000), increment: fmt(5000), status: 'Outbid', time: '13:10:45' },
          { id: 'BID-99079', item: 'First Edition Harry Potter Book', bidder: 'Priya Patel', amount: fmt(24500), increment: fmt(1500), status: 'Winning', time: '12:55:18' },
          { id: 'BID-99078', item: 'Autographed Dhoni Cricket Bat', bidder: 'Rohan Gupta', amount: fmt(85000), increment: fmt(5000), status: 'Won', time: '2026-06-12' },
          { id: 'BID-99077', item: 'Autographed Dhoni Cricket Bat', bidder: 'Siddharth Sen', amount: fmt(80000), increment: fmt(2000), status: 'Lost', time: '2026-06-12' },
        ]
      })
    },
    seller: {
      title: 'Seller Performance & Verification Report',
      subtitle: 'Audit merchant onboardings, average review ratings, and listing numbers.',
      icon: Shield,
      stats: [
        { label: 'Verified Sellers', value: '182', change: '+9.4%', isPositive: true },
        { label: 'Pending Verification', value: '14', change: '-3', isPositive: true },
        { label: 'Total Merchant GMV', value: fmt(3480000), change: '+21.5%', isPositive: true },
        { label: 'Avg Merchant Rating', value: '4.6 / 5.0', change: '+0.5%', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Status', type: 'select', options: ['Verified', 'Pending Verification', 'Suspended'] }
      ],
      chartType: 'bar',
      chartKeys: ['RevenueGenerated', 'ListingsCount'],
      tableColumns: ['Seller ID', 'Company Name', 'Owner Name', 'Total Sales', 'Active Listings', 'Rating', 'Status'],
      tableKeys: ['id', 'company', 'owner', 'sales', 'listings', 'rating', 'status'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'TechHub', RevenueGenerated: 850000, ListingsCount: 120 },
          { date: 'FashionQ', RevenueGenerated: 1200000, ListingsCount: 340 },
          { date: 'DecorsPlaza', RevenueGenerated: 450000, ListingsCount: 95 },
          { date: 'SportsMart', RevenueGenerated: 320000, ListingsCount: 60 },
        ],
        tableData: [
          { id: 'SEL-001', company: 'TechHub Retailers Pvt Ltd', owner: 'Rohan Gupta', sales: fmt(850000), listings: 120, rating: '4.7', status: 'Verified' },
          { id: 'SEL-002', company: 'Fashion Quotient', owner: 'Anjali Sharma', sales: fmt(1200000), listings: 340, rating: '4.5', status: 'Verified' },
          { id: 'SEL-003', company: 'Classic Decorators', owner: 'Vikram Malhotra', sales: fmt(450000), listings: 95, rating: '4.3', status: 'Verified' },
          { id: 'SEL-004', company: 'Prime Sports Accessories', owner: 'Suresh Kumar', sales: fmt(320000), listings: 60, rating: '4.8', status: 'Pending Verification' },
          { id: 'SEL-005', company: 'Fake Bargain Inc', owner: 'Malicious Seller', sales: fmt(15000), listings: 3, rating: '1.9', status: 'Suspended' },
        ]
      })
    },
    buyer: {
      title: 'Buyer Acquisition & Lifetime Value Report',
      subtitle: 'Monitor buyer retention, repeat purchase behavior, and lifetime spend metrics.',
      icon: ShoppingBag,
      stats: [
        { label: 'Active Buyers', value: '4,650', change: '+14.2%', isPositive: true },
        { label: 'Repeat Purchase Rate', value: '38.4%', change: '+5.2%', isPositive: true },
        { label: 'Average LTV', value: fmt(8450), change: '+7.1%', isPositive: true },
        { label: 'Cart Abandonment', value: '54.2%', change: '-3.1%', isPositive: true },
      ],
      filters: [
        { id: 'tier', label: 'Buyer Tier', type: 'select', options: ['Gold VIP', 'Silver Member', 'Regular'] }
      ],
      chartType: 'line',
      chartKeys: ['LifetimeValue', 'OrdersCount'],
      tableColumns: ['Buyer ID', 'Buyer Name', 'Email', 'Tier', 'Orders Placed', 'Lifetime Value', 'Last Active'],
      tableKeys: ['id', 'name', 'email', 'tier', 'orders', 'ltv', 'lastActive'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'Jan', LifetimeValue: 6200, OrdersCount: 1.5 },
          { date: 'Feb', LifetimeValue: 6800, OrdersCount: 1.8 },
          { date: 'Mar', LifetimeValue: 7100, OrdersCount: 1.9 },
          { date: 'Apr', LifetimeValue: 7800, OrdersCount: 2.2 },
          { date: 'May', LifetimeValue: 8100, OrdersCount: 2.4 },
          { date: 'Jun', LifetimeValue: 8450, OrdersCount: 2.6 },
        ],
        tableData: [
          { id: 'BUY-8012', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', tier: 'Gold VIP', orders: 12, ltv: fmt(45800), lastActive: 'Today' },
          { id: 'BUY-8013', name: 'Priya Patel', email: 'priya.patel@example.com', tier: 'Silver Member', orders: 6, ltv: fmt(18200), lastActive: 'Yesterday' },
          { id: 'BUY-8014', name: 'Sneha Reddy', email: 'sneha.reddy@example.com', tier: 'Regular', orders: 2, ltv: fmt(3299), lastActive: '10 days ago' },
          { id: 'BUY-8015', name: 'Kabir Singh', email: 'kabir.s@admin.com', tier: 'Gold VIP', orders: 18, ltv: fmt(78000), lastActive: 'Today' },
          { id: 'BUY-8016', name: 'Ananya Desai', email: 'ananya.d@example.com', tier: 'Regular', orders: 1, ltv: fmt(999), lastActive: 'Today' },
        ]
      })
    },
    payment: {
      title: 'Payment Method Success & Distribution Report',
      subtitle: 'Analyze transaction gateway health, payment methods, and failure logs.',
      icon: CreditCard,
      stats: [
        { label: 'Total Paid Volume', value: fmt(2845000), change: '+18.4%', isPositive: true },
        { label: 'Success Rate', value: '98.4%', change: '+0.8%', isPositive: true },
        { label: 'Failed Payments', value: '42', change: '-15.4%', isPositive: true },
        { label: 'Refunds Total', value: fmt(48500), change: '+1.2%', isPositive: false },
      ],
      filters: [
        { id: 'method', label: 'Payment Method', type: 'select', options: ['Razorpay UPI', 'Stripe Card', 'Wallet Balance', 'Cash on Delivery'] },
        { id: 'status', label: 'Status', type: 'select', options: ['Success', 'Failed', 'Refunded'] }
      ],
      chartType: 'pie',
      chartKeys: ['value'],
      tableColumns: ['Txn ID', 'Order Reference', 'Payment Method', 'Amount Paid', 'Status', 'Gateway Fee', 'Payment Date'],
      tableKeys: ['id', 'orderId', 'method', 'amount', 'status', 'fee', 'date'],
      mockDataGenerator: () => ({
        chartData: [
          { name: 'Razorpay UPI', value: 1450000 },
          { name: 'Stripe Card', value: 980000 },
          { name: 'Wallet Balance', value: 320000 },
          { name: 'Cash on Delivery', value: 95000 },
        ],
        tableData: [
          { id: 'TXN-998821', orderId: '#10940', method: 'Razorpay UPI', amount: fmt(4598), status: 'Success', fee: fmt(92), date: '2026-06-12' },
          { id: 'TXN-998822', orderId: '#10941', method: 'Stripe Card', amount: fmt(78500), status: 'Success', fee: fmt(1570), date: '2026-06-12' },
          { id: 'TXN-998823', orderId: '#10942', method: 'Wallet Balance', amount: fmt(999), status: 'Success', fee: fmt(0), date: '2026-06-13' },
          { id: 'TXN-998824', orderId: '#10946', method: 'Razorpay UPI', amount: fmt(3198), status: 'Refunded', fee: fmt(0), date: '2026-06-10' },
          { id: 'TXN-998825', orderId: '#10943', method: 'Razorpay UPI', amount: fmt(2499), status: 'Failed', fee: fmt(0), date: '2026-06-13' },
        ]
      })
    },
    transaction: {
      title: 'Financial Transaction Ledger',
      subtitle: 'Complete list of credit, debit, wallet top-ups, and settlement logs.',
      icon: DollarSign,
      stats: [
        { label: 'Total Ledged Value', value: fmt(3490000), change: '+22.1%', isPositive: true },
        { label: 'Wallet Top-ups', value: fmt(450000), change: '+12.4%', isPositive: true },
        { label: 'Escrow Settlements', value: fmt(1820000), change: '+18.9%', isPositive: true },
        { label: 'System Service Fees', value: fmt(91200), change: '+15.2%', isPositive: true },
      ],
      filters: [
        { id: 'type', label: 'Transaction Type', type: 'select', options: ['Wallet Topup', 'Purchase Debit', 'Auction Escrow', 'Payout Credit'] }
      ],
      chartType: 'area',
      chartKeys: ['Credits', 'Debits'],
      tableColumns: ['Ref Number', 'Account Name', 'Type', 'Amount', 'Fee Charge', 'Fulfillment', 'Timestamp'],
      tableKeys: ['refNo', 'account', 'type', 'amount', 'fee', 'status', 'timestamp'],
      mockDataGenerator: () => ({
        chartData: [
          { date: '06-08', Credits: 180000, Debits: 140000 },
          { date: '06-09', Credits: 210000, Debits: 175000 },
          { date: '06-10', Credits: 340000, Debits: 220000 },
          { date: '06-11', Credits: 220000, Debits: 185000 },
          { date: '06-12', Credits: 410000, Debits: 310000 },
          { date: '06-13', Credits: 450000, Debits: 290000 },
        ],
        tableData: [
          { refNo: 'TRF-009981', account: 'Aarav Sharma', type: 'Wallet Topup', amount: `+${fmt(5000)}`, fee: fmt(50), status: 'Settled', timestamp: '2026-06-13 11:20' },
          { refNo: 'TRF-009982', account: 'Priya Patel', type: 'Purchase Debit', amount: `-${fmt(24500)}`, fee: fmt(0), status: 'Settled', timestamp: '2026-06-12 12:55' },
          { refNo: 'TRF-009983', account: 'Vikram Malhotra', type: 'Auction Escrow', amount: `-${fmt(410000)}`, fee: fmt(4100), status: 'Pending', timestamp: '2026-06-13 13:14' },
          { refNo: 'TRF-009984', account: 'Rohan Gupta (Seller)', type: 'Payout Credit', amount: `+${fmt(75000)}`, fee: fmt(750), status: 'Settled', timestamp: '2026-06-12 18:30' },
        ]
      })
    },
    inventory: {
      title: 'Inventory Health & Valuation Report',
      subtitle: 'Identify low stock alerts, stock value, and replenishment forecasting.',
      icon: Package,
      stats: [
        { label: 'Total Items Stocked', value: '4,820', change: '+2.4%', isPositive: true },
        { label: 'Stock Asset Value', value: fmt(1480000), change: '+8.4%', isPositive: true },
        { label: 'Low Stock Alerts', value: '12', change: '-4', isPositive: true },
        { label: 'Out of Stock Items', value: '3', change: '-1', isPositive: true },
      ],
      filters: [
        { id: 'status', label: 'Stock Level', type: 'select', options: ['Healthy', 'Low Stock', 'Out of Stock'] }
      ],
      chartType: 'bar',
      chartKeys: ['StockLevel', 'ReorderPoint'],
      tableColumns: ['SKU Code', 'Product Description', 'Category', 'Stock Qty', 'Reorder Alert Level', 'Asset Value', 'Status'],
      tableKeys: ['sku', 'description', 'category', 'qty', 'reorder', 'value', 'status'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'WF- headphones', StockLevel: 85, ReorderPoint: 15 },
          { date: 'Polo Shirt', StockLevel: 240, ReorderPoint: 20 },
          { date: 'Gaming Keyboard', StockLevel: 12, ReorderPoint: 15 },
          { date: 'Ceramic Vase', StockLevel: 45, ReorderPoint: 10 },
          { date: 'Yoga Mat', StockLevel: 0, ReorderPoint: 20 },
        ],
        tableData: [
          { sku: 'PROD-WF-990', description: 'Wireless Headphones v5.2', category: 'Electronics', qty: 85, reorder: 15, value: fmt(424915), status: 'Healthy' },
          { sku: 'PROD-TS-411', description: 'Premium Cotton Polo Shirt', category: 'Fashion', qty: 240, reorder: 20, value: fmt(311760), status: 'Healthy' },
          { sku: 'PROD-LK-082', description: 'Mechanical Gaming Keyboard', category: 'Electronics', qty: 12, reorder: 15, value: fmt(41988), status: 'Low Stock' },
          { sku: 'PROD-HD-109', description: 'Ceramic Vase Set of 3', category: 'Home Decor', qty: 45, reorder: 10, value: fmt(85455), status: 'Healthy' },
          { sku: 'PROD-SP-771', description: 'Yoga Mat Anti-Slip Extra Thick', category: 'Sports', qty: 0, reorder: 20, value: fmt(0), status: 'Out of Stock' },
        ]
      })
    },
    revenue: {
      title: 'Revenue & Profit Margin Analytics',
      subtitle: 'Track platform gross merchandise value (GMV), system commissions, and earnings.',
      icon: Percent,
      stats: [
        { label: 'Gross Revenue (GMV)', value: fmt(4820000), change: '+24.1%', isPositive: true },
        { label: 'Net Platform Earnings', value: fmt(241000), change: '+18.4%', isPositive: true },
        { label: 'Avg Commission Take', value: '5.0%', change: '0.0%', isPositive: true },
        { label: 'Monthly Growth Rate', value: '14.8%', change: '+2.1%', isPositive: true },
      ],
      filters: [
        { id: 'channel', label: 'Sales Channel', type: 'select', options: ['Direct Retail', 'Auction Commission', 'B2B Wholesale'] }
      ],
      chartType: 'area',
      chartKeys: ['GMV', 'Earnings'],
      tableColumns: ['Billing Month', 'Gross Sales Volume', 'Merchant Payouts', 'Commission Rate', 'Net Platform Profit', 'Growth', 'Sales Channel'],
      tableKeys: ['month', 'sales', 'payouts', 'rate', 'profit', 'growth', 'channel'],
      mockDataGenerator: () => ({
        chartData: [
          { date: 'Jan', GMV: 3100000, Earnings: 155000 },
          { date: 'Feb', GMV: 3400000, Earnings: 170000 },
          { date: 'Mar', GMV: 3800000, Earnings: 190000 },
          { date: 'Apr', GMV: 4100000, Earnings: 205000 },
          { date: 'May', GMV: 4500000, Earnings: 225000 },
          { date: 'Jun', GMV: 4820000, Earnings: 241000 },
        ],
        tableData: [
          { month: 'June 2026 (MTD)', sales: fmt(4820000), payouts: fmt(4579000), rate: '5.0%', profit: fmt(241000), growth: '+7.1%', channel: 'Direct Retail' },
          { month: 'May 2026', sales: fmt(4500000), payouts: fmt(4275000), rate: '5.0%', profit: fmt(225000), growth: '+9.7%', channel: 'Direct Retail' },
          { month: 'April 2026', sales: fmt(4100000), payouts: fmt(3895000), rate: '5.0%', profit: fmt(205000), growth: '+7.8%', channel: 'Auction Commission' },
          { month: 'March 2026', sales: fmt(3800000), payouts: fmt(3610000), rate: '5.0%', profit: fmt(190000), growth: '+11.7%', channel: 'B2B Wholesale' },
        ]
      })
    },
    notification: {
      title: 'System Notifications & Alert Logs',
      subtitle: 'Track deliverability rates, open rates, and channel loads.',
      icon: Bell,
      stats: [
        { label: 'Notifications Sent', value: '24,850', change: '+12.4%', isPositive: true },
        { label: 'Email Success Rate', value: '99.1%', change: '+0.1%', isPositive: true },
        { label: 'SMS Delivery Rate', value: '97.4%', change: '+0.5%', isPositive: true },
        { label: 'Avg Email Open Rate', value: '34.2%', change: '+2.1%', isPositive: true },
      ],
      filters: [
        { id: 'channel', label: 'Channel Type', type: 'select', options: ['Push', 'Email', 'SMS'] },
        { id: 'status', label: 'Status', type: 'select', options: ['Delivered', 'Failed'] }
      ],
      chartType: 'line',
      chartKeys: ['Dispatches', 'Failures'],
      tableColumns: ['Log ID', 'User Target', 'Alert Description', 'Channel', 'Delivery Status', 'Dispatch Time', 'Retries'],
      tableKeys: ['id', 'user', 'desc', 'channel', 'status', 'time', 'retries'],
      mockDataGenerator: () => ({
        chartData: [
          { date: '06-08', Dispatches: 2400, Failures: 14 },
          { date: '06-09', Dispatches: 3100, Failures: 8 },
          { date: '06-10', Dispatches: 2900, Failures: 19 },
          { date: '06-11', Dispatches: 3400, Failures: 22 },
          { date: '06-12', Dispatches: 4100, Failures: 11 },
          { date: '06-13', Dispatches: 4850, Failures: 15 },
        ],
        tableData: [
          { id: 'NTF-11002', user: 'Aarav Sharma', desc: 'Outbid Alert for Vintage Rolex', channel: 'Push', status: 'Delivered', time: '13:10:45', retries: 0 },
          { id: 'NTF-11003', user: 'Priya Patel', desc: 'Order Confirmation #10940 Receipt', channel: 'Email', status: 'Delivered', time: '12:56:02', retries: 0 },
          { id: 'NTF-11004', user: 'Vikram Malhotra', desc: 'Upcoming Auction Watchlist Alert', channel: 'Email', status: 'Failed', time: '12:45:11', retries: 3 },
          { id: 'NTF-11005', user: 'Sneha Reddy', desc: 'OTP Verification Code', channel: 'SMS', status: 'Delivered', time: '12:00:54', retries: 1 },
        ]
      })
    }
  }), []);

  // Selected config details
  const activeReport = useMemo(() => {
    return reportConfigs[type] || reportConfigs.user;
  }, [type, reportConfigs]);

  // Merge stats from config and API
  const displayStats = useMemo(() => {
    if (fetchedData?.stats && fetchedData.stats.length === activeReport.stats.length) {
      return activeReport.stats.map((stat, idx) => ({
        ...stat,
        value: fetchedData.stats[idx].value
      }));
    }
    return activeReport.stats;
  }, [fetchedData, activeReport]);

  // Data generator / source
  const { chartData, tableData } = useMemo(() => {
    if (fetchedData?.chartData && fetchedData?.tableData) {
      return {
        chartData: fetchedData.chartData,
        tableData: fetchedData.tableData
      };
    }
    return activeReport.mockDataGenerator();
  }, [activeReport, fetchedData]);

  // Filter and search calculations
  const filteredTableData = useMemo(() => {
    return tableData.filter((row) => {
      // Check search
      const rowString = Object.values(row).join(' ').toLowerCase();
      if (searchQuery && !rowString.includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Check dynamic active filters
      for (const [filterId, filterVal] of Object.entries(filters)) {
        if (!filterVal) continue;
        
        // Find row value: check if the row has a direct value matching filterId
        const rowVal = row[filterId];
        if (rowVal !== undefined) {
          if (String(rowVal).toLowerCase() !== filterVal.toLowerCase()) {
            return false;
          }
        } else {
          // Fallback check: if no direct match, check if row contains the filter value string
          const rowValuesStr = Object.values(row).join(' ').toLowerCase();
          if (!rowValuesStr.includes(filterVal.toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });
  }, [tableData, searchQuery, filters]);

  // Exports logic
  const handleExportCSV = () => {
    if (!filteredTableData.length) return;
    const headers = activeReport.tableColumns.join(',');
    const rows = filteredTableData.map(row =>
      activeReport.tableKeys.map(key => `"${String(row[key] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const ReportIcon = activeReport.icon;

  return (
    <div className="min-h-full bg-[#eaeded] -m-6 p-4 sm:p-6 text-[#111] font-sans antialiased print:bg-white print:p-0">
      <div className="max-w-[1600px] mx-auto space-y-4 print:space-y-6">

        {/* Navigation Breadcrumbs & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-4 border border-gray-300 rounded shadow-sm gap-4 print:border-none print:shadow-none print:px-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 print:hidden">
              <Link to="/dashboard" className="hover:underline">Seller Central</Link>
              <span>&gt;</span>
              <span className="font-semibold text-gray-700">Reports</span>
              <span>&gt;</span>
              <span className="font-semibold text-gray-700 capitalize">{type}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-9 h-9 rounded-md bg-amazon-blue/10 flex items-center justify-center text-amazon-blue">
                <ReportIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{activeReport.title}</h1>
                <p className="text-xs text-gray-500 mt-0.5">{activeReport.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded text-gray-600 shadow-sm transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] text-xs font-semibold rounded shadow-sm text-gray-800 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] text-xs font-semibold rounded shadow-sm text-gray-800 flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorText && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs print:hidden">
            <strong>Notice:</strong> Using offline simulated data due to connection issues: {errorText}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {displayStats.map((stat, idx) => (
            <div key={idx} className={`bg-white p-4 rounded border border-gray-300 shadow-sm flex items-center justify-between transition-all ${loading ? 'animate-pulse opacity-60' : ''}`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                {loading ? (
                  <div className="h-6 w-24 bg-gray-200 rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                )}
              </div>
              {stat.change && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  stat.isPositive
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {stat.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Filters and Search - Hidden on Print */}
        <div className="bg-white p-4 border border-gray-300 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-3.5 flex-1">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search report records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-[#888c8c] rounded-[3px] text-sm focus:outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)] bg-white text-[#0f1111]"
              />
            </div>

            {/* Configured Filters */}
            {activeReport.filters.map((flt) => (
              <div key={flt.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-bold whitespace-nowrap">{flt.label}:</span>
                <select
                  value={filters[flt.id] || ''}
                  onChange={(e) => {
                    setFilters(prev => ({
                      ...prev,
                      [flt.id]: e.target.value
                    }));
                  }}
                  className="px-2.5 py-1.5 bg-white border border-[#888c8c] rounded-[3px] text-xs focus:outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,0.5)] bg-white text-[#0f1111]"
                >
                  <option value="">All {flt.label}s</option>
                  {flt.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>Date:</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Section Grid (Chart and Table) */}
        <div className="grid grid-cols-1 gap-4">

          {/* Chart Component Card */}
          <div className="bg-white rounded border border-gray-300 shadow-sm p-5 print:border-none print:shadow-none relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-[#e77600] animate-spin" />
                  <span className="text-xs font-semibold text-gray-600">Retrieving ledger analytics...</span>
                </div>
              </div>
            )}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Analytics Overview</h3>
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeReport.chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    {activeReport.chartKeys.map((key, index) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2.5} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                ) : activeReport.chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    {activeReport.chartKeys.map((key, index) => (
                      <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                ) : activeReport.chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    {activeReport.chartKeys.map((key, index) => (
                      <Area key={key} type="monotone" dataKey={key} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} fillOpacity={0.2} />
                    ))}
                  </AreaChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Component Card */}
          <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden print:border-none print:shadow-none relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-[#e77600] animate-spin" />
                  <span className="text-xs font-semibold text-gray-600">Syncing table records...</span>
                </div>
              </div>
            )}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report Records Ledger</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600 border border-gray-300 print:hidden">
                Showing {filteredTableData.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f6f6f6] border-b border-gray-300 text-xs font-semibold text-gray-600">
                    {activeReport.tableColumns.map((col) => (
                      <th key={col} className="px-5 py-3 border-r border-gray-200 last:border-r-0">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTableData.length === 0 ? (
                    <tr>
                      <td colSpan={activeReport.tableColumns.length} className="px-5 py-8 text-center text-gray-500 font-medium">
                        No report records matching criteria found.
                      </td>
                    </tr>
                  ) : (
                    filteredTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#fcfcfc] transition-colors border-b border-gray-200 last:border-b-0">
                        {activeReport.tableKeys.map((key) => {
                          const val = row[key];
                          return (
                            <td key={key} className="px-5 py-3 border-r border-gray-200 last:border-r-0 font-medium text-gray-800">
                              {/* Custom status badge layout */}
                              {key === 'status' ? (
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  ['active', 'success', 'won', 'delivered', 'verified', 'healthy', 'settled', 'resolved', 'completed'].includes(String(val).toLowerCase())
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : ['pending', 'shipped', 'winning', 'processing', 'confirmed'].includes(String(val).toLowerCase())
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : ['inactive', 'outbid', 'suspended', 'failed', 'refunded', 'cancelled', 'out of stock', 'lost', 'blocked'].includes(String(val).toLowerCase())
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}>
                                  {val}
                                </span>
                              ) : (
                                String(val ?? '')
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
