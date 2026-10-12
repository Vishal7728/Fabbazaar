import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import type { Product } from '@/lib/products';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { WishlistButton } from '@/components/wishlist-button';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card-shell group overflow-hidden rounded-xl border transition hover:-translate-y-0.5 hover:border-brand-300">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[3/2]">
          <Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-[1.025]" sizes="(max-width: 640px) 50vw, (max-width: 1023px) 33vw, 25vw" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-8 sm:px-4 sm:pb-3"><p className="line-clamp-1 text-xs font-medium tracking-wide text-white sm:text-sm">{product.shortDescription}</p></div>
          <div className="absolute right-3 top-3 z-10 rounded-full border border-white/85 bg-white/90"><WishlistButton productId={product.id} /></div>
        </div>
      </Link>
      <div className="flex h-full flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-brand-600 sm:px-2.5 sm:text-[10px] sm:tracking-[0.25em]">{product.category}</span>
          {typeof product.rating === 'number' && product.rating > 0 && typeof product.reviews === 'number' && product.reviews > 0 && (
            <div className="flex items-center gap-1 text-brand-700">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              <span className="text-sm font-medium">{product.rating}</span>
              {product.reviews !== undefined && <span className="text-xs text-brand-500">({product.reviews})</span>}
            </div>
          )}
        </div>
        <div>
          <h3 className="line-clamp-2 font-serif text-sm text-brand-900 sm:text-lg">{product.name}</h3>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-brand-900 sm:text-2xl">₹{product.price.toLocaleString('en-IN')}</p>
            {product.originalPrice && (
              <p className="text-sm text-brand-400">
                <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                <span className="ml-2 font-medium text-[#b9684d]">Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="inline-flex items-center gap-1 rounded-full border border-brand-200 px-2 py-1.5 text-[11px] font-medium text-brand-900 transition hover:border-brand-400 sm:px-3 sm:text-xs">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <AddToCartButton productId={product.id} compact className="product-card-add rounded-full px-2.5 py-2 text-xs font-semibold sm:px-3" />
          </div>
        </div>
      </div>
    </article>
  );
}
