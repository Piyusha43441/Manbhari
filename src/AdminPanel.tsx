import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc, increment, serverTimestamp, where, getDocs, setDoc } from 'firebase/firestore';
import { Product } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Image as ImageIcon, Package, ShoppingCart, CheckCircle, Clock, XCircle, Upload, X, Mail, Utensils, Camera, TrendingUp, Star, Users, Shield, Wallet, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { PRODUCTS } from './constants';
import { handleFirestoreError, OperationType } from './App';

export const AdminPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [wallEntries, setWallEntries] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);
  const recipeVideoInputRef = useRef<HTMLInputElement>(null);
  const [editingShipment, setEditingShipment] = useState<{ id: string, shipmentId: string, shippingCompany: string } | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [walletAdjustment, setWalletAdjustment] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 500000) { // ~500KB limit for Firestore document
      toast.error('Image is too large. Please use an image under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setEditingProduct(prev => {
        if (!prev) return null;
        const currentImages = prev.images || [];
        if (currentImages.length >= 5) {
          toast.error('Maximum 5 images allowed per product');
          return prev;
        }
        return { ...prev, images: [...currentImages, base64] };
      });
    };
    reader.readAsDataURL(file);
  };

  const processRecipeImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 500000) {
      toast.error('Image is too large. Please use an image under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setEditingRecipe(prev => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const processRecipeVideo = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }
    if (file.size > 5000000) { // 5MB limit
      toast.error('Video is too large. Please use a video under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setEditingRecipe(prev => ({ ...prev, videoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRecipeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processRecipeImage(file);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      setOrders(ords);
      
      // Fetch missing user profiles
      ords.forEach(async (order: any) => {
        if (order.userId && !userProfiles[order.userId]) {
          const userDoc = await getDoc(doc(db, 'users', order.userId));
          if (userDoc.exists()) {
            setUserProfiles(prev => ({ ...prev, [order.userId]: userDoc.data() }));
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contact_messages');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecipes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'wall_of_fame'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWallEntries(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const calculateStats = async () => {
      const completedOrders = orders.filter(o => o.status === 'completed');
      const revenue = completedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      
      // Get total users count
      const usersSnap = await getDocs(collection(db, 'users'));
      
      setStats({
        totalRevenue: revenue,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalCustomers: usersSnap.size,
        avgOrderValue: completedOrders.length > 0 ? revenue / completedOrders.length : 0
      });
    };
    calculateStats();
  }, [orders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) return;
      const orderData = orderSnap.data();
      const oldStatus = orderData.status;

      await updateDoc(orderRef, { status });
      toast.success(`Order marked as ${status}`);

      // If marking as completed for the first time
      if (status === 'completed' && oldStatus !== 'completed') {
        const userId = orderData.userId;
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const referredBy = userData.referredBy;
          
          // Update total spent and tier
          const newTotalSpent = (userData.totalSpent || 0) + orderData.totalAmount;
          let newTier = 'Bronze';
          if (newTotalSpent > 15000) newTier = 'Gold';
          else if (newTotalSpent > 5000) newTier = 'Silver';

          await updateDoc(userRef, {
            totalSpent: newTotalSpent,
            tier: newTier
          });

          // Check if this is their first completed order
          // (We can check if they've already received a referral bonus or just check order history)
          // For simplicity, let's check if they have a referredBy and haven't processed it yet
          if (referredBy && !userData.referralBonusProcessed) {
            // Award referrer
            const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', referredBy));
            const referrerSnap = await getDocs(referrerQuery);
            
            if (!referrerSnap.empty) {
              const referrerDoc = referrerSnap.docs[0];
              const referrerRef = doc(db, 'users', referrerDoc.id);
              
              // Add transaction for referrer
              await addDoc(collection(db, 'wallet_transactions'), {
                userId: referrerDoc.id,
                amount: 25,
                type: 'credit',
                source: 'referral',
                createdAt: serverTimestamp()
              });

              await updateDoc(referrerRef, {
                walletBalance: increment(25)
              });

              // Mark as processed for the new user
              await updateDoc(userRef, {
                referralBonusProcessed: true
              });
              
              toast.success('Referral bonus awarded to referrer!');
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recipeData = {
        ...editingRecipe,
        ingredients: editingRecipe.ingredients || [],
        instructions: editingRecipe.instructions || [],
      };
      if (editingRecipe.id) {
        const { id, ...data } = recipeData;
        await updateDoc(doc(db, 'recipes', id), data);
        toast.success('Recipe updated');
      } else {
        await addDoc(collection(db, 'recipes'), {
          ...recipeData,
          createdAt: serverTimestamp()
        });
        toast.success('Recipe added');
      }
      setEditingRecipe(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateWallStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'wall_of_fame', id), { status });
      toast.success(`Post ${status}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateUserWallet = async (userId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        walletBalance: increment(amount)
      });
      
      await addDoc(collection(db, 'wallet_transactions'), {
        userId,
        amount: Math.abs(amount),
        type: amount > 0 ? 'credit' : 'debit',
        source: 'admin_adjustment',
        createdAt: serverTimestamp()
      });
      
      toast.success(`Wallet updated by ₹${amount}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      toast.success(`User role updated to ${role}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateShipmentDetails = async (orderId: string) => {
    if (!editingShipment || editingShipment.id !== orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        shipmentId: editingShipment.shipmentId,
        shippingCompany: editingShipment.shippingCompany
      });
      toast.success('Shipment details updated');
      setEditingShipment(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleImportDefaults = async () => {
    setIsImporting(true);
    try {
      // Import Products
      for (const product of PRODUCTS) {
        const exists = products.find(p => p.name === product.name);
        if (!exists) {
          const { id, ...data } = product;
          await setDoc(doc(db, 'products', id), { ...data, id });
        }
      }

      // Import Default Recipe
      const makhanaRecipe = {
        title: 'Makhana Power Smoothie',
        description: 'A high-protein, energy-boosting smoothie made with pure Makhana powder, bananas, and nuts.',
        image: 'https://picsum.photos/seed/smoothie/800/600',
        ingredients: [
          { name: 'Manbhari Makhana Powder', productId: 'makhana-powder-100g' },
          { name: 'Ripe Banana' },
          { name: 'Milk or Almond Milk' },
          { name: 'Honey' },
          { name: 'Almonds' }
        ],
        instructions: [
          'Add 2 tablespoons of Manbhari Makhana Powder to a blender.',
          'Add one ripe banana and a cup of milk.',
          'Add honey and a few almonds.',
          'Blend until smooth and creamy.',
          'Serve chilled for a perfect post-workout meal.'
        ],
        createdAt: serverTimestamp()
      };

      const recipeExists = recipes.find(r => r.title === makhanaRecipe.title);
      if (!recipeExists) {
        await addDoc(collection(db, 'recipes'), makhanaRecipe);
      }

      toast.success('Default products and recipes imported successfully');
    } catch (error: any) {
      toast.error('Failed to import: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.images || editingProduct.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    try {
      if (editingProduct.id) {
        const { id, ...data } = editingProduct;
        await updateDoc(doc(db, 'products', id), data);
        toast.success('Product updated successfully');
      } else {
        const newId = Math.random().toString(36).substring(7);
        await setDoc(doc(db, 'products', newId), {
          ...editingProduct,
          id: newId
        });
        toast.success('Product added successfully');
      }
      setEditingProduct(null);
      setIsAdding(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-3xl font-serif font-bold">Admin Dashboard</h2>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8 border-b rounded-none">
          <TabsTrigger value="dashboard" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <TrendingUp className="h-4 w-4" /> Stats
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <Package className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <ShoppingCart className="h-4 w-4" /> Orders
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px]">
                {orders.filter(o => o.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <Star className="h-4 w-4" /> Reviews
          </TabsTrigger>
          <TabsTrigger value="recipes" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <Utensils className="h-4 w-4" /> Recipes
          </TabsTrigger>
          <TabsTrigger value="wall" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <Camera className="h-4 w-4" /> Wall
            {wallEntries.filter(e => e.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px]">
                {wallEntries.filter(e => e.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-4 py-2 gap-2">
            <Mail className="h-4 w-4" /> Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">From {orders.filter(o => o.status === 'completed').length} completed orders</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-800 uppercase tracking-wider">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
                <p className="text-xs text-orange-700 mt-1">Requires attention</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 uppercase tracking-wider">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalCustomers}</div>
                <p className="text-xs text-blue-700 mt-1">Registered users</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800 uppercase tracking-wider">Avg. Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">₹{Math.round(stats.avgOrderValue)}</div>
                <p className="text-xs text-green-700 mt-1">Per completed order</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-8">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleImportDefaults} disabled={isImporting}>
              {isImporting ? 'Importing...' : 'Import Default Products'}
            </Button>
            <Button onClick={() => { setEditingProduct({ name: '', price: 0, category: 'masala', weight: '', description: '', images: [] }); setIsAdding(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>

          {(isAdding || editingProduct?.id) && (
            <Card className="bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input value={editingProduct?.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={editingProduct?.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingProduct?.category} 
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    >
                      <option value="masala">Organic Masala</option>
                      <option value="snacks">Homemade Snacks</option>
                      <option value="puja">Puja Items</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (e.g. 100gm)</Label>
                    <Input value={editingProduct?.weight} onChange={e => setEditingProduct({ ...editingProduct, weight: e.target.value })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <textarea 
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingProduct?.description} 
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Product Images (Max 5)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {editingProduct?.images?.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-secondary/30 group">
                          <img src={img} alt={`Preview ${idx + 1}`} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImages = [...(editingProduct.images || [])];
                              newImages.splice(idx, 1);
                              setEditingProduct({ ...editingProduct, images: newImages });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {(editingProduct?.images?.length || 0) < 5 && (
                        <div 
                          className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-secondary/50 transition-colors border-muted-foreground/20"
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground">Add Image</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Video URL (Optional)</Label>
                    <Input value={editingProduct?.videoUrl} onChange={e => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })} placeholder="YouTube or Video link" />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <Button type="submit">Save Product</Button>
                    <Button variant="outline" onClick={() => { setEditingProduct(null); setIsAdding(false); }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img src={product.images?.[0]} alt={product.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                  {product.images && product.images.length > 1 && (
                    <Badge className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm border-none">
                      {product.images.length} Photos
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-serif font-bold text-lg">{product.name}</h4>
                    <p className="font-bold text-primary">₹{product.price}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingProduct(product)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-6">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No orders placed yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className={order.status === 'pending' ? 'border-primary/30' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-mono">Order #{order.id.slice(-6)}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt?.toDate().toLocaleString() || 'Just now'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {order.customerName || userProfiles[order.userId]?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerEmail || userProfiles[order.userId]?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerMobile || userProfiles[order.userId]?.mobile}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          order.status === 'completed' ? 'default' : 
                          order.status === 'cancelled' ? 'destructive' : 'secondary'
                        }
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {(order.customerAddress || userProfiles[order.userId]?.address) && (
                      <div className="p-3 bg-secondary/20 rounded-lg text-xs space-y-1">
                        <p className="font-bold text-muted-foreground uppercase tracking-wider">Shipping Address</p>
                        <p className="whitespace-pre-wrap">{order.customerAddress || userProfiles[order.userId]?.address}</p>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold text-primary">₹{order.totalAmount}</p>
                      </div>
                      <div className="flex gap-2">
                        {order.screenshotUrl ? (
                          <Dialog>
                            <DialogTrigger render={<Button size="sm" variant="outline" />}>
                              <ImageIcon className="h-4 w-4 mr-2" /> View Screenshot
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                              <DialogHeader>
                                <DialogTitle>Payment Screenshot - Order #{order.id.slice(-6).toUpperCase()}</DialogTitle>
                              </DialogHeader>
                              <div className="flex-1 overflow-auto p-2 bg-secondary/20 rounded-lg flex items-center justify-center">
                                <img 
                                  src={order.screenshotUrl} 
                                  alt="Payment Screenshot" 
                                  className="max-w-full h-auto object-contain shadow-lg rounded"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-dashed">
                            No Screenshot
                          </Badge>
                        )}
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" /> Complete
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-destructive"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                          </>
                        )}
                        {order.status !== 'pending' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => updateOrderStatus(order.id, 'pending')}
                          >
                            Reset to Pending
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Shipment ID</Label>
                          <Input 
                            placeholder="Enter Shipment ID" 
                            value={editingShipment?.id === order.id ? editingShipment.shipmentId : (order.shipmentId || '')}
                            onChange={(e) => setEditingShipment({ 
                              id: order.id, 
                              shipmentId: e.target.value, 
                              shippingCompany: editingShipment?.id === order.id ? editingShipment.shippingCompany : (order.shippingCompany || '') 
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Shipping Company</Label>
                          <Input 
                            placeholder="Enter Company Name" 
                            value={editingShipment?.id === order.id ? editingShipment.shippingCompany : (order.shippingCompany || '')}
                            onChange={(e) => setEditingShipment({ 
                              id: order.id, 
                              shipmentId: editingShipment?.id === order.id ? editingShipment.shipmentId : (order.shipmentId || ''), 
                              shippingCompany: e.target.value 
                            })}
                          />
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full" 
                        disabled={!editingShipment || editingShipment.id !== order.id}
                        onClick={() => updateShipmentDetails(order.id)}
                      >
                        Update Shipment Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid gap-6">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  No messages yet.
                </CardContent>
              </Card>
            ) : (
              messages.map((msg) => (
                <Card key={msg.id} className="bg-white/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold">{msg.name}</CardTitle>
                    <Badge variant="outline">
                      {msg.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{msg.email}</p>
                    <Separator className="my-2" />
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <div className="pt-4 flex justify-end">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, 'contact_messages', msg.id));
                            toast.success('Message deleted');
                          } catch (error: any) {
                            toast.error(error.message);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6">
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No users registered yet.</p>
              </div>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                          {user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {user.name || 'Anonymous'}
                            {user.role === 'admin' && <Badge className="bg-purple-500"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{user.tier || 'Bronze'}</Badge>
                        <p className="text-xs text-muted-foreground">Joined: {user.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-secondary/20 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Wallet Balance</p>
                        <p className="text-lg font-bold text-primary flex items-center gap-1">
                          <Wallet className="h-4 w-4" /> ₹{user.walletBalance || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-secondary/20 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Spent</p>
                        <p className="text-lg font-bold">₹{user.totalSpent || 0}</p>
                      </div>
                      <div className="p-3 bg-secondary/20 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Mobile</p>
                        <p className="text-sm font-medium">{user.mobile || 'Not set'}</p>
                      </div>
                      <div className="p-3 bg-secondary/20 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Referral Code</p>
                        <p className="text-sm font-mono">{user.referralCode || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger render={<Button size="sm" variant="outline" />}>
                          <Wallet className="h-4 w-4 mr-2" /> Adjust Wallet
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Wallet for {user.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Amount (use negative for debit)</Label>
                              <Input 
                                type="number" 
                                placeholder="e.g. 50 or -50" 
                                value={walletAdjustment}
                                onChange={(e) => setWalletAdjustment(Number(e.target.value))}
                              />
                            </div>
                            <Button className="w-full" onClick={() => {
                              if (walletAdjustment) {
                                updateUserWallet(user.id, walletAdjustment);
                                setWalletAdjustment(0);
                              }
                            }}>Update Balance</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'customer' : 'admin')}
                      >
                        <Shield className="h-4 w-4 mr-2" /> 
                        {user.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                      </Button>

                      {user.referredBy && (
                        <Badge variant="secondary" className="h-8">Referred by: {user.referredBy}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="grid gap-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No reviews yet.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{review.userName}</CardTitle>
                        <p className="text-xs text-muted-foreground">Product: {review.productName} (ID: {review.productId})</p>
                      </div>
                      <div className="flex gap-0.5 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-muted'}`} />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm italic">"{review.comment}"</p>
                    {review.videoUrl && (
                      <div className="aspect-video w-48 rounded-lg overflow-hidden bg-black">
                        <video src={review.videoUrl} className="w-full h-full object-cover" controls />
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, 'reviews', review.id));
                            toast.success('Review deleted');
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-8">
          <div className="flex justify-end">
            <Button onClick={() => setEditingRecipe({ title: '', description: '', image: '', videoUrl: '', ingredients: [{ name: '' }], instructions: [''] })}>
              <Plus className="h-4 w-4 mr-2" /> Add Recipe
            </Button>
          </div>

          {editingRecipe && (
            <Card>
              <CardHeader>
                <CardTitle>{editingRecipe.id ? 'Edit Recipe' : 'Add Recipe'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveRecipe} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={editingRecipe.title} onChange={e => setEditingRecipe({ ...editingRecipe, title: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipe Image</Label>
                      <div 
                        className={`border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${editingRecipe.image ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:bg-secondary/50'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleRecipeDrop}
                        onClick={() => recipeFileInputRef.current?.click()}
                      >
                        {editingRecipe.image ? (
                          <div className="relative w-full aspect-video rounded-md overflow-hidden">
                            <img src={editingRecipe.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <p className="text-white text-xs font-medium">Click or Drop to Change</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium">Click or Drag & Drop</p>
                              <p className="text-xs text-muted-foreground">Image for your recipe (Max 500KB)</p>
                            </div>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={recipeFileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processRecipeImage(file);
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipe Video (Optional - Max 5MB)</Label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${editingRecipe.videoUrl ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:bg-secondary/50'}`}
                      onClick={() => recipeVideoInputRef.current?.click()}
                    >
                      {editingRecipe.videoUrl ? (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                          <video src={editingRecipe.videoUrl} className="w-full h-full object-contain" controls />
                          <div className="absolute top-2 right-2">
                            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setEditingRecipe({ ...editingRecipe, videoUrl: '' }); }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Utensils className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Click to Upload Recipe Video</p>
                            <p className="text-xs text-muted-foreground">Short video showing the process (Max 5MB)</p>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={recipeVideoInputRef} 
                        className="hidden" 
                        accept="video/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processRecipeVideo(file);
                        }} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={editingRecipe.description} onChange={e => setEditingRecipe({ ...editingRecipe, description: e.target.value })} required />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Ingredients</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newIngredients = [...(editingRecipe.ingredients || []), { name: '', productId: '' }];
                          setEditingRecipe({ ...editingRecipe, ingredients: newIngredients });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Ingredient
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(Array.isArray(editingRecipe.ingredients) ? editingRecipe.ingredients : []).map((ing: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <Input 
                              placeholder="Ingredient Name" 
                              value={ing.name} 
                              onChange={e => {
                                const newIngs = [...(Array.isArray(editingRecipe.ingredients) ? editingRecipe.ingredients : [])];
                                newIngs[idx] = { ...newIngs[idx], name: e.target.value };
                                setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                              }} 
                            />
                            <select 
                              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={ing.productId || ''} 
                              onChange={e => {
                                const newIngs = [...(Array.isArray(editingRecipe.ingredients) ? editingRecipe.ingredients : [])];
                                newIngs[idx] = { ...newIngs[idx], productId: e.target.value };
                                setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                              }} 
                            >
                              <option value="">No Linked Product</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.weight})</option>
                              ))}
                            </select>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive h-10 w-10"
                            onClick={() => {
                              const newIngs = (Array.isArray(editingRecipe.ingredients) ? editingRecipe.ingredients : []).filter((_: any, i: number) => i !== idx);
                              setEditingRecipe({ ...editingRecipe, ingredients: newIngs });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Instructions</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const newInstructions = [...(editingRecipe.instructions || []), ''];
                          setEditingRecipe({ ...editingRecipe, instructions: newInstructions });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Step
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(Array.isArray(editingRecipe.instructions) ? editingRecipe.instructions : []).map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <Textarea 
                            placeholder={`Step ${idx + 1}`}
                            value={step} 
                            className="min-h-[80px]"
                            onChange={e => {
                              const newSteps = [...(Array.isArray(editingRecipe.instructions) ? editingRecipe.instructions : [])];
                              newSteps[idx] = e.target.value;
                              setEditingRecipe({ ...editingRecipe, instructions: newSteps });
                            }} 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive h-10 w-10"
                            onClick={() => {
                              const newSteps = (Array.isArray(editingRecipe.instructions) ? editingRecipe.instructions : []).filter((_: any, i: number) => i !== idx);
                              setEditingRecipe({ ...editingRecipe, instructions: newSteps });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save Recipe</Button>
                    <Button variant="outline" onClick={() => setEditingRecipe(null)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map(recipe => (
              <Card key={recipe.id}>
                <img src={recipe.image} alt={recipe.title} className="aspect-video object-cover w-full" referrerPolicy="no-referrer" />
                <CardContent className="p-4">
                  <h4 className="font-bold">{recipe.title}</h4>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setEditingRecipe(recipe)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={async () => {
                      await deleteDoc(doc(db, 'recipes', recipe.id));
                      toast.success('Recipe deleted');
                    }}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wall" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallEntries.map(entry => (
              <Card key={entry.id} className={entry.status === 'pending' ? 'border-primary' : ''}>
                <img src={entry.imageUrl} alt={entry.caption} className="aspect-square object-cover w-full" referrerPolicy="no-referrer" />
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{entry.userName}</p>
                      <p className="text-sm text-muted-foreground italic">"{entry.caption}"</p>
                    </div>
                    <Badge variant={entry.status === 'approved' ? 'default' : 'secondary'}>
                      {entry.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {entry.status === 'pending' && (
                      <Button size="sm" className="flex-1" onClick={() => updateWallStatus(entry.id, 'approved')}>Approve</Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={async () => {
                      await deleteDoc(doc(db, 'wall_of_fame', entry.id));
                      toast.success('Deleted');
                    }}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
