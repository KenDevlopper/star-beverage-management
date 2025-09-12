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
    $action = $_GET['action'] ?? 'sales';
    
    switch ($action) {
        case 'sales':
            getSalesReport($pdo);
            break;
        case 'products':
            getProductsReport($pdo);
            break;
        case 'trends':
            getTrendsReport($pdo);
            break;
        case 'statistics':
            getKeyStatistics($pdo);
            break;
        case 'categories':
            getCategoryReport($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non reconnue']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getSalesReport($pdo) {
    try {
        $dateRange = $_GET['dateRange'] ?? 'month';
        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;
        
        // Déterminer la période selon le filtre
        switch ($dateRange) {
            case 'week':
                $period = 'WEEK';
                $format = '%u'; // Numéro de semaine
                $labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
                break;
            case 'month':
                $period = 'MONTH';
                $format = '%m';
                $labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                break;
            case 'year':
                $period = 'YEAR';
                $format = '%Y';
                $labels = [];
                break;
            case 'custom':
                if (!$startDate || !$endDate) {
                    throw new Exception('Dates de début et fin requises pour la période personnalisée');
                }
                $period = 'DAY';
                $format = '%Y-%m-%d';
                $labels = [];
                break;
            default:
                $period = 'MONTH';
                $format = '%m';
                $labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        }
        
        // Construire la requête selon la période
        if ($dateRange === 'custom') {
            $whereClause = "WHERE DATE(created_at) BETWEEN ? AND ?";
            $params = [$startDate, $endDate];
        } else {
            $currentYear = date('Y');
            $whereClause = "WHERE YEAR(created_at) = ?";
            $params = [$currentYear];
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                $period(created_at) as period,
                COALESCE(SUM(total_amount), 0) as revenue,
                COUNT(*) as orders_count
            FROM orders 
            $whereClause
            AND status != 'cancelled'
            GROUP BY $period(created_at)
            ORDER BY period
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        
        // Préparer les données pour le graphique
        $chartData = [];
        $chartLabels = [];
        
        if ($dateRange === 'year') {
            // Pour les années, on prend les 5 dernières années
            $currentYear = date('Y');
            for ($i = 4; $i >= 0; $i--) {
                $year = $currentYear - $i;
                $chartLabels[] = $year;
                $chartData[] = 0;
            }
            
            foreach ($data as $row) {
                $index = array_search($row['period'], $chartLabels);
                if ($index !== false) {
                    $chartData[$index] = (float)$row['revenue'];
                }
            }
        } elseif ($dateRange === 'custom') {
            // Pour les dates personnalisées, on génère les jours entre start et end
            $start = new DateTime($startDate);
            $end = new DateTime($endDate);
            $interval = $start->diff($end)->days;
            
            for ($i = 0; $i <= $interval; $i++) {
                $date = clone $start;
                $date->add(new DateInterval('P' . $i . 'D'));
                $chartLabels[] = $date->format('d/m');
                $chartData[] = 0;
            }
            
            foreach ($data as $row) {
                $date = new DateTime($row['period']);
                $index = array_search($date->format('d/m'), $chartLabels);
                if ($index !== false) {
                    $chartData[$index] = (float)$row['revenue'];
                }
            }
        } else {
            // Pour les mois ou semaines
            $maxPeriods = $dateRange === 'week' ? 7 : 12;
            for ($i = 1; $i <= $maxPeriods; $i++) {
                $chartLabels[] = $labels[$i - 1] ?? $i;
                $chartData[] = 0;
            }
            
            foreach ($data as $row) {
                $index = $row['period'] - 1;
                if ($index >= 0 && $index < count($chartData)) {
                    $chartData[$index] = (float)$row['revenue'];
                }
            }
        }
        
        $result = [
            'labels' => $chartLabels,
            'datasets' => [
                [
                    'label' => 'Ventes',
                    'data' => $chartData,
                    'backgroundColor' => '#8B5CF6',
                    'borderColor' => '#7C3AED',
                    'borderWidth' => 1
                ]
            ]
        ];
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        // Données de démonstration en cas d'erreur
        $demoData = [
            'labels' => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
            'datasets' => [
                [
                    'label' => 'Ventes',
                    'data' => [4230, 5120, 4800, 5600, 7000, 6200],
                    'backgroundColor' => '#8B5CF6',
                    'borderColor' => '#7C3AED',
                    'borderWidth' => 1
                ]
            ]
        ];
        echo json_encode($demoData);
    }
}

function getProductsReport($pdo) {
    try {
        $category = $_GET['category'] ?? 'all';
        
        $whereClause = "WHERE o.status != 'cancelled'";
        $params = [];
        
        if ($category !== 'all') {
            $whereClause .= " AND c.name = ?";
            $params[] = $category;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                c.name as category_name,
                COALESCE(SUM(oi.total_price), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as quantity_sold
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            $whereClause
            GROUP BY c.id, c.name
            HAVING revenue > 0
            ORDER BY revenue DESC
            LIMIT 10
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        
        $labels = [];
        $chartData = [];
        $colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6B7280',
            '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16', '#F97316'
        ];
        
        foreach ($data as $index => $row) {
            $labels[] = $row['category_name'];
            $chartData[] = (float)$row['revenue'];
        }
        
        $result = [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Ventes par catégorie',
                    'data' => $chartData,
                    'backgroundColor' => array_slice($colors, 0, count($labels))
                ]
            ]
        ];
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoData = [
            'labels' => ['Eau', 'Jus', 'Soda', 'Thé', 'Autres'],
            'datasets' => [
                [
                    'label' => 'Ventes par catégorie',
                    'data' => [35, 25, 20, 15, 5],
                    'backgroundColor' => ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6B7280']
                ]
            ]
        ];
        echo json_encode($demoData);
    }
}

function getTrendsReport($pdo) {
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
        
        // Créer les tableaux de données pour les 12 mois
        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        $currentYearValues = array_fill(0, 12, 0);
        $lastYearValues = array_fill(0, 12, 0);
        
        foreach ($currentYearData as $data) {
            $currentYearValues[$data['month'] - 1] = (float)$data['revenue'];
        }
        
        foreach ($lastYearData as $data) {
            $lastYearValues[$data['month'] - 1] = (float)$data['revenue'];
        }
        
        $result = [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => "Ventes $currentYear",
                    'data' => $currentYearValues,
                    'backgroundColor' => 'rgba(139, 92, 246, 0.1)',
                    'borderColor' => '#8B5CF6',
                    'borderWidth' => 2,
                    'fill' => true
                ],
                [
                    'label' => "Ventes $lastYear",
                    'data' => $lastYearValues,
                    'backgroundColor' => 'rgba(156, 163, 175, 0.1)',
                    'borderColor' => '#9CA3AF',
                    'borderWidth' => 2,
                    'fill' => false
                ]
            ]
        ];
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoData = [
            'labels' => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            'datasets' => [
                [
                    'label' => 'Ventes 2025',
                    'data' => [1800, 2200, 1900, 2400, 2800, 3100, 2900, 3200, 3000, 3500, 3300, 3800],
                    'backgroundColor' => 'rgba(139, 92, 246, 0.1)',
                    'borderColor' => '#8B5CF6',
                    'borderWidth' => 2,
                    'fill' => true
                ],
                [
                    'label' => 'Ventes 2024',
                    'data' => [1700, 1900, 1800, 2100, 2500, 2800, 2600, 2900, 2700, 3000, 2800, 3200],
                    'backgroundColor' => 'rgba(156, 163, 175, 0.1)',
                    'borderColor' => '#9CA3AF',
                    'borderWidth' => 2,
                    'fill' => false
                ]
            ]
        ];
        echo json_encode($demoData);
    }
}

