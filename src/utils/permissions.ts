// Système de permissions basé sur les rôles (RBAC)
export type Role = 'admin' | 'manager' | 'staff' | 'agents_vente' | 'agents_stock';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermissions {
  role: Role;
  permissions: string[];
  displayName: string;
  description: string;
}

// Définition des permissions disponibles
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Inventaire
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  
  // Produits
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_MANAGE: 'products:manage',
  
  // Commandes
  ORDERS_VIEW: 'orders:view',
  ORDERS_MANAGE: 'orders:manage',
  
  // Clients
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_MANAGE: 'customers:manage',
  
  // Rapports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Paramètres
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',
  
  // Administration
  ADMIN_VIEW: 'admin:view',
  ADMIN_MANAGE: 'admin:manage',
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_LOGS: 'admin:logs',
} as const;

// Définition des permissions par rôle
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet au système',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_MANAGE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_MANAGE,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.ADMIN_VIEW,
      PERMISSIONS.ADMIN_MANAGE,
      PERMISSIONS.ADMIN_USERS,
      PERMISSIONS.ADMIN_ROLES,
      PERMISSIONS.ADMIN_LOGS,
    ]
  },
  {
    role: 'manager',
    displayName: 'Gestionnaire',
    description: 'Accès de gestion sans administration',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_MANAGE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_MANAGE,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ]
  },
  {
    role: 'staff',
    displayName: 'Employé',
    description: 'Accès de base sans rapports et administration',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
    ]
  },
  {
    role: 'agents_vente',
    displayName: 'Agent de Vente',
    description: 'Accès aux clients et commandes uniquement',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_MANAGE,
    ]
  },
  {
    role: 'agents_stock',
    displayName: 'Agent de Stock',
    description: 'Accès aux produits et stock uniquement',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_MANAGE,
    ]
  }
];

// Fonction pour obtenir les permissions d'un rôle
export const getRolePermissions = (role: Role): string[] => {
  const roleConfig = ROLE_PERMISSIONS.find(r => r.role === role);
  return roleConfig ? roleConfig.permissions : [];
};

// Fonction pour vérifier si un rôle a une permission
export const hasPermission = (role: Role, permission: string): boolean => {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
};

// Fonction pour obtenir les informations d'un rôle
export const getRoleInfo = (role: Role): RolePermissions | undefined => {
  return ROLE_PERMISSIONS.find(r => r.role === role);
};

// Fonction pour vérifier l'accès à une page
export const canAccessPage = (role: Role, page: string): boolean => {
  const pagePermissions: Record<string, string> = {
    'dashboard': PERMISSIONS.DASHBOARD_VIEW,
    'inventory': PERMISSIONS.INVENTORY_VIEW,
    'products': PERMISSIONS.PRODUCTS_VIEW,
    'orders': PERMISSIONS.ORDERS_VIEW,
    'customers': PERMISSIONS.CUSTOMERS_VIEW,
    'reports': PERMISSIONS.REPORTS_VIEW,
    'settings': PERMISSIONS.SETTINGS_VIEW,
    'admin': PERMISSIONS.ADMIN_VIEW,
  };
  
  const requiredPermission = pagePermissions[page];
  const hasAccess = requiredPermission ? hasPermission(role, requiredPermission) : false;
  
  // Debug
  console.log('canAccessPage Debug:', {
    role,
    page,
    requiredPermission,
    hasAccess,
    rolePermissions: getRolePermissions(role)
  });
  
  return hasAccess;
};

// Fonction pour obtenir les pages accessibles pour un rôle
export const getAccessiblePages = (role: Role): string[] => {
  const pages = ['dashboard', 'inventory', 'products', 'orders', 'customers', 'reports', 'settings', 'admin'];
  return pages.filter(page => canAccessPage(role, page));
};
