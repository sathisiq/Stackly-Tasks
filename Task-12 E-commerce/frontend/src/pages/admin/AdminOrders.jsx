import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import api from '../../api';
import { formatINR } from '../../utils/currency';
import Pagination from '../../components/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination states (?page=1&limit=10)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit, setLimit] = useState(10);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Fetch orders when page, search, filter, or limit changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearch, statusFilter, limit]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/api/orders', { params });

      // Handle paginated response: { orders, total, page, limit, total_pages }
      if (res.data && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
        setTotalPages(res.data.total_pages || 1);
        setTotalOrders(res.data.total ?? res.data.orders.length);
      } else if (Array.isArray(res.data)) {
        // Fallback for non-paginated array
        setOrders(res.data);
        setTotalPages(1);
        setTotalOrders(res.data.length);
      } else {
        setOrders([]);
        setTotalPages(1);
        setTotalOrders(0);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setToastMessage({ type: 'success', text: `Order #${orderId} status changed to ${newStatus}` });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update status' });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Confirmed':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Customer Orders</h1>
          <p className="text-slate-500 text-sm font-medium">
            Showing <span className="font-semibold text-slate-800">{orders.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalOrders}</span> orders across {totalPages} {totalPages === 1 ? 'page' : 'pages'}
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fadeIn ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order ID, customer, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <label htmlFor="admin-order-status-filter" className="sr-only">Filter orders by status</label>
          <select
            id="admin-order-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package size={36} className="mx-auto text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800">No orders found</h3>
            <p className="text-slate-500 text-xs">No orders match your filter criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Items Ordered</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">Fulfillment Status</th>
                    <th className="py-4 px-6">Delivery Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Order ID & Date */}
                      <td className="py-4 px-6 align-top">
                        <span className="font-extrabold text-slate-900 block">#{order.id}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6 align-top">
                        <p className="font-bold text-slate-800">{order.customer_name || 'Customer'}</p>
                        <p className="text-xs text-slate-400">{order.customer_email}</p>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">{item.quantity}×</span> {item.product_name}{' '}
                              <span className="text-slate-400">({formatINR(item.unit_price)})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6 align-top font-extrabold text-indigo-600">
                        {formatINR(order.total_amount)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-6 align-top">
                        <div className="relative inline-block">
                          <label htmlFor={`admin-order-status-select-${order.id}`} className="sr-only">Update order status</label>
                          <select
                            id={`admin-order-status-select-${order.id}`}
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all ${getStatusClasses(order.status)}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-4 px-6 align-top max-w-xs">
                        <div className="text-xs text-slate-600 line-clamp-2" title={order.address}>
                          {order.address}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component for Admin Orders */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
