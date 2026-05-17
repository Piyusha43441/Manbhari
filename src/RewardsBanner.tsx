import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCw, Sparkles, ArrowRight, Gift, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RewardsBannerProps {
  canPlayQuiz: boolean;
  canPlayWheel: boolean;
  canPlayDarts: boolean;
  onPlayQuiz: () => void;
  onPlayWheel: () => void;
  onPlayDarts: () => void;
}

export const RewardsBanner: React.FC<RewardsBannerProps> = ({
  canPlayQuiz,
  canPlayWheel,
  canPlayDarts,
  onPlayQuiz,
  onPlayWheel,
  onPlayDarts
}) => {
  if (!canPlayQuiz && !canPlayWheel && !canPlayDarts) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/10"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-primary animate-bounce" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-bold text-primary flex items-center justify-center md:justify-start gap-2">
              Weekly Rewards Available!
              <Sparkles className="h-4 w-4 text-orange-500" />
            </h4>
            <p className="text-xs text-muted-foreground">
              Complete your weekly challenges to earn wallet balance for your next order.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {canPlayQuiz && (
            <Button 
              size="sm" 
              variant="default" 
              className="gap-2 bg-primary hover:bg-primary/90 shadow-sm"
              onClick={onPlayQuiz}
            >
              <Trophy className="h-4 w-4" />
              Take Quiz (₹10)
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          {canPlayWheel && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={onPlayWheel}
            >
              <RotateCw className="h-4 w-4" />
              Spin & Win (Up to ₹20)
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          {canPlayDarts && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 border-red-200 hover:bg-red-50 text-red-600"
              onClick={onPlayDarts}
            >
              <Target className="h-4 w-4" />
              Dart Master (₹10)
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
