'use client';

import Link from 'next/link';
import Script from 'next/script';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart-provider';

type PaymentConfig = { enabled: boolean; keyId: string | null; mode: 'test' };
type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill: { name: string; email: string; contact: string };
      handler: (response: RazorpaySuccess) => void;
      modal: { ondismiss: () => void };
    }) => {
      open: () => void;
      on: (event: string, callback: (event: { error?: { description?: string } }) => void) => void;
    };
  }
}

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function CheckoutPage() {
  const router = useRouter();
  const { items, catalogProducts, ready, removeItem } = useCart();
  const cartItems = items.flatMap((item) => {
    const product = catalogProducts.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal > 3000 ? 0 : 199;
  const [promoInput, setPromoInput] = useState('');
  const [promotion, setPromotion] = useState<{ code: string; discount: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState('');
  const total = subtotal + shipping - (promotion?.discount ?? 0);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState('');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  useEffect(() => {
    setToken(sessionStorage.getItem('fabbazaar-token') || '');
    fetch(`${apiBaseUrl}/payments/config`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to check payment configuration');
        const result: unknown = await response.json();
        if (!result || typeof result !== 'object' || !('enabled' in result) || !('keyId' in result)) {
          throw new Error('Payment service returned invalid configuration');
        }
        setConfig(result as PaymentConfig);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to check payment configuration'));
  }, []);

  async function finishPayment(orderId: string, payment: RazorpaySuccess) {
    try {
      const response = await fetch(`${apiBaseUrl}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, ...payment })
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Payment verification failed';
        throw new Error(typeof detail === 'string' ? detail : 'Payment verification failed');
      }
      items.forEach((item) => removeItem(item.productId));
      setCompletedOrder(orderId);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Payment verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function redeemPromotion() {
    const code = promoInput.trim();
    if (!code) { setPromoMessage('Enter a promotion code first.'); return; }
    try {
      const response = await fetch(`${apiBaseUrl}/promotions/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, subtotal }) });
      const result = await response.json() as { data?: { code: string; discount: number }; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error || 'This code cannot be applied.');
      setPromotion(result.data); setPromoInput(result.data.code); setPromoMessage(`${result.data.code} applied — you save ₹${result.data.discount.toLocaleString('en-IN')}.`);
    } catch (reason) { setPromotion(null); setPromoMessage(reason instanceof Error ? reason.message : 'Unable to validate the code.'); }
  }

  async function startPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      router.push('/login');
      return;
    }
    if (!config?.enabled || !config.keyId || !window.Razorpay) {
      setError('Razorpay test checkout is not configured or could not be loaded.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          shippingAddress: address,
          promotionCode: promotion?.code || ''
        })
      });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== 'object' || !('data' in result)) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to start payment';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to start payment');
      }
      const order = result.data as { orderId: string; razorpayOrderId: string; amount: number; currency: string; keyId: string };
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'FabBazaar',
        description: 'FabBazaar bedsheet order',
        order_id: order.razorpayOrderId,
        prefill: { name: address.fullName, email: '', contact: address.phone },
        handler: (payment) => { void finishPayment(order.orderId, payment); },
        modal: { ondismiss: () => setSubmitting(false) }
      });
      checkout.on('payment.failed', (failure) => {
        setError(failure.error?.description || 'Test payment did not complete.');
        setSubmitting(false);
      });
      checkout.open();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start payment');
      setSubmitting(false);
    }
  }

  if (!ready) return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-brand-600">Preparing your checkout…</div>;

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">Test payment captured</p>
        <h1 className="mt-3 font-serif text-4xl text-brand-900">Order confirmed</h1>
        <p className="mt-4 font-mono text-sm text-brand-600">{completedOrder}</p>
        <Link href="/account/orders" className="mt-6 inline-block rounded-full bg-brand-900 px-6 py-3 text-white">View orders</Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl text-brand-900">Your cart is empty</h1>
        <Link href="/products" className="mt-6 inline-block rounded-full bg-brand-900 px-6 py-3 text-white">Shop the collection</Link>
      </div>
    );
  }

  return (
    <>
      {config?.enabled && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" onLoad={() => setScriptLoaded(true)} onError={() => setError('Unable to load Razorpay checkout. Please try again later.')} />}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-500">Secure test checkout</p>
        <h1 className="mt-2 font-serif text-5xl text-brand-900">Checkout</h1>
        {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>}
        <form onSubmit={startPayment} className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-brand-100 bg-white p-7 shadow-soft">
            <h2 className="font-serif text-2xl text-brand-900">Shipping details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input autoComplete="name" value={address.fullName} onChange={(event) => setAddress({ ...address, fullName: event.target.value })} required minLength={2} maxLength={100} className="rounded-xl border border-brand-200 p-3" placeholder="Full name" aria-label="Full name" />
              <input autoComplete="tel" type="tel" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} required pattern="\+?[1-9][0-9]{7,14}" className="rounded-xl border border-brand-200 p-3" placeholder="Phone number, e.g. +919876543210" aria-label="Phone number" />
              <input autoComplete="address-line1" value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} required minLength={4} maxLength={160} className="rounded-xl border border-brand-200 p-3 sm:col-span-2" placeholder="Address line 1" aria-label="Address line 1" />
              <input autoComplete="address-line2" value={address.line2} onChange={(event) => setAddress({ ...address, line2: event.target.value })} maxLength={160} className="rounded-xl border border-brand-200 p-3 sm:col-span-2" placeholder="Address line 2 (optional)" aria-label="Address line 2" />
              <input autoComplete="address-level2" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} required minLength={2} className="rounded-xl border border-brand-200 p-3" placeholder="City" aria-label="City" />
              <input autoComplete="address-level1" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} required minLength={2} className="rounded-xl border border-brand-200 p-3" placeholder="State" aria-label="State" />
              <input autoComplete="postal-code" value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value })} required minLength={4} maxLength={12} className="rounded-xl border border-brand-200 p-3" placeholder="PIN code" aria-label="PIN code" />
              <input autoComplete="country-name" value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} required minLength={2} className="rounded-xl border border-brand-200 p-3" placeholder="Country" aria-label="Country" />
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-brand-100 bg-white p-7 shadow-soft">
            <h2 className="font-serif text-2xl text-brand-900">Order summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {cartItems.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between gap-3 text-brand-700">
                  <span>{product.name} × {quantity}</span>
                  <span className="shrink-0">₹{(product.price * quantity).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <label htmlFor="promotion-code" className="text-sm font-medium text-brand-800">Promotion code</label>
              <div className="mt-2 flex gap-2"><input id="promotion-code" value={promoInput} onChange={(event) => { setPromoInput(event.target.value.toUpperCase()); setPromotion(null); setPromoMessage(''); }} maxLength={32} placeholder="Enter code" className="min-w-0 flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm uppercase"/><button type="button" onClick={() => void redeemPromotion()} className="rounded-xl border border-brand-300 px-4 text-sm font-semibold text-brand-800 hover:bg-white">Apply</button></div>
              {promoMessage && <p role="status" className={`mt-2 text-xs ${promotion ? 'text-emerald-700' : 'text-brand-600'}`}>{promoMessage}</p>}
            </div>
            <div className="mt-5 space-y-3 border-t border-brand-100 pt-5 text-sm text-brand-700">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              {promotion && <div className="flex justify-between text-emerald-700"><span>Promotion · {promotion.code}</span><span>−₹{promotion.discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between pt-2 text-lg font-semibold text-brand-900"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>
            {!token && <p className="mt-5 text-sm text-brand-600">Sign in with a customer account to place your order.</p>}
            {config && !config.enabled && <p className="mt-5 text-sm text-amber-300">Razorpay test keys and a MongoDB connection are required to enable test checkout.</p>}
            <button type="submit" disabled={!token || !config?.enabled || !config.keyId || !scriptLoaded || submitting} className="mt-6 w-full rounded-full bg-brand-900 px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? 'Opening secure checkout…' : `Pay ₹${total.toLocaleString('en-IN')} using Razorpay test mode`}
            </button>
            {!token && <Link href="/login" className="mt-4 block text-center text-sm font-medium text-brand-700 hover:text-brand-900">Sign in</Link>}
            <p className="mt-4 text-center text-xs text-brand-500">Test mode only. No live payment keys are accepted by the server.</p>
          </aside>
        </form>
      </div>
    </>
  );
}
