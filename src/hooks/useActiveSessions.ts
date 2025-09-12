import { useState, useEffect } from 'react';
import axios from 'axios';

export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export const useActiveSessions = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // D'abord, forcer l'expiration des sessions expirées
      try {
        await axios.get('http://localhost/star-beverage-flow-main-v.0/public/api/force_expire_sessions.php');
      } catch (expireError) {
        console.warn('Erreur lors de l\'expiration des sessions:', expireError);
      }
      
      // Récupérer les sessions actives depuis l'API
      const response = await axios.get('http://localhost/star-beverage-flow-main-v.0/public/api/active_sessions.php');
      
      if (response.data.success) {
        setSessions(response.data.data || []);
      } else {
        setError('Erreur lors du chargement des sessions actives');
      }
    } catch (err) {
      console.error('Erreur useActiveSessions:', err);
      // En cas d'erreur, on initialise avec un tableau vide plutôt qu'une erreur
      setSessions([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const isUserOnline = (userId: string): boolean => {
    return sessions.some(session => session.userId === userId);
  };

  const getUserSession = (userId: string): ActiveSession | null => {
    return sessions.find(session => session.userId === userId) || null;
  };

  useEffect(() => {
    loadActiveSessions();
    
    // Recharger les sessions toutes les 30 secondes
    const interval = setInterval(loadActiveSessions, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    sessions,
    loading,
    error,
    loadActiveSessions,
    isUserOnline,
    getUserSession
  };
};
