import { useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost/star-beverage-flow-main-v.0/public/api';

export const useUserActivity = () => {
  // Fonction pour mettre à jour l'activité de l'utilisateur
  const updateActivity = useCallback(async (action: string = 'activity', target: string = 'system', details?: string) => {
    try {
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        await axios.post(`${API_URL}/update_activity.php`, {
          user_id: userData.id,
          action,
          target,
          details
        });
      }
    } catch (error) {
      console.warn('Erreur lors de la mise à jour de l\'activité:', error);
    }
  }, []);

  // Fonction pour logger une action utilisateur
  const logUserAction = useCallback(async (action: string, target: string, details: string) => {
    await updateActivity(action, target, details);
  }, [updateActivity]);

  // Mettre à jour l'activité périodiquement
  useEffect(() => {
    // Mise à jour initiale
    updateActivity('page_view', 'admin', 'Consultation de la page d\'administration');

    // Mise à jour toutes les 2 minutes
    const interval = setInterval(() => {
      updateActivity('activity', 'system', 'Activité utilisateur détectée');
    }, 120000); // 2 minutes

    // Mise à jour lors des interactions utilisateur
    const handleUserInteraction = () => {
      updateActivity('interaction', 'ui', 'Interaction utilisateur détectée');
    };

    // Écouter les événements d'interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('scroll', handleUserInteraction);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
    };
  }, [updateActivity]);

  return {
    updateActivity,
    logUserAction
  };
};
