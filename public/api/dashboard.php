<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $action = $_GET['action'] ?? 'stats';
    
    switch ($action) {
        case 'stats':
            getDashboardStats($pdo);
            break;
        case 'recent-orders':
            getRecentOrders($pdo);
            break;
        case 'low-stock':
            getLowStockItems($pdo);
            break;
        case 'sales-data':
            getSalesData($pdo);
            break;
        case 'category-data':
            getCategoryData($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non reconnue']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getDashboardStats($pdo) {
    try {
        // Vérifier l'existence des tables essentielles
        $stmt = $pdo->query("SHOW TABLES LIKE 'orders'");
        if ($stmt->rowCount() === 0) {
            throw new Exception("Table orders n'existe pas");
        }
        
        $stmt = $pdo->query("SHOW TABLES LIKE 'products'");
        if ($stmt->rowCount() === 0) {
            throw new Exception("Table products n'existe pas");
        }
        
        $today = date('Y-m-d');
        $thisMonth = date('Y-m');
        $lastMonth = date('Y-m', strtotime('-1 month'));
        
        // Commandes d'aujourd'hui
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE DATE(created_at) = ?
        ");
        $stmt->execute([$today]);
        $todayOrders = $stmt->fetch()['count'];
        
        // Commandes d'aujourd'hui du mois précédent
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE DATE(created_at) = DATE_SUB(?, INTERVAL 1 MONTH)
        ");
        $stmt->execute([$today]);
        $lastMonthTodayOrders = $stmt->fetch()['count'];
        
        // Chiffre d'affaires mensuel
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM orders 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ? 
            AND status != 'cancelled'
        ");
        $stmt->execute([$thisMonth]);
        $monthlyRevenue = $stmt->fetch()['revenue'];
        
        // Chiffre d'affaires du mois précédent
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM orders 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ? 
            AND status != 'cancelled'
        ");
        $stmt->execute([$lastMonth]);
        $lastMonthRevenue = $stmt->fetch()['revenue'];
        
        // Produits en alerte de stock (avec seuil fixe de 10)
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products WHERE inventory <= 10");
        $stmt->execute();
        $lowStockProducts = $stmt->fetch()['count'];
        
        // Produits en alerte du mois précédent (même requête car c'est un instantané)
        $lastMonthLowStock = $lowStockProducts;
        
        // Livraisons prévues (commandes en attente ou en préparation)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE status IN ('pending', 'processing')
        ");
        $stmt->execute();
        $scheduledDeliveries = $stmt->fetch()['count'];
        
        // Calculer les tendances
        $todayOrdersTrend = $lastMonthTodayOrders > 0 
            ? round((($todayOrders - $lastMonthTodayOrders) / $lastMonthTodayOrders) * 100, 1)
            : 0;
            
        $monthlyRevenueTrend = $lastMonthRevenue > 0 
            ? round((($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 0;
            
        $lowStockProductsTrend = $lastMonthLowStock > 0 
            ? round((($lowStockProducts - $lastMonthLowStock) / $lastMonthLowStock) * 100, 1)
            : 0;
        
        $stats = [
            'todayOrders' => (int)$todayOrders,
            'monthlyRevenue' => (float)$monthlyRevenue,
            'lowStockProducts' => (int)$lowStockProducts,
            'scheduledDeliveries' => (int)$scheduledDeliveries,
            'todayOrdersTrend' => $todayOrdersTrend,
            'monthlyRevenueTrend' => $monthlyRevenueTrend,
            'lowStockProductsTrend' => $lowStockProductsTrend
        ];
        
        echo json_encode($stats);
        
    } catch (Exception $e) {
        // Retourner des données de démonstration en cas d'erreur
        $demoStats = [
            'todayOrders' => 45,
            'monthlyRevenue' => 580450,
            'lowStockProducts' => 5,
            'scheduledDeliveries' => 12,
            'todayOrdersTrend' => 12,
            'monthlyRevenueTrend' => 8,
            'lowStockProductsTrend' => -2
        ];
        echo json_encode($demoStats);
    }
}

function getRecentOrders($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                o.id,
                COALESCE(c.name, o.customer_name) as client,
                o.created_at,
                o.total_amount,
                o.status
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 5
        ");
        $stmt->execute();
        $orders = $stmt->fetchAll();
        
        $formattedOrders = array_map(function($order) {
            return [
                'id' => $order['id'],
                'client' => $order['client'] ?: 'Client non spécifié',
                'date' => date('d/m/Y', strtotime($order['created_at'])),
                'amount' => number_format($order['total_amount'], 0, ',', ' ') . ' HTG',
                'status' => $order['status']
            ];
        }, $orders);
        
        echo json_encode($formattedOrders);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoOrders = [
            ['id' => 'ORD-1234', 'client' => 'Hôtel Sérénade', 'date' => '04/07/2025', 'amount' => '12,450 HTG', 'status' => 'completed'],
            ['id' => 'ORD-1235', 'client' => 'Restaurant Cascade', 'date' => '04/07/2025', 'amount' => '8,200 HTG', 'status' => 'processing'],
            ['id' => 'ORD-1236', 'client' => 'Café Bleu', 'date' => '03/07/2025', 'amount' => '5,800 HTG', 'status' => 'pending'],
            ['id' => 'ORD-1237', 'client' => 'Superette Express', 'date' => '03/07/2025', 'amount' => '15,600 HTG', 'status' => 'completed'],
            ['id' => 'ORD-1238', 'client' => 'Marché Central', 'date' => '02/07/2025', 'amount' => '9,150 HTG', 'status' => 'cancelled']
        ];
        echo json_encode($demoOrders);
    }
}

function getLowStockItems($pdo) {
    try {
        // Vérifier l'existence de la table products
        $stmt = $pdo->query("SHOW TABLES LIKE 'products'");
        if ($stmt->rowCount() === 0) {
            throw new Exception("Table products n'existe pas");
        }
        
        // Utiliser un seuil fixe de 10 unités
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                inventory as current,
                10 as minimum,
                'Caisses' as unit
            FROM products
            WHERE inventory <= 10
            ORDER BY inventory ASC
            LIMIT 10
        ");
        $stmt->execute();
        $items = $stmt->fetchAll();
        
        // S'assurer que les données sont des entiers
        foreach ($items as &$item) {
            $item['current'] = (int)$item['current'];
            $item['minimum'] = (int)$item['minimum'];
        }
        
        echo json_encode($items);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoItems = [
            ['id' => '1', 'name' => 'Eau minérale 500ml', 'current' => 125, 'minimum' => 200, 'unit' => 'Caisses'],
            ['id' => '2', 'name' => 'Soda Citron 330ml', 'current' => 45, 'minimum' => 150, 'unit' => 'Caisses'],
            ['id' => '3', 'name' => 'Jus d\'Orange 1L', 'current' => 18, 'minimum' => 50, 'unit' => 'Caisses'],
            ['id' => '4', 'name' => 'Étiquettes personnalisées', 'current' => 500, 'minimum' => 2000, 'unit' => 'pièces'],
            ['id' => '5', 'name' => 'Bouchons spéciaux', 'current' => 850, 'minimum' => 1000, 'unit' => 'pièces']
        ];
        echo json_encode($demoItems);
    }
}

function getSalesData($pdo) {
    try {
        $currentYear = date('Y');
        $lastYear = $currentYear - 1;
        
        // Données pour l'année en cours
        $stmt = $pdo->prepare("
            SELECT 
                MONTH(created_at) as month,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders 
            WHERE YEAR(created_at) = ? 
            AND status != 'cancelled'
            GROUP BY MONTH(created_at)
            ORDER BY month
        ");
        $stmt->execute([$currentYear]);
        $currentYearData = $stmt->fetchAll();
        
        // Données pour l'année précédente
        $stmt = $pdo->prepare("
            SELECT 
                MONTH(created_at) as month,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders 
            WHERE YEAR(created_at) = ? 
            AND status != 'cancelled'
            GROUP BY MONTH(created_at)
            ORDER BY month
        ");
        $stmt->execute([$lastYear]);
        $lastYearData = $stmt->fetchAll();
        
        // Créer les tableaux de données pour les 6 derniers mois
        $months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun'];
        $currentYearValues = array_fill(0, 6, 0);
        $lastYearValues = array_fill(0, 6, 0);
        
        foreach ($currentYearData as $data) {
            if ($data['month'] <= 6) {
                $currentYearValues[$data['month'] - 1] = (float)$data['revenue'];
            }
        }
        
        foreach ($lastYearData as $data) {
            if ($data['month'] <= 6) {
                $lastYearValues[$data['month'] - 1] = (float)$data['revenue'];
            }
        }
        
        $salesData = [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => "Ventes $currentYear",
                    'data' => $currentYearValues,
                    'backgroundColor' => 'rgba(10, 173, 215, 0.6)',
                    'borderColor' => '#0AADD7'
                ],
                [
                    'label' => "Ventes $lastYear",
                    'data' => $lastYearValues,
                    'backgroundColor' => 'rgba(160, 200, 220, 0.4)',
                    'borderColor' => '#a0c8dc'
                ]
            ]
        ];
        
        echo json_encode($salesData);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoSalesData = [
            'labels' => ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun'],
            'datasets' => [
                [
                    'label' => 'Ventes 2025',
                    'data' => [1800, 2200, 1900, 2400, 2800, 3100],
                    'backgroundColor' => 'rgba(10, 173, 215, 0.6)',
                    'borderColor' => '#0AADD7'
                ],
                [
                    'label' => 'Ventes 2024',
                    'data' => [1700, 1900, 1800, 2100, 2500, 2800],
                    'backgroundColor' => 'rgba(160, 200, 220, 0.4)',
                    'borderColor' => '#a0c8dc'
                ]
            ]
        ];
        echo json_encode($demoSalesData);
    }
}

function getCategoryData($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                c.name as category_name,
                COALESCE(SUM(oi.total_price), 0) as revenue
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled' OR o.status IS NULL
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            LIMIT 5
        ");
        $stmt->execute();
        $categoryData = $stmt->fetchAll();
        
        $labels = [];
        $data = [];
        $colors = [
            'rgba(10, 173, 215, 0.8)',
            'rgba(15, 130, 190, 0.8)',
            'rgba(25, 100, 160, 0.8)',
            'rgba(30, 70, 130, 0.8)',
            'rgba(40, 50, 100, 0.8)'
        ];
        
        foreach ($categoryData as $index => $category) {
            $labels[] = $category['category_name'];
            $data[] = (float)$category['revenue'];
        }
        
        $result = [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Ventes par catégorie',
                    'data' => $data,
                    'backgroundColor' => array_slice($colors, 0, count($labels))
                ]
            ]
        ];
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoCategoryData = [
            'labels' => ['Eau minérale', 'Sodas', 'Jus', 'Énergisants', 'Thés'],
            'datasets' => [
                [
                    'label' => 'Ventes par catégorie',
                    'data' => [35, 25, 20, 15, 5],
                    'backgroundColor' => [
                        'rgba(10, 173, 215, 0.8)',
                        'rgba(15, 130, 190, 0.8)',
                        'rgba(25, 100, 160, 0.8)',
                        'rgba(30, 70, 130, 0.8)',
                        'rgba(40, 50, 100, 0.8)'
                    ]
                ]
            ]
        ];
        echo json_encode($demoCategoryData);
    }
}
?>
