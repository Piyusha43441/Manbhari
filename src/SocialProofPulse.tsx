import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MapPin, CheckCircle } from 'lucide-react';
import { PRODUCTS } from './constants';

const locations = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Indore', 'Surat', 'Chandigarh'];
const times = ['2 minutes ago', '5 minutes ago', 'just now', '10 minutes ago', '1 minute ago'];

export const SocialProofPulse: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentData, setCurrentData] = useState({
    location: '',
    product: '',
    time: ''
  });

  useEffect(() => {
    const showNotification = () => {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)].name;
      const randomTime = times[Math.floor(Math.random() * times.length)];

      setCurrentData({
        location: randomLocation,
        product: randomProduct,
        time: randomTime
      });
      setIsVisible(true);

      // Hide after 10 seconds (slower/longer visibility)
      setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    };

    // Initial delay
    const initialTimer = setTimeout(showNotification, 10000);

    // Repeat every 5 minutes (300,000 ms)
    const interval = setInterval(showNotification, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-6 z-[60] max-w-[320px] w-full"
        >
          <div className="bg-white/90 backdrop-blur-md border border-primary/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Verified Purchase</span>
              </div>
              <p className="text-sm text-gray-800 leading-tight">
                Someone from <span className="font-bold text-primary">{currentData.location}</span> just bought <span className="font-bold">{currentData.product}</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-medium">{currentData.time}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
