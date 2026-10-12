import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

      <section className="home-categories mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-500">A home for every layer</p>
            <h2 className="mt-1 font-serif text-2xl italic text-brand-900 sm:text-3xl">Browse the collection</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 xl:grid-cols-7">
          {categories.filter(({ name }) => name !== 'Home Furnishings').map(({ name, icon: Icon }) => (
            <Link key={name} href={`/products?category=${encodeURIComponent(name)}`} className="category-link group flex items-center gap-2.5 border-b border-brand-300/50 py-2.5 transition hover:border-brand-500 sm:gap-3">
              <div className="category-medallion flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-300/70 text-brand-600 transition group-hover:bg-brand-900 group-hover:text-amber-100"><Icon className="h-[18px] w-[18px]" strokeWidth={1.35} /></div>
              <h3 className="font-serif text-sm text-brand-900 sm:text-base">{name}</h3>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-brand-400 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-bestsellers mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-500">The signature edit</p>
            <h2 className="mt-1 font-serif text-3xl text-brand-900 sm:text-4xl">Loved in every room</h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="home-films relative isolate overflow-hidden bg-[#244638] py-10 text-[#faf7f0] sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d4dfd0]">The FabBazaar film room</p>
              <h2 className="mt-1 font-serif text-3xl text-[#fffaf0] sm:text-4xl">See the print in motion.</h2>
            </div>
            <span className="text-sm text-[#e4ebe1]">A closer look at the collection</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <article className="film-card group">
              <div className="film-frame relative overflow-hidden rounded-2xl border border-white/15 bg-white/5"><LoopingVideo src="/videos/bedsheet-advertisement.mp4" poster={products[0].image} title="Bedsheet advertisement" /></div>
              <h3 className="px-1 pt-3 font-serif text-lg italic text-[#fffaf0] sm:text-xl">Patterns made to be lived in</h3>
            </article>
            <article className="film-card group">
              <div className="film-frame relative overflow-hidden rounded-2xl border border-white/15 bg-white/5"><LoopingVideo src="/videos/cotton-bedsheet-commercial.mp4" poster={products[1].image} title="Cotton bedsheet commercial" /></div>
              <h3 className="px-1 pt-3 font-serif text-lg italic text-[#fffaf0] sm:text-xl">Everyday comfort, beautifully told</h3>
            </article>
          </div>
        </div>
      </section>

      <section className="home-heritage bg-brand-900 py-10 text-brand-50 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4dfd0]">FabBazaar collections</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl">Traditional prints for the everyday bedroom.</h2>
            </div>
            <div className="space-y-4 text-[#e4ebe1]">
              <p>Explore floral and heritage-inspired bedsheet designs by colour and collection. Each listing includes product photos and the set details available for that design.</p>
              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-[#a8b9a0] underline-offset-4 hover:text-[#d6e1d2]">Browse bedsheets <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-12 lg:px-8">
        <div className="home-cta-panel relative overflow-hidden rounded-3xl border px-5 py-7 sm:px-8 sm:py-9">
          <div className="home-cta-pattern pointer-events-none absolute inset-0" style={{ backgroundImage: "url('/images/jaipur-blockprint-seamless.svg')", backgroundSize: '220px' }} />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-500">Find your next favourite</p>
              <h2 className="mt-1 font-serif text-3xl italic text-brand-900">A fresh layer for the season.</h2>
            </div>
            <div className="flex justify-end">
              <Link href="/products" className="rounded-full bg-brand-900 px-5 py-2.5 text-sm text-white hover:bg-brand-700">Explore the collection</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
