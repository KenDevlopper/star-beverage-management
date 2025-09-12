
<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer tous les produits avec les catégories
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.name
            ");
            $stmt->execute();
            $products = $stmt->fetchAll();
            
            if (empty($products)) {
                error_log("Aucun produit trouvé dans la base de données");
            } else {
                error_log("Nombre de produits récupérés: " . count($products));
            }
            
            // Conversion du format des prix et statuts
            foreach ($products as &$product) {
                $product['price'] = (float) $product['price'];
                $product['inventory'] = (int) $product['inventory'];
                
                // Déterminer le statut en fonction de l'inventaire (seuil de 5 Caisses)
                if ($product['inventory'] <= 0) {
                    $product['status'] = 'Rupture de stock';
                } elseif ($product['inventory'] < 5) {
                    $product['status'] = 'Stock limité';
                } else {
                    $product['status'] = 'En stock';
                }
            }
            
            echo json_encode($products);
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la récupération des produits: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des produits: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'POST':
        // Ajouter un nouveau produit
        try {
            // Récupérer les données envoyées au format JSON
            $data = json_decode(file_get_contents('php://input'), true);
            error_log("Données reçues pour création de produit: " . print_r($data, true));
            
            if (!$data) {
                throw new Exception("Aucune donnée reçue ou format JSON invalide");
            }
            
            // Vérifier que toutes les données nécessaires sont présentes
            if (empty($data['name']) || !isset($data['price']) || !isset($data['inventory']) || empty($data['category'])) {
                throw new Exception("Données incomplètes pour la création du produit");
            }
            
            // Récupérer l'ID de la catégorie depuis la base de données
            $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
            $stmt->execute([$data['category']]);
            $category_id = $stmt->fetchColumn();
            
            if (!$category_id) {
                // Si la catégorie n'existe pas, utiliser "Autre" (ID 6)
                $category_id = 6;
            }
            
            // Vérifier si la colonne 'unit' existe
            $stmt = $pdo->query("SHOW COLUMNS FROM products LIKE 'unit'");
            $unitColumnExists = $stmt->fetch();
            
            if ($unitColumnExists) {
                // Insérer le produit avec la colonne unit
                $stmt = $pdo->prepare("INSERT INTO products (id, name, price, inventory, category_id, unit) VALUES (?, ?, ?, ?, ?, 'Caisse')");
                $stmt->execute([
                    $data['id'],
                    $data['name'],
                    $data['price'],
                    $data['inventory'],
                    $category_id
                ]);
            } else {
                // Insérer le produit sans la colonne unit
                $stmt = $pdo->prepare("INSERT INTO products (id, name, price, inventory, category_id) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['id'],
                    $data['name'],
                    $data['price'],
                    $data['inventory'],
                    $category_id
                ]);
            }
            
            error_log("Produit créé avec succès: " . $data['name']);
            
            // Renvoyer le produit créé
            echo json_encode([
                'success' => true,
                'message' => 'Produit ajouté avec succès',
                'product' => [
                    'id' => $data['id'],
                    'name' => $data['name'],
                    'price' => (float) $data['price'],
                    'inventory' => (int) $data['inventory'],
                    'category_id' => $category_id,
                    'status' => ($data['inventory'] <= 0) ? 'Rupture de stock' : (($data['inventory'] < 100) ? 'Stock limité' : 'En stock')
                ]
            ]);
        } catch (Exception $e) {
            error_log("Erreur lors de l'ajout du produit: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du produit: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'PUT':
        // Mettre à jour un produit existant
        try {
            // Récupérer l'ID du produit à mettre à jour
            $productId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$productId) {
                throw new Exception("ID du produit non spécifié");
            }
            
            // Récupérer les données envoyées au format JSON
            $data = json_decode(file_get_contents('php://input'), true);
            error_log("Données reçues pour mise à jour du produit {$productId}: " . print_r($data, true));
            
            if (!$data) {
                throw new Exception("Aucune donnée reçue ou format JSON invalide");
            }
            
            // Construire la requête de mise à jour
            $updates = [];
            $params = [];
            
            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = $data['name'];
            }
            
            if (isset($data['price'])) {
                $updates[] = "price = ?";
                $params[] = $data['price'];
            }
            
            if (isset($data['inventory'])) {
                $updates[] = "inventory = ?";
                $params[] = $data['inventory'];
            }
            
            if (isset($data['category'])) {
                // Récupérer l'ID de la catégorie depuis la base de données
                $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
                $stmt->execute([$data['category']]);
                $category_id = $stmt->fetchColumn();
                
                if (!$category_id) {
                    // Si la catégorie n'existe pas, utiliser "Autre" (ID 6)
                    $category_id = 6;
                }
                
                $updates[] = "category_id = ?";
                $params[] = $category_id;
            }
            
            if (empty($updates)) {
                throw new Exception("Aucune donnée à mettre à jour");
            }
            
            // Ajouter l'ID à la fin des paramètres pour la clause WHERE
            $params[] = $productId;
            
            // Exécuter la requête de mise à jour
            $stmt = $pdo->prepare("UPDATE products SET " . implode(", ", $updates) . " WHERE id = ?");
            $stmt->execute($params);
            
            // Vérifier si le produit existe (un rowCount de 0 signifie qu'aucun produit n'a été mis à jour)
            if ($stmt->rowCount() === 0) {
                throw new Exception("Produit non trouvé");
            }
            
            error_log("Produit mis à jour avec succès: " . $productId);
            
            // Récupérer le produit mis à jour
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            // Formater les données
            $product['price'] = (float) $product['price'];
            $product['inventory'] = (int) $product['inventory'];
            
            // Déterminer le statut en fonction de l'inventaire
            if ($product['inventory'] <= 0) {
                $product['status'] = 'Rupture de stock';
            } elseif ($product['inventory'] < 100) {
                $product['status'] = 'Stock limité';
            } else {
                $product['status'] = 'En stock';
            }
            
            // Renvoyer le produit mis à jour
            echo json_encode([
                'success' => true,
                'message' => 'Produit mis à jour avec succès',
                'product' => $product
            ]);
        } catch (Exception $e) {
            error_log("Erreur lors de la mise à jour du produit: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du produit: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'DELETE':
        // Supprimer un produit
        try {
            // Récupérer l'ID du produit à supprimer
            $productId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$productId) {
                throw new Exception("ID du produit non spécifié");
            }
            
            // Vérifier si le produit existe
            $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("Produit non trouvé");
            }
            
            // Supprimer le produit
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            
            error_log("Produit supprimé avec succès: " . $productId);
            
            // Renvoyer la confirmation de suppression
            echo json_encode([
                'success' => true,
                'message' => 'Produit supprimé avec succès'
            ]);
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression du produit: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la suppression du produit: ' . $e->getMessage()
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
