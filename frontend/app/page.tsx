import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { getFeaturedProducts, products } from '@/lib/products';
import { categories } from '@/lib/categories';
import { ProductCard } from '@/components/product-card';
import { LoopingVideo } from '@/components/looping-video';
import { HomeHero } from '@/components/home-hero';

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <div>
      <HomeHero />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Collections</p>
            <h2 className="mt-2 font-serif text-4xl text-brand-900">Shop by category</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
          {categories.map(({ name, icon: Icon }) => (
            <Link key={name} href={`/products?category=${encodeURIComponent(name)}`} className="rounded-[1.5rem] border border-brand-100 bg-white/95 p-5 text-center shadow-soft transition hover:-translate-y-1 hover:border-brand-300">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600"><Icon className="h-7 w-7" strokeWidth={1.7} /></div>
              <h3 className="font-serif text-lg text-brand-900">{name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Featured</p>
            <h2 className="mt-2 font-serif text-4xl text-brand-900">Best sellers</h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.28em] text-brand-500">FabBazaar films</p>
            <h2 className="mt-2 font-serif text-4xl text-brand-900">See our bedsheet advertisements</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <article className="overflow-hidden rounded-[2rem] border border-brand-100 bg-brand-50 shadow-soft">
              <LoopingVideo src="/videos/bedsheet-advertisement.mp4" poster={products[0].image} title="Bedsheet advertisement" />
              <h3 className="p-5 font-serif text-2xl text-brand-900">Bedsheet advertisement</h3>
            </article>
            <article className="overflow-hidden rounded-[2rem] border border-brand-100 bg-brand-50 shadow-soft">
              <LoopingVideo src="/videos/cotton-bedsheet-commercial.mp4" poster={products[1].image} title="Cotton bedsheet commercial" />
              <h3 className="p-5 font-serif text-2xl text-brand-900">Cotton bedsheet commercial</h3>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-brand-900 py-16 text-brand-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-brand-200">Heritage</p>
              <h2 className="mt-2 font-serif text-4xl text-white">Time-honored craftsmanship, modern comfort.</h2>
            </div>
            <div className="space-y-6 text-brand-100">
              <p>Each FabBazaar collection is designed with the grace of Indian textile traditions—handloom textures, heritage motifs, and premium finishes that transform everyday living into a cherished ritual.</p>
              <p>From joyful festival gifting to serene bedroom styling, our ranges blend artisanal storytellings with effortless utility.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Home stories</p>
            <h2 className="mt-2 font-serif text-4xl text-brand-900">Loved by our customers</h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { name: 'Nisha S.', quote: 'The quality is stunning and the color palette feels luxurious—exactly the elegance I wanted for my bedroom.' },
            { name: 'Rohan M.', quote: 'From ordering to delivery, the experience felt premium. The bedsheets are soft, durable, and beautifully designed.' },
            { name: 'Ananya P.', quote: 'FabBazaar blends traditional craftsmanship with modern Indian interiors so beautifully. I ordered gifting sets too.' }
          ].map((item) => (
            <div key={item.name} className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-1 text-amber-400">{Array.from({ length: 5 }, (_, idx) => <Star key={idx} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-4 text-lg text-brand-700">“{item.quote}”</p>
              <p className="mt-6 font-medium text-brand-900">{item.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-brand-100 via-brand-50 to-white p-8 shadow-soft lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-brand-500">New arrivals</p>
              <h2 className="mt-2 font-serif text-4xl text-brand-900">Refresh your spaces with handpicked essentials.</h2>
            </div>
            <div className="flex justify-end">
              <Link href="/products" className="rounded-full bg-brand-900 px-6 py-3 text-white hover:bg-brand-700">Explore new arrivals</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
