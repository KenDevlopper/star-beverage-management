<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=star_beverage', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            if ($action === 'permissions') {
                // Récupérer les permissions disponibles
                $permissions = [
                    'products' => [
                        'view' => 'Voir les produits',
                        'create' => 'Créer des produits',
                        'edit' => 'Modifier les produits',
                        'delete' => 'Supprimer les produits'
                    ],
                    'orders' => [
                        'view' => 'Voir les commandes',
                        'create' => 'Créer des commandes',
                        'edit' => 'Modifier les commandes',
                        'delete' => 'Supprimer les commandes'
                    ],
                    'customers' => [
                        'view' => 'Voir les clients',
                        'create' => 'Créer des clients',
                        'edit' => 'Modifier les clients',
                        'delete' => 'Supprimer les clients'
                    ],
                    'inventory' => [
                        'view' => 'Voir l\'inventaire',
                        'adjust' => 'Ajuster le stock',
                        'history' => 'Voir l\'historique'
                    ],
                    'reports' => [
                        'view' => 'Voir les rapports',
                        'export' => 'Exporter les rapports'
                    ],
                    'settings' => [
                        'view' => 'Voir les paramètres',
                        'edit' => 'Modifier les paramètres'
                    ],
                    'admin' => [
                        'view' => 'Voir l\'administration',
                        'users' => 'Gérer les utilisateurs',
                        'roles' => 'Gérer les rôles',
                        'logs' => 'Voir les logs'
                    ]
                ];

                echo json_encode([
                    'success' => true,
                    'data' => $permissions
                ]);
            } else {
                // Récupérer tous les rôles
                $stmt = $pdo->prepare("
                    SELECT 
                        r.id,
                        r.name,
                        r.description,
                        r.permissions,
                        r.is_system,
                        r.created_at,
                        r.updated_at,
                        COUNT(u.id) as user_count
                    FROM roles r
                    LEFT JOIN users u ON (
                        r.name = u.role OR 
                        (r.name = 'Agents Stock' AND u.role = 'agents_stock') OR
                        (r.name = 'Agents de Vente' AND u.role = 'agents_vente')
                    )
                    GROUP BY r.id
                    ORDER BY r.is_system DESC, r.created_at ASC
                ");
                $stmt->execute();
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Formater les données
                $formattedRoles = array_map(function($role) {
                    $permissions = json_decode($role['permissions'], true) ?? [];
                    return [
                        'id' => $role['id'],
                        'name' => $role['name'],
                        'description' => $role['description'],
                        'permissions' => $permissions,
                        'isSystem' => (bool)$role['is_system'],
                        'userCount' => (int)$role['user_count'],
                        'created' => $role['created_at'],
                        'updated' => $role['updated_at']
                    ];
                }, $roles);

                echo json_encode([
                    'success' => true,
                    'data' => $formattedRoles
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                throw new Exception("Données JSON invalides");
            }

            // Validation des données
            $requiredFields = ['name', 'description'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier si le nom du rôle existe déjà
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM roles WHERE name = ?");
            $checkStmt->execute([$data['name']]);
            if ($checkStmt->fetchColumn() > 0) {
                throw new Exception("Ce nom de rôle existe déjà");
            }

            $pdo->beginTransaction();

            $insertStmt = $pdo->prepare("
                INSERT INTO roles (name, description, permissions, is_system, created_at) 
                VALUES (?, ?, ?, 0, NOW())
            ");
            $insertStmt->execute([
                $data['name'],
                $data['description'],
                json_encode($data['permissions'] ?? [])
            ]);

            $roleId = $pdo->lastInsertId();

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Rôle créé avec succès',
                'data' => ['id' => $roleId]
            ]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                throw new Exception("Données JSON invalides");
            }

            $roleId = $_GET['id'] ?? null;
            if (!$roleId) {
                throw new Exception("ID du rôle requis");
            }
            
            // Debug: Log the role ID being updated
            error_log("Attempting to update role ID: " . $roleId);

            // Vérifier si le rôle existe et n'est pas système
            $checkStmt = $pdo->prepare("SELECT id, name, is_system FROM roles WHERE id = ?");
            $checkStmt->execute([$roleId]);
            $role = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$role) {
                throw new Exception("Rôle avec l'ID $roleId non trouvé");
            }
            
            if ($role['is_system']) {
                throw new Exception("Impossible de modifier le rôle système '{$role['name']}' (ID: $roleId)");
            }

            $pdo->beginTransaction();

            $updateStmt = $pdo->prepare("
                UPDATE roles 
                SET name = ?, description = ?, permissions = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([
                $data['name'],
                $data['description'],
                json_encode($data['permissions'] ?? []),
                $roleId
            ]);

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Rôle mis à jour avec succès'
            ]);
            break;

        case 'DELETE':
            $roleId = $_GET['id'] ?? null;
            if (!$roleId) {
                throw new Exception("ID du rôle requis");
            }

            // Vérifier si le rôle existe et n'est pas système
            $checkStmt = $pdo->prepare("SELECT is_system, name FROM roles WHERE id = ?");
            $checkStmt->execute([$roleId]);
            $role = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$role) {
                throw new Exception("Rôle non trouvé");
            }
            
            if ($role['is_system']) {
                throw new Exception("Impossible de supprimer un rôle système");
            }

            // Vérifier si des utilisateurs utilisent ce rôle
            $userStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = ?");
            $userStmt->execute([$role['name']]);
            if ($userStmt->fetchColumn() > 0) {
                throw new Exception("Impossible de supprimer un rôle utilisé par des utilisateurs");
            }

            $pdo->beginTransaction();

            $deleteStmt = $pdo->prepare("DELETE FROM roles WHERE id = ?");
            $deleteStmt->execute([$roleId]);

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Rôle supprimé avec succès'
            ]);
            break;

        default:
            throw new Exception("Méthode non autorisée");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
