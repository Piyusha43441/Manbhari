import React from 'react';
import { Phone, Mail, Instagram, Facebook, Twitter, MapPin } from 'lucide-react';
import { CUSTOMER_CARE } from './constants';
import { Separator } from '../components/ui/separator';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-bold">Manbhari</h2>
            <p className="text-primary-foreground/70 leading-relaxed">
              Bringing the authentic taste of Indian spices to your kitchen. 
              Pure, organic, and traditionally made for a healthier lifestyle.
            </p>
          </div>
          
          <div>
            <h3 className="font-serif text-xl mb-6">Categories</h3>
            <ul className="space-y-3 text-primary-foreground/70">
              <li><a href="#masala" className="hover:text-white transition-colors">Organic Masala</a></li>
              <li><a href="#snacks" className="hover:text-white transition-colors">Organic Snacks</a></li>
              <li><a href="#coming-soon" className="hover:text-white transition-colors">Coming Soon</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-xl mb-6">Customer Care</h3>
            <ul className="space-y-4 text-primary-foreground/70">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5" />
                <span>{CUSTOMER_CARE.mobile}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5" />
                <span>{CUSTOMER_CARE.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-1" />
                <span>India - Pure Organic Spices</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-xl mb-6">Follow Us</h3>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-primary-foreground/20" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/50">
          <p>© 2026 Manbhari Organic. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { Button } from '../components/ui/button';
