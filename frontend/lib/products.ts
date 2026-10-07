export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection?: 'Rivaaz' | 'Jaipuri Collection' | 'Bazaar Exclusive';
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  tags: string[];
  featured?: boolean;
};

export const categories = ['Bedding'];

const featuredProducts: Product[] = [
  {
    id: 'blue-floral-bedsheet',
    slug: 'blue-floral-bedsheet-set',
    name: 'Blue Floral Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A traditional blue floral print to bring rich color and heritage-inspired style to your bedroom. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/blue-floral-set-layout.jpg',
    gallery: [
      '/images/blue-floral-set-layout.jpg',
      '/images/blue-floral-pillows.jpg',
      '/images/blue-floral-fabric-detail.jpg',
      '/images/blue-floral-sheet-detail.jpg'
    ],
    tags: ['blue', 'floral', 'traditional'],
    featured: true
  },
  {
    id: 'olive-floral-bedsheet',
    slug: 'olive-floral-bedsheet-set',
    name: 'Olive Floral Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'An olive-toned traditional floral print with a richly detailed border. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/olive-floral-bed.jpg',
    gallery: [
      '/images/olive-floral-bed.jpg',
      '/images/olive-floral-fabric-detail.jpg'
    ],
    tags: ['olive', 'floral', 'traditional'],
    featured: true
  },
  {
    id: 'brown-floral-bedsheet',
    slug: 'brown-floral-bedsheet-set',
    name: 'Brown Floral Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A warm brown floral print with a classic look. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/brown-floral-fabric.jpg',
    gallery: ['/images/brown-floral-fabric.jpg'],
    tags: ['brown', 'floral', 'traditional']
  },
  {
    id: 'heritage-navy-bedsheet',
    slug: 'heritage-navy-bedsheet-set',
    name: 'Heritage Navy Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A navy traditional print with warm red and cream accents. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/heritage-navy-print-bedroom.jpg',
    gallery: ['/images/heritage-navy-print-bedroom.jpg'],
    tags: ['navy', 'heritage', 'traditional']
  },
  {
    id: 'heritage-blue-bedsheet',
    slug: 'heritage-blue-bedsheet-set',
    name: 'Blue & Ivory Heritage Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A blue and ivory heritage-inspired print styled for a welcoming bedroom. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/heritage-blue-cream-bedroom.jpg',
    gallery: ['/images/heritage-blue-cream-bedroom.jpg'],
    tags: ['blue', 'ivory', 'heritage']
  },
  {
    id: 'cream-floral-bedsheet',
    slug: 'cream-floral-bedsheet-set',
    name: 'Cream Floral Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A light cream base with a colorful traditional floral print. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/cream-floral-print-bedroom.jpg',
    gallery: ['/images/cream-floral-print-bedroom.jpg'],
    tags: ['cream', 'floral', 'traditional']
  },
  {
    id: 'chocolate-paisley-bedsheet',
    slug: 'chocolate-paisley-bedsheet-set',
    name: 'Chocolate Paisley Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A deep chocolate-toned paisley print styled with coordinating pillow covers. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/RC-005-A (6).jpg',
    gallery: ['/images/RC-005-A (6).jpg'],
    tags: ['chocolate', 'paisley', 'traditional'],
    featured: true
  },
  {
    id: 'elephant-print-bedsheet',
    slug: 'elephant-print-bedsheet-set',
    name: 'Elephant Print Bedsheet Set',
    category: 'Bedding',
    price: 699,
    originalPrice: 2399,
    description: 'A warm elephant-inspired traditional print with coordinating pillow covers. Set includes 1 bedsheet and 2 matching pillow covers.',
    shortDescription: '1 bedsheet + 2 matching pillow covers',
    image: '/images/product-1.jpeg',
    gallery: ['/images/product-1.jpeg'],
    tags: ['elephant', 'traditional', 'print']
  },
];

const riwazProducts: Product[] = Array.from({ length: 13 }, (_, index) => {
  const design = `RC-${String(index + 1).padStart(3, '0')}`;

  return ['A', 'B', 'C'].map((variant) => {
    const code = `${design}-${variant}`;
    const gallery = [3, 1, 4, 5, 2, 6].map((image) => `/images/riwaz/${code}-${image}.webp`);

    return {
      id: `riwaz-${code.toLowerCase()}`,
      slug: `riwaz-${code.toLowerCase()}-93x108`,
      name: `Riwaz ${design} · Colour ${variant}`,
      category: 'Bedding',
      price: 699,
      originalPrice: 2399,
      description: `The Riwaz ${design} ${variant} traditional print, shown across a complete set of matching product photos. Sized 93 × 108 inches; set includes 1 bedsheet and 2 matching pillow covers.`,
      shortDescription: '93 × 108 in • 1 bedsheet + 2 pillow covers',
      image: gallery[0],
      gallery,
      tags: ['riwaz', '93x108', design.toLowerCase(), variant.toLowerCase()],
      featured: index === 0 && variant === 'A'
    };
  });
}).flat();

export const products: Product[] = [...featuredProducts, ...riwazProducts];

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
