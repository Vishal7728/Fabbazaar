'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/products';

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function AccountWishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`${apiBaseUrl}/auth/me/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok || !result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load wishlist';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load wishlist');
        }
        setWishlist(result.data.filter((id): id is string => typeof id === 'string'));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load wishlist'))
      .finally(() => setLoading(false));
  }, [router]);

  const savedProducts = products.filter((product) => wishlist.includes(product.id));
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm text-brand-600 hover:text-brand-900">← Account</Link>
      <h1 className="mt-3 font-serif text-5xl text-brand-900">Your wishlist</h1>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
      {loading ? <p className="mt-8 text-brand-600">Loading your wishlist…</p> : savedProducts.length === 0 && !error ? (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-8 text-center text-brand-600">Your wishlist is empty. Save a product you love to find it here.</div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}
