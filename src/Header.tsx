import React from 'react';
import { ShoppingCart, User, Phone, Mail, Menu, Gift, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from './CartContext';
import { CUSTOMER_CARE } from './constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Badge } from '../components/ui/badge';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
  onViewChange: (view: 'home' | 'admin' | 'referral') => void;
  user: any;
  userRole?: 'customer' | 'admin';
}

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick, onViewChange, user, userRole }) => {
  const { totalItems } = useCart();

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
                <SheetTitle className="font-serif text-2xl">Manbhari</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                <a href="#masala" className="text-lg font-medium" onClick={() => onViewChange('home')}>Organic Masala</a>
                <a href="#snacks" className="text-lg font-medium" onClick={() => onViewChange('home')}>Organic Snacks</a>
                {user && (
                  <button onClick={() => onViewChange('referral')} className="text-lg font-medium flex items-center gap-2 text-primary">
                    <Gift className="h-5 w-5" /> Refer & Earn
                  </button>
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
          <h1 
            className="text-2xl font-serif font-bold tracking-tight text-primary cursor-pointer"
            onClick={() => onViewChange('home')}
          >
            Manbhari
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#masala" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => onViewChange('home')}>Organic Masala</a>
          <a href="#snacks" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => onViewChange('home')}>Organic Snacks</a>
          {user && (
            <button onClick={() => onViewChange('referral')} className="text-sm font-medium flex items-center gap-2 text-primary hover:opacity-80">
              <Gift className="h-4 w-4" /> Refer & Earn
            </button>
          )}
          {userRole === 'admin' && (
            <button onClick={() => onViewChange('admin')} className="text-sm font-medium flex items-center gap-2 text-primary hover:opacity-80">
              <Settings className="h-4 w-4" /> Admin
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
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
