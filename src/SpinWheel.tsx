import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Trophy, RotateCw, Wallet, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { db, auth } from './firebase';
import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';

const SLOTS = [1, 2, 5, 7, 8, 10, 14, 15, 18, 20];
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'
];

interface SpinWheelProps {
  onComplete: () => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ onComplete }) => {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const controls = useAnimation();

  const spin = async () => {
    if (isSpinning || attempts.length >= 3) return;

    setIsSpinning(true);
    
    // Random rotation: at least 5 full turns + random offset
    const extraTurns = 5 + Math.floor(Math.random() * 5);
    const randomOffset = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraTurns * 360) + randomOffset;
    
    setRotation(newRotation);

    await controls.start({
      rotate: newRotation,
      transition: { duration: 4, ease: [0.15, 0, 0.15, 1] }
    });

    // Calculate which slot it landed on
    // The wheel rotates clockwise, but the pointer is at the top (0 degrees)
    // So we need to find the angle relative to the top
    const normalizedRotation = newRotation % 360;
    const anglePerSlot = 360 / SLOTS.length;
    
    // The slots are arranged clockwise. 
    // If rotation is 0, slot 0 is at the top.
    // If rotation is 36 degrees, slot 9 is at the top.
    // So slotIndex = (SLOTS.length - Math.floor(normalizedRotation / anglePerSlot)) % SLOTS.length
    const slotIndex = (SLOTS.length - Math.floor(normalizedRotation / anglePerSlot)) % SLOTS.length;
    const result = SLOTS[slotIndex];

    const newAttempts = [...attempts, result];
    setAttempts(newAttempts);
    setIsSpinning(false);

    if (newAttempts.length === 3) {
      setTimeout(() => setShowFinalResult(true), 1000);
    }
  };

  const highestAmount = Math.max(...attempts, 0);

  const claimReward = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      // Add transaction
      await addDoc(collection(db, 'wallet_transactions'), {
        userId: auth.currentUser.uid,
        amount: highestAmount,
        type: 'credit',
        source: 'spin',
        expiresAt: expiryDate,
        createdAt: serverTimestamp()
      });

      await setDoc(userRef, {
        walletBalance: increment(highestAmount),
        lastWheelSpin: serverTimestamp()
      }, { merge: true });
      toast.success(`₹${highestAmount} added to your wallet (expires in 15 days)!`);
      onComplete();
    } catch (error: any) {
      toast.error('Failed to claim reward: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden border-none bg-white/80 backdrop-blur-md shadow-2xl">
      <CardHeader className="bg-primary text-primary-foreground p-6">
        <CardTitle className="flex items-center gap-3 text-2xl font-serif">
          <RotateCw className="h-8 w-8" />
          Weekly Spin & Win
        </CardTitle>
        <p className="text-primary-foreground/80 text-sm">Spin 3 times and keep the highest reward!</p>
      </CardHeader>

      <CardContent className="p-8 flex flex-col items-center gap-8">
        {!showFinalResult ? (
          <>
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="w-6 h-8 bg-primary clip-path-triangle shadow-lg" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
              </div>

              {/* Wheel */}
              <motion.div
                animate={controls}
                className="w-full h-full rounded-full border-8 border-primary/20 shadow-2xl relative overflow-hidden bg-white"
                style={{ transformOrigin: 'center' }}
              >
                {SLOTS.map((amount, i) => {
                  const angle = (360 / SLOTS.length) * i;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full origin-bottom"
                      style={{
                        transform: `rotate(${angle}deg)`,
                        height: '50%',
                        clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                        backgroundColor: COLORS[i],
                        opacity: 0.9
                      }}
                    >
                      <div 
                        className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-bold text-lg md:text-xl drop-shadow-md"
                        style={{ transform: 'rotate(0deg)' }}
                      >
                        ₹{amount}
                      </div>
                    </div>
                  );
                })}
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-inner z-10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary fill-primary animate-pulse" />
                </div>
              </motion.div>
            </div>

            <div className="w-full space-y-6">
              <div className="flex justify-center gap-4">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all ${
                      attempts[i] !== undefined 
                        ? 'bg-primary/10 border-primary text-primary scale-110' 
                        : 'bg-muted/50 border-dashed border-muted-foreground/30 text-muted-foreground/30'
                    }`}
                  >
                    {attempts[i] !== undefined ? `₹${attempts[i]}` : '?'}
                  </div>
                ))}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {attempts.length < 3 
                    ? `Attempt ${attempts.length + 1} of 3` 
                    : 'All spins completed!'}
                </p>
                {attempts.length > 0 && (
                  <p className="text-primary font-bold">
                    Current Highest: ₹{highestAmount}
                  </p>
                )}
              </div>

              <Button 
                className="w-full h-14 text-xl gap-3 shadow-lg hover:shadow-xl transition-all"
                onClick={spin}
                disabled={isSpinning || attempts.length >= 3}
              >
                {isSpinning ? (
                  <>Spinning...</>
                ) : attempts.length >= 3 ? (
                  <>Processing Result...</>
                ) : (
                  <>
                    <RotateCw className="h-6 w-6" /> 
                    Spin the Wheel
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 w-full"
          >
            <div className="relative">
              <div className="h-32 w-32 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="h-16 w-16 text-green-600" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg"
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
            </div>

            <div className="space-y-4">
              <h3 className="text-4xl font-serif font-bold text-primary">
                Congratulations!
              </h3>
              <div className="space-y-1">
                <p className="text-muted-foreground">Your spins were: {attempts.join(', ')}</p>
                <p className="text-2xl font-bold">
                  Highest Reward: <span className="text-green-600 text-3xl">₹{highestAmount}</span>
                </p>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary font-bold">
                <Wallet className="h-5 w-5" />
                Wallet Reward
              </div>
              <p className="text-sm text-muted-foreground">
                We've selected your highest spin of ₹{highestAmount} to be added to your Manbhari wallet!
              </p>
              <Button className="w-full h-12 text-lg gap-2" onClick={claimReward} disabled={isProcessing}>
                {isProcessing ? 'Adding to Wallet...' : 'Claim Reward Now'}
                <CheckCircle2 className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
