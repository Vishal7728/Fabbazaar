'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Search, UserRound, Menu, X, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/components/cart-provider';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountPath, setAccountPath] = useState('/login');
  const { itemCount } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    const syncAccount = () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('fabbazaar-user') || 'null');
        setAccountPath(user?.role === 'admin' ? '/admin' : user?.role === 'customer' ? '/account' : '/login');
      } catch {
        setAccountPath('/login');
      }
    };
    syncAccount();
    window.addEventListener('fabbazaar-auth-change', syncAccount);
    window.addEventListener('pageshow', syncAccount);
    return () => {
      window.removeEventListener('fabbazaar-auth-change', syncAccount);
      window.removeEventListener('pageshow', syncAccount);
    };
  }, []);

  function signOut() {
    sessionStorage.removeItem('fabbazaar-token');
    sessionStorage.removeItem('fabbazaar-user');
    window.dispatchEvent(new Event('fabbazaar-auth-change'));
    window.location.assign('/login');
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-amber-500/60 bg-black text-amber-100 shadow-soft">
      <div className="flex min-h-10 items-center justify-center gap-2 bg-rose-950 px-3 py-2 text-center text-xs font-semibold text-white sm:text-sm">
        <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-950">Hot</span>
        <span>Navratri festive deals · Bedsheet sets ₹699 (MRP ₹2,399)</span>
        <Link href="/products" className="font-bold text-amber-200 underline underline-offset-4 hover:text-white">Shop now</Link>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-3 sm:px-8 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-brand-300 bg-black shadow-sm sm:h-11 sm:w-11">
            <Image src="/images/fabbazaar-monogram.jpeg" alt="" width={44} height={44} className="h-full w-full object-cover" priority />
          </span>
          <div className="leading-tight">
            <p className="text-xl italic tracking-wide text-brand-50 sm:text-2xl" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              Fab<span className="text-amber-400">Bazaar</span><sup className="ml-0.5 align-super font-sans text-[9px] not-italic text-amber-300">™</sup>
            </p>
            <p className="mt-0.5 font-sans text-[8px] font-normal not-italic uppercase tracking-[0.15em] text-brand-300 sm:text-[9px] sm:tracking-[0.2em]">Celebrating Tradition</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 text-sm font-medium text-amber-300 md:flex">
          <Link
            href="/"
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-amber-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-black hover:text-amber-200 hover:shadow-[0_3px_0_0_#b9864f,0_8px_18px_rgba(212,175,55,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Home
          </Link>
          <Link
            href="/products"
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-amber-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-black hover:text-amber-200 hover:shadow-[0_3px_0_0_#b9864f,0_8px_18px_rgba(212,175,55,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-amber-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-black hover:text-amber-200 hover:shadow-[0_3px_0_0_#b9864f,0_8px_18px_rgba(212,175,55,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            About
          </Link>
            <Link
            href="/support"
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-amber-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-black hover:text-amber-200 hover:shadow-[0_3px_0_0_#b9864f,0_8px_18px_rgba(212,175,55,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >Support</Link>
          <Link
            href="/contact"
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-amber-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-black hover:text-amber-200 hover:shadow-[0_3px_0_0_#b9864f,0_8px_18px_rgba(212,175,55,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Contact
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <form onSubmit={handleSearch} className="hidden h-10 items-center md:flex">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-[180px] rounded-l-lg border border-brand-500 bg-brand-50 px-4 py-2 text-brand-900 placeholder:text-brand-600 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 sm:w-[220px]"
            />
            <button
              type="submit"
              className="navbar-search-button inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-r-lg border border-brand-400 bg-brand-400 transition-colors duration-200 hover:border-brand-300 hover:bg-brand-300"
              aria-label="Search"
            >
              <Search className="h-6 w-6" strokeWidth={2.25} />
            </button>
          </form>
          <Link href="/account/wishlist" className="hidden rounded-full border border-brand-500 p-2 text-brand-100 transition-all duration-200 hover:border-brand-300 hover:text-brand-50 sm:inline-flex" aria-label="Wishlist">
            <span className="text-sm" aria-hidden="true">♡</span>
          </Link>
          <Link href={accountPath} className="rounded-full border border-amber-700 p-2 text-amber-200 transition-all duration-200 hover:border-amber-400 hover:text-amber-100" aria-label={accountPath === '/login' ? 'Sign in' : 'Your account'}>
            <UserRound className="h-4 w-4" />
          </Link>
          {accountPath !== '/login' && <button type="button" onClick={signOut} className="hidden items-center gap-1.5 rounded-full border border-amber-700 px-3 py-2 text-xs font-medium text-amber-200 transition hover:border-amber-400 hover:text-amber-100 sm:inline-flex" aria-label="Sign out"><LogOut className="h-3.5 w-3.5"/>Sign out</button>}
          <Link href="/cart" className="relative rounded-full bg-brand-900 p-2 text-brand-100 transition-all duration-200 hover:bg-brand-700" aria-label={`Cart, ${itemCount} items`}>
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-400 px-1 text-[10px] font-bold text-brand-900">{itemCount}</span>}
          </Link>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex rounded-full border border-brand-500 p-2 text-brand-100 hover:border-brand-300 md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
        </div>
        <form onSubmit={handleSearch} className={pathname === '/register' ? 'hidden' : 'flex h-11 w-full items-center md:hidden'}>
          <input type="search" placeholder="Search products…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-l-xl border border-brand-500 bg-brand-50 px-4 text-brand-900 placeholder:text-brand-600 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400" aria-label="Search products" />
          <button type="submit" className="navbar-search-button inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-r-xl border border-brand-400 bg-brand-400 hover:border-brand-300 hover:bg-brand-300" aria-label="Search"><Search className="h-5 w-5"/></button>
        </form>
      </div>
      {menuOpen && <nav className="border-t border-amber-500/40 bg-black px-5 py-3 text-sm font-medium text-amber-300 md:hidden"><div className="mx-auto flex max-w-7xl flex-wrap gap-2">{[['Home','/'],['Shop','/products'],['About','/about'],['Support','/support'],['Contact','/contact']].map(([label,href])=><Link key={href} href={href} onClick={()=>setMenuOpen(false)} className="rounded-md border border-transparent px-4 py-2 transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_3px_0_0_#b9864f,0_8px_18px_rgba(212,175,55,0.18)]">{label}</Link>)}</div></nav>}
    </header>
  );
}
