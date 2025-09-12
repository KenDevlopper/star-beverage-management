
import axios from 'axios';
import { Product } from '@/types/product';
import { User } from '@/types/user';

// Configuration de l'URL de base pour l'API
// Si vous utilisez WAMP, assurez-vous que l'URL correspond à la configuration de votre serveur
// Par exemple, si WAMP est configuré sur un port spécifique comme 8080, utilisez http://localhost:8080/api
const API_URL = 'http://localhost/star-beverage-flow-main-v.0/public/api'; 

// Configuration globale d'axios pour gestion des erreurs de réseau
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erreur de connexion API:', error.message || 'Erreur inconnue');
    return Promise.reject(error);
  }
);

// Service pour l'authentification
export const authService = {
  // Connexion utilisateur
  login: async (username: string, password: string): Promise<any> => {
    try {
      console.log('Tentative de connexion pour:', username);
      const response = await axios.post(`${API_URL}/users.php`, {
        action: 'login',
        username,
        password
      });
      console.log('Réponse de connexion:', response.data);
      
      // Stocker les informations utilisateur dans le localStorage
      if (response.data.success && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  },
  
  // Déconnexion utilisateur
  logout: async (): Promise<void> => {
    try {
      // Récupérer l'ID utilisateur avant de nettoyer le localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Enregistrer la déconnexion dans les logs
      if (user.id) {
        try {
          await axios.post(`${API_URL}/logout.php`, {
            user_id: user.id
          });
        } catch (logoutError) {
          console.error('Erreur lors de l\'enregistrement de la déconnexion:', logoutError);
          // Continuer même si l'enregistrement de la déconnexion échoue
        }
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer toutes les données utilisateur
      localStorage.removeItem('user');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
    }
  },
  
  // Vérifier si l'utilisateur est connecté
  isAuthenticated: (): boolean => {
    const user = localStorage.getItem('user');
    return user !== null;
  },
  
  // Obtenir l'utilisateur connecté
  getCurrentUser: (): User | null => {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    return JSON.parse(userString);
  }
};

// Service pour les utilisateurs
export const userService = {
  // Récupérer tous les utilisateurs
  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log('Récupération des utilisateurs');
      const response = await axios.get(`${API_URL}/users.php`);
      console.log('Réponse utilisateurs:', response.data);
      return response.data.users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },
  
  // Récupérer un utilisateur spécifique
  getUserById: async (id: string): Promise<User> => {
    try {
      console.log('Récupération de l\'utilisateur:', id);
      const response = await axios.get(`${API_URL}/users.php?id=${id}`);
      console.log('Réponse utilisateur:', response.data);
      return response.data.user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  },
  
  // Créer un nouvel utilisateur
  createUser: async (userData: any): Promise<any> => {
    try {
      console.log('Création d\'un utilisateur:', userData);
      const response = await axios.post(`${API_URL}/users.php`, userData);
      console.log('Réponse création d\'utilisateur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },
  
  // Mettre à jour un utilisateur
  updateUser: async (id: string, userData: any): Promise<any> => {
    try {
      console.log('Mise à jour de l\'utilisateur:', id, userData);
      const response = await axios.put(`${API_URL}/users.php?id=${id}`, userData);
      console.log('Réponse mise à jour d\'utilisateur:', response.data);
      
      // Si l'utilisateur met à jour son propre profil, mettre à jour le localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id.toString() === id) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  },
  
  // Supprimer un utilisateur
  deleteUser: async (id: string): Promise<any> => {
    try {
      console.log('Suppression de l\'utilisateur:', id);
      const response = await axios.delete(`${API_URL}/users.php?id=${id}`);
      console.log('Réponse suppression d\'utilisateur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }
};


// Service pour les produits
export const productService = {
  // Récupérer tous les produits
  getAllProducts: async (): Promise<Product[]> => {
    try {
      console.log('Tentative de connexion à:', `${API_URL}/products.php`);
      const response = await axios.get(`${API_URL}/products.php`);
      console.log('Réponse du serveur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  },
  
  // Ajouter un nouveau produit
  addProduct: async (productData: any): Promise<any> => {
    try {
      console.log('Envoi des données de produit:', productData);
      const response = await axios.post(`${API_URL}/products.php`, productData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Réponse de création de produit:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      throw error;
    }
  },
  
  // Mettre à jour un produit existant
  updateProduct: async (productId: string, productData: any): Promise<any> => {
    try {
      console.log('Mise à jour du produit:', productId, productData);
      const response = await axios.put(`${API_URL}/products.php?id=${productId}`, productData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Réponse de mise à jour de produit:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  },
  
  // Supprimer un produit
  deleteProduct: async (productId: string): Promise<any> => {
    try {
      console.log('Suppression du produit:', productId);
      const response = await axios.delete(`${API_URL}/products.php?id=${productId}`);
      console.log('Réponse de suppression de produit:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }
};

// Service pour les commandes
export const orderService = {
  // Récupérer toutes les commandes
  getAllOrders: async (): Promise<any[]> => {
    try {
      console.log('Récupération des commandes');
      const response = await axios.get(`${API_URL}/orders.php`);
      console.log('Réponse commandes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }
  },
  
  // Récupérer une commande spécifique
  getOrderById: async (orderId: string): Promise<any> => {
    try {
      console.log('Récupération de la commande:', orderId);
      const response = await axios.get(`${API_URL}/orders.php?id=${orderId}`);
      console.log('Réponse commande:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      throw error;
    }
  },
  
  // Créer une nouvelle commande
  createOrder: async (orderData: any): Promise<any> => {
    try {
      console.log('Envoi des données de commande:', orderData);
      const response = await axios.post(`${API_URL}/orders.php`, orderData);
      console.log('Réponse de création de commande:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  },
  
  // Mettre à jour une commande
  updateOrder: async (orderId: string, orderData: any): Promise<any> => {
    try {
      console.log('Mise à jour de la commande:', orderId, orderData);
      const response = await axios.put(`${API_URL}/orders.php?id=${orderId}`, orderData);
      console.log('Réponse de mise à jour de commande:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }
  },
  
  // Supprimer une commande
  deleteOrder: async (orderId: string): Promise<any> => {
    try {
      console.log('Suppression de la commande:', orderId);
      const response = await axios.delete(`${API_URL}/orders.php?id=${orderId}`);
      console.log('Réponse de suppression de commande:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw error;
    }
  },
  
  // Récupérer l'historique d'une commande
  getOrderHistory: async (orderId: string): Promise<any[]> => {
    try {
      console.log('Récupération de l\'historique pour:', orderId);
      const response = await axios.get(`${API_URL}/order_history.php?order_id=${orderId}`);
      console.log('Réponse historique:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
};

// Service pour les clients
export const customerService = {
  // Récupérer tous les clients
  getAllCustomers: async (): Promise<any[]> => {
    try {
      console.log('Récupération des clients');
      const response = await axios.get(`${API_URL}/customers.php`);
      console.log('Réponse clients:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },
  
  // Récupérer un client spécifique
  getCustomerById: async (customerId: string): Promise<any> => {
    try {
      console.log('Récupération du client:', customerId);
      const response = await axios.get(`${API_URL}/customers.php?id=${customerId}`);
      console.log('Réponse client:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
      throw error;
    }
  },
  
  // Créer un nouveau client
  createCustomer: async (customerData: any): Promise<any> => {
    try {
      console.log('Création du client:', customerData);
      const response = await axios.post(`${API_URL}/customers.php`, customerData);
      console.log('Réponse de création de client:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },
  
  // Mettre à jour un client
  updateCustomer: async (customerId: string, customerData: any): Promise<any> => {
    try {
      console.log('Mise à jour du client:', customerId, customerData);
      const response = await axios.put(`${API_URL}/customers.php?id=${customerId}`, customerData);
      console.log('Réponse de mise à jour de client:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  },
  
  // Supprimer un client
  deleteCustomer: async (customerId: string): Promise<any> => {
    try {
      console.log('Suppression du client:', customerId);
      const response = await axios.delete(`${API_URL}/customers.php?id=${customerId}`);
      console.log('Réponse de suppression de client:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      throw error;
    }
  },
  
  // Récupérer les commandes d'un client
  getCustomerOrders: async (customerId: string): Promise<any> => {
    try {
      console.log('Récupération des commandes du client:', customerId);
      const response = await axios.get(`${API_URL}/customer_orders.php?customer_id=${customerId}`);
      console.log('Réponse commandes client:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes du client:', error);
      throw error;
    }
  }
};

// Service pour le tableau de bord
export const dashboardService = {
  // Récupérer les statistiques du tableau de bord
  getStats: async (): Promise<any> => {
    try {
      console.log('Récupération des statistiques du tableau de bord');
      const response = await axios.get(`${API_URL}/dashboard.php?action=stats`);
      console.log('Réponse statistiques:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },
  
  // Récupérer les commandes récentes
  getRecentOrders: async (): Promise<any[]> => {
    try {
      console.log('Récupération des commandes récentes');
      const response = await axios.get(`${API_URL}/dashboard.php?action=recent-orders`);
      console.log('Réponse commandes récentes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes récentes:', error);
      throw error;
    }
  },
  
  // Récupérer les produits en rupture de stock
  getLowStockItems: async (): Promise<any[]> => {
    try {
      console.log('Récupération des produits en rupture de stock');
      const response = await axios.get(`${API_URL}/dashboard.php?action=low-stock`);
      console.log('Réponse produits en rupture:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits en rupture:', error);
      throw error;
    }
  },
  
  // Récupérer les données de ventes
  getSalesData: async (): Promise<any> => {
    try {
      console.log('Récupération des données de ventes');
      const response = await axios.get(`${API_URL}/dashboard.php?action=sales-data`);
      console.log('Réponse données de ventes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de ventes:', error);
      throw error;
    }
  },
  
  // Récupérer les données par catégorie
  getCategoryData: async (): Promise<any> => {
    try {
      console.log('Récupération des données par catégorie');
      const response = await axios.get(`${API_URL}/dashboard.php?action=category-data`);
      console.log('Réponse données par catégorie:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données par catégorie:', error);
      throw error;
    }
  }
};

// Service pour l'inventaire
export const inventoryService = {
  // Récupérer l'inventaire complet
  getInventory: async (): Promise<any[]> => {
    try {
      console.log('Récupération de l\'inventaire');
      const response = await axios.get(`${API_URL}/inventory.php`);
      console.log('Réponse inventaire:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'inventaire:', error);
      throw error;
    }
  },
  
  // Ajuster le stock d'un produit
  adjustStock: async (productId: string, newQuantity: number, reason: string): Promise<any> => {
    try {
      console.log('Ajustement du stock:', productId, newQuantity, reason);
      const response = await axios.post(`${API_URL}/inventory.php`, {
        product_id: productId,
        new_quantity: newQuantity,
        reason: reason
      });
      console.log('Réponse ajustement stock:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajustement du stock:', error);
      throw error;
    }
  },
  
  // Mettre à jour les paramètres d'inventaire
  updateInventorySettings: async (productId: string, minimumQuantity: number, reorderPoint?: number): Promise<any> => {
    try {
      console.log('Mise à jour des paramètres d\'inventaire:', productId, minimumQuantity);
      const response = await axios.put(`${API_URL}/inventory.php`, {
        product_id: productId,
        minimum_quantity: minimumQuantity,
        reorder_point: reorderPoint || minimumQuantity
      });
      console.log('Réponse mise à jour paramètres:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  },
  
  // Récupérer l'historique d'un produit
  getProductHistory: async (productId: string): Promise<any[]> => {
    try {
      console.log('Récupération de l\'historique pour:', productId);
      const response = await axios.get(`${API_URL}/inventory_history.php?product_id=${productId}`);
      console.log('Réponse historique:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
};

// Service pour les rapports
export const reportsService = {
  // Récupérer le rapport des ventes
  getSalesReport: async (params: string = ''): Promise<any> => {
    try {
      console.log('Récupération du rapport des ventes');
      const response = await axios.get(`${API_URL}/reports.php?action=sales&${params}`);
      console.log('Réponse rapport ventes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport des ventes:', error);
      throw error;
    }
  },

  // Récupérer le rapport des produits
  getProductsReport: async (params: string = ''): Promise<any> => {
    try {
      console.log('Récupération du rapport des produits');
      const response = await axios.get(`${API_URL}/reports.php?action=products&${params}`);
      console.log('Réponse rapport produits:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport des produits:', error);
      throw error;
    }
  },

  // Récupérer le rapport des tendances
  getTrendsReport: async (): Promise<any> => {
    try {
      console.log('Récupération du rapport des tendances');
      const response = await axios.get(`${API_URL}/reports.php?action=trends`);
      console.log('Réponse rapport tendances:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport des tendances:', error);
      throw error;
    }
  },

  // Récupérer les statistiques clés
  getKeyStatistics: async (): Promise<any> => {
    try {
      console.log('Récupération des statistiques clés');
      const response = await axios.get(`${API_URL}/reports.php?action=statistics`);
      console.log('Réponse statistiques clés:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques clés:', error);
      throw error;
    }
  },

  // Récupérer le rapport des catégories
  getCategoryReport: async (): Promise<any> => {
    try {
      console.log('Récupération du rapport des catégories');
      const response = await axios.get(`${API_URL}/reports.php?action=categories`);
      console.log('Réponse rapport catégories:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport des catégories:', error);
      throw error;
    }
  }
};

// Service pour les paramètres
export const settingsService = {
  // Récupérer les paramètres de l'entreprise
  getCompanySettings: async (): Promise<any> => {
    try {
      console.log('Récupération des paramètres de l\'entreprise');
      const response = await axios.get(`${API_URL}/settings.php?action=company`);
      console.log('Réponse paramètres entreprise:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres entreprise:', error);
      throw error;
    }
  },

  // Récupérer les paramètres système
  getSystemSettings: async (): Promise<any> => {
    try {
      console.log('Récupération des paramètres système');
      const response = await axios.get(`${API_URL}/settings.php?action=system`);
      console.log('Réponse paramètres système:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres système:', error);
      throw error;
    }
  },

  // Récupérer les paramètres d'apparence
  getAppearanceSettings: async (): Promise<any> => {
    try {
      console.log('Récupération des paramètres d\'apparence');
      const response = await axios.get(`${API_URL}/settings.php?action=appearance`);
      console.log('Réponse paramètres apparence:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres apparence:', error);
      throw error;
    }
  },

  // Mettre à jour les paramètres de l'entreprise
  updateCompanySettings: async (data: any): Promise<any> => {
    try {
      console.log('Mise à jour des paramètres de l\'entreprise');
      const response = await axios.post(`${API_URL}/settings.php?action=company`, data);
      console.log('Réponse mise à jour entreprise:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres entreprise:', error);
      throw error;
    }
  },

  // Mettre à jour les paramètres système
  updateSystemSettings: async (data: any): Promise<any> => {
    try {
      console.log('Mise à jour des paramètres système');
      const response = await axios.post(`${API_URL}/settings.php?action=system`, data);
      console.log('Réponse mise à jour système:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres système:', error);
      throw error;
    }
  },

  // Mettre à jour les paramètres d'apparence
  updateAppearanceSettings: async (data: any): Promise<any> => {
    try {
      console.log('Mise à jour des paramètres d\'apparence');
      const response = await axios.post(`${API_URL}/settings.php?action=appearance`, data);
      console.log('Réponse mise à jour apparence:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres apparence:', error);
      throw error;
    }
  }
};

// Service pour les utilisateurs
export const usersService = {
  // Récupérer tous les utilisateurs
  getUsers: async (): Promise<any> => {
    try {
      console.log('Récupération des utilisateurs');
      const response = await axios.get(`${API_URL}/users.php`);
      console.log('Réponse utilisateurs:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },

  // Créer un nouvel utilisateur
  createUser: async (userData: any): Promise<any> => {
    try {
      console.log('Création d\'un utilisateur');
      const response = await axios.post(`${API_URL}/users.php`, userData);
      console.log('Réponse création utilisateur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },

  // Mettre à jour un utilisateur
  updateUser: async (userData: any): Promise<any> => {
    try {
      console.log('Mise à jour d\'un utilisateur');
      const response = await axios.put(`${API_URL}/users.php`, userData);
      console.log('Réponse mise à jour utilisateur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (userId: string): Promise<any> => {
    try {
      console.log('Suppression d\'un utilisateur');
      const response = await axios.delete(`${API_URL}/users.php?id=${userId}`);
      console.log('Réponse suppression utilisateur:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }
};

// Service pour les rôles
export const rolesService = {
  // Récupérer tous les rôles
  getRoles: async (): Promise<any> => {
    try {
      console.log('Récupération des rôles');
      const response = await axios.get(`${API_URL}/roles.php`);
      console.log('Réponse rôles:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      throw error;
    }
  },

  // Récupérer les permissions disponibles
  getPermissions: async (): Promise<any> => {
    try {
      console.log('Récupération des permissions');
      const response = await axios.get(`${API_URL}/roles.php?action=permissions`);
      console.log('Réponse permissions:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      throw error;
    }
  },

  // Créer un nouveau rôle
  createRole: async (roleData: any): Promise<any> => {
    try {
      console.log('Création du rôle:', roleData);
      const response = await axios.post(`${API_URL}/roles.php`, roleData);
      console.log('Réponse création rôle:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  },

  // Mettre à jour un rôle
  updateRole: async (roleId: string, roleData: any): Promise<any> => {
    try {
      console.log('Mise à jour du rôle:', roleId, roleData);
      const response = await axios.put(`${API_URL}/roles.php?id=${roleId}`, roleData);
      console.log('Réponse mise à jour rôle:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  },

  // Supprimer un rôle
  deleteRole: async (roleId: string): Promise<any> => {
    try {
      console.log('Suppression du rôle:', roleId);
      const response = await axios.delete(`${API_URL}/roles.php?id=${roleId}`);
      console.log('Réponse suppression rôle:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      throw error;
    }
  }
};

// Service pour les logs utilisateur
export const userLogsService = {
  // Récupérer les logs utilisateur
  getUserLogs: async (params: any = {}): Promise<any> => {
    try {
      console.log('Récupération des logs utilisateur');
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.user_id) queryParams.append('user_id', params.user_id);
      if (params.action) queryParams.append('action', params.action);
      if (params.target) queryParams.append('target', params.target);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.search) queryParams.append('search', params.search);

      const response = await axios.get(`${API_URL}/user_logs.php?${queryParams.toString()}`);
      console.log('Réponse logs utilisateur:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      throw error;
    }
  },

  // Créer un nouveau log
  createLog: async (logData: any): Promise<any> => {
    try {
      console.log('Création du log:', logData);
      const response = await axios.post(`${API_URL}/user_logs.php`, logData);
      console.log('Réponse création log:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du log:', error);
      throw error;
    }
  }
};

// Service pour la gestion des profils utilisateur
export const profileService = {
  // Récupérer le profil d'un utilisateur
  getProfile: async (userId: string | number): Promise<any> => {
    try {
      console.log('Récupération du profil pour l\'utilisateur:', userId);
      const response = await axios.get(`${API_URL}/profile.php?user_id=${userId}`);
      console.log('Réponse profil:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  // Mettre à jour le profil d'un utilisateur
  updateProfile: async (userId: string | number, profileData: any): Promise<any> => {
    try {
      console.log('Mise à jour du profil pour l\'utilisateur:', userId, profileData);
      const response = await axios.put(`${API_URL}/profile.php`, {
        user_id: userId,
        ...profileData
      });
      console.log('Réponse mise à jour profil:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  },

  // Changer le mot de passe
  changePassword: async (userId: string | number, currentPassword: string, newPassword: string): Promise<any> => {
    try {
      console.log('Changement de mot de passe pour l\'utilisateur:', userId);
      const response = await axios.post(`${API_URL}/profile.php`, {
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword
      });
      console.log('Réponse changement mot de passe:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }
};

// Service pour la gestion de la sécurité
export const securityService = {
  // Récupérer les paramètres de sécurité
  getSecuritySettings: async (): Promise<any> => {
    try {
      console.log('Récupération des paramètres de sécurité');
      const response = await axios.get(`${API_URL}/security.php`);
      console.log('Réponse sécurité:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de sécurité:', error);
      throw error;
    }
  },

  // Mettre à jour les politiques de sécurité
  updateSecurityPolicies: async (policies: any[]): Promise<any> => {
    try {
      console.log('Mise à jour des politiques de sécurité:', policies);
      const response = await axios.put(`${API_URL}/security.php`, { policies });
      console.log('Réponse mise à jour sécurité:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des politiques de sécurité:', error);
      throw error;
    }
  },

  // Créer une nouvelle clé API
  createApiKey: async (name: string, permissions: string[] = []): Promise<any> => {
    try {
      console.log('Création d\'une nouvelle clé API:', { name, permissions });
      const response = await axios.post(`${API_URL}/security.php`, {
        action: 'create',
        name,
        permissions
      });
      console.log('Réponse création clé API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la clé API:', error);
      throw error;
    }
  },

  // Supprimer une clé API
  deleteApiKey: async (keyId: string): Promise<any> => {
    try {
      console.log('Suppression de la clé API:', keyId);
      const response = await axios.post(`${API_URL}/security.php`, {
        action: 'delete',
        id: keyId
      });
      console.log('Réponse suppression clé API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la clé API:', error);
      throw error;
    }
  }
};
