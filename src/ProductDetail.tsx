import React, { useState } from 'react';
import { Product } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Plus, Minus, Star, ShieldCheck, Truck, Clock } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ReviewSection } from './components/ReviewSection';
import { PRODUCTS } from './constants';
import { Card, CardContent } from '@/components/ui/card';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  isFromOrder?: boolean;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, isFromOrder = false }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];

  const relatedProducts = PRODUCTS.filter(p => 
    product.relatedProducts?.includes(p.id) || 
    (p.category === product.category && p.id !== product.id)
  ).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-12">
      <Button 
        variant="ghost" 
        className="mb-8 gap-2 hover:bg-primary/5" 
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Collection
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-[40px] overflow-hidden bg-muted relative"
          >
            <img 
              src={images[currentImageIndex]} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {product.category === 'masala' && (
              <Badge className="absolute top-6 left-6 bg-primary/90 text-lg px-4 py-1">Organic</Badge>
            )}
          </motion.div>
          
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-24 w-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    currentImageIndex === idx ? 'border-primary' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium uppercase tracking-widest text-sm">
              {product.category}
            </div>
            <h1 className="text-5xl font-serif font-bold leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-primary">₹{product.price}</p>
              <Badge variant="secondary" className="text-sm">{product.weight}</Badge>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
              <span className="text-muted-foreground text-sm ml-2">(4.9/5 based on 120+ reviews)</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Description</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {product.description}
              <br /><br />
              Our {product.name} is crafted using traditional Indian methods, ensuring that every pinch brings 
              authentic flavor and aroma to your dishes. We source our ingredients directly from organic farmers 
              who prioritize quality and sustainability.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-8 border-y">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">100% Pure</p>
                <p className="text-xs text-muted-foreground">No additives</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Fast Delivery</p>
                <p className="text-xs text-muted-foreground">3-5 business days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Freshly Made</p>
                <p className="text-xs text-muted-foreground">Small batches</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Premium Quality</p>
                <p className="text-xs text-muted-foreground">Hand-picked</p>
              </div>
            </div>
            {(product.category === 'masala' || product.category === 'snacks') && (
              <div className="flex items-center gap-3 col-span-2 mt-2 p-3 bg-green-50 rounded-2xl border border-green-100">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">FSSAI Certified</p>
                  <p className="text-xs text-green-600">Quality & Safety Guaranteed</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center justify-between bg-secondary/30 rounded-full p-1 min-w-[140px]">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-white"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-white"
                onClick={() => setQuantity(prev => prev + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              className="flex-1 h-14 text-lg gap-3 rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                for(let i = 0; i < quantity; i++) {
                  addToCart(product);
                }
                toast.success(`Added ${quantity} ${product.name} to cart`);
              }}
            >
              <ShoppingCart className="h-6 w-6" />
              Add to Cart - ₹{product.price * quantity}
            </Button>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} productName={product.name} isFromOrder={isFromOrder} />

      {/* Frequently Bought Together */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <h3 className="text-2xl font-serif font-bold">Frequently Bought Together</h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedProducts.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -5 }}
                className="cursor-pointer"
                onClick={() => {
                  // This would ideally navigate to the product detail
                  // For now we'll just show it's related
                  toast.info(`Viewing ${p.name}`);
                }}
              >
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all">
                  <div className="aspect-square bg-muted">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-bold">{p.name}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-primary font-bold">₹{p.price}</span>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                        toast.success(`Added ${p.name} to cart`);
                      }}>Add</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
