import { Suspense } from 'react';
import { ProductBrowser } from '@/components/product-browser';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">Loading the collection…</div>}>
      <ProductBrowser />
    </Suspense>
  );
}
