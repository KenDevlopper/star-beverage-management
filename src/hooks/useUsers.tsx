import { useState, useEffect } from 'react';
import { usersService } from '@/services/apiService';
import { toast } from 'sonner';

// Types pour les utilisateurs
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  avatar?: string;
  lastLogin?: string;
  created: string;
  roleDescription?: string;
}

export interface NewUser {
  name: string;
  email: string;
  username: string;
  role: string;
  password: string;
  confirmPassword: string;
  status?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersService.getUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs');
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouvel utilisateur
  const createUser = async (userData: NewUser) => {
    try {
      setLoading(true);
      setError(null);

      // Validation des mots de passe
      const password = userData.password?.trim();
      const confirmPassword = userData.confirmPassword?.trim();
      
      console.log('Password (trimmed):', `"${password}"`);
      console.log('Confirm Password (trimmed):', `"${confirmPassword}"`);
      console.log('Are equal:', password === confirmPassword);
      
      if (!password || !confirmPassword) {
        throw new Error('Les mots de passe sont requis');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      // Préparer les données pour l'API
      const apiData = {
        name: userData.name?.trim(),
        email: userData.email?.trim(),
        username: userData.username?.trim(),
        role: userData.role,
        password: password,
        status: userData.status || 'active'
      };

      const response = await usersService.createUser(apiData);
      if (response.success) {
        toast.success('Utilisateur créé avec succès');
        // Recharger la liste des utilisateurs
        await fetchUsers();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la création de l\'utilisateur');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la création de l\'utilisateur');
      toast.error(error.message || 'Erreur lors de la création de l\'utilisateur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un utilisateur
  const updateUser = async (userData: Partial<User> & { id: string }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersService.updateUser(userData);
      if (response.success) {
        toast.success('Utilisateur mis à jour avec succès');
        // Mettre à jour l'utilisateur dans la liste locale
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userData.id ? { ...user, ...userData } : user
          )
        );
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour de l\'utilisateur');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la mise à jour de l\'utilisateur');
      toast.error(error.message || 'Erreur lors de la mise à jour de l\'utilisateur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersService.deleteUser(userId);
      if (response.success) {
        toast.success('Utilisateur supprimé avec succès');
        // Supprimer l'utilisateur de la liste locale
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la suppression de l\'utilisateur');
      toast.error(error.message || 'Erreur lors de la suppression de l\'utilisateur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obtenir un utilisateur par ID
  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  // Filtrer les utilisateurs par statut
  const getUsersByStatus = (status: string) => {
    return users.filter(user => user.status === status);
  };

  // Filtrer les utilisateurs par rôle
  const getUsersByRole = (role: string) => {
    return users.filter(user => user.role.toLowerCase() === role.toLowerCase());
  };

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    // État
    users,
    loading,
    error,

    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,

    // Utilitaires
    getUserById,
    getUsersByStatus,
    getUsersByRole,

    // Setters
    setUsers
  };
};
