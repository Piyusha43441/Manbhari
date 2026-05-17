import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Wallet, Sparkles, CheckCircle2, Gift, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { db, auth } from './firebase';
import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface DartGameProps {
  onComplete: () => void;
  canPlay?: boolean;
}

export const DartGame: React.FC<DartGameProps> = ({ onComplete, canPlay = true }) => {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isThrowing, setIsThrowing] = useState(false);
  const [showCooldown, setShowCooldown] = useState(!canPlay);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [hitMarkers, setHitMarkers] = useState<{x: number, y: number, score: number}[]>([]);
  const [scorePopups, setScorePopups] = useState<{id: number, x: number, y: number, score: number}[]>([]);
  const [boardShake, setBoardShake] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);

  const SLOTS = {
    BULLSEYE: 10,
    INNER: 5,
    OUTER: 1
  };

  useEffect(() => {
    if (isThrowing || attempts.length >= 3 || showFinalResult) return;

    const startTime = Date.now();
    // Increase difficulty with each throw
    const speedMultiplier = 1 + (attempts.length * 0.5);
    const seedX = (Math.random() * 2 + 1.5) * speedMultiplier;
    const seedY = (Math.random() * 2 + 2) * speedMultiplier;
    const amplitude = 35 + (attempts.length * 5); // Larger sweeps as we progress

    const animate = () => {
      const time = (Date.now() - startTime) / 1000;
      const x = 50 + Math.sin(time * seedX) * amplitude;
      const y = 50 + Math.cos(time * seedY) * amplitude;
      setCrosshairPos({ x, y });
      gameLoopRef.current = requestAnimationFrame(animate);
    };

    gameLoopRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [isThrowing, attempts.length, showFinalResult]);

  const throwDart = () => {
    if (isThrowing || attempts.length >= 3) return;

    setIsThrowing(true);
    cancelAnimationFrame(gameLoopRef.current);

    const dist = Math.sqrt(Math.pow(crosshairPos.x - 50, 2) + Math.pow(crosshairPos.y - 50, 2));
    
    let score = 0;
    if (dist <= 6) score = SLOTS.BULLSEYE;
    else if (dist <= 22) score = SLOTS.INNER;
    else if (dist <= 42) score = SLOTS.OUTER;
    else score = 0;

    const currentPos = { ...crosshairPos };

    setTimeout(() => {
      const newAttempts = [...attempts, score];
      setAttempts(newAttempts);
      setHitMarkers(prev => [...prev, { ...currentPos, score }]);
      
      // Add score popup
      const popupId = Date.now();
      setScorePopups(prev => [...prev, { id: popupId, ...currentPos, score }]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popupId));
      }, 1000);

      setIsThrowing(false);
      setBoardShake(true);
      setTimeout(() => setBoardShake(false), 300);

      if (score === SLOTS.BULLSEYE) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#facc15', '#ffffff']
        });
        toast.success("Bullseye! Amazing Shot!", {
          icon: <Sparkles className="h-4 w-4 text-yellow-500" />
        });
      }

      if (newAttempts.length === 3) {
        setTimeout(() => {
          setShowFinalResult(true);
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#facc15', '#10b981', '#ffffff']
          });
        }, 1200);
      }
    }, 800);
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
        source: 'darts',
        expiresAt: expiryDate,
        createdAt: serverTimestamp()
      });

      await setDoc(userRef, {
        walletBalance: increment(highestAmount),
        lastDartGame: serverTimestamp()
      }, { merge: true });
      
      toast.success(`₹${highestAmount} added to your wallet!`, {
        description: "Valid for 15 days.",
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
    <Card className="w-full max-w-2xl mx-auto overflow-hidden border-none bg-white/90 backdrop-blur-xl shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white p-8 relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target className="h-24 w-24" />
        </div>
        <CardTitle className="flex items-center gap-3 text-3xl font-serif relative z-10">
          <Target className="h-8 w-8" />
          Dart Master Challenge
        </CardTitle>
        <p className="text-white/90 text-sm font-medium relative z-10 mt-2">
          3 throws to hit the bullseye. Keep your <span className="text-yellow-300 font-bold underline">highest score</span>!
        </p>
      </CardHeader>

      <CardContent className="p-8 flex flex-col items-center gap-8">
        {showCooldown ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 w-full py-12"
          >
            <div className="h-40 w-40 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Gift className="h-20 w-20 text-slate-300" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-serif font-bold text-slate-800">Darts Master Cooldown</h3>
              <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                Your darts Master pass is on cooldown. Return in 7 days for more target practice and rewards!
              </p>
            </div>
            <Button variant="outline" className="w-full h-14 text-lg rounded-xl" onClick={onComplete}>
              Back to Shopping
            </Button>
          </motion.div>
        ) : !showFinalResult ? (
          <>
            <motion.div 
              className="relative w-72 h-72 md:w-80 md:h-80 select-none" 
              ref={boardRef}
              animate={boardShake ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Board Layers - Shadow Casting */}
              <div className="absolute inset-0 rounded-full bg-slate-900 border-8 border-yellow-600 shadow-[0_20px_50px_rgba(0,0,0,0.3)]" />
              
              {/* Outer Ring with Segments Effect */}
              <div className="absolute inset-[10%] rounded-full bg-white flex items-center justify-center border-4 border-slate-900 overflow-hidden">
                 <div className="absolute inset-0 opacity-5">
                   {[...Array(20)].map((_, i) => (
                     <div 
                       key={i} 
                       className="absolute h-full w-[2px] bg-black left-1/2 -ml-[1px]" 
                       style={{ transform: `rotate(${i * 18}deg)` }}
                     />
                   ))}
                 </div>
                 <span className="absolute top-2 font-bold text-slate-400 text-[10px]">₹1</span>
              </div>
              
              {/* Inner Ring */}
              <div className="absolute inset-[30%] rounded-full bg-slate-900 flex items-center justify-center border-4 border-white">
                <span className="absolute top-4 font-bold text-slate-400 text-[10px]">₹5</span>
              </div>
              
              {/* Bullseye Ring */}
              <div className="absolute inset-[44%] rounded-full bg-red-600 border-2 border-white shadow-inner" />
              
              {/* Bullseye Core */}
              <div className="absolute inset-[47%] rounded-full bg-red-700 flex items-center justify-center shadow-lg">
                 <span className="text-white font-black text-[12px] drop-shadow-md">₹10</span>
              </div>

              {/* Hit Markers */}
              {hitMarkers.map((marker, i) => {
                const tilt = (i * 30) % 60 - 30; // Random looking tilt for each dart
                return (
                  <div 
                    key={i}
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative group">
                      <div className="w-1 h-1 bg-black rounded-full" />
                      <div 
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-6 bg-slate-700/90 rounded-sm origin-bottom" 
                        style={{ transform: `skewX(${tilt}deg) scale(0.6)` }} 
                      />
                    </div>
                  </div>
                );
              })}

              {/* Score Popups */}
              <AnimatePresence>
                {scorePopups.map((popup) => (
                  <motion.div
                    key={popup.id}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -40, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="absolute z-50 pointer-events-none font-black text-2xl text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    style={{
                      left: `${popup.x}%`,
                      top: `${popup.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {popup.score > 0 ? `+₹${popup.score}` : 'MISS'}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Aiming Crosshair */}
              <AnimatePresence>
                {!isThrowing && attempts.length < 3 && (
                  <motion.div
                    className="absolute z-30 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      left: `${crosshairPos.x}%`,
                      top: `${crosshairPos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative">
                       <div className="h-10 w-10 border-2 border-primary rounded-full flex items-center justify-center">
                         <div className="h-1 w-1 bg-primary rounded-full" />
                         <div className="absolute h-6 w-[2px] bg-primary top-0" />
                         <div className="absolute h-6 w-[2px] bg-primary bottom-0" />
                         <div className="absolute w-6 h-[2px] bg-primary left-0" />
                         <div className="absolute w-6 h-[2px] bg-primary right-0" />
                       </div>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-primary rounded-full animate-ping opacity-30" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dart Visual after throw */}
              {isThrowing && (
                <motion.div
                  initial={{ scale: 4, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  className="absolute z-40"
                  style={{
                    left: `${crosshairPos.x}%`,
                    top: `${crosshairPos.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative h-16 w-4">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-20 bg-slate-600 rounded-full" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-8 bg-slate-800 rounded-sm" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-[1px]">
                      <div className="w-2 h-6 bg-red-600 rounded-tl-full rounded-bl-lg" />
                      <div className="w-2 h-6 bg-red-600 rounded-tr-full rounded-br-lg" />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <div className="w-full space-y-6">
              <div className="flex justify-center gap-4">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className={`h-14 w-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                      attempts[i] !== undefined 
                        ? 'bg-red-50 border-red-500 text-red-600 scale-110 shadow-lg' 
                        : 'bg-slate-50 border-dashed border-slate-200 text-slate-300'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold opacity-50">Throw {i+1}</span>
                    <span className="font-black">{attempts[i] !== undefined ? `₹${attempts[i]}` : '-'}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg"
                className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 shadow-xl"
                onClick={throwDart}
                disabled={isThrowing || attempts.length >= 3}
              >
                {isThrowing ? 'Dart in Air...' : attempts.length === 3 ? 'Game Over' : 'Tap to Throw!'}
              </Button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-4"
          >
            <div className="h-32 w-32 bg-red-100 rounded-full flex items-center justify-center mx-auto relative">
              <Trophy className="h-16 w-16 text-red-600" />
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500 bg-white rounded-full p-1" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-serif font-bold">Impressive Accuracy!</h3>
              <p className="text-muted-foreground">Highest throw: <span className="text-red-600 font-bold text-xl">₹{highestAmount}</span></p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
               <p className="text-sm text-slate-600 mb-4">
                 We've credited your best performance to your Manbhari Wallet.
               </p>
               <Button className="w-full gap-2" onClick={claimReward} disabled={isProcessing}>
                 {isProcessing ? 'Crediting Wallet...' : 'Claim ₹' + highestAmount}
                 <CheckCircle2 className="h-5 w-5" />
               </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
