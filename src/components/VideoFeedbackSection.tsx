import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Play, Star, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';

interface Review {
  id: string;
  productId: string;
  userName: string;
  comment: string;
  videoUrl: string;
  rating: number;
  createdAt: any;
}

export const VideoFeedbackSection: React.FC = () => {
  const [videoReviews, setVideoReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('videoUrl', '!=', null),
      orderBy('videoUrl'), // Required for inequality filter
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
      setVideoReviews(revs);
    }, (error) => {
      console.error('Error fetching video reviews:', error);
    });

    return () => unsubscribe();
  }, []);

  if (videoReviews.length === 0) return null;

  return (
    <section className="py-24 bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-serif font-bold">Customer Video Feedback</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say about our organic goodness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden bg-white border-none shadow-xl hover:shadow-2xl transition-all group">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black flex items-center justify-center group/vid">
                    <video 
                      src={review.videoUrl} 
                      className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-100 transition-opacity"
                      muted
                      onMouseOver={(e) => e.currentTarget.play()}
                      onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/vid:scale-110 transition-transform">
                        <Play className="h-6 w-6 fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm">{review.userName}</span>
                      </div>
                      <div className="flex gap-0.5 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-muted'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">
                      "{review.comment}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