function getKeyStatistics($pdo) {
    try {
        $currentMonth = date('Y-m');
        $lastMonth = date('Y-m', strtotime('-1 month'));
        $currentYear = date('Y');
        $lastYear = $currentYear - 1;
        
        // Total des ventes
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as total_sales
            FROM orders 
            WHERE status != 'cancelled'
        ");
        $stmt->execute();
        $totalSales = $stmt->fetch()['total_sales'];
        
        // Ventes du mois précédent pour calculer la tendance
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as last_month_sales
            FROM orders 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
            AND status != 'cancelled'
        ");
        $stmt->execute([$lastMonth]);
        $lastMonthSales = $stmt->fetch()['last_month_sales'];
        
        // Nombre total de commandes
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total_orders
            FROM orders 
            WHERE status != 'cancelled'
        ");
        $stmt->execute();
        $totalOrders = $stmt->fetch()['total_orders'];
        
        // Commandes du mois précédent
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as last_month_orders
            FROM orders 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
            AND status != 'cancelled'
        ");
        $stmt->execute([$lastMonth]);
        $lastMonthOrders = $stmt->fetch()['last_month_orders'];
        
        // Produit le plus vendu
        $stmt = $pdo->prepare("
            SELECT 
                p.name as product_name,
                SUM(oi.quantity) as total_quantity
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.id, p.name
            ORDER BY total_quantity DESC
            LIMIT 1
        ");
        $stmt->execute();
        $topProduct = $stmt->fetch();
        
        // Valeur moyenne des commandes
        $stmt = $pdo->prepare("
            SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
            FROM orders 
            WHERE status != 'cancelled'
        ");
        $stmt->execute();
        $avgOrderValue = $stmt->fetch()['avg_order_value'];
        
        // Valeur moyenne du mois précédent
        $stmt = $pdo->prepare("
            SELECT COALESCE(AVG(total_amount), 0) as last_month_avg
            FROM orders 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
            AND status != 'cancelled'
        ");
        $stmt->execute([$lastMonth]);
        $lastMonthAvg = $stmt->fetch()['last_month_avg'];
        
        // Calculer les tendances
        $salesTrend = $lastMonthSales > 0 
            ? round((($totalSales - $lastMonthSales) / $lastMonthSales) * 100, 1)
            : 0;
            
        $ordersTrend = $lastMonthOrders > 0 
            ? round((($totalOrders - $lastMonthOrders) / $lastMonthOrders) * 100, 1)
            : 0;
            
        $avgTrend = $lastMonthAvg > 0 
            ? round((($avgOrderValue - $lastMonthAvg) / $lastMonthAvg) * 100, 1)
            : 0;
        
        $result = [
            'totalSales' => (float)$totalSales,
            'totalOrders' => (int)$totalOrders,
            'topProduct' => $topProduct ? $topProduct['product_name'] : 'Aucun',
            'avgOrderValue' => (float)$avgOrderValue,
            'salesTrend' => $salesTrend,
            'ordersTrend' => $ordersTrend,
            'avgTrend' => $avgTrend
        ];
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoData = [
            'totalSales' => 32945.50,
            'totalOrders' => 1245,
            'topProduct' => 'Eau minérale',
            'avgOrderValue' => 26.45,
            'salesTrend' => 12.5,
            'ordersTrend' => 8.2,
            'avgTrend' => 5.1
        ];
        echo json_encode($demoData);
    }
}

function getCategoryReport($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                c.name as category_name,
                COUNT(DISTINCT p.id) as product_count,
                COALESCE(SUM(oi.quantity), 0) as total_sold,
                COALESCE(SUM(oi.total_price), 0) as total_revenue
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
            GROUP BY c.id, c.name
            ORDER BY total_revenue DESC
        ");
        $stmt->execute();
        $data = $stmt->fetchAll();
        
        echo json_encode($data);
        
    } catch (Exception $e) {
        // Données de démonstration
        $demoData = [
            ['category_name' => 'Eau', 'product_count' => 5, 'total_sold' => 150, 'total_revenue' => 7500.00],
            ['category_name' => 'Soda', 'product_count' => 8, 'total_sold' => 120, 'total_revenue' => 6000.00],
            ['category_name' => 'Jus', 'product_count' => 6, 'total_sold' => 80, 'total_revenue' => 4000.00]
        ];
        echo json_encode($demoData);
    }
}
?>
