import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-500">A personal welcome</p>
        <h1 className="mt-3 font-serif text-5xl text-brand-900 sm:text-6xl">Meet the people behind FabBazaar.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-brand-700">We’re here to help you find thoughtful textiles for the moments and rituals that make a house feel like home.</p>
      </div>
      <section aria-label="FabBazaar owners" className="mt-10 grid gap-5 sm:grid-cols-2">
        {[
          { src: '/images/fabbazaar-owner-1.jpeg', alt: 'FabBazaar owner in a blue suit' },
          { src: '/images/fabbazaar-owner-2.jpeg', alt: 'FabBazaar owner in a dark waistcoat' }
        ].map((owner, index) => (
          <figure key={owner.src} className="overflow-hidden rounded-[1.75rem] border border-brand-200 bg-white">
            <div className="relative h-[25rem] sm:h-[30rem]">
              <Image src={owner.src} alt={owner.alt} fill sizes="(max-width: 640px) 100vw, 50vw" className={`object-cover ${index === 0 ? 'object-[center_16%]' : 'object-[center_13%]'}`} />
            </div>
            <figcaption className="flex items-center justify-between px-5 py-4">
              <span className="font-serif text-xl text-brand-900">The FabBazaar team</span>
              <span className="text-xs uppercase tracking-[0.18em] text-brand-500">Jaipur, India</span>
            </figcaption>
          </figure>
        ))}
      </section>
      <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2">
        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft">
          <p className="font-medium text-brand-900">Email</p>
          <a className="mt-2 block text-brand-700 hover:text-brand-900" href="mailto:support@fabbazaar.com">support@fabbazaar.com</a>
        </div>
        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft">
          <p className="font-medium text-brand-900">Call or WhatsApp</p>
          <a className="mt-2 block text-brand-700 hover:text-brand-900" href="tel:+917744991441">+91 77449 91441</a>
          <a className="mt-1 block text-brand-700 hover:text-brand-900" href="tel:+919529329402">+91 95293 29402</a>
          <a className="mt-3 inline-flex items-center rounded-full bg-[#25d366] px-4 py-2 text-sm font-semibold text-white" href="https://wa.me/917744991441" target="_blank" rel="noreferrer">Message on WhatsApp</a>
        </div>
        <a className="rounded-[2rem] border border-brand-100 bg-white p-6 hover:border-brand-300 sm:col-span-2" href="https://maps.google.com/?q=D-271%2C+Mulipura+Scheme%2C+Jaipur%2C+Rajasthan+302039" target="_blank" rel="noreferrer">
          <p className="font-medium text-brand-900">Visit FabBazaar</p>
          <p className="mt-2 text-brand-700">D-271, Mulipura Scheme, Jaipur (Rajasthan) 302039</p>
          <p className="mt-3 text-sm text-brand-500">Open address in Google Maps →</p>
        </a>
      </div>
    </div>
  );
}
