import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Our story</p>
      <h1 className="mt-3 font-serif text-5xl text-brand-900">Celebrating the beauty of Indian homes.</h1>
      <div className="mt-8 space-y-5 text-lg text-brand-700">
        <p>FabBazaar began with a simple idea: bring the warmth and artistry of Indian textiles into modern homes—without losing the soul of handmade craftsmanship.</p>
        <p>We work closely with weavers, printers, and home artisans across India to craft premium bedsheets, curtains, and decor with timeless design and enduring comfort.</p>
      </div>
      <figure className="mt-12 overflow-hidden rounded-3xl border border-brand-200 bg-white shadow-soft">
        <Image src="/images/fabbazaar-workshop.png" alt="FabBazaar artisans carefully crafting and finishing traditional printed textiles in the Jaipur workshop" width={768} height={432} className="h-auto w-full object-cover" sizes="(max-width: 896px) 100vw, 896px" />
        <figcaption className="px-5 py-4 text-sm text-brand-600">The care and craft behind every FabBazaar textile.</figcaption>
      </figure>
    </div>
  );
}
