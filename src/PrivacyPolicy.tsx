import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Store
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-serif">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us when you create an account, place an order, or contact us. 
                This may include your name, email address, phone number, and shipping address.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h2>
              <p>
                We use your information to process orders, communicate with you about your purchases, and provide rewards through our 
                gamified features (Spin Wheel, Dart Game, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal data. Your payment information is 
                securely processed via UPI and we do not store sensitive payment credentials on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">4. Third-Party Services</h2>
              <p>
                We use Firebase (a Google service) for authentication and database management. Your data is stored securely in 
                compliance with Google's security standards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at support@manbhari.com.
              </p>
            </section>
            
            <p className="text-sm italic pt-8 border-t">Last updated: May 2026</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
