import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ProductGallery } from '@/components/product-gallery';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { WishlistButton } from '@/components/wishlist-button';
import { ProductReviewSummary } from '@/components/product-review-summary';
import { DynamicProductDetail } from '@/components/dynamic-product-detail';
import { getProductBySlug, products } from '@/lib/products';

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return <DynamicProductDetail slug={slug} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-12 lg:px-8">
      <Link href="/products" className="mb-8 inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"><ArrowLeft className="h-4 w-4" /> Back to collection</Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery name={product.name} images={product.gallery} />

        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-500">{product.category}</p>
          <h1 className="mt-3 font-serif text-5xl text-brand-900">{product.name}</h1>
          <ProductReviewSummary slug={product.slug} />
          <div className="mt-6 flex items-end gap-4">
            <p className="text-4xl font-semibold text-brand-900">₹{product.price.toLocaleString('en-IN')}</p>
            {product.originalPrice && (
              <div>
                <p className="text-xl text-brand-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</p>
                <p className="text-sm font-medium text-emerald-700">
                  Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                </p>
              </div>
            )}
          </div>
          <p className="mt-6 text-lg text-brand-700">{product.description}</p>
          <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
            <p className="font-medium text-brand-900">What&apos;s included</p>
            <p className="mt-2 text-brand-700">1 bedsheet + 2 matching pillow covers</p>
          </div>

          <div className="mt-8 hidden flex-wrap gap-3 md:flex">
            <AddToCartButton productId={product.id} className="rounded-full bg-brand-900 px-6 py-3 text-white hover:bg-brand-700" />
            <WishlistButton productId={product.id} />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-brand-100 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3 text-brand-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Premium quality & easy returns</span>
            </div>
            <ul className="mt-4 space-y-2 text-brand-700">
              <li>Free shipping on order values above ₹3,000.</li>
              <li>Secure payment and handcrafted quality guarantees.</li>
              <li>7-day easy exchange policy for most items.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-brand-200 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex h-12 w-14 items-center justify-center rounded-full border border-brand-200 bg-white"><WishlistButton productId={product.id} /></div>
        <AddToCartButton productId={product.id} className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#963e3e] px-4 text-sm font-semibold text-white hover:bg-[#7e3030]" />
      </div>
    </div>
  );
}
