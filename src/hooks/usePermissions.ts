import { useAuth } from '@/context/AuthContext';
import { 
  hasPermission, 
  canAccessPage, 
  getAccessiblePages, 
  getRoleInfo,
  type Role,
  type Permission 
} from '@/utils/permissions';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const userRole = user?.role?.toLowerCase() as Role;
  
  // Debug: Afficher les informations de debug
  console.log('usePermissions Debug:', {
    user,
    userRole,
    roleInfo: getRoleInfo(userRole)
  });
  
  // Vérifier si l'utilisateur a une permission spécifique
  const checkPermission = (permission: string): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };
  
  // Vérifier l'accès à une page
  const checkPageAccess = (page: string): boolean => {
    if (!userRole) {
      console.log('checkPageAccess: No userRole for page:', page);
      return false;
    }
    const result = canAccessPage(userRole, page);
    console.log('checkPageAccess:', { page, userRole, result });
    return result;
  };
  
  // Obtenir les pages accessibles
  const getAccessiblePagesForUser = (): string[] => {
    if (!userRole) return ['dashboard'];
    return getAccessiblePages(userRole);
  };
  
  // Obtenir les informations du rôle
  const getRoleInformation = () => {
    if (!userRole) return null;
    return getRoleInfo(userRole);
  };
  
  // Vérifications spécifiques pour les actions
  const canManageInventory = (): boolean => {
    return checkPermission('inventory:manage');
  };
  
  const canManageProducts = (): boolean => {
    return checkPermission('products:manage');
  };
  
  const canManageOrders = (): boolean => {
    return checkPermission('orders:manage');
  };
  
  const canManageCustomers = (): boolean => {
    return checkPermission('customers:manage');
  };
  
  const canViewReports = (): boolean => {
    return checkPermission('reports:view');
  };
  
  const canExportReports = (): boolean => {
    return checkPermission('reports:export');
  };
  
  const canManageSettings = (): boolean => {
    return checkPermission('settings:manage');
  };
  
  const canManageUsers = (): boolean => {
    return checkPermission('admin:users');
  };
  
  const canManageRoles = (): boolean => {
    return checkPermission('admin:roles');
  };
  
  const canViewLogs = (): boolean => {
    return checkPermission('admin:logs');
  };
  
  // Vérifications pour les pages principales
  const canAccessDashboard = (): boolean => {
    return checkPageAccess('dashboard');
  };
  
  const canAccessInventory = (): boolean => {
    return checkPageAccess('inventory');
  };
  
  const canAccessProducts = (): boolean => {
    return checkPageAccess('products');
  };
  
  const canAccessOrders = (): boolean => {
    return checkPageAccess('orders');
  };
  
  const canAccessCustomers = (): boolean => {
    return checkPageAccess('customers');
  };
  
  const canAccessReports = (): boolean => {
    return checkPageAccess('reports');
  };
  
  const canAccessSettings = (): boolean => {
    return checkPageAccess('settings');
  };
  
  const canAccessAdmin = (): boolean => {
    return checkPageAccess('admin');
  };
  
  return {
    // Informations de base
    userRole,
    roleInfo: getRoleInformation(),
    accessiblePages: getAccessiblePagesForUser(),
    
    // Vérifications générales
    checkPermission,
    checkPageAccess,
    
    // Vérifications spécifiques pour les actions
    canManageInventory,
    canManageProducts,
    canManageOrders,
    canManageCustomers,
    canViewReports,
    canExportReports,
    canManageSettings,
    canManageUsers,
    canManageRoles,
    canViewLogs,
    
    // Vérifications pour les pages
    canAccessDashboard,
    canAccessInventory,
    canAccessProducts,
    canAccessOrders,
    canAccessCustomers,
    canAccessReports,
    canAccessSettings,
    canAccessAdmin,
  };
};
