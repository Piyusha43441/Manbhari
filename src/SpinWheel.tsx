import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Trophy, RotateCw, Wallet, Star, Sparkles, CheckCircle2, Gift, ArrowBigDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { db, auth } from './firebase';
import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const SLOTS = [1, 3, 5, 10, 12, 15, 18, 20];
const COLORS = [
  '#FF4D4D', '#32D74B', '#007AFF', '#FF9F0A', '#AF52DE',
  '#5856D6', '#FF2D55', '#FF3B30'
];

interface SpinWheelProps {
  onComplete: () => void;
  canPlay?: boolean;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ onComplete, canPlay = true }) => {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showCooldown, setShowCooldown] = useState(!canPlay);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [pointerTick, setPointerTick] = useState(false);
  const controls = useAnimation();
  const wheelRef = useRef<HTMLDivElement>(null);

  // Sound effect simulation (visual feedback)
  const [lastTickAngle, setLastTickAngle] = useState(0);

  const spin = async () => {
    if (isSpinning || attempts.length >= 3) return;

    setIsSpinning(true);
    
    // Increased excitement: at least 10 full turns
    const extraTurns = 10 + Math.floor(Math.random() * 5);
    const randomOffset = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraTurns * 360) + randomOffset;
    
    setRotation(newRotation);

    // Simulate pointer flickers during spin
    const tickInterval = setInterval(() => {
      setPointerTick(prev => !prev);
    }, 120);

    await controls.start({
      rotate: newRotation,
      transition: { 
        duration: 6, 
        ease: [0.15, 0, 0.1, 1] 
      }
    });

    clearInterval(tickInterval);

    const normalizedRotation = newRotation % 360;
    const anglePerSlot = 360 / SLOTS.length;
    // Calculate winning index based on fixed pointer at top (270 degrees in wheel space)
    const slotIndex = (SLOTS.length - Math.floor(normalizedRotation / anglePerSlot)) % SLOTS.length;
    const result = SLOTS[slotIndex];

    const newAttempts = [...attempts, result];
    setAttempts(newAttempts);
    setIsSpinning(false);

    // Big celebration for Jackpot or high wins
    if (result === 20) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#ffffff', '#FF4D4D']
      });
      toast.success("JACKPOT! You hit ₹20!", {
        icon: <Sparkles className="h-5 w-5 text-yellow-500" />
      });
    } else if (result >= 10) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: [COLORS[slotIndex], '#ffffff']
      });
      toast.success(`Great! You won ₹${result}!`);
    } else {
      toast.success(`You won ₹${result}!`);
    }

    if (newAttempts.length === 3) {
      setTimeout(() => {
        setShowFinalResult(true);
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FF4D4D', '#32D74B', '#FFD700', '#007AFF']
        });
      }, 1200);
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
      
      toast.success(`₹${highestAmount} added to your wallet!`, {
        description: "Valid for 15 days. Use it on your next order!",
        icon: <Wallet className="h-5 w-5 text-primary" />
      });
      onComplete();
    } catch (error: any) {
      toast.error('Failed to claim reward: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden border-none bg-white/90 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Gift className="h-24 w-24 rotate-12" />
        </div>
        <CardTitle className="flex items-center gap-3 text-3xl font-serif relative z-10">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <RotateCw className={`h-8 w-8 ${isSpinning ? 'animate-spin' : ''}`} />
          </div>
          Weekly Spin & Win
        </CardTitle>
        <p className="text-primary-foreground/90 text-sm font-medium relative z-10 mt-2">
          Spin 3 times and keep the <span className="text-yellow-300 font-bold underline decoration-2 underline-offset-4">highest reward</span>!
        </p>
      </CardHeader>

      <CardContent className="p-8 flex flex-col items-center gap-10">
        {showCooldown ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 w-full py-12"
          >
            <div className="h-40 w-40 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-20 w-20 text-slate-300" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-serif font-bold text-slate-800">Spin Cooldown</h3>
              <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                You've already claimed your weekly spin! Come back in 7 days to try your luck again for amazing prizes.
              </p>
            </div>
            <Button variant="outline" className="w-full h-14 text-lg rounded-xl" onClick={onComplete}>
              Back to Shopping
            </Button>
          </motion.div>
        ) : !showFinalResult ? (
          <>
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />
              
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                {/* Tactical Pointer */}
                <motion.div 
                  className="absolute -top-6 left-1/2 -translate-x-1/2 z-40"
                  animate={{ 
                    rotate: isSpinning ? [0, -20, 0] : 0,
                    scale: isSpinning ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    duration: 0.12, 
                    repeat: isSpinning ? Infinity : 0 
                  }}
                >
                  <div className="relative">
                    <ArrowBigDown className="h-12 w-12 text-slate-900 fill-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 rounded-full" />
                  </div>
                </motion.div>

                {/* Wheel Container */}
                <motion.div
                  animate={controls}
                  className="w-full h-full rounded-full border-[14px] border-slate-900 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative overflow-hidden bg-slate-100"
                  style={{ transformOrigin: 'center' }}
                >
                  <div className="absolute inset-0 bg-slate-900" />
                  {SLOTS.map((amount, i) => {
                    const angle = (360 / SLOTS.length) * i;
                    const isJackpot = amount === 20;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full origin-bottom"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          height: '50%',
                          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                          backgroundColor: isJackpot ? '#D4AF37' : COLORS[i],
                          borderRight: '2px solid rgba(0,0,0,0.1)',
                          boxShadow: isJackpot ? 'inset 0 0 50px rgba(255,255,255,0.3)' : 'none'
                        }}
                      >
                        <div 
                          className={`absolute top-10 left-1/2 -translate-x-1/2 text-white font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex flex-col items-center gap-1 ${
                            isJackpot ? 'text-4xl md:text-5xl text-white' : 'text-xl md:text-2xl'
                          }`}
                          style={{ transform: 'rotate(0deg)' }}
                        >
                          <span className={isJackpot ? 'animate-pulse' : ''}>₹{amount}</span>
                          {isJackpot && (
                            <Sparkles className="h-5 w-5 text-yellow-100 drop-shadow-lg" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Outer Pulsing Lights */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      className="absolute w-2 h-2 bg-yellow-200 rounded-full z-10"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 18}deg) translateY(-170px) translateX(-50%)`
                      }}
                    />
                  ))}
                  
                  {/* Decorative Inner Ring */}
                  <div className="absolute inset-4 rounded-full border-2 border-white/10 pointer-events-none z-10" />
                  
                  {/* Center Hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.4)] z-20 flex items-center justify-center border-8 border-slate-900">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-foreground rounded-full flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      <Star className="h-10 w-10 text-white fill-white relative z-10 drop-shadow-xl" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="w-full space-y-8">
              <div className="flex justify-center gap-6">
                {[0, 1, 2].map((i) => (
                  <motion.div 
                    key={i}
                    initial={false}
                    animate={attempts[i] !== undefined ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                    className={`h-16 w-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 ${
                      attempts[i] !== undefined 
                        ? 'bg-primary/5 border-primary text-primary shadow-lg shadow-primary/10' 
                        : 'bg-slate-50 border-dashed border-slate-300 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-tighter opacity-50 mb-1">Spin {i+1}</span>
                    <span className="font-bold text-lg">{attempts[i] !== undefined ? `₹${attempts[i]}` : '?'}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    {attempts.length < 3 
                      ? `Attempt ${attempts.length + 1} of 3` 
                      : 'All spins completed!'}
                  </p>
                  <AnimatePresence mode="wait">
                    {attempts.length > 0 && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-primary font-black text-xl flex items-center gap-2"
                      >
                        <Trophy className="h-5 w-5" />
                        Highest: ₹{highestAmount}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <Button 
                  className="w-full h-16 text-xl gap-3 rounded-2xl shadow-[0_8px_16px_-4px_rgba(var(--primary),0.3)] hover:shadow-[0_12px_24px_-4px_rgba(var(--primary),0.4)] transition-all active:scale-[0.98]"
                  onClick={spin}
                  disabled={isSpinning || attempts.length >= 3}
                >
                  {isSpinning ? (
                    <div className="flex items-center gap-3">
                      <RotateCw className="h-6 w-6 animate-spin" />
                      Spinning...
                    </div>
                  ) : attempts.length >= 3 ? (
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-yellow-400" />
                      Calculating Win...
                    </div>
                  ) : (
                    <>
                      <RotateCw className="h-6 w-6" /> 
                      Spin Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 w-full py-4"
          >
            <div className="relative inline-block">
              <div className="h-40 w-40 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="h-20 w-20 text-green-600 drop-shadow-lg" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 bg-yellow-400 p-3 rounded-full shadow-xl border-4 border-white"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            <div className="space-y-4">
              <h3 className="text-5xl font-serif font-bold text-primary tracking-tight">
                {highestAmount === 20 ? 'JACKPOT!' : 'Great Result!'}
              </h3>
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium">Your spin results: {attempts.map(a => `₹${a}`).join(', ')}</p>
                <div className={`inline-flex items-baseline gap-2 px-6 py-2 rounded-full border ${
                  highestAmount === 20 ? 'bg-yellow-50 border-yellow-200 shadow-lg' : 'bg-green-50 border-green-100'
                }`}>
                  <span className={`text-sm font-bold uppercase tracking-widest ${
                    highestAmount === 20 ? 'text-yellow-700' : 'text-green-700'
                  }`}>You Won</span>
                  <span className={`${
                    highestAmount === 20 ? 'text-yellow-600' : 'text-green-600'
                  } text-5xl font-black`}>₹{highestAmount}</span>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto p-8 bg-slate-50 rounded-[32px] border border-slate-200 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
              <div className="flex items-center justify-center gap-3 text-primary font-black uppercase tracking-widest text-sm">
                <Wallet className="h-5 w-5" />
                Wallet Credit
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Congratulations! We've selected your best spin of <span className="font-bold text-slate-900">₹{highestAmount}</span> to be added to your Manbhari wallet. Use it to shop your favorite organic spices!
              </p>
              <Button 
                className="w-full h-14 text-lg gap-3 rounded-xl shadow-lg" 
                onClick={claimReward} 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    Claim Reward Now
                    <CheckCircle2 className="h-6 w-6" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
