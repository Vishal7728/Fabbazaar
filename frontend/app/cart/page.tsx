'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/cart-provider';

export default function CartPage() {
  const { items, catalogProducts, ready, error, updateQuantity, removeItem } = useCart();
  const cartItems = items.flatMap((item) => {
    const product = catalogProducts.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal > 3000 ? 0 : 199;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-500">Your selection</p>
          <h1 className="mt-2 font-serif text-5xl text-brand-900">Shopping cart</h1>
        </div>
        <Link href="/products" className="text-sm font-medium text-brand-700 hover:text-brand-900">Continue shopping</Link>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>}

      {!ready ? (
        <p className="mt-10 rounded-2xl border border-brand-100 bg-white p-8 text-brand-600">Loading your saved cart…</p>
      ) : cartItems.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-brand-100 bg-white p-10 text-center shadow-soft">
          <h2 className="font-serif text-3xl text-brand-900">Your cart is waiting for something lovely.</h2>
          <p className="mt-3 text-brand-600">Add a bedsheet set to see your order total here.</p>
          <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-3 font-medium text-white">
            Explore the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            {cartItems.map(({ product, quantity }) => (
              <article key={product.id} className="flex flex-wrap items-center gap-5 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft sm:flex-nowrap">
                <Link href={`/products/${product.slug}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                  <Image src={product.image} alt={product.name} fill sizes="112px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${product.slug}`} className="font-serif text-xl text-brand-900 hover:text-brand-500">{product.name}</Link>
                  <p className="mt-1 text-sm text-brand-600">₹{product.price.toLocaleString('en-IN')} each</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" aria-label={`Decrease quantity of ${product.name}`} disabled={quantity <= 1} onClick={() => updateQuantity(product.id, quantity - 1)} className="rounded-lg border border-brand-200 p-1.5 text-brand-700 disabled:opacity-40">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm text-brand-900">{quantity}</span>
                    <button type="button" aria-label={`Increase quantity of ${product.name}`} disabled={quantity >= 99} onClick={() => updateQuantity(product.id, quantity + 1)} className="rounded-lg border border-brand-200 p-1.5 text-brand-700 disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeItem(product.id)} className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-300 hover:bg-red-950/50">
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
                <p className="w-full text-right text-lg font-semibold text-brand-900 sm:w-auto">₹{(product.price * quantity).toLocaleString('en-IN')}</p>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
            <h2 className="font-serif text-3xl text-brand-900">Order summary</h2>
            <div className="mt-6 space-y-3 text-brand-700">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span></div>
              <div className="mt-4 flex justify-between border-t border-brand-100 pt-4 text-lg font-semibold text-brand-900"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>
            <Link href="/checkout" className="mt-8 block rounded-full bg-brand-900 px-6 py-3 text-center font-medium text-white hover:bg-brand-700">Continue to checkout</Link>
            <p className="mt-4 text-center text-xs text-brand-500">Shipping is free on orders over ₹3,000.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
