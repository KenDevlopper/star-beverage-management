import { useState, useEffect } from 'react';
import { userLogsService } from '@/services/apiService';
import { toast } from 'sonner';

export interface UserLog {
  id: number;
  userId: number | null;
  userName: string;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  target: string | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface LogsData {
  logs: UserLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    totalLogs: number;
    actionStats: Array<{
      action: string;
      count: number;
    }>;
  };
}

export interface LogFilters {
  page?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  target?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export const useUserLogs = () => {
  const [logsData, setLogsData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newLogsCount, setNewLogsCount] = useState(0);

  // Charger les logs avec filtres
  const fetchLogs = async (filters: LogFilters = {}, showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const data = await userLogsService.getUserLogs(filters);
      
      // Compter les nouveaux logs si on a déjà des données
      if (logsData && data.logs) {
        const newLogs = data.logs.filter(newLog => 
          !logsData.logs.some(existingLog => existingLog.id === newLog.id)
        );
        if (newLogs.length > 0) {
          console.log(`🆕 ${newLogs.length} nouveaux logs détectés:`, newLogs.map(log => `ID ${log.id} - ${log.action}`));
        }
        setNewLogsCount(newLogs.length);
      }
      
      setLogsData(data);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des logs';
      setError(errorMessage);
      console.error('Erreur lors du chargement des logs:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Créer un nouveau log
  const createLog = async (logData: {
    user_id?: number;
    action: string;
    target?: string;
    details?: string;
    ip_address?: string;
  }) => {
    try {
      const response = await userLogsService.createLog(logData);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du log';
      console.error('Erreur lors de la création du log:', err);
      throw err;
    }
  };

  // Fonction utilitaire pour créer un log d'action utilisateur
  const logUserAction = async (
    action: string,
    target?: string,
    details?: string,
    userId?: number
  ) => {
    try {
      await createLog({
        user_id: userId,
        action,
        target,
        details,
        ip_address: undefined // Sera rempli par le serveur
      });
    } catch (err) {
      // Ne pas afficher d'erreur pour les logs, juste logger en console
      console.warn('Impossible de créer le log:', err);
    }
  };

  // Rafraîchir les logs en arrière-plan
  const refreshLogs = async (filters: LogFilters = {}) => {
    console.log('🔄 Rafraîchissement des logs en arrière-plan...');
    await fetchLogs(filters, false);
    console.log('✅ Logs rafraîchis');
  };

  // Réinitialiser le compteur de nouveaux logs
  const resetNewLogsCount = () => {
    setNewLogsCount(0);
  };

  // Charger les logs au montage du composant
  useEffect(() => {
    fetchLogs();
    
    // Rafraîchir automatiquement toutes les 10 secondes (plus fréquent)
    const interval = setInterval(() => {
      refreshLogs();
    }, 10000); // 10 secondes au lieu de 30
    
    return () => clearInterval(interval);
  }, []);

  return {
    logsData,
    loading,
    error,
    lastUpdate,
    newLogsCount,
    fetchLogs,
    refreshLogs,
    resetNewLogsCount,
    createLog,
    logUserAction
  };
};
