export interface Product {
  id: string;
  name: string;
  category: 'masala' | 'snacks' | 'puja';
  price: number;
  weight: string;
  description: string;
  images: string[];
  videoUrl?: string;
  spiceLevel?: 1 | 2 | 3 | 4 | 5;
  isBestSeller?: boolean;
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
  walletBalance?: number;
  lastQuizCompletion?: any;
  lastWheelSpin?: any;
  role?: 'customer' | 'admin';
}
