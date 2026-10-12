'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBasket, Search, UserRound, Menu, X, LogOut, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/components/cart-provider';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/products' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
  { label: 'Contact', href: '/contact' },
];

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
    <header className="site-navbar sticky top-0 z-50 border-b border-[#e6e0d5] bg-[#faf7f0]/95 text-[#244638] backdrop-blur-md">
      <div className="offer-bar flex min-h-8 items-center justify-center gap-3 overflow-hidden bg-[#244638] px-3 py-1.5 text-[10px] font-medium tracking-wide text-[#faf7f0] sm:text-xs">
        <div className="offer-window min-w-0 flex-1 overflow-hidden" aria-label="Festive offer: bedsheet sets ₹699, previously ₹2,399">
          <div className="offer-track flex w-max items-center gap-12 whitespace-nowrap">
            <span>✦ Festive offer · Printed bedsheet sets ₹699 · MRP ₹2,399 · Discover the collection ✦</span>
            <span aria-hidden="true">✦ Festive offer · Printed bedsheet sets ₹699 · MRP ₹2,399 · Discover the collection ✦</span>
          </div>
        </div>
        <Link href="/products" className="shrink-0 rounded-full border border-white/45 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#244638] sm:text-[10px]">Shop offer</Link>
      </div>
      <div className="navbar-main-row mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-1 px-4 py-1 sm:px-8 lg:px-10">
        <Link href="/" className="brand-lockup relative flex h-[62px] w-[88px] min-w-0 items-center overflow-hidden sm:h-[70px] sm:w-[100px]" aria-label="FabBazaar home">
          <span className="absolute inset-0 bg-[#18372c]" />
          <Image src="/images/logo.jpeg" alt="FabBazaar · Celebrating Tradition" width={1080} height={1016} className="brand-dark-image relative h-full w-full object-contain mix-blend-screen" priority />
          <span aria-hidden="true" className="brand-light-lockup absolute inset-0 z-10 hidden flex-col items-center justify-center text-center">
            <span className="brand-light-monogram flex h-[48%] items-center font-serif font-semibold leading-none text-[#b78c32]"><span>F</span><span>B</span></span>
            <span className="brand-light-wordmark font-serif text-[9px] font-semibold italic leading-none text-[#18372c] sm:text-[10px]">FabBazaar</span>
            <span className="brand-light-tagline mt-1 font-serif text-[4px] italic leading-none tracking-wide text-[#53675a] sm:text-[5px]">Celebrating Tradition</span>
          </span>
          <span className="brand-tm-mask brand-tm-mask-navbar absolute left-[84%] top-[53%] h-[8%] w-[13%] bg-[#18372c]" />
        </Link>

        <nav aria-label="Main navigation" className="navbar-primary-nav hidden items-center gap-1 text-sm font-medium text-[#244638] md:flex">
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className="nav-link rounded-lg border border-transparent px-3 py-2 text-sm tracking-wide text-[#244638] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions flex shrink-0 items-center gap-2 sm:gap-3">
          <form onSubmit={handleSearch} className="navbar-search-form hidden h-10 items-center md:flex">
            <input
              type="text"
              placeholder="Find your favourite print"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar-search h-9 w-[185px] rounded-l-full border border-[#e6e0d5] bg-white px-4 py-2 text-sm text-[#292d29] placeholder:text-[#70736c] focus:border-[#244638] focus:outline-none focus:ring-2 focus:ring-[#244638]/15 sm:w-[220px]"
            />
            <button
              type="submit"
              className="navbar-search-button inline-flex h-9 w-11 shrink-0 items-center justify-center rounded-r-full border border-[#244638] bg-[#244638] text-white transition-colors hover:bg-[#18372c]"
              aria-label="Search"
            >
              <Search className="h-6 w-6" strokeWidth={2.25} />
            </button>
          </form>
          <Link href="/account/wishlist" className="hidden rounded-full border border-[#e6e0d5] p-2 text-[#244638] transition-all duration-200 hover:border-[#a8b9a0] hover:bg-[#f2ebdd] sm:inline-flex" aria-label="Wishlist">
            <Heart className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={accountPath} className="rounded-full border border-[#e6e0d5] p-2 text-[#244638] transition-all duration-200 hover:border-[#a8b9a0] hover:bg-[#f2ebdd]" aria-label={accountPath === '/login' ? 'Sign in' : 'Your account'}>
            <UserRound className="h-4 w-4" />
          </Link>
          {accountPath !== '/login' && <button type="button" onClick={signOut} className="hidden items-center gap-1.5 rounded-full border border-[#e6e0d5] px-3 py-2 text-xs font-medium text-[#244638] transition hover:border-[#a8b9a0] hover:bg-[#f2ebdd] sm:inline-flex" aria-label="Sign out" title="Sign out"><LogOut className="h-3.5 w-3.5"/>Sign out</button>}
          <Link href="/cart" className="relative rounded-full bg-[#244638] p-2 text-white transition-all duration-200 hover:bg-[#18372c]" aria-label={`Cart, ${itemCount} items`}>
            <ShoppingBasket className="h-4 w-4" />
            {itemCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-400 px-1 text-[10px] font-bold text-brand-900">{itemCount}</span>}
          </Link>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex rounded-full border border-[#e6e0d5] p-2 text-[#244638] hover:border-[#a8b9a0] hover:bg-[#f2ebdd] md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
        </div>
        <form onSubmit={handleSearch} className={`navbar-search-form ${pathname === '/register' ? 'hidden' : 'flex h-10 w-full items-center md:hidden'}`}>
          <input type="search" placeholder="Find your favourite print" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="navbar-search h-10 min-w-0 flex-1 rounded-l-full border border-[#e6e0d5] bg-white px-4 text-sm text-[#292d29] placeholder:text-[#70736c] focus:border-[#244638] focus:outline-none focus:ring-2 focus:ring-[#244638]/15" aria-label="Search products" />
          <button type="submit" className="navbar-search-button inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-r-full border border-[#244638] bg-[#244638] text-white hover:bg-[#18372c]" aria-label="Search"><Search className="h-5 w-5"/></button>
        </form>
      </div>
      {menuOpen && (
        <nav aria-label="Mobile navigation" className="mobile-navbar-menu border-t px-5 py-3 text-sm font-medium md:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
            {NAV_ITEMS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border px-4 py-2 transition"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
