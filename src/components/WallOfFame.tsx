import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Plus, Camera, Loader2, Play } from 'lucide-react';
import { FileUpload } from './FileUpload';

interface WallEntry {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  type?: 'image' | 'video';
  caption: string;
  status: 'pending' | 'approved';
  createdAt: any;
}

export const WallOfFame: React.FC<{ user: any }> = ({ user }) => {
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newEntry, setNewEntry] = useState({ imageUrl: '', caption: '', type: 'image' as 'image' | 'video' });

  useEffect(() => {
    const q = query(
      collection(db, 'wall_of_fame'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as WallEntry))
        .filter(entry => entry.status === 'approved');
      setEntries(data);
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to upload');
      return;
    }

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'wall_of_fame'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        imageUrl: newEntry.imageUrl,
        type: newEntry.type,
        caption: newEntry.caption,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast.success('Submitted for approval!');
      setShowUpload(false);
      setNewEntry({ imageUrl: '', caption: '', type: 'image' });
    } catch (error) {
      toast.error('Failed to submit');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="text-center md:text-left space-y-4">
            <h3 className="text-4xl font-serif font-bold">Customer Wall of Fame</h3>
            <p className="text-muted-foreground max-w-xl">
              Showcase your culinary masterpieces! Share a photo of your dish made with Manbhari products.
            </p>
          </div>
          
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger render={<Button className="rounded-full px-8 h-12 gap-2 shadow-lg hover:shadow-xl transition-all" />}>
              <Plus className="h-5 w-5" /> Share Your Dish
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Your Masterpiece</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label>Upload Photo or Video</Label>
                  <FileUpload 
                    onFileSelect={(base64, type) => setNewEntry(prev => ({ ...prev, imageUrl: base64, type }))}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                </div>
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea 
                    placeholder="What did you cook today?" 
                    value={newEntry.caption}
                    onChange={e => setNewEntry(prev => ({ ...prev, caption: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-full" disabled={isUploading || !newEntry.imageUrl}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  Submit for Approval
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-secondary/20"
            >
              {entry.type === 'video' ? (
                <div className="relative h-full w-full">
                  <video 
                    src={entry.imageUrl} 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="h-6 w-6 fill-current" />
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={entry.imageUrl} 
                  alt={entry.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                <p className="text-sm font-medium line-clamp-2 mb-2 italic">"{entry.caption}"</p>
                <p className="text-xs font-bold text-primary-foreground/80">— {entry.userName}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {entries.length === 0 && (
          <div className="text-center py-20 bg-secondary/5 rounded-3xl border-2 border-dashed">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photos yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </section>
  );
};
