import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, CheckCircle2, XCircle, Trophy, ArrowRight, Wallet, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { db, auth } from './firebase';
import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';

const QUIZ_QUESTIONS = [
  {
    question: "Which category features pure Indian spices made the organic way?",
    options: ["Homemade Snacks", "Organic Masala", "Puja Items", "Beverages"],
    correct: 1
  },
  {
    question: "Our 'Homemade Snacks' are described as both healthy and...?",
    options: ["Salty", "Spicy", "Tasty", "Crunchy"],
    correct: 2
  },
  {
    question: "Which category is dedicated to spiritual and religious needs?",
    options: ["Organic Masala", "Homemade Snacks", "Puja Items", "Kitchenware"],
    correct: 2
  },
  {
    question: "What is the main focus of the 'Manbhari' brand based on our categories?",
    options: ["Electronics", "Organic and Homemade products", "Fast Fashion", "Automobiles"],
    correct: 1
  },
  {
    question: "How many main categories does Manbhari currently have listed?",
    options: ["2", "3", "4", "5"],
    correct: 1
  }
];

interface QuizProps {
  onComplete: () => void;
  canPlay?: boolean;
}

export const Quiz: React.FC<QuizProps> = ({ onComplete, canPlay = true }) => {
  const [step, setStep] = useState<'intro' | 'questions' | 'result' | 'cooldown'>(canPlay ? 'intro' : 'cooldown');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep('result');
    }
  };

  const correctCount = answers.reduce((acc, curr, idx) => {
    return curr === QUIZ_QUESTIONS[idx].correct ? acc + 1 : acc;
  }, 0);

  const isPerfect = correctCount === QUIZ_QUESTIONS.length;

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
        amount: 10,
        type: 'credit',
        source: 'quiz',
        expiresAt: expiryDate,
        createdAt: serverTimestamp()
      });

      await setDoc(userRef, {
        walletBalance: increment(10),
        lastQuizCompletion: serverTimestamp()
      }, { merge: true });
      toast.success('₹10 added to your wallet (expires in 15 days)!');
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
          <HelpCircle className="h-8 w-8" />
          Weekly Category Quiz
        </CardTitle>
        <p className="text-primary-foreground/80 text-sm">Test your knowledge and earn rewards!</p>
      </CardHeader>

      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {step === 'cooldown' && (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-8"
            >
              <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Timer className="h-12 w-12 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Quiz on Cooldown</h3>
                <p className="text-muted-foreground">
                  You've already played the quiz this week. Come back in a few days to earn more rewards!
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={onComplete}>
                Close
              </Button>
            </motion.div>
          )}

          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Win ₹10 Wallet Balance!</h3>
                <p className="text-muted-foreground">
                  Answer all 5 questions correctly about our categories to receive a reward in your wallet.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4" /> 2 mins
                </div>
                <div className="flex items-center gap-1">
                  <Wallet className="h-4 w-4" /> ₹10 Reward
                </div>
              </div>
              <Button className="w-full h-12 text-lg gap-2" onClick={() => setStep('questions')}>
                Start Quiz <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-primary">Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(((currentQuestion) / QUIZ_QUESTIONS.length) * 100)}% Complete</span>
                </div>
                <Progress value={(currentQuestion / QUIZ_QUESTIONS.length) * 100} className="h-2" />
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium leading-tight">
                  {QUIZ_QUESTIONS[currentQuestion].question}
                </h3>
                <div className="grid gap-3">
                  {QUIZ_QUESTIONS[currentQuestion].options.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-14 justify-start text-left px-6 hover:bg-primary/5 hover:border-primary transition-all"
                      onClick={() => handleAnswer(idx)}
                    >
                      <span className="h-6 w-6 rounded-full border flex items-center justify-center mr-4 text-xs font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto ${isPerfect ? 'bg-green-100' : 'bg-orange-100'}`}>
                {isPerfect ? (
                  <Trophy className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-orange-600" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-bold">
                  {isPerfect ? 'Perfect Score!' : 'So Close!'}
                </h3>
                <p className="text-muted-foreground">
                  You got {correctCount} out of {QUIZ_QUESTIONS.length} questions right.
                </p>
              </div>

              {isPerfect ? (
                <div className="p-6 bg-green-50 rounded-2xl border border-green-100 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    Congratulations!
                  </div>
                  <p className="text-sm text-green-600">
                    You've earned ₹10 for your wallet. This can be used for your next order.
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={claimReward} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Claim ₹10 Reward'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You need a perfect score to earn the reward. Don't worry, you can try again next week!
                  </p>
                  <Button variant="outline" className="w-full" onClick={onComplete}>
                    Back to Home
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
