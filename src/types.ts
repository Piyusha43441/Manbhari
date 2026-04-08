export interface Product {
  id: string;
  name: string;
  category: 'masala' | 'snacks' | 'puja';
  price: number;
  weight: string;
  description: string;
  images: string[];
  videoUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}
