import { useState, useEffect } from 'react';
import { reportsService } from '@/services/apiService';

export interface SalesReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface ProductsReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
  }[];
}

export interface TrendsReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    fill: boolean;
  }[];
}

export interface KeyStatistics {
  totalSales: number;
  totalOrders: number;
  topProduct: string;
  avgOrderValue: number;
  salesTrend: number;
  ordersTrend: number;
  avgTrend: number;
}

export interface CategoryReport {
  category_name: string;
  product_count: number;
  total_sold: number;
  total_revenue: number;
}

export interface ReportFilters {
  reportType: 'sales' | 'products' | 'trends';
  dateRange: 'week' | 'month' | 'year' | 'custom';
  category: string;
  startDate?: string;
  endDate?: string;
}

export const useReports = () => {
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [productsData, setProductsData] = useState<ProductsReportData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsReportData | null>(null);
  const [keyStatistics, setKeyStatistics] = useState<KeyStatistics | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesReport = async (filters: Partial<ReportFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const data = await reportsService.getSalesReport(params.toString());
      setSalesData(data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport des ventes');
      console.error('Erreur fetchSalesReport:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsReport = async (filters: Partial<ReportFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      const data = await reportsService.getProductsReport(params.toString());
      setProductsData(data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport des produits');
      console.error('Erreur fetchProductsReport:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendsReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportsService.getTrendsReport();
      setTrendsData(data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport des tendances');
      console.error('Erreur fetchTrendsReport:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeyStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportsService.getKeyStatistics();
      setKeyStatistics(data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques clés');
      console.error('Erreur fetchKeyStatistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportsService.getCategoryReport();
      setCategoryData(data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport des catégories');
      console.error('Erreur fetchCategoryReport:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReports = async (filters: Partial<ReportFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchSalesReport(filters),
        fetchProductsReport(filters),
        fetchTrendsReport(),
        fetchKeyStatistics(),
        fetchCategoryReport()
      ]);
    } catch (err) {
      setError('Erreur lors du chargement des rapports');
      console.error('Erreur fetchAllReports:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (filters: ReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les rapports selon le type sélectionné
      switch (filters.reportType) {
        case 'sales':
          await fetchSalesReport(filters);
          break;
        case 'products':
          await fetchProductsReport(filters);
          break;
        case 'trends':
          await fetchTrendsReport();
          break;
      }
      
      // Toujours charger les statistiques clés
      await fetchKeyStatistics();
      
    } catch (err) {
      setError('Erreur lors de l\'application des filtres');
      console.error('Erreur applyFilters:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Charger les données initiales
  useEffect(() => {
    fetchAllReports();
  }, []);

  return {
    // Données
    salesData,
    productsData,
    trendsData,
    keyStatistics,
    categoryData,
    
    // États
    loading,
    error,
    
    // Actions
    fetchSalesReport,
    fetchProductsReport,
    fetchTrendsReport,
    fetchKeyStatistics,
    fetchCategoryReport,
    fetchAllReports,
    applyFilters,
    
    // Utilitaires
    formatCurrency,
    formatNumber,
    formatPercentage
  };
};
