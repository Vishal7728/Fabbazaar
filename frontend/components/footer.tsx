import Link from 'next/link';
import Image from 'next/image';
import { SocialLinks } from '@/components/brand-links';

export function Footer() {
  return (
    <footer className="site-footer relative overflow-hidden border-t border-[#496857] bg-[#244638] text-[#faf7f0]">
      <div className="footer-jaal pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr] lg:gap-10 lg:px-8">
        <div>
          <div className="relative h-32 w-36 overflow-hidden"><span className="absolute inset-0 bg-[#244638]"/><Image src="/images/logo.jpeg" alt="FabBazaar · Celebrating Tradition" width={1080} height={1016} className="relative h-full w-full object-contain mix-blend-screen"/><span className="brand-tm-mask absolute left-[84%] top-[53%] h-[8%] w-[13%] bg-[#244638]"/></div>
          <p className="-mt-1 text-[10px] uppercase tracking-[0.2em] text-[#d4dfd0]">A brand of Dakon Enterprises</p>
          <p className="mt-3 max-w-xs font-serif text-sm italic text-[#e4ebe1]">Printed bedsheets and home textiles for a warm, welcoming home.</p>
        </div>
        <div>
          <h3 className="mb-3 font-serif text-lg text-[#d6e1d2]">Shop the edit</h3>
          <ul className="space-y-2 text-xs text-[#e7dfcf]">
            <li><Link href="/products">Bedsheets</Link></li>
            <li><Link href="/products?category=Comforter">Comforter sets</Link></li>
            <li><Link href="/products?category=Diwan%20Sets">Diwan sets</Link></li>
            <li><Link href="/products?category=Dohar%20Sets">Dohar sets</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-serif text-lg text-[#d6e1d2]">Here to help</h3>
          <ul className="space-y-2 text-xs text-[#e7dfcf]">
            <li><Link href="/contact">Contact us</Link></li>
            <li><Link href="/support">24×7 customer support</Link></li>
            <li><Link href="/privacy">Privacy policy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-serif text-lg text-[#d6e1d2]">Visit Jaipur</h3>
          <p className="text-xs leading-5 text-[#e7dfcf]">D-271, Mulipura Scheme,<br />Jaipur, Rajasthan 302039</p>
          <a className="mt-2 block text-xs text-[#e7dfcf] hover:text-white" href="mailto:support@fabbazaar.com">support@fabbazaar.com</a>
          <a className="mt-2 block text-xs text-[#e7dfcf] hover:text-white" href="tel:+917744991441">+91 77449 91441</a>
          <a className="mt-1 block text-xs text-[#e7dfcf] hover:text-white" href="tel:+919529329402">+91 95293 29402</a>
          <div className="mt-5"><SocialLinks /></div>
        </div>
      </div>
      <div className="relative border-t border-[#496857] px-4 py-3 text-center text-[10px] tracking-wide text-[#d4dfd0]">
        © 2026 FabBazaar. Crafted with heritage and care.
      </div>
    </footer>
  );
}
