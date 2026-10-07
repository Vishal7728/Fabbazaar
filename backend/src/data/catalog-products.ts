import catalog from './catalog.json';
import type { ProductRecord } from './seed';

export const products = catalog as ProductRecord[];
