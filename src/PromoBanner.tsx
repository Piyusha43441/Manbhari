import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoBannerProps {
  onReferralClick: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onReferralClick }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Masala Promo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[32px] bg-[#5A5A40] text-white p-8 md:p-12 h-[300px] flex flex-col justify-center group"
        >
          <div className="absolute inset-0 opacity-20 group-hover:scale-110 transition-transform duration-700">
            <img 
              src="https://picsum.photos/seed/masala-banner/800/600" 
              alt="Masala Banner" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 space-y-4 max-w-md">
            <div className="flex items-center gap-2 text-accent font-medium uppercase tracking-widest text-xs">
              <Sparkles className="h-4 w-4" />
              Pure & Traditional
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
              Authentic Organic <br /> <span className="italic text-accent">Masalas</span>
            </h3>
            <p className="text-white/70 text-sm md:text-base">
              Hand-ground spices that bring the soul of Indian kitchens to your home.
            </p>
            <Button 
              variant="secondary" 
              className="rounded-full gap-2 group/btn"
              onClick={() => document.getElementById('masala')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Collection <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        {/* Refer & Earn Promo */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[32px] bg-primary text-primary-foreground p-8 md:p-12 h-[300px] flex flex-col justify-center group"
        >
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-4 max-w-md">
            <div className="flex items-center gap-2 text-white/80 font-medium uppercase tracking-widest text-xs">
              <Gift className="h-4 w-4" />
              Special Offer
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
              Refer a Friend <br /> & Earn <span className="italic text-white">₹25</span>
            </h3>
            <p className="text-primary-foreground/70 text-sm md:text-base">
              Share the goodness of Manbhari with your friends and get rewarded on every successful referral.
            </p>
            <Button 
              variant="outline" 
              className="rounded-full gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white"
              onClick={onReferralClick}
            >
              Start Earning <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
