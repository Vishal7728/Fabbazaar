'use client';

import { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/cart-provider';

export function AddToCartButton({ productId, className, compact = false }: { productId: string; className: string; compact?: boolean }) {
  const { addItem, ready } = useCart();
  const [added, setAdded] = useState(false);

  function add() {
    addItem(productId);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button type="button" onClick={add} disabled={!ready} aria-label={added ? 'Added to cart' : ready ? 'Add to cart' : 'Loading cart'} className={`${className} whitespace-nowrap disabled:cursor-wait disabled:opacity-60`}>
      {added ? <Check className={compact ? 'h-4 w-4 min-[420px]:mr-2' : 'mr-2 inline h-4 w-4'} /> : <ShoppingBag className={compact ? 'h-4 w-4 min-[420px]:mr-2' : 'mr-2 inline h-4 w-4'} />}
      <span className={compact ? 'hidden min-[420px]:inline' : ''}>{added ? 'Added to cart' : ready ? 'Add to cart' : 'Loading…'}</span>
    </button>
  );
}
