import { Facebook, Instagram, MessageCircle } from 'lucide-react';

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  const links = [
    { label: 'Facebook', href: 'https://www.facebook.com/share/r/1FY2qv9oVB/the', icon: Facebook },
    { label: 'Instagram', href: 'https://www.instagram.com/reel/DeDiKTVTLG9/?stkn=MThxcXNrOHY1cTlkcQ==', icon: Instagram },
    { label: 'WhatsApp', href: 'https://wa.me/917744991441', icon: MessageCircle }
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && <span className="mr-1 text-xs uppercase tracking-widest text-brand-300">Follow & chat</span>}
      {links.map(({ label, href, icon: Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-500 text-brand-100 transition hover:border-brand-300 hover:bg-brand-700 hover:text-brand-50">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export function MarketplaceLinks({ productName, compact = false }: { productName: string; compact?: boolean }) {
  const query = encodeURIComponent(`FabBazaar ${productName}`);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'rounded-2xl border border-brand-100 bg-brand-50 p-4'}`}>
      {!compact && <span className="w-full text-xs text-brand-600">Search this product on</span>}
      <a href={`https://www.amazon.in/s?k=${query}`} target="_blank" rel="noreferrer" aria-label={`Search ${productName} on Amazon`} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-brand-800 hover:border-brand-400">
        <span className="font-serif tracking-tight">amazon</span><svg aria-hidden="true" width="20" height="8" viewBox="0 0 20 8" className="-ml-1 mt-1"><path d="M1 2.5c5 4 11 4 17 0M14.5 1.5 18 2l-.6 3" fill="none" stroke="#f59b24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </a>
      <a href={`https://www.flipkart.com/search?q=${query}`} target="_blank" rel="noreferrer" aria-label={`Search ${productName} on Flipkart`} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-[#2874f0] hover:border-brand-400">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path d="M5 8.5h14l1 12H4l1-12Z" fill="#ffe500" stroke="#f39c12" strokeWidth="1.2"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#2874f0" strokeWidth="1.7" strokeLinecap="round"/><path d="M9 12v5m0-2.5h5a1.4 1.4 0 0 0 0-2.8H9" fill="none" stroke="#2874f0" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Flipkart
      </a>
    </div>
  );
}
