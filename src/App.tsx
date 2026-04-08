import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ProductCard } from './ProductCard';
import { Cart } from './Cart';
import { AuthModal } from './AuthModal';
import { Footer } from './Footer';
import { CartProvider } from './CartContext';
import { PRODUCTS, CATEGORIES, CUSTOMER_CARE } from './constants';
import { Toaster } from '../components/ui/sonner';
import { motion } from 'motion/react';
import { ShoppingBag, Sparkles, Clock, Phone, Mail } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { AdminPanel } from './AdminPanel';
import { ReferralPage } from './ReferralPage';
import { Product as ProductType } from './types';

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [view, setView] = useState<'home' | 'admin' | 'referral'>('home');
  const [userRole, setUserRole] = useState<'customer' | 'admin'>('customer');
  const [dynamicProducts, setDynamicProducts] = useState<ProductType[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Force admin role for the specific admin email
        if (user.email === 'manbhari555a@gmail.com') {
          setUserRole('admin');
        } else {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'customer');
          } else {
            setUserRole('customer');
          }
        }
      } else {
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
          onViewChange={setView}
          user={user}
          userRole={userRole}
        />

        <main className="flex-1">
          {view === 'admin' && userRole === 'admin' ? (
            <AdminPanel />
          ) : view === 'referral' ? (
            <ReferralPage />
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
                      Explore Snacks
                    </button>
                  </a>
                </div>
              </motion.div>
            </div>
          </section>

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

          {/* Categories & Products */}
          <div className="container mx-auto px-4 py-24 space-y-32">
            {CATEGORIES.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-medium uppercase tracking-widest text-xs">
                      {category.id === 'masala' && <Sparkles className="h-4 w-4" />}
                      {category.id === 'snacks' && <ShoppingBag className="h-4 w-4" />}
                      {category.id === 'coming-soon' && <Clock className="h-4 w-4" />}
                      {category.name}
                    </div>
                    <h3 className="text-4xl font-serif font-bold">{category.name}</h3>
                    <p className="text-muted-foreground max-w-md">{category.description}</p>
                  </div>
                  <div className="h-[1px] flex-1 bg-border mx-8 hidden md:block opacity-50" />
                </div>

                {category.id === 'coming-soon' ? (
                  <div className="bg-secondary/50 rounded-3xl p-12 text-center space-y-4 border-2 border-dashed border-border">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h4 className="text-2xl font-serif font-bold">New Delights Coming Soon</h4>
                    <p className="text-muted-foreground">We are crafting something special for you. Stay tuned!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {displayProducts.filter(p => p.category === category.id).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                    {displayProducts.filter(p => p.category === category.id).length === 0 && (
                      <div className="col-span-full py-12 text-center text-muted-foreground italic">
                        More products being added soon...
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}
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
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('Message sent! We will get back to you soon.'); }}>
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-primary-foreground">Name</Label>
                      <Input id="contact-name" placeholder="Your Name" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-primary-foreground">Email</Label>
                      <Input id="contact-email" type="email" placeholder="Your Email" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-message" className="text-primary-foreground">Message</Label>
                      <textarea 
                        id="contact-message" 
                        className="w-full min-h-[100px] rounded-md bg-white/10 border border-white/20 p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="How can we help?"
                      ></textarea>
                    </div>
                    <Button className="w-full bg-white text-primary hover:bg-white/90">Send Message</Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>

        <Footer />

        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <Toaster position="top-center" />
      </div>
    </CartProvider>
  );
}
