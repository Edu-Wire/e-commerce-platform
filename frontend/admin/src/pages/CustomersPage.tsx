import { useAdminCustomers } from '../hooks/useAdminCustomers';
import { UserCircle } from 'lucide-react';

export default function CustomersPage() {
  const { data: customers, isLoading } = useAdminCustomers();

  function fmt(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Header / Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">Customers</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">
              Customers Management
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">View and manage all registered store customers.</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
             <div className="w-10 h-10 bg-[#0FA86E]/10 rounded-lg flex items-center justify-center border border-[#0FA86E]/20">
               <UserCircle className="w-5 h-5 text-[#0FA86E]" />
             </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="bg-[#F4F9F4]/30 px-5 py-4 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Customer Roster</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4 w-36">Phone</th>
                  <th className="px-6 py-4 w-36 text-center">Status</th>
                  <th className="px-6 py-4 w-32 text-center">Total Orders</th>
                  <th className="px-6 py-4 w-36 text-right">Total Spent</th>
                  <th className="px-6 py-4 w-48 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-gray-50 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : (customers ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No customers found.</td>
                      </tr>
                    ) : (
                      (customers ?? []).map((customer: any) => (
                        <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase border bg-gray-50 text-gray-700 border-gray-200">
                                {customer.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900">{customer.name}</div>
                                <div className="text-[11px] text-gray-400 font-medium">{customer.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">
                            {customer.phone || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${
                              customer.is_active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {customer.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-gray-900">
                            {customer.total_orders}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-[#0FA86E]">
                            {fmt(customer.total_spent)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-400 font-bold whitespace-nowrap">
                            {new Date(customer.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
