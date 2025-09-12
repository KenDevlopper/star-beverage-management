import { useState, useEffect } from 'react';
import { orderService } from '@/services/apiService';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export interface Order {
  id: string;
  client: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  date: string;
  amount: string;
  total_amount?: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: number;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export interface OrderFormData {
  id: string;
  client: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  date: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const { t } = useLanguage();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      
      // Vérifier que data est un tableau
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide');
      }
      
      // Formater les données pour correspondre à l'interface existante
      const formattedOrders = data.map((order: any) => ({
        id: order.id,
        client: order.customer_name || order.client || 'Client non spécifié',
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        date: formatDate(order.created_at),
        amount: formatAmount(order.total_amount),
        total_amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        status: order.status,
        notes: order.notes,
        items: order.items || [],
        created_at: order.created_at,
        updated_at: order.updated_at
      }));
      
      setOrders(formattedOrders);
      setError(null);
      setIsDemo(false);
      
      toast.success('Commandes chargées avec succès');
    } catch (err: any) {
      console.error('Erreur lors du chargement des commandes:', err);
      const errorMessage = err?.message || 'Erreur inconnue';
      setError(`Impossible de charger les commandes. ${errorMessage}`);
      setIsDemo(true);
      
      toast.error('Erreur lors du chargement des commandes');
      
      // Charger les données de démonstration en cas d'erreur
      const demoOrders = [
        { id: "ORD-1234", client: "Hôtel Sérénade", date: "04/07/2025", amount: "12,450 HTG", status: "completed" as const },
        { id: "ORD-1235", client: "Restaurant Cascade", date: "04/07/2025", amount: "8,200 HTG", status: "processing" as const },
        { id: "ORD-1236", client: "Café Bleu", date: "03/07/2025", amount: "5,800 HTG", status: "pending" as const },
        { id: "ORD-1237", client: "Superette Express", date: "03/07/2025", amount: "15,600 HTG", status: "completed" as const },
        { id: "ORD-1238", client: "Marché Central", date: "02/07/2025", amount: "9,150 HTG", status: "cancelled" as const },
        { id: "ORD-1239", client: "Restaurant Delmas", date: "02/07/2025", amount: "7,800 HTG", status: "completed" as const },
        { id: "ORD-1240", client: "Hôtel Paradis", date: "01/07/2025", amount: "18,350 HTG", status: "processing" as const },
        { id: "ORD-1241", client: "Bar Tropical", date: "01/07/2025", amount: "6,450 HTG", status: "pending" as const },
        { id: "ORD-1242", client: "Centre Commercial Star", date: "30/06/2025", amount: "22,100 HTG", status: "completed" as const },
        { id: "ORD-1243", client: "Café Créole", date: "30/06/2025", amount: "4,900 HTG", status: "completed" as const },
      ];
      setOrders(demoOrders);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: OrderFormData) => {
    try {
      const result = await orderService.createOrder(orderData);
      toast.success('Commande créée avec succès');
      // Rafraîchir la liste des commandes
      await fetchOrders();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la création de la commande:', err);
      
      // Gérer les erreurs de stock spécifiques
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const stockErrors = err.response.data.errors;
        // Afficher chaque erreur de stock individuellement
        stockErrors.forEach((error: string) => {
          toast.error(error);
        });
      } else {
        // Erreur générale
        const errorMessage = err.response?.data?.message || 'Erreur lors de la création de la commande';
        toast.error(errorMessage);
      }
      
      throw err;
    }
  };

  const updateOrder = async (orderId: string, orderData: Partial<OrderFormData>) => {
    try {
      const result = await orderService.updateOrder(orderId, orderData);
      toast.success('Commande mise à jour avec succès');
      // Rafraîchir la liste des commandes
      await fetchOrders();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la commande:', err);
      toast.error('Erreur lors de la mise à jour de la commande');
      throw err;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const result = await orderService.deleteOrder(orderId);
      toast.success('Commande supprimée avec succès');
      // Rafraîchir la liste des commandes
      await fetchOrders();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la commande:', err);
      toast.error('Erreur lors de la suppression de la commande');
      throw err;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const order = await orderService.getOrderById(orderId);
      return {
        id: order.id,
        client: order.customer_name || order.client,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        date: formatDate(order.created_at),
        amount: formatAmount(order.total_amount),
        total_amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        status: order.status,
        notes: order.notes,
        items: order.items || [],
        created_at: order.created_at,
        updated_at: order.updated_at
      };
    } catch (err: any) {
      console.error('Erreur lors de la récupération de la commande:', err);
      toast.error('Erreur lors de la récupération de la commande');
      throw err;
    }
  };

  const getOrderHistory = async (orderId: string) => {
    try {
      const history = await orderService.getOrderHistory(orderId);
      return history;
    } catch (err: any) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      toast.error('Erreur lors de la récupération de l\'historique');
      throw err;
    }
  };

  // Fonctions utilitaires
  const formatDate = (dateString: string): string => {
    if (!dateString) return new Date().toLocaleDateString('fr-FR');
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount: number | string): string => {
    if (!amount) return '0 HTG';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 HTG';
    return `${numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} HTG`;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    isDemo,
    refreshOrders: fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    getOrderHistory
  };
}
