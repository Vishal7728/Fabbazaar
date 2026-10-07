'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { products as fallbackProducts, type Product } from '@/lib/products';
import { categories } from '@/lib/categories';

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) apiUrl.hostname = window.location.hostname;
  return apiUrl.toString().replace(/\/+$/, '');
})();

export function ProductBrowser() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>(fallbackProducts);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [collection, setCollection] = useState(searchParams.get('collection') || '');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setCollection(searchParams.get('collection') || '');
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/products?limit=40&page=1`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Catalog request failed');
        const result = await response.json() as { data?: Product[]; pagination?: { totalPages?: number } };
        const listings = result.data ?? [];
        const totalPages = result.pagination?.totalPages ?? 1;
        const remaining = await Promise.all(Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
          fetch(`${apiBaseUrl}/products?limit=40&page=${index + 2}`, { signal: controller.signal })
            .then((page) => page.ok ? page.json() as Promise<{ data?: Product[] }> : { data: [] })
        ));
        setAllProducts([...listings, ...remaining.flatMap((page) => page.data ?? [])]);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const visibleProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return allProducts.filter((product) => {
      const text = [product.name, product.category, product.shortDescription, product.description, ...product.tags].join(' ').toLocaleLowerCase();
      const productCategory = product.category.toLowerCase();
      const categoryMatches = !category || (category.toLowerCase() === 'bedsheet' ? productCategory.includes('bed') : productCategory === category.toLowerCase());
      return (!keyword || text.includes(keyword)) && categoryMatches && (!collection || product.collection === collection);
    });
  }, [allProducts, category, collection, search]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="rounded-[2rem] border border-brand-200 bg-white/90 p-6 shadow-soft sm:p-9">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-500">FabBazaar collections</p>
        <h1 className="mt-2 font-serif text-4xl text-brand-900 sm:text-5xl">Home, dressed in tradition.</h1>
        <p className="mt-3 max-w-2xl text-brand-600">Browse traditional prints, soft textures and thoughtful details for every corner of your home.</p>
        <label className="mt-6 flex h-12 max-w-2xl items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
          <Search className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, colour or keyword" aria-label="Search products" className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-brand-900 outline-none focus:ring-0" />
        </label>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map(({ name, icon: Icon }) => (
            <button key={name} type="button" onClick={() => setCategory(category === name ? '' : name)} aria-pressed={category === name} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-medium transition ${category === name ? 'border-brand-500 bg-brand-100 text-brand-900' : 'border-brand-100 bg-brand-50/90 text-brand-700 hover:border-brand-300 hover:bg-brand-100'}`}>
              <Icon className="h-6 w-6 text-brand-500" strokeWidth={1.7} />{name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Bedsheet collections">
        <button type="button" onClick={() => setCollection('')} aria-pressed={!collection} className={`rounded-full border px-4 py-2 text-sm ${!collection ? 'border-brand-600 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}>All collections</button>
        {['Rivaaz', 'Jaipuri Collection', 'Bazaar Exclusive'].map((name) => <button key={name} type="button" onClick={() => setCollection(collection === name ? '' : name)} aria-pressed={collection === name} className={`rounded-full border px-4 py-2 text-sm ${collection === name ? 'border-brand-600 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}>{name}</button>)}
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-3xl text-brand-900">{collection || category || 'Shop all products'}</h2>
        <p className="text-sm text-brand-600">{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</p>
      </div>
      {visibleProducts.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-brand-100 bg-white p-8 text-brand-600">No products match that search. Try another keyword or category.</p>
      )}
    </section>
  );
}
