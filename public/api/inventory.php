<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer l'inventaire complet avec les paramètres
        try {
            // Vérifier d'abord si les tables existent
            $stmt = $pdo->prepare("SHOW TABLES LIKE 'products'");
            $stmt->execute();
            $productsTableExists = $stmt->rowCount() > 0;
            
            if (!$productsTableExists) {
                throw new Exception("Table 'products' n'existe pas. Veuillez exécuter le script init.sql");
            }
            
            // Vérifier si la table categories existe
            $stmt = $pdo->prepare("SHOW TABLES LIKE 'categories'");
            $stmt->execute();
            $categoriesTableExists = $stmt->rowCount() > 0;
            
            if ($categoriesTableExists) {
                // Requête avec catégories
                $stmt = $pdo->prepare("
                    SELECT 
                        p.id,
                        p.name,
                        p.inventory,
                        'Caisse' as unit,
                        p.status,
                        c.name as category_name,
                        10 as minimum_quantity,
                        10 as reorder_point,
                        CASE 
                            WHEN p.inventory <= 0 THEN 'Rupture de stock'
                            WHEN p.inventory < 10 THEN 'Stock limité'
                            ELSE 'En stock'
                        END as status_text
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    ORDER BY p.name
                ");
            } else {
                // Requête simplifiée sans catégories
                $stmt = $pdo->prepare("
                    SELECT 
                        p.id,
                        p.name,
                        p.inventory,
                        'Caisse' as unit,
                        p.status,
                        CASE p.category_id
                            WHEN 1 THEN 'Eau'
                            WHEN 2 THEN 'Jus'
                            WHEN 3 THEN 'Soda'
                            WHEN 4 THEN 'Thé'
                            ELSE 'Autre'
                        END as category_name,
                        10 as minimum_quantity,
                        10 as reorder_point,
                        CASE 
                            WHEN p.inventory <= 0 THEN 'Rupture de stock'
                            WHEN p.inventory < 10 THEN 'Stock limité'
                            ELSE 'En stock'
                        END as status_text
                    FROM products p
                    ORDER BY p.name
                ");
            }
            
            $stmt->execute();
            $inventory = $stmt->fetchAll();
            
            echo json_encode($inventory);
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la récupération de l'inventaire: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur de base de données lors de la récupération de l\'inventaire: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération de l'inventaire: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'inventaire: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'POST':
        // Ajuster le stock d'un produit
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['product_id']) || !isset($data['new_quantity']) || !isset($data['reason'])) {
                throw new Exception("Données incomplètes pour l'ajustement");
            }
            
            $pdo->beginTransaction();
            
            // Récupérer l'ancienne quantité
            $stmt = $pdo->prepare("SELECT inventory FROM products WHERE id = ?");
            $stmt->execute([$data['product_id']]);
            $oldQuantity = $stmt->fetchColumn();
            
            if ($oldQuantity === false) {
                throw new Exception("Produit non trouvé");
            }
            
            // Mettre à jour le stock
            $stmt = $pdo->prepare("UPDATE products SET inventory = ? WHERE id = ?");
            $stmt->execute([$data['new_quantity'], $data['product_id']]);
            
            $adjustmentQuantity = $data['new_quantity'] - $oldQuantity;
            
            // Enregistrer l'ajustement
            $stmt = $pdo->prepare("
                INSERT INTO inventory_adjustments 
                (product_id, old_quantity, new_quantity, adjustment_quantity, unit, reason, user_id) 
                VALUES (?, ?, ?, ?, 'Caisse', ?, 1)
            ");
            $stmt->execute([
                $data['product_id'],
                $oldQuantity,
                $data['new_quantity'],
                $adjustmentQuantity,
                $data['reason']
            ]);
            
            // Enregistrer le mouvement
            $movementType = $adjustmentQuantity > 0 ? 'in' : 'out';
            $stmt = $pdo->prepare("
                INSERT INTO inventory_movements 
                (product_id, movement_type, quantity, unit, reference_type, reference_id, user_id, reason) 
                VALUES (?, ?, ?, 'Caisse', 'adjustment', ?, 1, ?)
            ");
            $stmt->execute([
                $data['product_id'],
                $movementType,
                abs($adjustmentQuantity),
                $data['product_id'],
                $data['reason']
            ]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock ajusté avec succès',
                'adjustment' => [
                    'product_id' => $data['product_id'],
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $data['new_quantity'],
                    'adjustment_quantity' => $adjustmentQuantity
                ]
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Erreur lors de l'ajustement du stock: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de l\'ajustement: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'PUT':
        // Mettre à jour les paramètres d'inventaire (seuils minimums)
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['product_id']) || !isset($data['minimum_quantity'])) {
                throw new Exception("Données incomplètes pour la mise à jour des paramètres");
            }
            
            // Vérifier si les paramètres existent déjà
            $stmt = $pdo->prepare("SELECT id FROM inventory_settings WHERE product_id = ?");
            $stmt->execute([$data['product_id']]);
            
            if ($stmt->rowCount() > 0) {
                // Mettre à jour
                $stmt = $pdo->prepare("
                    UPDATE inventory_settings 
                    SET minimum_quantity = ?, reorder_point = ?, updated_at = NOW() 
                    WHERE product_id = ?
                ");
                $stmt->execute([
                    $data['minimum_quantity'],
                    $data['reorder_point'] ?? $data['minimum_quantity'],
                    $data['product_id']
                ]);
            } else {
                // Créer
                $stmt = $pdo->prepare("
                    INSERT INTO inventory_settings 
                    (product_id, minimum_quantity, reorder_point, unit) 
                    VALUES (?, ?, ?, 'Caisse')
                ");
                $stmt->execute([
                    $data['product_id'],
                    $data['minimum_quantity'],
                    $data['reorder_point'] ?? $data['minimum_quantity']
                ]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Paramètres d\'inventaire mis à jour avec succès'
            ]);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la mise à jour des paramètres: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
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
