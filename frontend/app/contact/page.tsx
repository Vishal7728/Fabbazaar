import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

const contactOptions = [
  { icon: Mail, label: 'Email', detail: 'support@fabbazaar.com', href: 'mailto:support@fabbazaar.com' },
  { icon: Phone, label: 'Call', detail: '+91 77449 91441', href: 'tel:+917744991441' },
  { icon: Phone, label: 'Call', detail: '+91 95293 29402', href: 'tel:+919529329402' },
  { icon: MessageCircle, label: 'WhatsApp', detail: 'Message our team', href: 'https://wa.me/917744991441' }
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-500">FabBazaar care · Jaipur</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-900 sm:text-4xl">We’re here to help.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-brand-600">Questions about a product or an order? Reach the team using the contact option that works best for you.</p>
      </header>

      <section aria-label="Contact options" className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {contactOptions.map(({ icon: Icon, label, detail, href }) => (
          <a key={`${label}-${detail}`} href={href} target={label === 'WhatsApp' ? '_blank' : undefined} rel={label === 'WhatsApp' ? 'noreferrer' : undefined} className="contact-option group flex min-h-24 items-center gap-4 rounded-2xl border px-4 py-4 transition">
            <span className="contact-option-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-200 text-brand-600 transition"><Icon className="h-4 w-4" strokeWidth={1.7} /></span>
            <span><span className="block text-[10px] uppercase tracking-[0.18em] text-brand-500">{label}</span><span className="mt-1 block text-sm font-medium text-brand-900">{detail}</span></span>
          </a>
        ))}
      </section>

      <a className="contact-location mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-5 transition" href="https://maps.google.com/?q=D-271%2C+Mulipura+Scheme%2C+Jaipur%2C+Rajasthan+302039" target="_blank" rel="noreferrer">
        <span className="flex items-center gap-4"><span className="contact-option-icon flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 text-brand-600 transition"><MapPin className="h-4 w-4" strokeWidth={1.7} /></span><span><span className="block text-[10px] uppercase tracking-[0.18em] text-brand-500">Visit us</span><span className="mt-1 block text-sm font-medium text-brand-900">D-271, Mulipura Scheme, Jaipur, Rajasthan 302039</span></span></span>
        <span className="ml-14 text-xs text-brand-600 sm:ml-0">Open in Google Maps ↗</span>
      </a>
    </main>
  );
}
