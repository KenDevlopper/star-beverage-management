import { useState, useEffect } from 'react';
import { settingsService } from '@/services/apiService';
import { toast } from 'sonner';

// Types pour les paramètres
export interface CompanySettings {
  name: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface SystemSettings {
  currency: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
}

export interface AppearanceSettings {
  theme: string;
  sidebarCollapsed: boolean;
  denseMode: boolean;
  tableStripes: boolean;
  fontSize: string;
  animationLevel: string;
  accentColor: string;
}

export const useSettings = () => {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'StarBeverage',
    logo: '',
    email: 'contact@starbeverage.com',
    phone: '+1 555-123-4567',
    address: '123 Beverage St, New York, NY 10001',
    primaryColor: '#1a365d',
    secondaryColor: '#3182ce'
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '24h',
    timezone: 'UTC-5',
    language: 'fr'
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'system',
    sidebarCollapsed: false,
    denseMode: false,
    tableStripes: true,
    fontSize: 'medium',
    animationLevel: 'medium',
    accentColor: '#3182ce'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les paramètres de l'entreprise
  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getCompanySettings();
      if (response.success) {
        setCompanySettings(response.data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des paramètres entreprise:', error);
      setError('Erreur lors du chargement des paramètres entreprise');
      // Utiliser les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Charger les paramètres système
  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSystemSettings();
      if (response.success) {
        setSystemSettings(response.data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des paramètres système:', error);
      setError('Erreur lors du chargement des paramètres système');
      // Utiliser les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Charger les paramètres d'apparence
  const fetchAppearanceSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getAppearanceSettings();
      if (response.success) {
        setAppearanceSettings(response.data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des paramètres apparence:', error);
      setError('Erreur lors du chargement des paramètres apparence');
      // Utiliser les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les paramètres de l'entreprise
  const saveCompanySettings = async (data: CompanySettings) => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.updateCompanySettings(data);
      if (response.success) {
        setCompanySettings(data);
        toast.success('Paramètres de l\'entreprise sauvegardés avec succès');
        return true;
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres entreprise:', error);
      setError('Erreur lors de la sauvegarde des paramètres entreprise');
      toast.error('Erreur lors de la sauvegarde des paramètres entreprise');
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Sauvegarder les paramètres système
  const saveSystemSettings = async (data: SystemSettings) => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.updateSystemSettings(data);
      if (response.success) {
        setSystemSettings(data);
        toast.success('Paramètres système sauvegardés avec succès');
        return true;
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres système:', error);
      setError('Erreur lors de la sauvegarde des paramètres système');
      toast.error('Erreur lors de la sauvegarde des paramètres système');
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Sauvegarder les paramètres d'apparence
  const saveAppearanceSettings = async (data: AppearanceSettings) => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.updateAppearanceSettings(data);
      if (response.success) {
        setAppearanceSettings(data);
        toast.success('Paramètres d\'apparence sauvegardés avec succès');
        return true;
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres apparence:', error);
      setError('Erreur lors de la sauvegarde des paramètres apparence');
      toast.error('Erreur lors de la sauvegarde des paramètres apparence');
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Charger tous les paramètres au montage du composant
  useEffect(() => {
    fetchCompanySettings();
    fetchSystemSettings();
    fetchAppearanceSettings();
  }, []);

  return {
    // État
    companySettings,
    systemSettings,
    appearanceSettings,
    loading,
    error,

    // Actions
    fetchCompanySettings,
    fetchSystemSettings,
    fetchAppearanceSettings,
    saveCompanySettings,
    saveSystemSettings,
    saveAppearanceSettings,

    // Setters pour les mises à jour locales
    setCompanySettings,
    setSystemSettings,
    setAppearanceSettings
  };
};
