import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from './App';

export const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setOrders(ords);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="p-24 text-center space-y-4">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
        <h3 className="text-2xl font-serif font-bold">Your Orders</h3>
        <p className="text-muted-foreground">Please login to see your order history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-24 text-center">
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-serif font-bold">Order History</h2>
          <p className="text-muted-foreground">
            Track your organic delights from our fields to your kitchen.
          </p>
        </div>

        <div className="grid gap-6">
          {orders.length === 0 ? (
            <Card className="p-12 text-center space-y-4 border-dashed">
              <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">You haven't placed any orders yet.</p>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-secondary/30 pb-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Order ID</p>
                      <CardTitle className="text-sm font-mono">#{order.id.slice(-8).toUpperCase()}</CardTitle>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Date</p>
                      <p className="text-sm font-medium">
                        {order.createdAt?.toDate().toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' : 
                        order.status === 'cancelled' ? 'destructive' : 'secondary'
                      }
                      className="h-8 px-4"
                    >
                      {order.status === 'pending' && <Clock className="h-3 w-3 mr-2" />}
                      {order.status === 'completed' && <CheckCircle className="h-3 w-3 mr-2" />}
                      {order.status === 'cancelled' && <XCircle className="h-3 w-3 mr-2" />}
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {item.quantity}x
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">₹{item.price * item.quantity || ''}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Method</p>
                      <p className="text-sm font-medium">UPI Payment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-serif font-bold text-primary">₹{order.totalAmount}</p>
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 text-xs text-center text-primary">
                      Your order is being processed. We will contact you on WhatsApp for delivery.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
