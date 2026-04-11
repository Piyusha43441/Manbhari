import React from 'react';
import { useCart } from './CartContext';
import { ProductCard } from './ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from './types';

interface WishlistProps {
  onProductClick: (product: Product) => void;
  onBack: () => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ onProductClick, onBack }) => {
  const { wishlist } = useCart();

  return (
    <section className="py-24 bg-white min-h-[60vh]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="text-center md:text-left space-y-4">
            <h3 className="text-4xl font-serif font-bold">My Wishlist</h3>
            <p className="text-muted-foreground max-w-xl">
              Your favorite Manbhari products, saved for later.
            </p>
          </div>
          <button 
            onClick={onBack}
            className="text-primary font-bold hover:underline"
          >
            Back to Shop
          </button>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlist.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard 
                  product={product} 
                  onProductClick={onProductClick}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/5 rounded-[40px] border-2 border-dashed">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
            <h4 className="text-2xl font-serif font-bold mb-2">Your wishlist is empty</h4>
            <p className="text-muted-foreground mb-8">Start adding your favorite spices and snacks!</p>
            <button 
              onClick={onBack}
              className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Explore Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
