import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2, Wallet, Gift, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const ReferralPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // If logged in but no profile, create one automatically for admin/existing users
        createMissingProfile();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createMissingProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const email = auth.currentUser.email || '';
      
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'User',
        email: email,
        mobile: '',
        role: email === 'manbhari555a@gmail.com' ? 'admin' : 'customer',
        walletBalance: 0,
        referralCode: newReferralCode,
        referredBy: null,
        createdAt: serverTimestamp(),
      });
      toast.success('Profile initialized!');
    } catch (error: any) {
      console.error('Error creating profile:', error);
    }
  };

  const copyToClipboard = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.referralCode);
    toast.success('Referral code copied!');
  };

  const shareReferral = () => {
    if (!profile) return;
    const text = `Join Manbhari and get ₹25 off on your first order! Use my referral code: ${profile.referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Manbhari Referral',
        text: text,
        url: window.location.origin
      });
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="p-24 text-center flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your referral details...</p>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="p-24 text-center space-y-4">
        <Gift className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
        <h3 className="text-2xl font-serif font-bold">Join Refer & Earn</h3>
        <p className="text-muted-foreground">Please login to see your referral code and wallet balance.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-24 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Setting up your referral profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-serif font-bold">Refer & Earn</h2>
          <p className="text-muted-foreground">
            Invite your friends to Manbhari. Both of you get ₹25 in your wallet when they make their first purchase!
          </p>
        </div>

        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <p className="text-primary-foreground/70 uppercase tracking-widest text-xs font-bold">Your Wallet Balance</p>
              <p className="text-5xl font-serif font-bold">₹{profile.walletBalance || 0}</p>
            </div>
            <p className="text-sm text-primary-foreground/50">Use this balance for your next order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center font-serif">Your Referral Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                value={profile.referralCode} 
                readOnly 
                className="text-center font-mono text-xl font-bold tracking-widest h-12"
              />
              <Button size="icon" variant="outline" className="h-12 w-12" onClick={copyToClipboard}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>
            <Button className="w-full h-12 gap-2" onClick={shareReferral}>
              <Share2 className="h-5 w-5" /> Share with Friends
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-secondary/30 space-y-2">
            <Gift className="h-6 w-6 text-primary" />
            <h4 className="font-bold">You Get ₹25</h4>
            <p className="text-sm text-muted-foreground">When your friend completes their first order.</p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 space-y-2">
            <Gift className="h-6 w-6 text-primary" />
            <h4 className="font-bold">They Get ₹25</h4>
            <p className="text-sm text-muted-foreground">Instantly in their wallet for their first order.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
