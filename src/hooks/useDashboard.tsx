import { useState, useEffect } from 'react';
import { dashboardService } from '@/services/apiService';

export interface DashboardStats {
  todayOrders: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  scheduledDeliveries: number;
  todayOrdersTrend: number;
  monthlyRevenueTrend: number;
  lowStockProductsTrend: number;
}

export interface RecentOrder {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export interface LowStockItem {
  id: string;
  name: string;
  current: number;
  minimum: number;
  unit: string;
}

export interface SalesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

export interface CategoryData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
  }[];
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Données de démonstration
  const demoStats: DashboardStats = {
    todayOrders: 45,
    monthlyRevenue: 580450,
    lowStockProducts: 5,
    scheduledDeliveries: 12,
    todayOrdersTrend: 12,
    monthlyRevenueTrend: 8,
    lowStockProductsTrend: -2
  };

  const demoRecentOrders: RecentOrder[] = [
    { id: "ORD-1234", client: "Hôtel Sérénade", date: "04/07/2025", amount: "12,450 HTG", status: "completed" },
    { id: "ORD-1235", client: "Restaurant Cascade", date: "04/07/2025", amount: "8,200 HTG", status: "processing" },
    { id: "ORD-1236", client: "Café Bleu", date: "03/07/2025", amount: "5,800 HTG", status: "pending" },
    { id: "ORD-1237", client: "Superette Express", date: "03/07/2025", amount: "15,600 HTG", status: "completed" },
    { id: "ORD-1238", client: "Marché Central", date: "02/07/2025", amount: "9,150 HTG", status: "cancelled" },
  ];

  const demoLowStockItems: LowStockItem[] = [
    { id: "1", name: "Eau minérale 500ml", current: 125, minimum: 200, unit: "Caisses" },
    { id: "2", name: "Soda Citron 330ml", current: 45, minimum: 150, unit: "Caisses" },
    { id: "3", name: "Jus d'Orange 1L", current: 18, minimum: 50, unit: "Caisses" },
    { id: "4", name: "Étiquettes personnalisées", current: 500, minimum: 2000, unit: "pièces" },
    { id: "5", name: "Bouchons spéciaux", current: 850, minimum: 1000, unit: "pièces" },
  ];

  const demoSalesData: SalesData = {
    labels: ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun"],
    datasets: [
      {
        label: "Ventes 2025",
        data: [1800, 2200, 1900, 2400, 2800, 3100],
        backgroundColor: "rgba(10, 173, 215, 0.6)",
        borderColor: "#0AADD7",
      },
      {
        label: "Ventes 2024",
        data: [1700, 1900, 1800, 2100, 2500, 2800],
        backgroundColor: "rgba(160, 200, 220, 0.4)",
        borderColor: "#a0c8dc",
      },
    ],
  };

  const demoCategoryData: CategoryData = {
    labels: ["Eau minérale", "Sodas", "Jus", "Énergisants", "Thés"],
    datasets: [
      {
        label: "Ventes par catégorie",
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          "rgba(10, 173, 215, 0.8)",
          "rgba(15, 130, 190, 0.8)",
          "rgba(25, 100, 160, 0.8)",
          "rgba(30, 70, 130, 0.8)",
          "rgba(40, 50, 100, 0.8)",
        ],
      },
    ],
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Chargement des données du tableau de bord...');

      // Récupérer les statistiques
      console.log('📊 Récupération des statistiques...');
      const statsResponse = await dashboardService.getStats();
      console.log('📊 Statistiques reçues:', statsResponse);
      setStats(statsResponse);

      // Récupérer les commandes récentes
      console.log('📋 Récupération des commandes récentes...');
      const ordersResponse = await dashboardService.getRecentOrders();
      console.log('📋 Commandes récentes reçues:', ordersResponse);
      setRecentOrders(ordersResponse);

      // Récupérer les alertes de stock
      console.log('📦 Récupération des alertes de stock...');
      const stockResponse = await dashboardService.getLowStockItems();
      console.log('📦 Alertes de stock reçues:', stockResponse);
      setLowStockItems(stockResponse);

      // Récupérer les données de ventes
      console.log('📈 Récupération des données de ventes...');
      const salesResponse = await dashboardService.getSalesData();
      console.log('📈 Données de ventes reçues:', salesResponse);
      setSalesData(salesResponse);

      // Récupérer les données par catégorie
      console.log('🏷️ Récupération des données par catégorie...');
      const categoryResponse = await dashboardService.getCategoryData();
      console.log('🏷️ Données par catégorie reçues:', categoryResponse);
      setCategoryData(categoryResponse);

      console.log('✅ Toutes les données chargées avec succès');
      setIsDemo(false);
    } catch (err) {
      console.error('❌ Erreur lors du chargement du tableau de bord:', err);
      setError('Erreur lors du chargement des données');
      
      // Utiliser les données de démonstration en cas d'erreur
      console.log('🔄 Utilisation des données de démonstration...');
      setStats(demoStats);
      setRecentOrders(demoRecentOrders);
      setLowStockItems(demoLowStockItems);
      setSalesData(demoSalesData);
      setCategoryData(demoCategoryData);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('HTG', 'HTG');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    recentOrders,
    lowStockItems,
    salesData,
    categoryData,
    loading,
    error,
    isDemo,
    formatCurrency,
    formatDate,
    refetch: fetchDashboardData
  };
};
