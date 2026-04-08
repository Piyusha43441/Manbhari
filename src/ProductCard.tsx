import React from 'react';
import { Product } from './types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, Play } from 'lucide-react';
import { useCart } from './CartContext';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white/50 backdrop-blur-sm">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
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
