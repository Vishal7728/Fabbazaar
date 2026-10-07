'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type OrderDetails = {
  orderId: string;
  items: Array<{ name: string; quantity: number; unitAmount: number }>;
  shippingAddress: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string };
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber: string;
  trackingUrl: string;
  createdAt: string;
};

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${apiBaseUrl}/orders/${encodeURIComponent(params.id)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load order';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load order');
        }
        if (!result || typeof result !== 'object' || !('data' in result)) throw new Error('The order service returned an invalid response');
        setOrder(result.data as OrderDetails);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load order'));
  }, [params.id, router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="text-sm text-brand-600 hover:text-brand-900">← Your orders</Link>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
      {!order ? !error && <p className="mt-8 text-brand-600">Loading order details…</p> : (
        <>
          <p className="mt-4 font-mono text-sm text-brand-500">{order.orderId}</p>
          <h1 className="mt-2 font-serif text-5xl text-brand-900">Order details</h1>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-brand-100 bg-white p-6">
              <h2 className="font-serif text-2xl text-brand-900">Items</h2>
              <ul className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <li key={item.name} className="flex justify-between gap-4 text-sm">
                    <span className="text-brand-700">{item.name} × {item.quantity}</span>
                    <span className="text-brand-900">₹{((item.unitAmount * item.quantity) / 100).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-brand-100 bg-white p-6">
              <h2 className="font-serif text-2xl text-brand-900">Delivery & status</h2>
              <p className="mt-4 text-sm leading-6 text-brand-700">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                {order.shippingAddress.country}
              </p>
              <p className="mt-4 text-sm capitalize text-brand-700">Payment: {order.paymentStatus}</p>
              <p className="mt-1 text-sm capitalize text-brand-700">Fulfilment: {order.fulfillmentStatus}</p>
              {order.trackingNumber && <p className="mt-3 text-sm text-brand-700">Tracking number: {order.trackingNumber}</p>}
              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-brand-500 underline">Track shipment</a>}
            </section>
          </div>
          <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6">
            <h2 className="font-serif text-2xl text-brand-900">Payment summary</h2>
            <div className="mt-4 space-y-2 text-sm text-brand-700">
              <p>Subtotal: ₹{(order.subtotal / 100).toLocaleString('en-IN')}</p>
              <p>Shipping: ₹{(order.shipping / 100).toLocaleString('en-IN')}</p>
              <p className="font-semibold text-brand-900">Total: ₹{(order.total / 100).toLocaleString('en-IN')}</p>
            </div>
            <p className="mt-4 text-xs text-brand-500">Invoice download is not available for this order yet.</p>
          </section>
        </>
      )}
    </div>
  );
}
