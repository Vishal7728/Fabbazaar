'use client';

import Image from 'next/image';
import { useState } from 'react';

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="space-y-4">
      <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-soft sm:h-[560px]">
        <Image src={selectedImage} alt={name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              aria-label={`View ${name} image ${index + 1}`}
              aria-pressed={selectedImage === image}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white ${
                selectedImage === image ? 'border-brand-700' : 'border-brand-100 hover:border-brand-400'
              }`}
            >
              <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 640px) 25vw, 15vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
