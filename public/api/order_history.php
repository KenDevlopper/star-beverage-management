<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer l'historique des statuts d'une commande
        try {
            $orderId = isset($_GET['order_id']) ? $_GET['order_id'] : null;
            
            if (!$orderId) {
                throw new Exception("ID de la commande non spécifié");
            }
            
            $stmt = $pdo->prepare("
                SELECT 
                    osh.*,
                    u.name as changed_by_name
                FROM order_status_history osh
                LEFT JOIN users u ON osh.changed_by = u.id
                WHERE osh.order_id = ?
                ORDER BY osh.created_at DESC
            ");
            $stmt->execute([$orderId]);
            $history = $stmt->fetchAll();
            
            echo json_encode($history);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération de l'historique: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique: ' . $e->getMessage()
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
