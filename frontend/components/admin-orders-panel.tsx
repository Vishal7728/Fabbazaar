'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

type ManagedOrder = {
  orderId: string;
  customerId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  trackingNumber: string;
  trackingUrl: string;
  createdAt: string;
};
type ManagedOrderResponse = {
  data: ManagedOrder[];
  pagination: { page: number; totalPages: number };
};

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();
const fulfillmentOptions: ManagedOrder['fulfillmentStatus'][] = ['pending', 'processing', 'dispatched', 'delivered', 'cancelled'];

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      setError('Administrator sign-in is required to view orders.');
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (status) query.set('status', status);
        if (search.trim()) query.set('search', search.trim());
        const response = await fetch(`${apiBaseUrl}/orders?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load orders';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load orders');
        }
        if (!result || typeof result !== 'object' || !('data' in result) || !('pagination' in result)) {
          throw new Error('The order service returned an invalid response');
        }
        const pageResult = result as ManagedOrderResponse;
        setOrders(pageResult.data);
        setTotalPages(pageResult.pagination.totalPages);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Unable to load orders');
          setOrders([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, refreshKey, search, status]);

  async function updateFulfillment(order: ManagedOrder, nextStatus: ManagedOrder['fulfillmentStatus']) {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return setError('Administrator sign-in is required.');
    let trackingNumber = order.trackingNumber;
    let trackingUrl = order.trackingUrl;
    if (nextStatus === 'dispatched') {
      trackingNumber = window.prompt('Enter the shipment tracking number:', trackingNumber) ?? trackingNumber;
      trackingUrl = window.prompt('Enter the shipment tracking URL (optional):', trackingUrl) ?? trackingUrl;
    }
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(order.orderId)}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, trackingNumber, trackingUrl })
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to update fulfilment';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to update fulfilment');
      }
      setRefreshKey((current) => current + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update fulfilment');
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-brand-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 p-6">
        <div>
          <h2 className="font-serif text-2xl text-brand-900">Orders & dispatch</h2>
          <p className="mt-1 text-sm text-brand-600">Search orders, review payment status, and update fulfilment.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Order or customer ID" aria-label="Search orders" className="w-full rounded-xl border border-brand-200 py-2.5 pl-10 pr-3 sm:w-56" />
          </label>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter fulfilment status" className="rounded-xl border border-brand-200 px-3 py-2.5">
            <option value="">All fulfilment statuses</option>
            {fulfillmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" className="m-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-[#f1f3ec] text-xs uppercase tracking-wide text-[#526659]">
            <tr>
              <th className="px-5 py-4 font-medium">Order / customer</th>
              <th className="px-5 py-4 font-medium">Order date</th>
              <th className="px-5 py-4 font-medium">Products</th>
              <th className="px-5 py-4 font-medium">Total</th>
              <th className="px-5 py-4 font-medium">Payment</th>
              <th className="px-5 py-4 font-medium">Fulfilment</th>
              <th className="px-5 py-4 font-medium">Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {orders.map((order) => (
              <tr key={order.orderId}>
                <td className="px-5 py-4">
                  <span className="font-mono text-xs text-brand-500">{order.orderId}</span>
                  <span className="mt-1 block font-medium text-brand-900">{order.customerName || 'Customer'}</span>
                  <span className="block text-xs text-brand-600">{order.customerId}</span>
                </td>
                <td className="px-5 py-4 text-brand-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="max-w-64 px-5 py-4 text-brand-700">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</td>
                <td className="px-5 py-4 font-medium text-brand-900">₹{(order.total / 100).toLocaleString('en-IN')}</td>
                <td className="px-5 py-4 capitalize text-brand-700">{order.paymentStatus}</td>
                <td className="px-5 py-4">
                  <select value={order.fulfillmentStatus} onChange={(event) => updateFulfillment(order, event.target.value as ManagedOrder['fulfillmentStatus'])} aria-label={`Update fulfilment for ${order.orderId}`} className="rounded-lg border border-brand-200 px-2 py-1.5 capitalize">
                    {fulfillmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </td>
                <td className="px-5 py-4 text-xs text-brand-600">{order.trackingNumber || 'Not dispatched'}</td>
              </tr>
            ))}
            {!loading && orders.length === 0 && !error && <tr><td colSpan={7} className="px-6 py-12 text-center text-brand-600">No orders found.</td></tr>}
            {loading && <tr><td colSpan={7} className="px-6 py-12 text-center text-brand-600">Loading orders…</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-brand-100 px-6 py-4">
        <p className="text-sm text-brand-600">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-brand-700 disabled:opacity-40">Previous</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-brand-700 disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>
  );
}
