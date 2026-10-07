export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection?: 'Rivaaz' | 'Jaipuri Collection' | 'Bazaar Exclusive';
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  colors: string[];
  sizes: string[];
  stock: number;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  featured: boolean;
  newArrival: boolean;
  tags: string[];
};

export const categories = [
  'Bedsheet',
  'Comforter',
  'Bedcover',
  'Dohar Sets',
  'Door Mats',
  'Diwan Sets',
  'Towels',
  'Home Furnishings'
];

export const products: ProductRecord[] = [
  {
    id: 'prod-1',
    slug: 'saffron-royal-weave',
    name: 'Saffron Royal Weave',
    category: 'Bedding',
    price: 2499,
    originalPrice: 3299,
    rating: 4.8,
    reviews: 124,
    colors: ['Saffron', 'Ivory'],
    sizes: ['Single', 'Queen', 'King'],
    stock: 18,
    description: 'A rich handloom bedsheet woven with floral jacquard and premium cotton finish for an opulent royal look.',
    shortDescription: 'Royal saffron handloom bedsheet set',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=80'
    ],
    featured: true,
    newArrival: true,
    tags: ['luxury', 'cotton', 'royal']
  },
  {
    id: 'prod-2',
    slug: 'ivory-gold-motif',
    name: 'Ivory Gold Motif',
    category: 'Bedding',
    price: 2199,
    originalPrice: 2899,
    rating: 4.7,
    reviews: 98,
    colors: ['Ivory', 'Gold'],
    sizes: ['Queen', 'King'],
    stock: 22,
    description: 'Subtle golden motifs with a delicate sheen that brings elegant warmth to every bedroom.',
    shortDescription: 'Classic ivory and gold motif bedding',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=700&q=80'
    ],
    featured: true,
    newArrival: false,
    tags: ['gold', 'classic']
  },
  {
    id: 'prod-3',
    slug: 'indigo-heritage-print',
    name: 'Indigo Heritage Print',
    category: 'Curtains',
    price: 1899,
    originalPrice: 2499,
    rating: 4.6,
    reviews: 74,
    colors: ['Indigo', 'Moss'],
    sizes: ['Standard', 'Large'],
    stock: 30,
    description: 'A richly textured curtain panel with heritage block-print detailing inspired by Jaipur homes.',
    shortDescription: 'Indigo block-printed curtain set',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=80'
    ],
    featured: false,
    newArrival: true,
    tags: ['indigo', 'heritage']
  },
  {
    id: 'prod-4',
    slug: 'blooming-nile-cushion',
    name: 'Blooming Nile Cushion',
    category: 'Home Decor',
    price: 999,
    originalPrice: 1299,
    rating: 4.9,
    reviews: 167,
    colors: ['Emerald', 'Sand'],
    sizes: ['18x18', '20x20'],
    stock: 40,
    description: 'Intricate woven cushion covers that bring softness and artisanal texture to everyday living spaces.',
    shortDescription: 'Decorative cushion cover with floral weave',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=80'
    ],
    featured: true,
    newArrival: false,
    tags: ['decor', 'artisan']
  },
  {
    id: 'prod-5',
    slug: 'pearl-kitchen-ensemble',
    name: 'Pearl Kitchen Ensemble',
    category: 'Kitchen Linens',
    price: 1499,
    originalPrice: 1899,
    rating: 4.5,
    reviews: 63,
    colors: ['Pearl', 'Rose'],
    sizes: ['Set of 4'],
    stock: 26,
    description: 'A refined set of kitchen towels and runners made with breathable cotton and subtle ethnic detailing.',
    shortDescription: 'Premium cotton kitchen linen set',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80'
    ],
    featured: false,
    newArrival: true,
    tags: ['kitchen', 'cotton']
  },
  {
    id: 'prod-6',
    slug: 'festival-gift-hamper',
    name: 'Festival Gift Hamper',
    category: 'Gift Sets',
    price: 2799,
    originalPrice: 3499,
    rating: 4.8,
    reviews: 89,
    colors: ['Crimson', 'Cream'],
    sizes: ['Standard'],
    stock: 15,
    description: 'A curated gifting bundle with handmade linens, a keepsake pouch, and festive styling accents.',
    shortDescription: 'Luxurious festive home textile gift set',
    image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=80'
    ],
    featured: true,
    newArrival: true,
    tags: ['gift', 'festive']
  }
];
