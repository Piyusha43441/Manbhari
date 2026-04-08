export interface Product {
  id: string;
  name: string;
  category: 'masala' | 'snacks' | 'coming-soon';
  price: number;
  weight: string;
  description: string;
  image: string;
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
