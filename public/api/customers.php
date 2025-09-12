<?php
require_once 'config.php';

// Gestion des requêtes HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer tous les clients ou un client spécifique
        try {
            $customerId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if ($customerId) {
                // Récupérer un client spécifique avec ses statistiques
                $stmt = $pdo->prepare("
                    SELECT 
                        c.*,
                        COUNT(o.id) as total_orders,
                        COALESCE(SUM(o.total_amount), 0) as total_spent,
                        MAX(o.created_at) as last_order_date
                    FROM customers c
                    LEFT JOIN orders o ON c.name = o.customer_name
                    WHERE c.id = ?
                    GROUP BY c.id
                ");
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
                
                echo json_encode($customer);
            } else {
                // Récupérer tous les clients avec leurs statistiques
                $stmt = $pdo->prepare("
                    SELECT 
                        c.*,
                        COUNT(o.id) as total_orders,
                        COALESCE(SUM(o.total_amount), 0) as total_spent,
                        MAX(o.created_at) as last_order_date
                    FROM customers c
                    LEFT JOIN orders o ON c.name = o.customer_name
                    WHERE c.status = 'active' OR c.status IS NULL
                    GROUP BY c.id
                    ORDER BY c.name
                ");
                $stmt->execute();
                $customers = $stmt->fetchAll();
                
                echo json_encode($customers);
            }
        } catch (PDOException $e) {
            error_log("Erreur PDO lors de la récupération des clients: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'POST':
        // Créer un nouveau client
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || empty($data['name'])) {
                throw new Exception("Données incomplètes pour la création du client");
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO customers (name, type, contact_person, email, phone, address, status, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['type'] ?? 'Restaurant',
                $data['contact_person'] ?? $data['contact'] ?? null,
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['address'] ?? null,
                $data['status'] ?? 'active',
                $data['notes'] ?? null
            ]);
            
            $customerId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Client créé avec succès',
                'customer_id' => $customerId
            ]);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la création du client: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'PUT':
        // Mettre à jour un client
        try {
            $customerId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$customerId) {
                throw new Exception("ID du client non spécifié");
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                throw new Exception("Aucune donnée reçue");
            }
            
            // Construire la requête de mise à jour
            $updates = [];
            $params = [];
            
            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = $data['name'];
            }
            
            if (isset($data['type'])) {
                $updates[] = "type = ?";
                $params[] = $data['type'];
            }
            
            if (isset($data['contact_person']) || isset($data['contact'])) {
                $updates[] = "contact_person = ?";
                $params[] = $data['contact_person'] ?? $data['contact'];
            }
            
            if (isset($data['email'])) {
                $updates[] = "email = ?";
                $params[] = $data['email'];
            }
            
            if (isset($data['phone'])) {
                $updates[] = "phone = ?";
                $params[] = $data['phone'];
            }
            
            if (isset($data['address'])) {
                $updates[] = "address = ?";
                $params[] = $data['address'];
            }
            
            if (isset($data['status'])) {
                $updates[] = "status = ?";
                $params[] = $data['status'];
            }
            
            if (isset($data['notes'])) {
                $updates[] = "notes = ?";
                $params[] = $data['notes'];
            }
            
            if (empty($updates)) {
                throw new Exception("Aucune donnée à mettre à jour");
            }
            
            $params[] = $customerId;
            
            $stmt = $pdo->prepare("UPDATE customers SET " . implode(", ", $updates) . " WHERE id = ?");
            $stmt->execute($params);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("Client non trouvé");
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Client mis à jour avec succès'
            ]);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la mise à jour du client: " . $e->getMessage());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'DELETE':
        // Supprimer un client (soft delete)
        try {
            $customerId = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$customerId) {
                throw new Exception("ID du client non spécifié");
            }
            
            $stmt = $pdo->prepare("UPDATE customers SET status = 'inactive' WHERE id = ?");
            $stmt->execute([$customerId]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("Client non trouvé");
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Client supprimé avec succès'
            ]);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression du client: " . $e->getMessage());
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
?>
