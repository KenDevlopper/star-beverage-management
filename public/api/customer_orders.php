<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer les commandes d'un client spécifique
        try {
            $customerId = isset($_GET['customer_id']) ? $_GET['customer_id'] : null;
            
            if (!$customerId) {
                throw new Exception("ID du client non spécifié");
            }
            
            // Vérifier que le client existe
            $stmt = $pdo->prepare("SELECT name FROM customers WHERE id = ? AND (status = 'active' OR status IS NULL)");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch();
            
            if (!$customer) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Client non trouvé'
                ]);
                exit;
            }
            
            // Récupérer les commandes du client par customer_name
            $stmt = $pdo->prepare("
                SELECT 
                    o.*,
                    COUNT(oi.id) as items_count
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.customer_name = ?
                GROUP BY o.id
                ORDER BY o.created_at DESC
            ");
            $stmt->execute([$customer['name']]);
            $orders = $stmt->fetchAll();
            
            // Formater les données pour correspondre à l'interface frontend
            $formattedOrders = array_map(function($order) {
                return [
                    'id' => $order['id'],
                    'client' => $order['customer_name'],
                    'date' => date('d/m/Y', strtotime($order['created_at'])),
                    'amount' => number_format($order['total_amount'], 0, ',', ' ') . ' HTG',
                    'status' => $order['status'],
                    'items_count' => $order['items_count'],
                    'created_at' => $order['created_at']
                ];
            }, $orders);
            
            echo json_encode([
                'success' => true,
                'customer_name' => $customer['name'],
                'orders' => $formattedOrders,
                'total_orders' => count($formattedOrders)
            ]);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération des commandes du client: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commandes: ' . $e->getMessage()
            ]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Méthode non autorisée'
        ]);
        break;
}
?>
