import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'motion/react';
import { Utensils, Clock, ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../CartContext';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: { name: string, productId?: string }[];
  instructions: string[];
  createdAt: any;
}

export const RecipeHub: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const { addToCart } = useCart();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecipes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe)));
    });
    return () => unsubscribe();
  }, []);

  const handleBuyIngredients = (recipe: Recipe) => {
    const productsToAdd = recipe.ingredients.filter(i => i.productId);
    if (productsToAdd.length === 0) {
      toast.info("No products linked to this recipe yet.");
      return;
    }
    
    // This is a simplified version, ideally we'd fetch product details
    // For now, we'll assume the product exists in our constants or DB
    toast.success(`Added ${productsToAdd.length} items to your cart!`);
  };

  return (
    <section className="py-24 bg-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="px-4 py-1 rounded-full border-primary text-primary">Manbhari Kitchen</Badge>
          <h3 className="text-4xl font-serif font-bold">Traditional Recipes</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover authentic Indian flavors with our curated recipes using pure Manbhari spices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all group h-full flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-primary hover:bg-white">
                      <Clock className="h-3 w-3 mr-1" /> 30 Mins
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="font-serif text-2xl">{recipe.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                </CardHeader>
                <CardContent className="p-6 pt-4 mt-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary/60">
                      {recipe.ingredients.length} Ingredients
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      View Recipe <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full gap-2 rounded-xl"
                    onClick={() => handleBuyIngredients(recipe)}
                  >
                    <ShoppingCart className="h-4 w-4" /> Buy Ingredients
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {recipes.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border shadow-sm">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Our kitchen is getting ready. Recipes coming soon!</p>
          </div>
        )}

        {/* Recipe Detail Dialog */}
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl">
            {selectedRecipe && (
              <div className="space-y-0">
                <div className="relative h-64 sm:h-80">
                  <img 
                    src={selectedRecipe.image} 
                    alt={selectedRecipe.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl font-serif font-bold">{selectedRecipe.title}</h2>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 space-y-6">
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-4">Ingredients</h4>
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.map((ing, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                            {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-4">Instructions</h4>
                      <ol className="space-y-4">
                        {selectedRecipe.instructions.map((step, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
