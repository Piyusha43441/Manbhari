import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ProductCard } from './ProductCard';
import { Cart } from './Cart';
import { AuthModal } from './AuthModal';
import { Footer } from './Footer';
import { CartProvider } from './CartContext';
import { PRODUCTS, CATEGORIES, CUSTOMER_CARE } from './constants';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, Clock, Phone, Mail } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, setDoc, serverTimestamp, where, addDoc } from 'firebase/firestore';
import { AdminPanel } from './AdminPanel';
import { ReferralPage } from './ReferralPage';
import { OrderHistory } from './OrderHistory';
import { PromoBanner } from './PromoBanner';
import { ChatBot } from './ChatBot';
import { Quiz } from './Quiz';
import { SpinWheel } from './SpinWheel';
import { RewardsBanner } from './RewardsBanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Product as ProductType } from './types';
import { Badge } from '@/components/ui/badge';
import { ProductDetail } from './ProductDetail';
import { WalletHistory } from './components/WalletHistory';
import { VideoFeedbackSection } from './components/VideoFeedbackSection';
import { RecipeHub } from './components/RecipeHub';
import { WallOfFame } from './components/WallOfFame';
import { Wishlist } from './Wishlist';
import { FeatureBanners } from './components/FeatureBanners';
import { Crown, TrendingUp, MessageCircle, X } from 'lucide-react';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the whole app, but we log it clearly
}

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [view, setView] = useState<'home' | 'admin' | 'referral' | 'orders' | 'product-detail' | 'recipes' | 'wall' | 'wishlist'>('home');
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isFromOrder, setIsFromOrder] = useState(false);
  const [userRole, setUserRole] = useState<'customer' | 'admin'>('customer');
  const [walletBalance, setWalletBalance] = useState(0);
  const [dynamicProducts, setDynamicProducts] = useState<ProductType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [productOrderCounts, setProductOrderCounts] = useState<Record<string, number>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [canPlayQuiz, setCanPlayQuiz] = useState(false);
  const [canPlayWheel, setCanPlayWheel] = useState(false);
  const [showAbandonedBanner, setShowAbandonedBanner] = useState(false);

  useEffect(() => {
    // Show abandoned cart banner after 30 seconds if cart is not empty
    const timer = setTimeout(() => {
      const cart = localStorage.getItem('cart');
      if (cart && JSON.parse(cart).length > 0) {
        setShowAbandonedBanner(true);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view === 'home') {
      if (!user) {
        setCanPlayQuiz(true);
        setCanPlayWheel(true);
        return;
      }
      const checkRewardsStatus = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const now = new Date();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

            // Check Quiz
            const lastQuiz = data.lastQuizCompletion?.toDate?.() || (data.lastQuizCompletion ? new Date(data.lastQuizCompletion) : null);
            const quizAvailable = !lastQuiz || (now.getTime() - lastQuiz.getTime() >= sevenDaysMs);
            setCanPlayQuiz(quizAvailable);

            // Check Wheel
            const lastWheel = data.lastWheelSpin?.toDate?.() || (data.lastWheelSpin ? new Date(data.lastWheelSpin) : null);
            const wheelAvailable = !lastWheel || (now.getTime() - lastWheel.getTime() >= sevenDaysMs);
            setCanPlayWheel(wheelAvailable);
          }
        } catch (error) {
          console.error('Error checking rewards status:', error);
        }
      };
      checkRewardsStatus();
    }
  }, [user, view, showQuiz, showWheel]);

  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Query public product orders from the last 7 days
    const ordersQuery = query(
      collection(db, 'product_orders'),
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const counts: Record<string, number> = {};
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAtDate = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : null);
        
        if (createdAtDate && (now - createdAtDate.getTime() <= sevenDaysMs)) {
          counts[data.productId] = (counts[data.productId] || 0) + (data.quantity || 1);
        }
      });
      setProductOrderCounts(counts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'product_orders');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setWalletBalance(0);
      return;
    }

    const q = query(collection(db, 'wallet_transactions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let balance = 0;
      const now = new Date();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        const type = data.type;
        const expiresAt = data.expiresAt?.toDate?.() || (data.expiresAt ? new Date(data.expiresAt) : null);

        if (type === 'credit') {
          // Check if expired
          if (!expiresAt || expiresAt > now) {
            balance += amount;
          }
        } else if (type === 'debit') {
          balance -= amount;
        }
      });

      setWalletBalance(Math.max(0, balance));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'wallet_transactions');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        
        // Listen to user profile
        const unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserProfile(data);
            setUserRole(data.role || 'customer');
            
            // Force admin role for the specific admin email
            if (user.email === 'manbhari555a@gmail.com' || user.email === 'agarwalpiyush263@gmail.com') {
              setUserRole('admin');
            }
          } else {
            // Create missing profile
            const createProfile = async () => {
              const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
              await setDoc(userRef, {
                uid: user.uid,
                name: user.displayName || 'User',
                email: user.email || '',
                mobile: '',
            role: (user.email === 'manbhari555a@gmail.com' || user.email === 'agarwalpiyush263@gmail.com') ? 'admin' : 'customer',
                walletBalance: 0,
                totalSpent: 0,
                tier: 'Bronze',
                referralCode: newReferralCode,
                createdAt: serverTimestamp(),
              });
            };
            createProfile();
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setUserRole('customer');
        setView('home');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProductType));
      setDynamicProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  const displayProducts = dynamicProducts.length > 0 ? dynamicProducts : PRODUCTS;

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
          <Header 
            onAuthClick={() => setIsAuthOpen(true)} 
            onCartClick={() => setIsCartOpen(true)}
            onViewChange={(v) => {
              setView(v);
              if (v !== 'product-detail') setIsFromOrder(false);
            }}
            user={user}
            userProfile={userProfile}
            userRole={userRole}
            onWalletClick={() => setShowWallet(true)}
          />

        <main className="flex-1">
          {view === 'home' && (
            <RewardsBanner 
              canPlayQuiz={canPlayQuiz}
              canPlayWheel={canPlayWheel}
              onPlayQuiz={() => user ? setShowQuiz(true) : setIsAuthOpen(true)}
              onPlayWheel={() => user ? setShowWheel(true) : setIsAuthOpen(true)}
            />
          )}
          {view === 'admin' && userRole === 'admin' ? (
            <AdminPanel />
          ) : view === 'referral' ? (
            <ReferralPage />
          ) : view === 'orders' ? (
            <OrderHistory onProductClick={(id) => {
              const product = displayProducts.find(p => p.id === id);
              if (product) {
                setSelectedProduct(product);
                setIsFromOrder(true);
                setView('product-detail');
              } else {
                toast.error('Product not found');
              }
            }} />
          ) : view === 'product-detail' && selectedProduct ? (
            <ProductDetail 
              product={selectedProduct} 
              onBack={() => {
                setView(isFromOrder ? 'orders' : 'home');
                setIsFromOrder(false);
              }} 
              isFromOrder={isFromOrder}
            />
          ) : view === 'recipes' ? (
            <div className="pt-10">
              <RecipeHub />
            </div>
          ) : view === 'wall' ? (
            <div className="pt-10">
              <WallOfFame user={user} />
            </div>
          ) : view === 'wishlist' ? (
            <div className="pt-10">
              <Wishlist 
                onProductClick={(p) => {
                  setSelectedProduct(p);
                  setView('product-detail');
                }}
                onBack={() => setView('home')}
              />
            </div>
          ) : (
            <>
              {/* Hero Section */}
              <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-[#5A5A40]">
            <div className="absolute inset-0 opacity-40">
              <img 
                src="https://picsum.photos/seed/spices/1920/1080?blur=4" 
                alt="Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">
                  Pure Organic <br /> <span className="italic">Indian Spices</span>
                </h2>
                <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-white/80 font-light leading-relaxed">
                  Experience the authentic aroma and health benefits of traditionally 
                  crafted organic masalas and snacks. Straight from our fields to your kitchen.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="#masala">
                    <button className="px-8 py-4 bg-white text-primary rounded-full font-semibold hover:bg-white/90 transition-all transform hover:scale-105">
                      Shop Masala
                    </button>
                  </a>
                  <a href="#snacks">
                    <button className="px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-all backdrop-blur-sm">
                      Explore Homemade Snacks
                    </button>
                  </a>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Promo Banner */}
          <PromoBanner onReferralClick={() => setView('referral')} />

          {/* Our Story */}
          <section className="py-24 overflow-hidden">
            <div className="container mx-auto px-4">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2 relative">
                  <div className="relative z-10 rounded-[40px] overflow-hidden aspect-[4/5]">
                    <img 
                      src="https://picsum.photos/seed/farm/800/1000" 
                      alt="Our Farm" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
                  <div className="absolute -top-8 -left-8 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />
                </div>
                <div className="lg:w-1/2 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-primary font-medium uppercase tracking-widest text-xs">Our Story</h3>
                    <h2 className="text-5xl font-serif font-bold leading-tight">
                      From Our Fields to <br /> Your <span className="italic">Heart</span>
                    </h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Manbhari was born out of a simple desire: to bring back the pure, 
                    unadulterated flavors of traditional Indian spices. We work directly 
                    with organic farmers who share our passion for quality and sustainability.
                  </p>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-3xl font-serif font-bold text-primary">100%</p>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Organic Certified</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-3xl font-serif font-bold text-primary">50+</p>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Local Farmers</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full px-8 h-12">Learn More About Our Process</Button>
                </div>
              </div>
            </div>
          </section>

          <FeatureBanners 
            onViewRecipes={() => setView('recipes')} 
            onViewWall={() => setView('wall')} 
          />

          {/* Categories & Products */}
          <div className="container mx-auto px-4 py-24 space-y-32">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-4xl font-serif font-bold">Our Collection</h3>
                <p className="text-muted-foreground">Pure, organic, and traditionally crafted.</p>
              </div>
              <div className="relative w-full max-w-md">
                <Input 
                  placeholder="Search for masala, snacks..." 
                  className="pl-12 h-12 rounded-full border-primary/20 bg-white/50 backdrop-blur-sm focus:ring-primary/20"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {CATEGORIES.map((category) => {
              const categoryProducts = displayProducts.filter(p => 
                p.category === category.id && 
                (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 p.description.toLowerCase().includes(searchQuery.toLowerCase()))
              );

              if (searchQuery && categoryProducts.length === 0) return null;

              return (
                <section key={category.id} id={category.id} className="scroll-mt-24">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary font-medium uppercase tracking-widest text-xs">
                        {category.id === 'masala' && <Sparkles className="h-4 w-4" />}
                        {category.id === 'snacks' && <ShoppingBag className="h-4 w-4" />}
                        {category.id === 'puja' && <Sparkles className="h-4 w-4 text-orange-500" />}
                        {category.name}
                        {(category.id === 'masala' || category.id === 'snacks') && (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-[10px]">
                            FSSAI Certified
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-4xl font-serif font-bold">{category.name}</h3>
                      <p className="text-muted-foreground max-w-md">{category.description}</p>
                    </div>
                    <div className="h-[1px] flex-1 bg-border mx-8 hidden md:block opacity-50" />
                  </div>

                  {category.id === 'puja' && categoryProducts.length === 0 ? (
                    <div className="bg-secondary/50 rounded-3xl p-12 text-center space-y-4 border-2 border-dashed border-border">
                      <Sparkles className="h-12 w-12 mx-auto text-orange-500 opacity-50" />
                      <h4 className="text-2xl font-serif font-bold">Puja Items Coming Soon</h4>
                      <p className="text-muted-foreground">We are bringing pure items for your spiritual journey. Stay tuned!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {categoryProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          orderCount={productOrderCounts[product.id || '']} 
                          onProductClick={(p) => {
                            setSelectedProduct(p);
                            setIsFromOrder(false);
                            setView('product-detail');
                            window.scrollTo(0, 0);
                          }}
                        />
                      ))}
                      {categoryProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground italic">
                          More products being added soon...
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Why Choose Us */}
          <section className="bg-secondary/30 py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 space-y-4">
                <h3 className="text-4xl font-serif font-bold">Why Choose Manbhari?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  We believe in purity and tradition. Our products are made with love and care.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { title: '100% Organic', desc: 'No chemicals, no pesticides. Just pure nature.' },
                  { title: 'Traditional Methods', desc: 'Crafted using age-old Indian spice-making traditions.' },
                  { title: 'Health First', desc: 'Rich in antioxidants and natural health benefits.' }
                ].map((item, i) => (
                  <div key={i} className="text-center space-y-4 p-8 rounded-3xl bg-white/50 backdrop-blur-sm">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-serif font-bold">{item.title}</h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-24 bg-primary/5">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 space-y-4">
                <h3 className="text-primary font-medium uppercase tracking-widest text-xs">Testimonials</h3>
                <h2 className="text-4xl font-serif font-bold">What Our Customers Say</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: 'Anita Sharma', text: 'The aroma of Manbhari Garam Masala is exactly like what my grandmother used to make. Truly authentic!' },
                  { name: 'Rajesh Patel', text: 'I love that everything is organic. You can really taste the difference in quality compared to store-bought spices.' },
                  { name: 'Priya Verma', text: 'Great customer service and the packaging is beautiful. Highly recommend for anyone looking for pure spices.' }
                ].map((testimonial, i) => (
                  <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="italic text-muted-foreground">"{testimonial.text}"</p>
                    <div>
                      <p className="font-bold font-serif">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Verified Customer</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-[40px] overflow-hidden flex flex-col md:flex-row">
                <div className="p-12 md:w-1/2 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-serif font-bold">Get in Touch</h3>
                    <p className="text-primary-foreground/70">
                      Have questions about our products or want to place a bulk order? 
                      We're here to help!
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/50">Call Us</p>
                        <p className="font-medium">{CUSTOMER_CARE.mobile}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/50">Email Us</p>
                        <p className="font-medium">{CUSTOMER_CARE.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-12 md:w-1/2 bg-white/5 backdrop-blur-sm flex flex-col justify-center">
                  <form className="space-y-4" onSubmit={async (e) => { 
                    e.preventDefault(); 
                    const name = (document.getElementById('contact-name') as HTMLInputElement).value;
                    const email = (document.getElementById('contact-email') as HTMLInputElement).value;
                    const message = (document.getElementById('contact-message') as HTMLTextAreaElement).value;
                    
                    const submitButton = e.currentTarget.querySelector('button');
                    if (submitButton) submitButton.disabled = true;

                    try {
                      // 1. Save to Firestore
                      await addDoc(collection(db, 'contact_messages'), {
                        name,
                        email,
                        message,
                        createdAt: serverTimestamp()
                      });

                      // 2. Send Email via FormSubmit.co
                      const response = await fetch(`https://formsubmit.co/ajax/${CUSTOMER_CARE.email}`, {
                        method: "POST",
                        headers: { 
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                          name,
                          email,
                          message,
                          _subject: `New Contact Message from ${name}`,
                          _template: 'table'
                        })
                      });

                      if (response.ok) {
                        toast.success('Message sent successfully! We will get back to you soon.');
                        (e.target as HTMLFormElement).reset();
                      } else {
                        // Fallback to mailto if FormSubmit fails
                        const mailtoLink = `mailto:${CUSTOMER_CARE.email}?subject=Contact from ${name}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0AMessage: ${message}`;
                        window.location.href = mailtoLink;
                        toast.info('Opening your email client...');
                      }
                    } catch (error) {
                      console.error('Error sending message:', error);
                      // Fallback to mailto
                      const mailtoLink = `mailto:${CUSTOMER_CARE.email}?subject=Contact from ${name}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0AMessage: ${message}`;
                      window.location.href = mailtoLink;
                      toast.info('Opening your email client...');
                    } finally {
                      if (submitButton) submitButton.disabled = false;
                    }
                  }}>
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-primary-foreground">Name</Label>
                      <Input id="contact-name" placeholder="Your Name" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-primary-foreground">Email</Label>
                      <Input id="contact-email" type="email" placeholder="Your Email" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-message" className="text-primary-foreground">Message</Label>
                      <textarea 
                        id="contact-message" 
                        className="w-full min-h-[100px] rounded-md bg-white/10 border border-white/20 p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="How can we help?"
                        required
                      ></textarea>
                    </div>
                    <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90">Send Message</Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>

    {view === 'home' && (
      <>
        <VideoFeedbackSection />
        <RecipeHub />
        <WallOfFame user={user} />
      </>
    )}

    <Footer />

        <ChatBot />

        <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
          <DialogContent className="max-w-2xl p-0 bg-transparent border-none shadow-none" showCloseButton={false}>
            <Quiz onComplete={() => setShowQuiz(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showWheel} onOpenChange={setShowWheel}>
          <DialogContent className="max-w-2xl p-0 bg-transparent border-none shadow-none" showCloseButton={false}>
            <SpinWheel onComplete={() => setShowWheel(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showWallet} onOpenChange={setShowWallet}>
          <DialogContent className="max-w-2xl p-6 bg-white rounded-[40px]">
            <WalletHistory />
          </DialogContent>
        </Dialog>

        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        
        {/* Abandoned Cart Banner */}
        <AnimatePresence>
          {showAbandonedBanner && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-primary/20 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <button 
                  onClick={() => setShowAbandonedBanner(false)}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Don't forget your items!</h4>
                    <p className="text-xs text-muted-foreground">Your cart is waiting for you. Complete your purchase now and get a special surprise!</p>
                    <Button 
                      size="sm" 
                      className="mt-2 rounded-full h-8 text-xs"
                      onClick={() => {
                        setIsCartOpen(true);
                        setShowAbandonedBanner(false);
                      }}
                    >
                      View Cart
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp Floating Button */}
        <a 
          href={`https://wa.me/${CUSTOMER_CARE.mobile.replace(/\D/g, '')}?text=Hi Manbhari, I have a question about your products!`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-8 z-50 h-14 w-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="h-8 w-8 fill-current"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.635 0 12.032-5.396 12.035-12.032a11.762 11.762 0 00-3.525-8.509z"/>
          </svg>
          <span className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat with us
          </span>
        </a>

        <Toaster position="top-center" />
      </div>
    </CartProvider>
  );
}
