
import { useState, useEffect } from 'react';
import { productService } from '@/services/apiService';
import { Product } from '@/types/product';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const { t } = useLanguage();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
      setError(null);
      setIsDemo(false);
      
      // Notification de succès
      toast.success(t('products.load.success'));
    } catch (err: any) {
      console.error('Erreur lors du chargement des produits:', err);
      const errorMessage = err?.message || 'Erreur inconnue';
      setError(`Impossible de charger les produits. ${errorMessage}`);
      setIsDemo(true);
      
      toast.error(t('products.load.error'));
      
      // Charger les données de démonstration en cas d'erreur
      const demoProducts = [
        { id: "PRD-001", name: "Eau minérale naturelle", price: 150, inventory: 25, status: "En stock", category_id: 1, category_name: "Eau" },
        { id: "PRD-002", name: "Jus d'orange tropical", price: 275, inventory: 18, status: "En stock", category_id: 2, category_name: "Jus" },
        { id: "PRD-003", name: "Soda cola classique", price: 200, inventory: 31, status: "En stock", category_id: 3, category_name: "Soda" },
        { id: "PRD-004", name: "Thé glacé au citron", price: 225, inventory: 9, status: "En stock", category_id: 4, category_name: "Thé" },
        { id: "PRD-005", name: "Limonade artisanale", price: 300, inventory: 6, status: "En stock", category_id: 3, category_name: "Soda" },
        { id: "PRD-006", name: "Eau pétillante", price: 175, inventory: 20, status: "En stock", category_id: 1, category_name: "Eau" },
        { id: "PRD-007", name: "Jus de pomme bio", price: 325, inventory: 11, status: "En stock", category_id: 2, category_name: "Jus" },
        { id: "PRD-008", name: "Soda gingembre", price: 250, inventory: 0, status: "Rupture de stock", category_id: 3, category_name: "Soda" },
      ];
      setProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    isDemo,
    refreshProducts: fetchProducts
  };
}
