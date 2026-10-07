'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type OrderSummary = {
  orderId: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
};

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${apiBaseUrl}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load orders';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load orders');
        }
        if (!result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
          throw new Error('The order service returned an invalid response');
        }
        setOrders(result.data as OrderSummary[]);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load orders'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm text-brand-600 hover:text-brand-900">← Account</Link>
      <h1 className="mt-3 font-serif text-5xl text-brand-900">Your orders</h1>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
      {loading ? <p className="mt-8 text-brand-600">Loading your orders…</p> : orders.length === 0 && !error ? (
        <div className="mt-8 rounded-3xl border border-brand-100 bg-white p-8 text-center">
          <h2 className="font-serif text-2xl text-brand-900">No orders yet</h2>
          <p className="mt-2 text-brand-600">Completed orders will appear here.</p>
          <Link href="/products" className="mt-5 inline-block rounded-full bg-brand-900 px-5 py-2.5 text-white">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link key={order.orderId} href={`/account/orders/${encodeURIComponent(order.orderId)}`} className="block rounded-2xl border border-brand-100 bg-white p-6 shadow-soft hover:border-brand-300">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm text-brand-500">{order.orderId}</p>
                  <p className="mt-2 font-medium text-brand-900">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p>
                  <p className="mt-1 text-sm text-brand-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-900">₹{(order.total / 100).toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-xs capitalize text-brand-600">Payment: {order.paymentStatus}</p>
                  <p className="mt-1 text-xs capitalize text-brand-600">Status: {order.fulfillmentStatus}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
