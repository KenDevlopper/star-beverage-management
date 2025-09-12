
<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer toutes les commandes ou une commande spécifique
        try {
            $orderId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if ($orderId) {
                // Récupérer une commande spécifique avec ses articles
                $stmt = $pdo->prepare("
                    SELECT 
                        o.*,
                        COALESCE(c.name, o.customer_name) as customer_name,
                        COALESCE(c.email, o.customer_email) as customer_email,
                        COALESCE(c.phone, o.customer_phone) as customer_phone
                    FROM orders o
                    LEFT JOIN customers c ON o.customer_id = c.id
                    WHERE o.id = ?
                ");
                $stmt->execute([$orderId]);
                $order = $stmt->fetch();
                
                if (!$order) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Commande non trouvée'
                    ]);
                    exit;
                }
                
                // Récupérer les articles de la commande
                $stmt = $pdo->prepare("
                    SELECT 
                        oi.*,
                        p.name as product_name
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?
                ");
                $stmt->execute([$orderId]);
                $order['items'] = $stmt->fetchAll();
                
                echo json_encode($order);
            } else {
                // Récupérer toutes les commandes
                $stmt = $pdo->prepare("
                    SELECT 
                        o.*,
                        COALESCE(c.name, o.customer_name) as customer_name,
                        COALESCE(c.email, o.customer_email) as customer_email,
                        COALESCE(c.phone, o.customer_phone) as customer_phone
                    FROM orders o
                    LEFT JOIN customers c ON o.customer_id = c.id
                    ORDER BY o.created_at DESC
                ");
                $stmt->execute();
                $orders = $stmt->fetchAll();
                
                // S'assurer qu'on retourne toujours un tableau
                if (!$orders) {
                    $orders = [];
                }
                
                echo json_encode($orders);
            }
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la récupération des commandes: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commandes: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'POST':
        // Créer une nouvelle commande
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['id']) || !isset($data['items']) || empty($data['items'])) {
                throw new Exception("Données incomplètes pour la création de la commande");
            }
            
            // Démarrer une transaction
            $pdo->beginTransaction();
            
            // VALIDATION DE STOCK - Vérifier que tous les produits ont un stock suffisant
            $stockErrors = [];
            foreach ($data['items'] as $item) {
                // Récupérer le stock actuel du produit
                $stockStmt = $pdo->prepare("SELECT name, inventory FROM products WHERE id = ?");
                $stockStmt->execute([$item['productId']]);
                $product = $stockStmt->fetch();
                
                if (!$product) {
                    $stockErrors[] = "Le produit avec l'ID '{$item['productId']}' n'existe pas";
                } else {
                    $currentStock = (int) $product['inventory'];
                    $requestedQuantity = (int) $item['quantity'];
                    
                    if ($currentStock <= 0) {
                        $stockErrors[] = "Le produit '{$product['name']}' n'est plus en stock";
                    } elseif ($currentStock < $requestedQuantity) {
                        $stockErrors[] = "Le produit '{$product['name']}' n'a pas de stock suffisant (disponible: {$currentStock}, demandé: {$requestedQuantity})";
                    }
                }
            }
            
            // Si des erreurs de stock sont détectées, annuler la transaction
            if (!empty($stockErrors)) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreur de stock',
                    'errors' => $stockErrors
                ]);
                exit;
            }
            
            // Calculer le montant total
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unitPrice'];
            }
            
            // Insérer la commande
            $stmt = $pdo->prepare("
                INSERT INTO orders (id, customer_id, customer_name, customer_email, customer_phone, total_amount, status, notes, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['id'],
                $data['customer_id'] ?? null,
                $data['customer_name'] ?? $data['client'] ?? '',
                $data['customer_email'] ?? null,
                $data['customer_phone'] ?? null,
                $totalAmount,
                $data['status'] ?? 'pending',
                $data['notes'] ?? null,
                1 // ID de l'utilisateur admin par défaut
            ]);
            
            // Insérer les articles de la commande
            $stmt = $pdo->prepare("
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            foreach ($data['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unitPrice'];
                $stmt->execute([
                    $data['id'],
                    $item['productId'],
                    $item['quantity'],
                    $item['unitPrice'],
                    $itemTotal
                ]);
                
                // Mettre à jour l'inventaire (soustraire la quantité commandée)
                $updateStmt = $pdo->prepare("
                    UPDATE products 
                    SET inventory = inventory - ? 
                    WHERE id = ?
                ");
                $updateStmt->execute([$item['quantity'], $item['productId']]);
                
                // Enregistrer le mouvement d'inventaire
                $movementStmt = $pdo->prepare("
                    INSERT INTO inventory_movements 
                    (product_id, movement_type, quantity, unit, reference_type, reference_id, user_id, reason) 
                    VALUES (?, 'out', ?, 'Caisse', 'order', ?, 1, ?)
                ");
                $movementStmt->execute([
                    $item['productId'],
                    $item['quantity'],
                    $data['id'],
                    'Commande ' . $data['id']
                ]);
            }
            
            // Enregistrer l'historique du statut initial
            $historyStmt = $pdo->prepare("
                INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, reason) 
                VALUES (?, NULL, ?, 1, 'Commande créée')
            ");
            $historyStmt->execute([$data['id'], $data['status'] ?? 'pending']);
            
            // Valider la transaction
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Commande créée avec succès',
                'order_id' => $data['id'],
                'total_amount' => $totalAmount
            ]);
            
        } catch (Exception $e) {
            // Annuler la transaction en cas d'erreur
            $pdo->rollBack();
            error_log("Erreur lors de la création de la commande: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'PUT':
        // Mettre à jour une commande (principalement le statut)
        try {
            $orderId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$orderId) {
                throw new Exception("ID de la commande non spécifié");
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                throw new Exception("Aucune donnée reçue");
            }
            
            $pdo->beginTransaction();
            
            // Récupérer l'ancien statut
            $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
            $stmt->execute([$orderId]);
            $oldStatus = $stmt->fetchColumn();
            
            if (!$oldStatus) {
                throw new Exception("Commande non trouvée");
            }
            
            // Mettre à jour la commande
            $updates = [];
            $params = [];
            
            if (isset($data['status'])) {
                $updates[] = "status = ?";
                $params[] = $data['status'];
            }
            
            if (isset($data['notes'])) {
                $updates[] = "notes = ?";
                $params[] = $data['notes'];
            }
            
            if (!empty($updates)) {
                $params[] = $orderId;
                $stmt = $pdo->prepare("UPDATE orders SET " . implode(", ", $updates) . " WHERE id = ?");
                $stmt->execute($params);
                
                // Enregistrer l'historique du changement de statut
                if (isset($data['status']) && $data['status'] !== $oldStatus) {
                    $historyStmt = $pdo->prepare("
                        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, reason) 
                        VALUES (?, ?, ?, 1, ?)
                    ");
                    $historyStmt->execute([
                        $orderId,
                        $oldStatus,
                        $data['status'],
                        $data['reason'] ?? 'Statut mis à jour'
                    ]);
                }
            }
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Commande mise à jour avec succès'
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Erreur lors de la mise à jour de la commande: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'DELETE':
        // Supprimer une commande (annulation)
        try {
            $orderId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$orderId) {
                throw new Exception("ID de la commande non spécifié");
            }
            
            $pdo->beginTransaction();
            
            // Récupérer les articles de la commande pour restaurer l'inventaire
            $stmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
            $stmt->execute([$orderId]);
            $items = $stmt->fetchAll();
            
            // Restaurer l'inventaire
            foreach ($items as $item) {
                $updateStmt = $pdo->prepare("
                    UPDATE products 
                    SET inventory = inventory + ? 
                    WHERE id = ?
                ");
                $updateStmt->execute([$item['quantity'], $item['product_id']]);
                
                // Enregistrer le mouvement d'inventaire
                $movementStmt = $pdo->prepare("
                    INSERT INTO inventory_movements 
                    (product_id, movement_type, quantity, unit, reference_type, reference_id, user_id, reason) 
                    VALUES (?, 'in', ?, 'Caisse', 'order_cancellation', ?, 1, ?)
                ");
                $movementStmt->execute([
                    $item['product_id'],
                    $item['quantity'],
                    $orderId,
                    'Annulation commande ' . $orderId
                ]);
            }
            
            // Supprimer la commande (cascade supprimera les articles et l'historique)
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
            $stmt->execute([$orderId]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("Commande non trouvée");
            }
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Commande supprimée avec succès'
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Erreur lors de la suppression de la commande: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
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
