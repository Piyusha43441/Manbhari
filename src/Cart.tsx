import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCart } from './CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ExternalLink, MessageSquare, Upload, CheckCircle, Copy } from 'lucide-react';
import { CUSTOMER_CARE } from './constants';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from './App';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart, shippingFee: baseShippingFee } = useCart();
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStep, setOrderStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [lastOrderDetails, setLastOrderDetails] = useState<{ items: any[], amount: number, id: string } | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const fetchData = async () => {
        try {
          // Fetch Order Count
          const q = query(collection(db, 'orders'), where('userId', '==', auth.currentUser!.uid));
          const snap = await getDocs(q);
          setOrderCount(snap.size);

          // Fetch User Profile
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users/orders');
        }
      };
      fetchData();

      // Listen to wallet transactions for real-time balance
      const walletQuery = query(collection(db, 'wallet_transactions'), where('userId', '==', auth.currentUser.uid));
      const unsubscribeWallet = onSnapshot(walletQuery, (snapshot) => {
        let balance = 0;
        const now = new Date();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;
          const type = data.type;
          const expiresAt = data.expiresAt?.toDate?.() || (data.expiresAt ? new Date(data.expiresAt) : null);
          if (type === 'credit') {
            if (!expiresAt || expiresAt > now) balance += amount;
          } else if (type === 'debit') {
            balance -= amount;
          }
        });
        setWalletBalance(Math.max(0, balance));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'wallet_transactions');
      });

      return () => unsubscribeWallet();
    }
  }, [isOpen]);

  const isFirstOrder = orderCount === 0;
  const shippingFee = items.length > 0 ? (isFirstOrder ? 0 : 50) : 0;
  const totalWithShipping = totalPrice + shippingFee;

  const finalAmount = useWallet ? Math.max(0, totalWithShipping - walletBalance) : totalWithShipping;
  const walletUsed = useWallet ? Math.min(totalWithShipping, walletBalance) : 0;

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
    if (!screenshot) {
      toast.error('Please upload the payment screenshot first');
      return;
    }

    setIsProcessing(true);
    try {
      // Create order in Firestore
      const orderData = {
        userId: auth.currentUser!.uid,
        customerName: userProfile?.name || auth.currentUser!.displayName || 'Anonymous',
        customerEmail: userProfile?.email || auth.currentUser!.email || '',
        customerMobile: userProfile?.mobile || '',
        customerAddress: userProfile?.address || '',
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount: finalAmount,
        walletUsed,
        status: 'pending',
        screenshotUrl: screenshot, // Storing base64 for now
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // Record public product orders for the live indicator
      for (const item of items) {
        await addDoc(collection(db, 'product_orders'), {
          productId: item.id,
          quantity: item.quantity,
          createdAt: serverTimestamp()
        });
      }

      // Save details for WhatsApp before clearing
      setLastOrderDetails({
        items: [...items],
        amount: finalAmount,
        id: docRef.id
      });

      // Deduct wallet balance if used
      if (walletUsed > 0) {
        await addDoc(collection(db, 'wallet_transactions'), {
          userId: auth.currentUser!.uid,
          amount: walletUsed,
          type: 'debit',
          source: 'order',
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'users', auth.currentUser!.uid), {
          walletBalance: walletBalance - walletUsed
        }, { merge: true });
      }

      setOrderStep('success');
      clearCart();
      toast.success('Order placed! Please share details on WhatsApp.');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!lastOrderDetails) return;

    const itemsSummary = lastOrderDetails.items
      .map(item => `${item.name} (x${item.quantity})`)
      .join(', ');

    const message = `Hi Manbhari!\n\n*Order ID: #${lastOrderDetails.id.slice(-6).toUpperCase()}*\n\n*Attached payment screenshot*\n\nI have paid *rupees ${lastOrderDetails.amount}* for the following items:\n${itemsSummary}\n\n*My Address:*\n${userProfile?.address || '[TYPE YOUR ADDRESS HERE]'}`;
    
    const whatsappUrl = `https://wa.me/${CUSTOMER_CARE.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error('Image is too large. Please use an image under 500KB.');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshot(e.target?.result as string);
        setIsUploading(false);
        toast.success('Screenshot uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
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
                        <img src={item.images?.[0]} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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
                <div className="text-sm text-muted-foreground">
                  If you weren't redirected, pay ₹{finalAmount} manually to:<br/>
                  <div className="flex items-center justify-center gap-2 mt-1 mb-4">
                    <span className="font-mono font-bold text-primary">{CUSTOMER_CARE.upiId}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => {
                        navigator.clipboard.writeText(CUSTOMER_CARE.upiId);
                        toast.success('UPI ID copied to clipboard');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-primary/10 shadow-sm mx-auto w-fit">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Scan to Pay</p>
                    <div className="h-48 w-48 relative overflow-hidden rounded-lg">
                      <img 
                        src={CUSTOMER_CARE.upiQrCode} 
                        alt="UPI QR Code" 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Accepted on all UPI Apps</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-left">Upload Payment Screenshot</p>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleScreenshotUpload}
                      className="hidden" 
                      id="screenshot-upload"
                    />
                    <label 
                      htmlFor="screenshot-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${screenshot ? 'border-green-500 bg-green-50' : 'border-primary/20 hover:bg-primary/5'}`}
                    >
                      {screenshot ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                          <span className="text-xs font-medium text-green-600">Screenshot Attached</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Click to upload screenshot</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <p className="text-xs">Once paid and screenshot uploaded, click below to confirm. You will then be redirected to WhatsApp.</p>
                <Button className="w-full gap-2" onClick={handlePaymentSuccess} disabled={isProcessing || isUploading || !screenshot}>
                  {isProcessing ? 'Processing...' : `Confirm Payment of ₹${finalAmount}`}
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
                <span className={isFirstOrder ? "text-green-600 font-bold" : ""}>
                  {isFirstOrder ? "FREE (1st Order)" : `₹${shippingFee}`}
                </span>
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
