import React from 'react';
import { Phone, Mail, Instagram, Facebook, Twitter, MapPin, Send } from 'lucide-react';
import { CUSTOMER_CARE } from './constants';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const Footer: React.FC = () => {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you for subscribing to our newsletter!');
  };

  return (
    <footer className="bg-primary text-primary-foreground pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-serif font-bold tracking-tight">Manbhari</h2>
            <p className="text-primary-foreground/70 leading-relaxed text-sm">
              Bringing the authentic taste of Indian spices to your kitchen. 
              Pure, organic, and traditionally made for a healthier lifestyle.
              Experience the true essence of nature.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-10 w-10">
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-serif text-xl mb-8">Quick Links</h3>
            <ul className="space-y-4 text-primary-foreground/70 text-sm">
              <li><a href="#masala" className="hover:text-white transition-colors">Organic Masala</a></li>
              <li><a href="#snacks" className="hover:text-white transition-colors">Homemade Snacks</a></li>
              <li><a href="#puja" className="hover:text-white transition-colors">Puja Items</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-xl mb-8">Contact Info</h3>
            <ul className="space-y-6 text-primary-foreground/70 text-sm">
              <li className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Phone className="h-4 w-4" />
                </div>
                <span>{CUSTOMER_CARE.mobile}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <span>{CUSTOMER_CARE.email}</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>India - Pure Organic Spices from Traditional Farms</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-serif text-xl mb-8">Newsletter</h3>
            <p className="text-sm text-primary-foreground/70">
              Subscribe to get updates on new products and organic living tips.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input 
                placeholder="Email address" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
                required
              />
              <Button size="icon" className="bg-white text-primary hover:bg-white/90 h-11 w-11 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <Separator className="my-16 bg-primary-foreground/10" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-primary-foreground/40 font-medium uppercase tracking-widest">
          <p>© 2026 Manbhari Organic. All rights reserved.</p>
          <div className="flex gap-12">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
