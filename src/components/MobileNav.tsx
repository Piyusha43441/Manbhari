import React from 'react';
import { Home, Utensils, Camera, Package, User, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Gift, Settings, LogOut, Heart, Wallet, Phone, Mail } from 'lucide-react';
import { auth } from '../firebase';
import { CUSTOMER_CARE } from '../constants';

interface MobileNavProps {
  currentView: string;
  onViewChange: (view: 'home' | 'admin' | 'referral' | 'orders' | 'recipes' | 'wall' | 'wishlist') => void;
  onAuthClick: () => void;
  user: any;
  userProfile?: any;
  userRole?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange, onAuthClick, user, userProfile, userRole }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'recipes', label: 'Recipes', icon: Utensils },
    { id: 'wall', label: 'Wall', icon: Camera },
    { id: 'orders', label: 'Orders', icon: Package },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as any);
              }}
              className="flex flex-col items-center justify-center flex-1 gap-1 relative group"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground group-hover:text-primary/70'
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-0 w-10 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {/* Account/Menu Tab */}
        <Sheet>
          <SheetTrigger 
            render={
              <button className="flex flex-col items-center justify-center flex-1 gap-1 relative group">
                <div className="p-1.5 rounded-xl text-muted-foreground group-hover:text-primary/70 transition-all duration-300">
                  {user ? <Menu className="h-5 w-5 stroke-[2px]" /> : <User className="h-5 w-5 stroke-[2px]" />}
                </div>
                <span className="text-[10px] font-bold tracking-tight text-muted-foreground">
                  {user ? 'Menu' : 'Login'}
                </span>
              </button>
            }
          />
          <SheetContent side="bottom" className="rounded-t-[32px] h-[70vh] p-0 overflow-hidden border-none">
            <div className="h-full flex flex-col bg-background">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-6" />
              <SheetHeader className="px-6 text-left">
                <SheetTitle className="text-2xl font-serif">
                  {user ? `Namaste, ${user.displayName?.split(' ')[0] || 'User'}` : 'Welcome to Manbhari'}
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {!user ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Login to track orders, earn rewards, and more.</p>
                    <Button className="w-full rounded-full h-12" onClick={onAuthClick}>Login / Sign Up</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => onViewChange('referral')}
                      className="flex flex-col items-center justify-center p-4 rounded-3xl bg-primary/5 border border-primary/10 gap-2"
                    >
                      <Gift className="h-6 w-6 text-primary" />
                      <span className="text-xs font-bold">Refer & Earn</span>
                    </button>
                    <button 
                      onClick={() => onViewChange('wishlist')}
                      className="flex flex-col items-center justify-center p-4 rounded-3xl bg-red-50 border border-red-100 gap-2"
                    >
                      <Heart className="h-6 w-6 text-red-500" />
                      <span className="text-xs font-bold">Wishlist</span>
                    </button>
                    <button 
                      onClick={() => onViewChange('orders')}
                      className="flex flex-col items-center justify-center p-4 rounded-3xl bg-blue-50 border border-blue-100 gap-2"
                    >
                      <Package className="h-6 w-6 text-blue-500" />
                      <span className="text-xs font-bold">My Orders</span>
                    </button>
                    {userRole === 'admin' && (
                      <button 
                        onClick={() => onViewChange('admin')}
                        className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-100 border border-slate-200 gap-2"
                      >
                        <Settings className="h-6 w-6 text-slate-600" />
                        <span className="text-xs font-bold">Admin Panel</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Support</p>
                  <a href={`tel:${CUSTOMER_CARE.mobile}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Call Us</p>
                      <p className="text-xs text-muted-foreground">{CUSTOMER_CARE.mobile}</p>
                    </div>
                  </a>
                  <a href={`mailto:${CUSTOMER_CARE.email}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Email Us</p>
                      <p className="text-xs text-muted-foreground">{CUSTOMER_CARE.email}</p>
                    </div>
                  </a>
                </div>

                {user && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl h-12"
                    onClick={() => auth.signOut()}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-bold">Logout</span>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
