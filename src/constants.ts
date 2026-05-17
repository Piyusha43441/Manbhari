import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'garam-masala-100g',
    name: 'Garam Masala',
    category: 'masala',
    price: 400,
    weight: '100gm',
    description: 'Made by organic way using premium Indian spices. Pure, aromatic, and traditional.',
    images: ['https://picsum.photos/seed/masala/800/800'],
    videoUrl: '',
    spiceLevel: 3,
    isBestSeller: true,
  },
  {
    id: 'makhana-powder-100g',
    name: 'Makhana Powder',
    category: 'snacks',
    price: 150,
    weight: '100gm',
    description: 'Pure, roasted and ground Fox Nuts (Makhana). Perfect for smoothies, kheer, and healthy baking.',
    images: ['https://picsum.photos/seed/makhana/800/800'],
    isBestSeller: true,
  },
];

export const CATEGORIES = [
  { id: 'masala', name: 'Organic Masala', description: 'Pure Indian spices' },
  { id: 'snacks', name: 'Homemade Snacks', description: 'Healthy and tasty' },
  { id: 'puja', name: 'Puja Items', description: 'Pure items for your spiritual needs' },
];

export const SHIPPING_FEE = 50;

export const CUSTOMER_CARE = {
  mobile: '7870820251',
  email: 'manbhari555a@gmail.com',
  upiId: '7870820251@upi',
  upiQrCode: 'https://bhimqr.edgeone.app/bhim.jpeg',
};
