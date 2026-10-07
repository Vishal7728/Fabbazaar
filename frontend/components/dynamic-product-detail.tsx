'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { ProductGallery } from '@/components/product-gallery';
import { ProductReviewSummary } from '@/components/product-review-summary';
import { WishlistButton } from '@/components/wishlist-button';
import type { Product } from '@/lib/products';

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) apiUrl.hostname = window.location.hostname;
  return apiUrl.toString().replace(/\/+$/, '');
})();

export function DynamicProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) { setNotFound(true); return; }
        const result = await response.json() as { data?: Product };
        if (!response.ok || !result.data) throw new Error('Product listing unavailable');
        setProduct(result.data);
      })
      .catch(() => { if (!controller.signal.aborted) setNotFound(true); });
    return () => controller.abort();
  }, [slug]);

  if (notFound) return <div className="mx-auto max-w-5xl px-5 py-20 text-center"><h1 className="font-serif text-4xl text-brand-900">This product is no longer listed.</h1><Link href="/products" className="mt-5 inline-flex text-brand-600 underline">Return to the collection</Link></div>;
  if (!product) return <div className="mx-auto max-w-7xl px-5 py-20 text-brand-600">Loading product…</div>;

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  return <div className="mx-auto max-w-7xl px-5 pb-28 pt-8 sm:px-8 sm:pb-12 lg:px-10">
    <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"><ArrowLeft className="h-4 w-4"/> Back to collection</Link>
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery name={product.name} images={gallery}/>
      <div><p className="text-xs uppercase tracking-[0.28em] text-brand-500">{product.category}</p><h1 className="mt-3 font-serif text-4xl text-brand-900 sm:text-5xl">{product.name}</h1><ProductReviewSummary slug={product.slug}/><p className="mt-6 text-3xl font-semibold text-brand-900">₹{product.price.toLocaleString('en-IN')}</p><p className="mt-5 text-lg leading-7 text-brand-700">{product.description}</p>
        <div className="mt-7 hidden flex-wrap gap-3 md:flex"><AddToCartButton productId={product.id} className="rounded-full bg-brand-900 px-6 py-3 text-white hover:bg-brand-700"/><WishlistButton productId={product.id}/></div>
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-5"><div className="flex items-center gap-3 text-brand-900"><ShieldCheck className="h-5 w-5 text-emerald-600"/><span className="font-medium">Premium home textiles from FabBazaar</span></div></div>
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-brand-200 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex h-12 w-14 items-center justify-center rounded-full border border-brand-200 bg-white"><WishlistButton productId={product.id} /></div>
      <AddToCartButton productId={product.id} className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#963e3e] px-4 text-sm font-semibold text-white hover:bg-[#7e3030]" />
    </div>
  </div>;
}
