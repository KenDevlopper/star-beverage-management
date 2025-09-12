import { useState, useEffect } from 'react';
import { customerService } from '@/services/apiService';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export interface Customer {
  id: number;
  name: string;
  type?: string;
  contact_person?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFormData {
  name: string;
  type?: string;
  contact_person?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const { t } = useLanguage();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllCustomers();
      setCustomers(data);
      setError(null);
      setIsDemo(false);
      
      toast.success('Clients chargés avec succès');
    } catch (err: any) {
      console.error('Erreur lors du chargement des clients:', err);
      const errorMessage = err?.message || 'Erreur inconnue';
      setError(`Impossible de charger les clients. ${errorMessage}`);
      setIsDemo(true);
      
      toast.error('Erreur lors du chargement des clients');
      
      // Charger les données de démonstration en cas d'erreur
      const demoCustomers = [
        { id: 1, name: "Hôtel Sérénade", type: "Hôtel", contact_person: "Jean Dupont", email: "contact@hotel-serenade.ht", phone: "+509 1234-5678", address: "123 Avenue des Palmiers, Port-au-Prince", status: "active" as const, total_orders: 24, total_spent: 125000 },
        { id: 2, name: "Restaurant Cascade", type: "Restaurant", contact_person: "Marie Laurent", email: "info@restaurant-cascade.ht", phone: "+509 2345-6789", address: "456 Rue du Centre, Pétion-Ville", status: "active" as const, total_orders: 38, total_spent: 189000 },
        { id: 3, name: "Café Bleu", type: "Café", contact_person: "Pierre Michel", email: "cafe@cafe-bleu.ht", phone: "+509 3456-7890", address: "789 Boulevard Jean-Jacques Dessalines, Port-au-Prince", status: "active" as const, total_orders: 17, total_spent: 85000 },
        { id: 4, name: "Superette Express", type: "Épicerie", contact_person: "Sophie Martin", email: "ventes@superette-express.ht", phone: "+509 4567-8901", address: "321 Route de Delmas, Delmas", status: "active" as const, total_orders: 42, total_spent: 210000 },
        { id: 5, name: "Marché Central", type: "Marché", contact_person: "Louis Joseph", email: "marche@marche-central.ht", phone: "+509 5678-9012", address: "654 Place du Marché, Port-au-Prince", status: "active" as const, total_orders: 31, total_spent: 155000 },
        { id: 6, name: "Restaurant Delmas", type: "Restaurant", contact_person: "Anne Estimé", email: "delmas@restaurant-delmas.ht", phone: "+509 6789-0123", address: "987 Avenue Delmas, Delmas", status: "active" as const, total_orders: 29, total_spent: 145000 },
        { id: 7, name: "Hôtel Paradis", type: "Hôtel", contact_person: "Claude Pascal", email: "reservation@hotel-paradis.ht", phone: "+509 7890-1234", address: "147 Route de Kenscoff, Kenscoff", status: "active" as const, total_orders: 22, total_spent: 110000 },
        { id: 8, name: "Bar Tropical", type: "Bar", contact_person: "Thomas Auguste", email: "bar@bar-tropical.ht", phone: "+509 8901-2345", address: "258 Rue Capois, Port-au-Prince", status: "active" as const, total_orders: 15, total_spent: 75000 },
        { id: 9, name: "Centre Commercial Star", type: "Marché", contact_person: "Isabelle François", email: "info@centre-star.ht", phone: "+509 9012-3456", address: "369 Boulevard Harry Truman, Port-au-Prince", status: "active" as const, total_orders: 35, total_spent: 175000 },
        { id: 10, name: "Café Créole", type: "Café", contact_person: "Michelle Jean", email: "creole@cafe-creole.ht", phone: "+509 0123-4567", address: "741 Avenue Christophe, Port-au-Prince", status: "active" as const, total_orders: 12, total_spent: 60000 },
      ];
      setCustomers(demoCustomers);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: CustomerFormData) => {
    try {
      const result = await customerService.createCustomer(customerData);
      toast.success('Client créé avec succès');
      // Rafraîchir la liste des clients
      await fetchCustomers();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la création du client:', err);
      toast.error('Erreur lors de la création du client');
      throw err;
    }
  };

  const updateCustomer = async (customerId: string, customerData: CustomerFormData) => {
    try {
      const result = await customerService.updateCustomer(customerId, customerData);
      toast.success('Client mis à jour avec succès');
      // Rafraîchir la liste des clients
      await fetchCustomers();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du client:', err);
      toast.error('Erreur lors de la mise à jour du client');
      throw err;
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const result = await customerService.deleteCustomer(customerId);
      toast.success('Client supprimé avec succès');
      // Rafraîchir la liste des clients
      await fetchCustomers();
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la suppression du client:', err);
      toast.error('Erreur lors de la suppression du client');
      throw err;
    }
  };

  const getCustomerById = async (customerId: string): Promise<Customer | null> => {
    try {
      const customer = await customerService.getCustomerById(customerId);
      return customer;
    } catch (err: any) {
      console.error('Erreur lors de la récupération du client:', err);
      toast.error('Erreur lors de la récupération du client');
      throw err;
    }
  };

  const getCustomerOrders = async (customerId: string) => {
    try {
      const result = await customerService.getCustomerOrders(customerId);
      return result;
    } catch (err: any) {
      console.error('Erreur lors de la récupération des commandes du client:', err);
      toast.error('Erreur lors de la récupération des commandes du client');
      throw err;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    isDemo,
    refreshCustomers: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomerOrders
  };
}
