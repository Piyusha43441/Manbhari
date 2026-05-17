import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FlyingItem {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  image: string;
}

export const FlyToCart: React.FC = () => {
  const [items, setItems] = useState<FlyingItem[]>([]);

  const triggerAnimation = useCallback((e: MouseEvent | React.MouseEvent, image: string) => {
    const cartButton = document.getElementById('cart-button');
    if (!cartButton) return;

    const cartRect = cartButton.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2;

    const newItem: FlyingItem = {
      id: Date.now(),
      x: startX,
      y: startY,
      targetX,
      targetY,
      image
    };

    setItems(prev => [...prev, newItem]);

    // Remove item after animation
    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== newItem.id));
    }, 2500);
  }, []);

  useEffect(() => {
    const handleAddToCart = (event: any) => {
      const { mouseEvent, image } = event.detail;
      triggerAnimation(mouseEvent, image);
    };

    window.addEventListener('add-to-cart-animation', handleAddToCart);
    return () => window.removeEventListener('add-to-cart-animation', handleAddToCart);
  }, [triggerAnimation]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ 
              x: item.x - 20, 
              y: item.y - 20, 
              scale: 1, 
              opacity: 1,
              rotate: 0 
            }}
            animate={{ 
              x: item.targetX - 15, 
              y: item.targetY - 15, 
              scale: [1, 2, 0.2], 
              opacity: [1, 1, 0.5],
              rotate: 360 
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 2.5, 
              ease: [0.16, 1, 0.3, 1] // Custom cubic-bezier for "magnetic" feel
            }}
            className="fixed top-0 left-0 w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-xl bg-white"
          >
            <img 
              src={item.image} 
              alt="flying product" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Helper to trigger the animation from anywhere
export const triggerFlyToCart = (e: React.MouseEvent, image: string) => {
  const event = new CustomEvent('add-to-cart-animation', {
    detail: { mouseEvent: { clientX: e.clientX, clientY: e.clientY }, image }
  });
  window.dispatchEvent(event);
};
