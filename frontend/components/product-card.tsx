import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import type { Product } from '@/lib/products';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { MarketplaceLinks } from '@/components/brand-links';
import { WishlistButton } from '@/components/wishlist-button';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-brand-100 bg-white transition hover:-translate-y-1 hover:border-brand-300">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative h-48 w-full overflow-hidden min-[420px]:h-60 sm:h-72">
          <Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute right-3 top-3 z-10 rounded-full bg-white/95"><WishlistButton productId={product.id} /></div>
        </div>
      </Link>
      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-brand-600 sm:px-2.5 sm:text-[10px] sm:tracking-[0.25em]">{product.category}</span>
          {product.rating !== undefined && (
            <div className="flex items-center gap-1 text-brand-700">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              <span className="text-sm font-medium">{product.rating}</span>
              {product.reviews !== undefined && <span className="text-xs text-brand-500">({product.reviews})</span>}
            </div>
          )}
        </div>
        <div>
          <h3 className="line-clamp-2 font-serif text-base text-brand-900 sm:text-2xl">{product.name}</h3>
          <p className="mt-2 hidden text-sm text-brand-600 sm:block">{product.shortDescription}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-brand-900 sm:text-2xl">₹{product.price.toLocaleString('en-IN')}</p>
            {product.originalPrice && (
              <p className="text-sm text-brand-400">
                <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                <span className="ml-2 font-medium text-emerald-700">Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="inline-flex items-center gap-1 rounded-full border border-brand-200 px-2 py-2 text-xs font-medium text-brand-900 transition hover:border-brand-400 sm:gap-2 sm:px-4 sm:text-sm">
              View <ArrowRight className="h-4 w-4" />
            </Link>
            <AddToCartButton productId={product.id} compact className="rounded-full bg-brand-900 px-3 py-2 text-sm font-medium text-brand-50 transition hover:bg-brand-700 sm:px-4" />
          </div>
        </div>
        <MarketplaceLinks productName={product.name} compact />
      </div>
    </article>
  );
}
