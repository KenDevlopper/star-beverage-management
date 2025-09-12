<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Récupérer les paramètres de sécurité
        try {
            // Récupérer les politiques de sécurité
            $stmt = $pdo->query("
                SELECT 
                    id, name, enabled, description, value_type,
                    value_string, value_number, value_boolean,
                    created_at, updated_at
                FROM security_policies 
                ORDER BY name
            ");
            $policies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Transformer les données pour le frontend
            $transformedPolicies = array_map(function($policy) {
                $value = null;
                switch ($policy['value_type']) {
                    case 'string':
                        $value = $policy['value_string'];
                        break;
                    case 'number':
                        $value = (int)$policy['value_number'];
                        break;
                    case 'boolean':
                        $value = (bool)$policy['value_boolean'];
                        break;
                }
                
                return [
                    'id' => $policy['id'],
                    'name' => $policy['name'],
                    'enabled' => (bool)$policy['enabled'],
                    'description' => $policy['description'],
                    'value' => $value
                ];
            }, $policies);
            
            // Récupérer les clés API
            $stmt = $pdo->query("
                SELECT 
                    id, name, key_value, permissions, last_used,
                    created_at, expires_at, is_active
                FROM api_keys 
                WHERE is_active = 1
                ORDER BY created_at DESC
            ");
            $apiKeys = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Transformer les clés API
            $transformedApiKeys = array_map(function($key) {
                return [
                    'id' => $key['id'],
                    'name' => $key['name'],
                    'key' => $key['key_value'],
                    'permissions' => json_decode($key['permissions'], true) ?: [],
                    'lastUsed' => $key['last_used'] ?: 'Never',
                    'createdAt' => $key['created_at'],
                    'expiresAt' => $key['expires_at']
                ];
            }, $apiKeys);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'policies' => $transformedPolicies,
                    'apiKeys' => $transformedApiKeys
                ]
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la récupération des paramètres de sécurité']);
        }
        break;
        
    case 'PUT':
        // Mettre à jour les politiques de sécurité
        if (!isset($input['policies']) || !is_array($input['policies'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données de politiques manquantes']);
            exit;
        }
        
        try {
            $pdo->beginTransaction();
            
            foreach ($input['policies'] as $policy) {
                if (!isset($policy['id']) || !isset($policy['enabled'])) {
                    continue;
                }
                
                $valueString = null;
                $valueNumber = null;
                $valueBoolean = null;
                $valueType = 'string';
                
                if (isset($policy['value'])) {
                    if (is_bool($policy['value'])) {
                        $valueBoolean = $policy['value'];
                        $valueType = 'boolean';
                    } elseif (is_numeric($policy['value'])) {
                        $valueNumber = (int)$policy['value'];
                        $valueType = 'number';
                    } else {
                        $valueString = (string)$policy['value'];
                        $valueType = 'string';
                    }
                }
                
                $stmt = $pdo->prepare("
                    UPDATE security_policies 
                    SET enabled = ?, value_type = ?, value_string = ?, value_number = ?, value_boolean = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([
                    $policy['enabled'] ? 1 : 0,
                    $valueType,
                    $valueString,
                    $valueNumber,
                    $valueBoolean,
                    $policy['id']
                ]);
            }
            
            $pdo->commit();
            echo json_encode([
                'success' => true,
                'message' => 'Paramètres de sécurité mis à jour avec succès'
            ]);
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour des paramètres']);
        }
        break;
        
    case 'POST':
        // Gérer les clés API
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'create':
                // Créer une nouvelle clé API
                if (!isset($input['name'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Nom de la clé requis']);
                    exit;
                }
                
                try {
                    $keyValue = 'sk_' . strtolower(str_replace(' ', '_', $input['name'])) . '_' . bin2hex(random_bytes(16));
                    $permissions = json_encode($input['permissions'] ?? []);
                    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO api_keys (name, key_value, permissions, expires_at) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([$input['name'], $keyValue, $permissions, $expiresAt]);
                    
                    $keyId = $pdo->lastInsertId();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Clé API créée avec succès',
                        'data' => [
                            'id' => $keyId,
                            'name' => $input['name'],
                            'key' => $keyValue,
                            'permissions' => $input['permissions'] ?? [],
                            'lastUsed' => 'Never',
                            'createdAt' => date('Y-m-d H:i:s'),
                            'expiresAt' => $expiresAt
                        ]
                    ]);
                    
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erreur lors de la création de la clé API']);
                }
                break;
                
            case 'delete':
                // Supprimer une clé API
                if (!isset($input['id'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'ID de la clé requis']);
                    exit;
                }
                
                try {
                    $stmt = $pdo->prepare("UPDATE api_keys SET is_active = 0 WHERE id = ?");
                    $stmt->execute([$input['id']]);
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Clé API supprimée avec succès'
                    ]);
                    
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Erreur lors de la suppression de la clé API']);
                }
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action non reconnue']);
                break;
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        break;
}
?>



