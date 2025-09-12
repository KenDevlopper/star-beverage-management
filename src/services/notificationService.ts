import { Notification } from '@/context/NotificationContext';

export interface NotificationRule {
  id: string;
  type: 'low_stock' | 'new_order' | 'system_alert' | 'user_activity' | 'daily_summary';
  condition: (data: any) => boolean;
  generateNotification: (data: any) => Omit<Notification, 'id' | 'timestamp' | 'read'>;
  interval?: number; // en millisecondes
  lastTriggered?: Date;
}

class NotificationService {
  private rules: NotificationRule[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // Règle pour les stocks faibles
    this.addRule({
      id: 'low_stock_check',
      type: 'low_stock',
      condition: (inventory: any[]) => {
        return inventory.some(item => item.inventory <= item.minimum_quantity);
      },
      generateNotification: (inventory: any[]) => {
        const lowStockItems = inventory.filter(item => item.inventory <= item.minimum_quantity);
        return {
          title: 'Stock faible détecté',
          message: `${lowStockItems.length} produit(s) en stock faible`,
          type: 'warning' as const
        };
      },
      interval: 30000 // Vérifier toutes les 30 secondes
    });

    // Règle pour les nouvelles commandes
    this.addRule({
      id: 'new_order_check',
      type: 'new_order',
      condition: (orders: any[]) => {
        const recentOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const now = new Date();
          return (now.getTime() - orderDate.getTime()) < 60000; // Dernière minute
        });
        return recentOrders.length > 0;
      },
      generateNotification: (orders: any[]) => {
        const recentOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const now = new Date();
          return (now.getTime() - orderDate.getTime()) < 60000;
        });
        return {
          title: 'Nouvelle commande reçue',
          message: `Commande #${recentOrders[0].id} de ${recentOrders[0].customer_name}`,
          type: 'success' as const
        };
      },
      interval: 10000 // Vérifier toutes les 10 secondes
    });

    // Règle pour les alertes système
    this.addRule({
      id: 'system_health_check',
      type: 'system_alert',
      condition: () => {
        // Simuler des alertes système occasionnelles
        return Math.random() < 0.1; // 10% de chance
      },
      generateNotification: () => {
        const alerts = [
          { title: 'Sauvegarde automatique', message: 'Sauvegarde des données terminée avec succès', type: 'info' as const },
          { title: 'Mise à jour disponible', message: 'Une nouvelle version est disponible', type: 'info' as const },
          { title: 'Maintenance programmée', message: 'Maintenance prévue demain à 2h00', type: 'warning' as const }
        ];
        return alerts[Math.floor(Math.random() * alerts.length)];
      },
      interval: 120000 // Toutes les 2 minutes
    });

    // Règle pour le résumé quotidien
    this.addRule({
      id: 'daily_summary',
      type: 'daily_summary',
      condition: () => {
        const now = new Date();
        const lastSummary = localStorage.getItem('lastDailySummary');
        if (!lastSummary) return true;
        
        const lastDate = new Date(lastSummary);
        return now.getDate() !== lastDate.getDate();
      },
      generateNotification: (dashboardData: any) => {
        return {
          title: 'Résumé quotidien',
          message: `Aujourd'hui: ${dashboardData.todayOrders || 0} commandes, ${dashboardData.monthlyRevenue || 0}€ de CA`,
          type: 'info' as const
        };
      },
      interval: 60000 // Vérifier toutes les minutes
    });
  }

  addRule(rule: NotificationRule) {
    this.rules.push(rule);
  }

  startMonitoring(addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void) {
    this.rules.forEach(rule => {
      if (rule.interval) {
        const interval = setInterval(async () => {
          try {
            const data = await this.fetchDataForRule(rule);
            if (rule.condition(data)) {
              const notification = rule.generateNotification(data);
              addNotification(notification);
              rule.lastTriggered = new Date();
              
              // Pour le résumé quotidien, marquer comme fait
              if (rule.id === 'daily_summary') {
                localStorage.setItem('lastDailySummary', new Date().toISOString());
              }
            }
          } catch (error) {
            console.error('Erreur lors de la vérification des notifications:', error);
          }
        }, rule.interval);
        
        this.intervals.set(rule.id, interval);
      }
    });
  }

  stopMonitoring() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  private async fetchDataForRule(rule: NotificationRule): Promise<any> {
    const API_BASE_URL = 'http://localhost/star-beverage-flow-main-v.0/public/api';
    
    switch (rule.type) {
      case 'low_stock':
        const inventoryResponse = await fetch(`${API_BASE_URL}/inventory.php`);
        return await inventoryResponse.json();
      
      case 'new_order':
        const ordersResponse = await fetch(`${API_BASE_URL}/orders.php`);
        return await ordersResponse.json();
      
      case 'system_alert':
        return {}; // Pas de données nécessaires
      
      case 'daily_summary':
        const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard.php?action=stats`);
        return await dashboardResponse.json();
      
      default:
        return {};
    }
  }

  // Méthode pour déclencher manuellement une notification
  triggerNotification(type: string, data: any, addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void) {
    const rule = this.rules.find(r => r.type === type);
    if (rule && rule.condition(data)) {
      const notification = rule.generateNotification(data);
      addNotification(notification);
    }
  }
}

export const notificationService = new NotificationService();
