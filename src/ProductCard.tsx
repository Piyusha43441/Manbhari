import React, { useState } from 'react';
import { Product } from './types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

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
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white/50 backdrop-blur-sm">
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
          {product.category === 'masala' && (
            <Badge className="absolute top-4 left-4 bg-primary/90">Organic</Badge>
          )}
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
        <CardFooter className="p-4 pt-0">
          <Button className="w-full gap-2" onClick={() => addToCart(product)}>
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
