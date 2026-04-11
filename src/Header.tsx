import React from 'react';
import { ShoppingCart, User, Phone, Mail, Menu, Gift, Settings, Package, Wallet, Crown, Utensils, Camera, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from './CartContext';
import { CUSTOMER_CARE } from './constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Logo } from './components/Logo';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
  onViewChange: (view: 'home' | 'admin' | 'referral' | 'orders' | 'recipes' | 'wall' | 'wishlist') => void;
  user: any;
  userProfile?: any;
  userRole?: 'customer' | 'admin';
  onWalletClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick, onViewChange, user, userProfile, userRole, onWalletClick }) => {
  const { totalItems, wishlist } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Logo className="h-8 w-8" />
                  <span className="font-serif text-2xl">Manbhari</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                <a href="#masala" className="text-lg font-medium" onClick={() => onViewChange('home')}>Organic Masala</a>
                <a href="#snacks" className="text-lg font-medium" onClick={() => onViewChange('home')}>Homemade Snacks</a>
                <a href="#puja" className="text-lg font-medium" onClick={() => onViewChange('home')}>Puja Items</a>
                <button onClick={() => onViewChange('recipes')} className="text-lg font-medium flex items-center gap-2">
                  <Utensils className="h-5 w-5" /> Recipe Hub
                </button>
                <button onClick={() => onViewChange('wall')} className="text-lg font-medium flex items-center gap-2">
                  <Camera className="h-5 w-5" /> Wall of Fame
                </button>
                <button onClick={() => onViewChange('wishlist')} className="text-lg font-medium flex items-center gap-2">
                  <Heart className="h-5 w-5" /> My Wishlist
                </button>
                {user && (
                  <>
                    <button onClick={() => onViewChange('referral')} className="text-lg font-medium flex items-center gap-2 text-primary">
                      <Gift className="h-5 w-5" /> Refer & Earn
                    </button>
                    <button onClick={() => onViewChange('orders')} className="text-lg font-medium flex items-center gap-2 text-primary">
                      <Package className="h-5 w-5" /> My Orders
                    </button>
                  </>
                )}
                {userRole === 'admin' && (
                  <button onClick={() => onViewChange('admin')} className="text-lg font-medium flex items-center gap-2 text-primary">
                    <Settings className="h-5 w-5" /> Admin Panel
                  </button>
                )}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Customer Care</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" /> {CUSTOMER_CARE.mobile}
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Mail className="h-4 w-4" /> {CUSTOMER_CARE.email}
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onViewChange('home')}
          >
            <Logo className="h-10 w-10 transition-transform group-hover:scale-110" />
            <h1 className="text-2xl font-serif font-bold tracking-tight text-primary">
              Manbhari
            </h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#masala" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => onViewChange('home')}>Organic Masala</a>
          <a href="#snacks" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => onViewChange('home')}>Homemade Snacks</a>
          <a href="#puja" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => onViewChange('home')}>Puja Items</a>
          <button onClick={() => onViewChange('recipes')} className="text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors">
            <Utensils className="h-4 w-4" /> Recipes
          </button>
          <button onClick={() => onViewChange('wall')} className="text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors">
            <Camera className="h-4 w-4" /> Wall
          </button>
          <button onClick={() => onViewChange('wishlist')} className="text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors">
            <Heart className="h-4 w-4" /> Wishlist
          </button>
          {user && (
            <>
              <button onClick={() => onViewChange('referral')} className="text-sm font-medium flex items-center gap-2 text-primary hover:opacity-80">
                <Gift className="h-4 w-4" /> Refer & Earn
              </button>
              <button onClick={() => onViewChange('orders')} className="text-sm font-medium flex items-center gap-2 text-primary hover:opacity-80">
                <Package className="h-4 w-4" /> Orders
              </button>
            </>
          )}
          {userRole === 'admin' && (
            <button onClick={() => onViewChange('admin')} className="text-sm font-medium flex items-center gap-2 text-primary hover:opacity-80">
              <Settings className="h-4 w-4" /> Admin
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user && userProfile && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`hidden lg:flex gap-1 border-none font-bold ${
                userProfile.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                userProfile.tier === 'Silver' ? 'bg-slate-100 text-slate-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                <Crown className="h-3 w-3" /> {userProfile.tier || 'Bronze'}
              </Badge>
              <button 
                onClick={onWalletClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                <Wallet className="h-4 w-4" />
                ₹{userProfile.walletBalance || 0}
              </button>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => onViewChange('wishlist')} className="relative">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {wishlist.length}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onCartClick} className="relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary">
                {totalItems}
              </Badge>
            )}
          </Button>
          <Button variant="outline" className="hidden sm:flex items-center gap-2" onClick={onAuthClick}>
            <User className="h-4 w-4" />
            {user ? user.displayName || 'Account' : 'Login'}
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={onAuthClick}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
