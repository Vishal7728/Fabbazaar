import Link from 'next/link';
import { SocialLinks } from '@/components/brand-links';

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-brand-900 text-brand-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-serif text-3xl">FabBazaar<sup className="ml-0.5 align-super font-sans text-xs">™</sup></p>
          <p className="mt-1 text-xs tracking-wide text-brand-300">A brand of Dakon Enterprises</p>
          <p className="mt-4 text-sm text-brand-200">Premium Indian home textiles crafted for warm, timeless living.</p>
        </div>
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.22em] text-brand-200">Shop</h3>
          <ul className="space-y-2 text-sm text-brand-100">
            <li><Link href="/products">Bedsheets</Link></li>
            <li><Link href="/products?category=Comforter">Comforter sets</Link></li>
            <li><Link href="/products?category=Diwan%20Sets">Diwan sets</Link></li>
            <li><Link href="/products?category=Dohar%20Sets">Dohar sets</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.22em] text-brand-200">Support</h3>
          <ul className="space-y-2 text-sm text-brand-100">
            <li><Link href="/contact">Contact us</Link></li>
            <li><Link href="/support">24×7 customer support</Link></li>
            <li><Link href="/privacy">Privacy policy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.22em] text-brand-200">Visit</h3>
          <p className="text-sm text-brand-100">D-271, Mulipura Scheme,<br />Jaipur, Rajasthan 302039</p>
          <a className="mt-2 block text-sm text-brand-100 hover:text-white" href="mailto:support@fabbazaar.com">support@fabbazaar.com</a>
          <a className="mt-2 block text-sm text-brand-100 hover:text-white" href="tel:+917744991441">+91 77449 91441</a>
          <a className="mt-1 block text-sm text-brand-100 hover:text-white" href="tel:+919529329402">+91 95293 29402</a>
          <div className="mt-5"><SocialLinks /></div>
        </div>
      </div>
      <div className="border-t border-brand-700 px-4 py-4 text-center text-sm text-brand-200">
        © 2026 FabBazaar™. Crafted with heritage and care.
      </div>
    </footer>
  );
}
