import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { useCart } from './CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ExternalLink, MessageSquare, Upload } from 'lucide-react';
import { CUSTOMER_CARE } from './constants';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStep, setOrderStep] = useState<'cart' | 'payment' | 'success'>('cart');

  useEffect(() => {
    if (auth.currentUser) {
      const fetchWallet = async () => {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          setWalletBalance(userDoc.data().walletBalance || 0);
        }
      };
      fetchWallet();
    }
  }, [isOpen]);

  const finalAmount = useWallet ? Math.max(0, totalPrice - walletBalance) : totalPrice;
  const walletUsed = useWallet ? Math.min(totalPrice, walletBalance) : 0;

  const handleProceedToPay = () => {
    if (!auth.currentUser) {
      toast.error('Please login to place an order');
      return;
    }
    
    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${CUSTOMER_CARE.upiId}&pn=Manbhari&am=${finalAmount}&cu=INR&tn=Order_Manbhari`;
    
    // Redirect to UPI app
    window.location.href = upiLink;
    
    // Move to payment step
    setOrderStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      // Create order in Firestore
      const orderData = {
        userId: auth.currentUser!.uid,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
        totalAmount: finalAmount,
        walletUsed,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'orders'), orderData);

      // Deduct wallet balance if used
      if (walletUsed > 0) {
        await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
          walletBalance: walletBalance - walletUsed
        });
      }

      setOrderStep('success');
      clearCart();
      toast.success('Order placed! Please share details on WhatsApp.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Hi Manbhari! I just placed an order for ₹${finalAmount}. Here is my address:\n\n[TYPE YOUR ADDRESS HERE]`;
    const whatsappUrl = `https://wa.me/${CUSTOMER_CARE.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) setOrderStep('cart'); onClose(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-2xl">
            <ShoppingBag className="h-6 w-6" />
            {orderStep === 'cart' && `Your Cart (${totalItems})`}
            {orderStep === 'payment' && 'Payment Verification'}
            {orderStep === 'success' && 'Order Successful!'}
          </SheetTitle>
        </SheetHeader>
        
        <Separator className="my-4" />

        <ScrollArea className="flex-1 -mx-6 px-6">
          {orderStep === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                  <Button variant="link" onClick={onClose}>Start Shopping</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-20 w-20 rounded-md overflow-hidden bg-muted">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.weight}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 border rounded-md">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                          <p className="font-medium">₹{item.price * item.quantity}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {walletBalance > 0 && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Use Wallet Balance</p>
                        <p className="text-xs text-muted-foreground">Available: ₹{walletBalance}</p>
                      </div>
                      <Button 
                        variant={useWallet ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setUseWallet(!useWallet)}
                      >
                        {useWallet ? "Applied" : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {orderStep === 'payment' && (
            <div className="space-y-6 text-center py-8">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ExternalLink className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold">Waiting for Payment</h4>
                <p className="text-sm text-muted-foreground">
                  If you weren't redirected, pay ₹{finalAmount} manually to:<br/>
                  <span className="font-mono font-bold text-primary">{CUSTOMER_CARE.upiId}</span>
                </p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
                <p className="text-xs">Once paid, click below to confirm. You will need to share the screenshot on WhatsApp next.</p>
                <Button className="w-full gap-2" onClick={handlePaymentSuccess} disabled={isProcessing}>
                  <Upload className="h-4 w-4" /> I Have Paid ₹{finalAmount}
                </Button>
              </div>
            </div>
          )}

          {orderStep === 'success' && (
            <div className="space-y-8 text-center py-12">
              <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="h-12 w-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-serif font-bold">Almost Done!</h4>
                <p className="text-muted-foreground">
                  To complete your order, please share your payment screenshot and delivery address on WhatsApp.
                </p>
              </div>
              <Button className="w-full h-14 text-lg gap-2 bg-green-600 hover:bg-green-700" onClick={shareOnWhatsApp}>
                <MessageSquare className="h-6 w-6" /> Share on WhatsApp
              </Button>
            </div>
          )}
        </ScrollArea>

        {orderStep === 'cart' && items.length > 0 && (
          <SheetFooter className="mt-auto pt-6 flex-col gap-4">
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              {useWallet && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Wallet Discount</span>
                  <span>-₹{walletUsed}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total to Pay</span>
                <span>₹{finalAmount}</span>
              </div>
            </div>
            <Button className="w-full h-12 text-lg" onClick={handleProceedToPay}>
              Proceed to Pay (UPI)
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Secure payment via UPI. No Cash on Delivery.
            </p>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
