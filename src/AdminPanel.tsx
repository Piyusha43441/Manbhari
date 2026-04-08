import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { Product } from './types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Image as ImageIcon } from 'lucide-react';

import { PRODUCTS } from './constants';

export const AdminPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(prods);
    });
    return () => unsubscribe();
  }, []);

  const handleImportDefaults = async () => {
    setIsImporting(true);
    try {
      for (const product of PRODUCTS) {
        // Check if product already exists to avoid duplicates
        const exists = products.find(p => p.name === product.name);
        if (!exists) {
          const { id, ...data } = product;
          await addDoc(collection(db, 'products'), data);
        }
      }
      toast.success('Default products imported successfully');
    } catch (error: any) {
      toast.error('Failed to import: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        const { id, ...data } = editingProduct;
        await updateDoc(doc(db, 'products', id), data);
        toast.success('Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), {
          ...editingProduct,
          id: Math.random().toString(36).substring(7)
        });
        toast.success('Product added successfully');
      }
      setEditingProduct(null);
      setIsAdding(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-3xl font-serif font-bold">Admin Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportDefaults} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import Default Products'}
          </Button>
          <Button onClick={() => { setEditingProduct({ name: '', price: 0, category: 'masala', weight: '', description: '', image: '' }); setIsAdding(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {(isAdding || editingProduct?.id) && (
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={editingProduct?.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" value={editingProduct?.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingProduct?.category} 
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                >
                  <option value="masala">Organic Masala</option>
                  <option value="snacks">Organic Snacks</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Weight (e.g. 100gm)</Label>
                <Input value={editingProduct?.weight} onChange={e => setEditingProduct({ ...editingProduct, weight: e.target.value })} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingProduct?.description} 
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Image URL</Label>
                <Input value={editingProduct?.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Video URL (Optional)</Label>
                <Input value={editingProduct?.videoUrl} onChange={e => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })} placeholder="YouTube or Video link" />
              </div>
              <div className="md:col-span-2 flex gap-4">
                <Button type="submit">Save Product</Button>
                <Button variant="outline" onClick={() => { setEditingProduct(null); setIsAdding(false); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img src={product.image} alt={product.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-serif font-bold text-lg">{product.name}</h4>
                <p className="font-bold text-primary">₹{product.price}</p>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingProduct(product)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
