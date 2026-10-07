'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Product } from '@/lib/products';
import { getApiBaseUrl } from '@/lib/api';

type Listing = Product & { stock?: number; collection?: string };

export function AdminProductManager() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [products, setProducts] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadListings(authToken: string) {
    const response = await fetch(`${getApiBaseUrl()}/admin/products`, { headers: { Authorization: `Bearer ${authToken}` } });
    const result = await response.json() as { data?: Listing[]; error?: string };
    if (!response.ok || !Array.isArray(result.data)) throw new Error(result.error || 'Unable to load product listings.');
    setProducts(result.data);
  }

  useEffect(() => {
    const savedToken = sessionStorage.getItem('fabbazaar-token');
    const savedUser = sessionStorage.getItem('fabbazaar-user');
    if (!savedToken || !savedUser) { router.replace('/login'); return; }
    try {
      if ((JSON.parse(savedUser) as { role?: string }).role !== 'admin') { router.replace('/login'); return; }
    } catch { router.replace('/login'); return; }
    setToken(savedToken);
    loadListings(savedToken).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load product listings.'));
  }, [router]);

  const visibleProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((product) => !keyword || `${product.name} ${product.category} ${product.collection ?? ''} ${product.slug}`.toLowerCase().includes(keyword));
  }, [products, search]);

  async function deleteListing(product: Listing) {
    if (!window.confirm(`Delete “${product.name}” from the store? This cannot be undone.`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to delete this listing.');
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this listing.'); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.25em] text-brand-500">Store catalogue</p><h1 className="mt-2 font-serif text-4xl text-brand-900">Product listings</h1><p className="mt-2 text-sm text-brand-600">Add, update or remove the products shoppers see in the catalogue.</p></div>
      <Link href="/admin/products/new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"><Plus className="h-4 w-4"/> Add a product</Link>
    </div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <label className="mt-6 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4"><Search className="h-5 w-5 text-brand-500"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a product listing" aria-label="Find a product listing" className="h-12 min-w-0 flex-1 border-0 bg-transparent text-brand-900 outline-none focus:ring-0"/></label>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visibleProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft"><div className="flex gap-4 p-4"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100"><Image src={product.image} alt="" fill sizes="80px" className="object-cover"/></div><div className="min-w-0 flex-1"><p className="truncate text-xs uppercase tracking-widest text-brand-500">{product.collection ?? 'Bazaar Exclusive'} · {product.category}</p><h2 className="mt-1 line-clamp-2 font-serif text-lg text-brand-900">{product.name}</h2><p className="mt-1 font-semibold text-brand-800">₹{product.price.toLocaleString('en-IN')}<span className="ml-2 text-xs font-normal text-brand-500">Stock {product.stock ?? 0}</span></p></div></div><div className="flex border-t border-brand-100"><Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="inline-flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"><Pencil className="h-4 w-4"/> Edit on separate page</Link><button type="button" disabled={busy} onClick={() => deleteListing(product)} className="inline-flex flex-1 items-center justify-center gap-2 border-l border-brand-100 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4"/> Delete</button></div></article>)}
    </div>
    {!visibleProducts.length && <p className="mt-6 rounded-2xl border border-brand-100 bg-white p-8 text-center text-brand-600">No listings found.</p>}
  </div>;
}
