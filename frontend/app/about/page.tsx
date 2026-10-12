import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="about-story mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Our story</p>
      <h1 className="mt-3 max-w-3xl font-serif text-brand-900">Printed bedsheets for expressive, welcoming homes.</h1>
      <div className="mt-8 space-y-5 text-lg text-brand-700">
        <p>FabBazaar is a Jaipur-based home-textile brand offering bedsheets with floral, paisley, and heritage-inspired prints.</p>
        <p>Browse the collection by design and colour, compare the available product photos, and check each listing for its size and included set details.</p>
      </div>
      <section aria-label="FabBazaar team" className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { src: '/images/fabbazaar-owner-1.jpeg', alt: 'FabBazaar team member in a blue suit' },
          { src: '/images/fabbazaar-owner-2.jpeg', alt: 'FabBazaar team member in a dark waistcoat' }
        ].map((person, index) => (
          <figure key={person.src} className="overflow-hidden rounded-xl border border-brand-200 bg-white">
            <div className="relative h-60 sm:h-72">
              <Image src={person.src} alt={person.alt} fill sizes="(max-width: 640px) 100vw, 50vw" className={`object-cover ${index === 0 ? 'object-[center_0%]' : 'object-[center_5%]'}`} />
            </div>
            <figcaption className="flex items-center justify-between px-4 py-2.5">
              <span className="font-serif text-sm text-brand-900">The FabBazaar team</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-brand-500">Jaipur, India</span>
            </figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
