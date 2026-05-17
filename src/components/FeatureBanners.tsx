import React from 'react';
import { motion } from 'motion/react';
import { Utensils, Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

interface FeatureBannersProps {
  onViewRecipes: () => void;
  onViewWall: () => void;
}

export const FeatureBanners: React.FC<FeatureBannersProps> = ({ onViewRecipes, onViewWall }) => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recipe Hub Banner */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="relative h-[300px] md:h-[400px] rounded-[32px] md:rounded-[40px] overflow-hidden group cursor-pointer shadow-2xl"
            onClick={onViewRecipes}
          >
            <img 
              src="https://picsum.photos/seed/cooking/1200/800" 
              alt="Manbhari Kitchen" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center items-start space-y-4 md:space-y-6 text-white">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <Utensils className="h-5 w-5 md:h-7 md:w-7" />
                </div>
                <Logo className="h-8 w-8 md:h-12 md:w-12 rounded-full border-2 border-white/20" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-2xl md:text-4xl font-serif font-bold">Manbhari Kitchen</h3>
                <p className="text-white/80 max-w-xs text-sm md:text-lg leading-relaxed">
                  Discover authentic recipes and shop all ingredients in one click.
                </p>
              </div>
              <Button className="rounded-full bg-white text-primary hover:bg-primary hover:text-white transition-all duration-300 h-10 md:h-12 px-6 md:px-8 text-xs md:text-base font-bold shadow-xl group/btn">
                Explore Recipes <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </motion.div>

          {/* Wall of Fame Banner */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="relative h-[300px] md:h-[400px] rounded-[32px] md:rounded-[40px] overflow-hidden group cursor-pointer shadow-2xl"
            onClick={onViewWall}
          >
            <img 
              src="https://picsum.photos/seed/food-photo/1200/800" 
              alt="Wall of Fame" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center items-start space-y-4 md:space-y-6 text-white">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                  <Camera className="h-5 w-5 md:h-7 md:w-7" />
                </div>
                <Logo className="h-8 w-8 md:h-12 md:w-12 rounded-full border-2 border-white/20" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-2xl md:text-4xl font-serif font-bold">Wall of Fame</h3>
                <p className="text-white/80 max-w-xs text-sm md:text-lg leading-relaxed">
                  Share your culinary creations and get featured in our community.
                </p>
              </div>
              <Button className="rounded-full bg-white text-accent hover:bg-accent hover:text-white transition-all duration-300 h-10 md:h-12 px-6 md:px-8 text-xs md:text-base font-bold shadow-xl group/btn">
                View Gallery <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
