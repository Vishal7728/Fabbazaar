'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';

const defaultSlides = [
  { src: '/images/navratri-bedsheet-1.jpg', alt: 'Green floral bedsheet styled in a bright bedroom', accent: '#9b7227' },
  { src: '/images/navratri-bedsheet-2.jpg', alt: 'Blue heritage-print bedsheet collection', accent: '#496575' },
  { src: '/images/navratri-bedsheet-3.jpeg', alt: 'Colorful traditional bedsheet in a festive bedroom', accent: '#a9533c' },
  { src: '/images/navratri-bedsheet-4.jpeg', alt: 'Soft green floral bedsheet and matching pillow covers', accent: '#536f59' },
  { src: '/images/navratri-bedsheet-5.jpeg', alt: 'Navratri bedsheet with traditional dancing motifs', accent: '#975044' },
  { src: '/images/navratri-bedsheet-6.jpeg', alt: 'Bright folk-art bedsheet in a classic Indian bedroom', accent: '#76523b' }
];
type HomepageBanner = { productSlug: string; image: string; eyebrow: string; title: string; description: string; buttonText: string };
const apiBase = getApiBaseUrl();

export function HomeHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [banner, setBanner] = useState<HomepageBanner | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/site/banner`)
      .then(async (response) => {
        if (!response.ok) return null;
        const result = await response.json() as { data?: HomepageBanner | null };
        return result.data ?? null;
      })
      .then((saved) => { if (active && saved) { setBanner(saved); setActiveSlide(0); } })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const slides = banner
    ? [{ src: banner.image, alt: banner.title, accent: '#bd9335' }]
    : defaultSlides;
  const slideCount = slides.length;

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (banner || isPaused || reducedMotion.matches) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideCount);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banner, isPaused, slideCount]);

  function moveSlide(direction: number) {
    setActiveSlide((current) => (current + direction + slideCount) % slideCount);
  }

  return (
    <section
      aria-label="New collection"
      aria-roledescription="carousel"
      className="mx-auto max-w-[1600px] px-3 pt-2 sm:px-5 lg:px-7"
    >
      <div className="heritage-hero relative isolate h-[285px] overflow-hidden rounded-2xl bg-brand-800 sm:h-[340px] lg:h-[390px]">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 1600px"
            className={`object-cover object-[center_58%] transition-opacity duration-1000 ${activeSlide === index ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-black/75 via-black/40 to-black/5" />
        <div className="absolute inset-0 -z-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

        <div
          className="absolute inset-y-0 left-0 z-10 flex max-w-2xl flex-col justify-center px-5 py-6 text-white sm:px-9 lg:px-12"
          role="group"
          aria-roledescription="slide"
          aria-label={`${activeSlide + 1} of ${slideCount}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200 sm:text-xs">
            {banner?.eyebrow ?? 'Woven for your home'}
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-3xl italic leading-[1.05] text-white sm:text-4xl lg:text-5xl">
            {banner?.title ?? 'A closer look at timeless prints.'}
          </h1>
          <p className="mt-3 max-w-md text-xs leading-5 text-white/90 sm:text-sm sm:leading-6">
            {banner?.description ?? 'Rich colour, detailed prints and Indian textile traditions for the everyday bedroom.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={banner ? `/products/${encodeURIComponent(banner.productSlug)}` : '/products'}
              className={`hero-primary-cta rounded-full px-4 py-2.5 text-xs font-semibold sm:px-5 sm:text-sm ${banner ? 'text-stone-950' : 'text-white'}`}
              style={{ '--hero-accent': slides[activeSlide].accent } as React.CSSProperties}
            >
              {banner?.buttonText ?? 'Explore the collection'}
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/75 bg-black/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-black/35 sm:px-5 sm:text-sm"
            >
              Our story
            </Link>
          </div>
        </div>

        {!banner && <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 sm:bottom-4 sm:right-5">
          <button
            type="button"
            onClick={() => moveSlide(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-black/70"
            aria-label="Previous collection image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActiveSlide(index)}
              className={`h-2.5 rounded-full border border-white/80 transition-all ${activeSlide === index ? 'w-7 bg-white' : 'w-2.5 bg-white/50'}`}
              aria-label={`Show collection image ${index + 1}`}
              aria-current={activeSlide === index}
            />
          ))}
          <button
            type="button"
            onClick={() => moveSlide(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-black/70"
            aria-label="Next collection image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-black/70"
            aria-label={isPaused ? 'Play image slideshow' : 'Pause image slideshow'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>}
      </div>
    </section>
  );
}
