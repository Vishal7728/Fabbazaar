'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { products } from '@/lib/products';
import { getApiBaseUrl } from '@/lib/api';

export type CartLine = { productId: string; quantity: number };
type CatalogProduct = (typeof products)[number];
type CartContextValue = {
  items: CartLine[];
  catalogProducts: CatalogProduct[];
  itemCount: number;
  ready: boolean;
  error: string;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = 'fabbazaar-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>(products);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      let availableProducts = products;
      try {
        const response = await fetch(`${getApiBaseUrl()}/products?limit=40&page=1`, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const result = await response.json() as { data?: CatalogProduct[]; pagination?: { totalPages?: number } };
          const firstPage = result.data ?? [];
          const totalPages = result.pagination?.totalPages ?? 1;
          const rest = await Promise.all(Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => fetch(`${getApiBaseUrl()}/products?limit=40&page=${index + 2}`, { signal: AbortSignal.timeout(5000) }).then(async (page) => page.ok ? (await page.json() as { data?: CatalogProduct[] }).data ?? [] : [])));
          if (firstPage.length) availableProducts = [...firstPage, ...rest.flat()];
        }
      } catch { /* Keep the bundled catalogue available while the API is offline. */ }
      if (cancelled) return;
      setCatalogProducts(availableProducts);
      const validProductIds = new Set(availableProducts.map((product) => product.id));
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!Array.isArray(parsed)) throw new Error('Saved cart data has an invalid format.');
          setItems(parsed.filter((item): item is CartLine => item !== null && typeof item === 'object' && 'productId' in item && typeof item.productId === 'string' && validProductIds.has(item.productId) && 'quantity' in item && typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99));
        }
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to read the saved cart.'); }
      setReady(true);
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(items)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the cart.'); }
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    catalogProducts,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    ready,
    error,
    addItem: (productId, quantity = 1) => {
      if (!catalogProducts.some((product) => product.id === productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) { setError('This product or quantity cannot be added to the cart.'); return; }
      setError('');
      setItems((current) => {
        const existing = current.find((item) => item.productId === productId);
        if (!existing) return [...current, { productId, quantity }];
        return current.map((item) => item.productId === productId ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item);
      });
    },
    updateQuantity: (productId, quantity) => {
      if (!catalogProducts.some((product) => product.id === productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) { setError('Choose a quantity from 1 to 99.'); return; }
      setError('');
      setItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item));
    },
    removeItem: (productId) => { setError(''); setItems((current) => current.filter((item) => item.productId !== productId)); }
  }), [catalogProducts, error, items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
