'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const slides = [
  { src: '/images/navratri-bedsheet-1.jpg', alt: 'Green floral bedsheet styled in a bright bedroom' },
  { src: '/images/navratri-bedsheet-2.jpg', alt: 'Blue heritage-print bedsheet collection' },
  { src: '/images/navratri-bedsheet-3.jpeg', alt: 'Colorful traditional bedsheet in a festive bedroom' },
  { src: '/images/navratri-bedsheet-4.jpeg', alt: 'Soft green floral bedsheet and matching pillow covers' },
  { src: '/images/navratri-bedsheet-5.jpeg', alt: 'Navratri bedsheet with traditional dancing motifs' },
  { src: '/images/navratri-bedsheet-6.jpeg', alt: 'Bright folk-art bedsheet in a classic Indian bedroom' }
];

export function HomeHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (isPaused || reducedMotion.matches) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  function moveSlide(direction: number) {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <section
      aria-label="New collection"
      aria-roledescription="carousel"
      className="mx-auto max-w-[1600px] px-3 pt-5 sm:px-6 lg:px-8"
    >
      <div className="relative isolate h-[440px] overflow-hidden rounded-[1.75rem] bg-brand-800 shadow-soft sm:h-[560px] lg:h-[640px]">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 1600px"
            className={`object-cover transition-opacity duration-1000 ${activeSlide === index ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

        <div
          className="absolute inset-y-0 left-0 z-10 flex max-w-3xl flex-col justify-center px-7 py-10 text-white sm:px-14 lg:px-20"
          role="group"
          aria-roledescription="slide"
          aria-label={`${activeSlide + 1} of ${slides.length}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200 sm:text-sm">
            The festive collection
          </p>
          <h1 className="mt-5 max-w-2xl font-serif text-5xl italic leading-[1.08] text-white sm:text-6xl lg:text-7xl">
            New season. Timeless stories.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/90 sm:text-lg">
            Bring the colors and craft of Indian tradition home with beautifully printed bedsheet sets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-full bg-amber-300 px-6 py-3 font-semibold text-brand-900 hover:bg-amber-200"
            >
              Explore the collection
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/70 bg-black/20 px-6 py-3 font-semibold text-white hover:bg-white/15"
            >
              Our story
            </Link>
          </div>
        </div>

        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 sm:bottom-7 sm:right-8">
          <button
            type="button"
            onClick={() => moveSlide(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-black/70"
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-black/70"
            aria-label="Next collection image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white hover:bg-black/70"
            aria-label={isPaused ? 'Play image slideshow' : 'Pause image slideshow'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
