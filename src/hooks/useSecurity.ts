import { useState, useEffect } from 'react';
import { securityService } from '@/services/apiService';
import { SecurityPolicy, ApiKey } from '@/types/admin';
import { toast } from 'sonner';

export const useSecurity = () => {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les paramètres de sécurité
  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.getSecuritySettings();
      
      if (response.success) {
        setPolicies(response.data.policies);
        setApiKeys(response.data.apiKeys);
      } else {
        setError('Erreur lors du chargement des paramètres de sécurité');
        toast.error('Erreur lors du chargement des paramètres de sécurité');
      }
    } catch (err) {
      const errorMessage = 'Erreur lors du chargement des paramètres de sécurité';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Erreur useSecurity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les politiques de sécurité
  const updatePolicies = async (updatedPolicies: SecurityPolicy[]) => {
    try {
      const response = await securityService.updateSecurityPolicies(updatedPolicies);
      
      if (response.success) {
        setPolicies(updatedPolicies);
        toast.success('Paramètres de sécurité mis à jour avec succès');
        return true;
      } else {
        toast.error('Erreur lors de la mise à jour des paramètres');
        return false;
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour des paramètres');
      console.error('Erreur updatePolicies:', err);
      return false;
    }
  };

  // Créer une nouvelle clé API
  const createApiKey = async (name: string, permissions: string[] = []) => {
    try {
      const response = await securityService.createApiKey(name, permissions);
      
      if (response.success) {
        const newApiKey = response.data;
        setApiKeys(prev => [newApiKey, ...prev]);
        toast.success('Clé API créée avec succès');
        return newApiKey;
      } else {
        toast.error('Erreur lors de la création de la clé API');
        return null;
      }
    } catch (err) {
      toast.error('Erreur lors de la création de la clé API');
      console.error('Erreur createApiKey:', err);
      return null;
    }
  };

  // Supprimer une clé API
  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await securityService.deleteApiKey(keyId);
      
      if (response.success) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
        toast.success('Clé API supprimée avec succès');
        return true;
      } else {
        toast.error('Erreur lors de la suppression de la clé API');
        return false;
      }
    } catch (err) {
      toast.error('Erreur lors de la suppression de la clé API');
      console.error('Erreur deleteApiKey:', err);
      return false;
    }
  };

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadSecuritySettings();
  }, []);

  return {
    policies,
    apiKeys,
    loading,
    error,
    loadSecuritySettings,
    updatePolicies,
    createApiKey,
    deleteApiKey
  };
};



