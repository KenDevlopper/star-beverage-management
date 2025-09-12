import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/apiService';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export interface InventoryItem {
  id: string;
  name: string;
  inventory: number;
  unit: string;
  status: string;
  status_text: string;
  category_name: string;
  minimum_quantity: number;
  reorder_point: number;
}

export interface InventoryHistoryItem {
  id: string;
  type: 'entrée' | 'sortie';
  quantity: number;
  unit: string;
  reason: string;
  user: string;
  date: string;
  reference_type: string;
  old_quantity?: number;
  new_quantity?: number;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const { t } = useLanguage();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(data);
      setError(null);
      setIsDemo(false);
      
      toast.success('Inventaire chargé avec succès');
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'inventaire:', err);
      const errorMessage = err?.message || 'Erreur inconnue';
      setError(`Impossible de charger l'inventaire. ${errorMessage}`);
      setIsDemo(true);
      
      toast.error('Erreur lors du chargement de l\'inventaire');
      
      // Charger les données de démonstration en cas d'erreur
      const demoInventory = [
        { 
          id: "PRD-001", 
          name: "Eau minérale naturelle", 
          inventory: 25, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Eau", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-002", 
          name: "Jus d'orange tropical", 
          inventory: 18, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Jus", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-003", 
          name: "Soda cola classique", 
          inventory: 31, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Soda", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-004", 
          name: "Thé glacé au citron", 
          inventory: 9, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Thé", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-005", 
          name: "Limonade artisanale", 
          inventory: 6, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Soda", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-006", 
          name: "Eau pétillante", 
          inventory: 20, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Eau", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-007", 
          name: "Jus de pomme bio", 
          inventory: 11, 
          unit: "Caisse", 
          status: "active",
          status_text: "En stock", 
          category_name: "Jus", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
        { 
          id: "PRD-008", 
          name: "Soda gingembre", 
          inventory: 0, 
          unit: "Caisse", 
          status: "active",
          status_text: "Rupture de stock", 
          category_name: "Soda", 
          minimum_quantity: 5, 
          reorder_point: 5 
        },
      ];
      setInventory(demoInventory);
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: string) => {
    try {
      const result = await inventoryService.adjustStock(productId, newQuantity, reason);
      toast.success('Stock ajusté avec succès');
      // Rafraîchir l'inventaire après l'ajustement
      await fetchInventory();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajustement du stock:', err);
      toast.error('Erreur lors de l\'ajustement du stock');
      throw err;
    }
  };

  const updateInventorySettings = async (productId: string, minimumQuantity: number, reorderPoint?: number) => {
    try {
      const result = await inventoryService.updateInventorySettings(productId, minimumQuantity, reorderPoint);
      toast.success('Paramètres d\'inventaire mis à jour');
      // Rafraîchir l'inventaire après la mise à jour
      await fetchInventory();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      toast.error('Erreur lors de la mise à jour des paramètres');
      throw err;
    }
  };

  const getProductHistory = async (productId: string): Promise<InventoryHistoryItem[]> => {
    try {
      const history = await inventoryService.getProductHistory(productId);
      return history;
    } catch (err: any) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      toast.error('Erreur lors de la récupération de l\'historique');
      throw err;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    loading,
    error,
    isDemo,
    refreshInventory: fetchInventory,
    adjustStock,
    updateInventorySettings,
    getProductHistory
  };
}
