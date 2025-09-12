import { useState, useEffect } from 'react';
import { rolesService } from '@/services/apiService';
import { toast } from 'sonner';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, any>;
  isSystem: boolean;
  userCount: number;
  created: string;
  updated: string;
}

export interface Permission {
  [key: string]: {
    [key: string]: string;
  };
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les rôles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rolesService.getRoles();
      setRoles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des rôles';
      setError(errorMessage);
      console.error('Erreur lors du chargement des rôles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les permissions
  const fetchPermissions = async () => {
    try {
      const data = await rolesService.getPermissions();
      setPermissions(data);
    } catch (err) {
      console.error('Erreur lors du chargement des permissions:', err);
    }
  };

  // Créer un nouveau rôle
  const createRole = async (roleData: {
    name: string;
    description: string;
    permissions: Record<string, any>;
  }) => {
    try {
      setLoading(true);
      const response = await rolesService.createRole(roleData);
      await fetchRoles(); // Recharger la liste
      toast.success('Rôle créé avec succès');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du rôle';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un rôle
  const updateRole = async (roleId: string, roleData: {
    name: string;
    description: string;
    permissions: Record<string, any>;
  }) => {
    try {
      setLoading(true);
      const response = await rolesService.updateRole(roleId, roleData);
      await fetchRoles(); // Recharger la liste
      toast.success('Rôle mis à jour avec succès');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du rôle';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un rôle
  const deleteRole = async (roleId: string) => {
    try {
      setLoading(true);
      const response = await rolesService.deleteRole(roleId);
      await fetchRoles(); // Recharger la liste
      toast.success('Rôle supprimé avec succès');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du rôle';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchRoles(),
        fetchPermissions()
      ]);
    };
    
    loadData();
  }, []);

  return {
    roles,
    permissions,
    loading,
    error,
    fetchRoles,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole
  };
};
