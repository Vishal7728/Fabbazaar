import { categories } from '../data/seed';
import { products } from '../data/catalog-products';

export type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type StoreUser = {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  phone?: string;
  status?: 'active' | 'deactivated';
  isEmailVerified?: boolean;
  createdAt?: Date;
  lastLoginAt?: Date | null;
  authVersion?: number;
  deletionRequestedAt?: Date | null;
  addresses?: Array<Address & { isDefault: boolean }>;
  wishlist?: string[];
};

const store = {
  products: products.slice(),
  categories: categories.slice(),
  users: [
    {
      id: 'user-1',
      customerId: 'FBZ-CUS-000001',
      name: 'Aarav Sharma',
      email: 'demo@fabbazaar.com',
      passwordHash: '$2a$10$gTUlq8dz3rCjC0yiXWEABO6WYz0Y8j4V7hR8Vn3hA7gQvZ5y2M6kW',
      role: 'customer',
      phone: '',
      status: 'active'
    }
  ] as StoreUser[]
};
let testCustomerSequence = 1;

export function nextTestCustomerId() {
  testCustomerSequence += 1;
  return `FBZ-CUS-${String(testCustomerSequence).padStart(6, '0')}`;
}

export function getProducts() {
  return store.products;
}

export function replaceProducts(products: ProductRecord[]) {
  store.products.splice(0, store.products.length, ...products);
}

export type ProductRecord = (typeof products)[number];

export function getProductBySlug(slug: string) {
  return store.products.find((product) => product.slug === slug);
}

export function getFeaturedProducts() {
  return store.products.filter((product) => product.featured);
}

export function getCategories() {
  return store.categories;
}

export function addUser(user: StoreUser) {
  store.users.push(user);
  return user;
}

export function findUserById(id: string) {
  return store.users.find((user) => user.id === id);
}

export function findUserByEmail(email: string) {
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

