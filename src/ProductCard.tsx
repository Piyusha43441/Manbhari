import React, { useState } from 'react';
import { Product } from './types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Play, ChevronLeft, ChevronRight, Plus, Minus, Heart } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  orderCount?: number;
  onProductClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, orderCount = 0, onProductClick }) => {
  const { addToCart, updateQuantity, items, toggleWishlist, isInWishlist } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const cartItem = items.find(item => item.id === product.id);
  const images = product.images || [];

  const slideImage = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentImageIndex((prev) => (prev + newDirection + images.length) % images.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white/50 backdrop-blur-sm cursor-pointer"
        onClick={() => onProductClick?.(product)}
      >
        <div className="relative aspect-square overflow-hidden group/slider">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={product.name}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDirection(i > currentImageIndex ? 1 : -1);
                      setCurrentImageIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentImageIndex ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  slideImage(-1);
                }}
              >
                <ChevronLeft className="h-4 w-4 text-primary" />
              </button>

              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity z-10 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  slideImage(1);
                }}
              >
                <ChevronRight className="h-4 w-4 text-primary" />
              </button>
            </>
          )}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
            {product.category === 'masala' && (
              <Badge className="bg-primary/90">Organic</Badge>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
                if (!isInWishlist(product.id)) {
                  toast.success('Added to wishlist');
                }
              }}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
            {orderCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-primary/20 flex items-center gap-2"
              >
                <div className="relative">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 h-2 w-2 bg-green-500 rounded-full animate-ping" />
                </div>
                <span className="text-[10px] font-bold text-primary whitespace-nowrap">
                  {orderCount} {orderCount === 1 ? 'order' : 'orders'} this week
                </span>
              </motion.div>
            )}
          </div>
          {product.videoUrl && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(product.videoUrl, '_blank')}
            >
              <Play className="h-4 w-4 fill-current" />
            </Button>
          )}
        </div>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-serif">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.weight}</p>
            </div>
            <p className="text-lg font-bold text-primary">₹{product.price}</p>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
          <div 
            className="flex items-center justify-between w-full bg-secondary/30 rounded-full p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-white"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-sm w-8 text-center">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-white"
              onClick={() => setQuantity(prev => prev + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            className="w-full gap-2 rounded-full" 
            onClick={(e) => {
              e.stopPropagation();
              for(let i = 0; i < quantity; i++) {
                addToCart(product);
              }
              toast.success(`Added ${quantity} ${product.name} to cart`);
              setQuantity(1);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
