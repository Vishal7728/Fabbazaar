'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const pageSize = 16;

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setCollection(searchParams.get('collection') || '');
    setPage(1);
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
    const results = allProducts.filter((product) => {
      const text = [product.name, product.category, product.shortDescription, product.description, ...product.tags].join(' ').toLocaleLowerCase();
      const productCategory = product.category.toLowerCase();
      const categoryMatches = !category || (category.toLowerCase() === 'bedsheet' ? productCategory.includes('bed') : productCategory === category.toLowerCase());
      return (!keyword || text.includes(keyword)) && categoryMatches && (!collection || product.collection === collection);
    });
    return results.sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price || a.name.localeCompare(b.name);
      if (sort === 'price-high') return b.price - a.price || a.name.localeCompare(b.name);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name);
    });
  }, [allProducts, category, collection, search, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const pageProducts = visibleProducts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-brand-600"><Link href="/" className="hover:text-brand-900">Home</Link><span aria-hidden="true">/</span><span className="text-brand-900">Shop</span></nav>
      <div className="border-b border-brand-200 pb-5 sm:pb-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-brand-500">FabBazaar collections</p>
            <h1 className="mt-1 font-serif text-3xl text-brand-900 sm:text-4xl">Home, dressed in tradition.</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-600">Browse traditional prints, soft textures and thoughtful details for every corner of your home.</p>
          </div>
          <label className="product-search-field flex h-11 w-full items-center gap-3 rounded-lg border border-brand-200 bg-white px-3.5 md:max-w-sm">
          <Search className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, colour or keyword" aria-label="Search products" className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-brand-900 outline-none focus:ring-0" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 sm:gap-x-4">
          {categories.map(({ name, icon: Icon }) => (
            <button key={name} type="button" onClick={() => { setCategory(category === name ? '' : name); setPage(1); }} aria-pressed={category === name} className={`inline-flex min-h-10 items-center gap-2 rounded-md border-b-2 px-2.5 py-2 text-left text-xs font-medium transition ${category === name ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-transparent text-brand-600 hover:border-brand-300 hover:text-brand-900'}`}>
              <Icon className="h-4 w-4 text-brand-500" strokeWidth={1.6} />{name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Bedsheet collections">
        <button type="button" onClick={() => { setCollection(''); setPage(1); }} aria-pressed={!collection} className={`rounded-full border px-4 py-2 text-sm ${!collection ? 'border-brand-600 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}>All collections</button>
        {['Rivaaz', 'Jaipuri Collection', 'Bazaar Exclusive'].map((name) => <button key={name} type="button" onClick={() => { setCollection(collection === name ? '' : name); setPage(1); }} aria-pressed={collection === name} className={`rounded-full border px-4 py-2 text-sm ${collection === name ? 'border-brand-600 bg-brand-900 text-white' : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}>{name}</button>)}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-brand-900">{collection || category || 'Shop all products'}</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-brand-600">{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</p>
          <label className="flex items-center gap-2 text-xs text-brand-600">Sort
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort products" className="sort-select rounded-lg border border-brand-200 bg-white px-2.5 py-2 text-sm text-brand-900">
              <option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>
      </div>
      {visibleProducts.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {pageProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          {totalPages > 1 && <nav aria-label="Product pages" className="col-span-full mt-3 flex items-center justify-center gap-3">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-full border border-brand-200 px-4 py-2 text-sm text-brand-700 disabled:opacity-40">Previous</button>
            <span aria-live="polite" className="text-sm text-brand-600">Page {page} of {totalPages}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-full border border-brand-200 px-4 py-2 text-sm text-brand-700 disabled:opacity-40">Next</button>
          </nav>}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-brand-100 bg-white p-8 text-brand-600">No products match that search. Try another keyword or category.</p>
      )}
    </section>
  );
}
