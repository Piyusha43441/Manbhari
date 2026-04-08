import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'garam-masala-100g',
    name: 'Garam Masala',
    category: 'masala',
    price: 1,
    weight: '100gm',
    description: 'Made by organic way using premium Indian spices. Pure, aromatic, and traditional.',
    image: 'https://picsum.photos/seed/masala/800/800',
    videoUrl: '', // Awaited
  },
];

export const CATEGORIES = [
  { id: 'masala', name: 'Organic Masala', description: 'Pure Indian spices' },
  { id: 'snacks', name: 'Organic Snacks', description: 'Healthy and tasty' },
  { id: 'coming-soon', name: 'Coming Soon', description: 'Exciting new products' },
];

export const CUSTOMER_CARE = {
  mobile: '7870820251',
  email: 'manbhari555a@gmail.com',
  upiId: 'agarwallalit686@ibl',
};
