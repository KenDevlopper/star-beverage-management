
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/apiService';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserData: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Vérifier s'il y a un utilisateur dans le localStorage au chargement
    const checkAuth = () => {
      setIsLoading(true);
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        setUser(response.user);
        toast.success(t('auth.loginSuccess'));
        return true;
      } else {
        toast.error(response.message || t('auth.loginFailed'));
        return false;
      }
    } catch (error) {
      let errorMessage = t('auth.loginFailed');
      if (error.response && error.response.status === 401) {
        errorMessage = t('auth.invalidCredentials');
      } else if (error.request) {
        errorMessage = t('auth.networkError');
      }
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.info(t('auth.logoutSuccess'));
    navigate('/login');
  };

  const updateUserData = (userData: Partial<User>) => {
    if (user) {
      // Mettre à jour l'état local de l'utilisateur
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Mettre à jour dans le localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
