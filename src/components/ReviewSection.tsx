import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Trash2, CheckCircle, Play } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  videoUrl?: string;
  createdAt: any;
}

interface ReviewSectionProps {
  productId: string;
  productName: string;
  isFromOrder?: boolean;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, productName, isFromOrder = false }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
      setReviews(revs);
      
      if (user) {
        setHasReviewed(revs.some(r => r.userId === user.uid));
      }
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (hasReviewed) {
      toast.error('You have already reviewed this product');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Add Review
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating,
        comment,
        videoUrl: videoUrl.trim() || null,
        createdAt: serverTimestamp()
      });

      // 2. Reward User (₹20) - Everyone gets it for their first review of a product
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalance: increment(20)
      });

      // 3. Add Wallet Transaction
      await addDoc(collection(db, 'wallet_transactions'), {
        userId: user.uid,
        amount: 20,
        type: 'credit',
        source: 'review',
        createdAt: serverTimestamp()
      });

      toast.success('Thank you for your review! ₹20 added to your wallet.');

      setComment('');
      setVideoUrl('');
      setRating(5);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-12 py-12 border-t mt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold">Customer Reviews</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-muted'}`} />
              ))}
            </div>
            <p className="text-lg font-bold">{averageRating} out of 5</p>
            <p className="text-muted-foreground">({reviews.length} reviews)</p>
          </div>
        </div>

        {user && (
          <Button variant="outline" className="rounded-full" onClick={() => {
            const el = document.getElementById('review-form');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Write a Review
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <Card id="review-form" className="sticky top-24 bg-secondary/10 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Share your thoughts</CardTitle>
            </CardHeader>
            <CardContent>
              {hasReviewed ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                  <p className="font-medium">You have already reviewed this product.</p>
                </div>
              ) : user ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 transition-all ${rating >= star ? 'text-yellow-500 scale-110' : 'text-muted hover:text-yellow-200'}`}
                        >
                          <Star className={`h-8 w-8 ${rating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Feedback</Label>
                    <Textarea 
                      id="comment"
                      placeholder="What did you like about this product?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] bg-white/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video Feedback (Optional)</Label>
                    <FileUpload 
                      onFileSelect={(base64) => setVideoUrl(base64)}
                      accept="video/*"
                      maxSize={1024 * 1024} // 1MB
                      label="Drag & drop or click to upload video clip"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Share a short video review (Max 1MB)
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full rounded-full h-12" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review & Get ₹20'}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    * ₹20 will be added to your permanent wallet balance.
                  </p>
                </form>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">Please login to write a review and earn rewards.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-24 bg-secondary/5 rounded-[40px] border-2 border-dashed border-border/50">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-xl font-serif text-muted-foreground italic">Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-[32px] bg-white border border-border/50 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                {review.videoUrl && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black group/vid">
                      <video 
                        src={review.videoUrl} 
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
