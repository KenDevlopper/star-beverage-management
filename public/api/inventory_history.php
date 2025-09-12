<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer l'historique des mouvements d'inventaire
        try {
            $productId = isset($_GET['product_id']) ? $_GET['product_id'] : null;
            
            if (!$productId) {
                throw new Exception("ID du produit non spécifié");
            }
            
            // Récupérer l'historique des mouvements
            $stmt = $pdo->prepare("
                SELECT 
                    im.id,
                    im.movement_type,
                    im.quantity,
                    im.unit,
                    im.reference_type,
                    im.reference_id,
                    im.reason,
                    im.created_at,
                    u.name as user_name,
                    p.name as product_name
                FROM inventory_movements im
                LEFT JOIN users u ON im.user_id = u.id
                LEFT JOIN products p ON im.product_id = p.id
                WHERE im.product_id = ?
                ORDER BY im.created_at DESC
                LIMIT 50
            ");
            $stmt->execute([$productId]);
            $movements = $stmt->fetchAll();
            
            // Récupérer l'historique des ajustements
            $stmt = $pdo->prepare("
                SELECT 
                    ia.id,
                    ia.old_quantity,
                    ia.new_quantity,
                    ia.adjustment_quantity,
                    ia.unit,
                    ia.reason,
                    ia.created_at,
                    u.name as user_name,
                    p.name as product_name
                FROM inventory_adjustments ia
                LEFT JOIN users u ON ia.user_id = u.id
                LEFT JOIN products p ON ia.product_id = p.id
                WHERE ia.product_id = ?
                ORDER BY ia.created_at DESC
                LIMIT 20
            ");
            $stmt->execute([$productId]);
            $adjustments = $stmt->fetchAll();
            
            // Combiner et formater les données
            $history = [];
            
            // Ajouter les mouvements
            foreach ($movements as $movement) {
                $history[] = [
                    'id' => 'movement_' . $movement['id'],
                    'type' => $movement['movement_type'] === 'in' ? 'entrée' : 'sortie',
                    'quantity' => $movement['quantity'],
                    'unit' => $movement['unit'],
                    'reason' => $movement['reason'] ?: $movement['reference_type'],
                    'user' => $movement['user_name'] ?: 'Système',
                    'date' => $movement['created_at'],
                    'reference_type' => $movement['reference_type']
                ];
            }
            
            // Ajouter les ajustements
            foreach ($adjustments as $adjustment) {
                $history[] = [
                    'id' => 'adjustment_' . $adjustment['id'],
                    'type' => $adjustment['adjustment_quantity'] > 0 ? 'entrée' : 'sortie',
                    'quantity' => abs($adjustment['adjustment_quantity']),
                    'unit' => $adjustment['unit'],
                    'reason' => 'Ajustement: ' . $adjustment['reason'],
                    'user' => $adjustment['user_name'] ?: 'Système',
                    'date' => $adjustment['created_at'],
                    'reference_type' => 'adjustment',
                    'old_quantity' => $adjustment['old_quantity'],
                    'new_quantity' => $adjustment['new_quantity']
                ];
            }
            
            // Trier par date décroissante
            usort($history, function($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });
            
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
