<?php
header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'session_middleware.php';

// Vérifier et expirer automatiquement les sessions expirées
checkAndExpireSessions($pdo);

try {

    // Fonction pour récupérer les politiques de sécurité
    function getSecurityPolicies($pdo) {
        try {
            $stmt = $pdo->query("
                SELECT name, enabled, value_type, value_string, value_number, value_boolean
                FROM security_policies 
                WHERE enabled = 1
            ");
            $policies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [];
            foreach ($policies as $policy) {
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
                $result[$policy['name']] = $value;
            }
            return $result;
        } catch (Exception $e) {
            return [];
        }
    }

    // Fonction pour vérifier les tentatives de connexion
    function checkLoginAttempts($pdo, $username, $maxAttempts = 5) {
        try {
            // Pour simplifier, on utilise une table temporaire en mémoire
            // Dans une vraie implémentation, on aurait une table login_attempts
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as attempts 
                FROM user_logs 
                WHERE user_id = (SELECT id FROM users WHERE username = ?) 
                AND action = 'login_failed' 
                AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            ");
            $stmt->execute([$username]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return (int)$result['attempts'] < $maxAttempts;
        } catch (Exception $e) {
            return true; // En cas d'erreur, on autorise la connexion
        }
    }

    // Fonction pour enregistrer une tentative de connexion échouée
    function logFailedLogin($pdo, $username) {
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            
            if ($user) {
                $stmt = $pdo->prepare("
                    INSERT INTO user_logs (user_id, action, target, details, ip_address, user_agent, created_at) 
                    VALUES (?, 'login_failed', 'user', 'Tentative de connexion échouée - Mot de passe incorrect', ?, ?, NOW())
                ");
                $stmt->execute([$user['id'], $ipAddress, $userAgent]);
            } else {
                // Log pour un utilisateur inexistant
                $stmt = $pdo->prepare("
                    INSERT INTO user_logs (user_id, action, target, details, ip_address, user_agent, created_at) 
                    VALUES (NULL, 'login_failed', 'user', 'Tentative de connexion échouée - Utilisateur inexistant: $username', ?, ?, NOW())
                ");
                $stmt->execute([$ipAddress, $userAgent]);
            }
        } catch (Exception $e) {
            // Ignorer les erreurs de logging
            error_log("Erreur de logging des échecs de connexion: " . $e->getMessage());
        }
    }

    $method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
            $stmt = $pdo->prepare("
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.name,
                    u.role,
                    u.status,
                    u.avatar,
                    u.last_login,
                    u.created_at
                FROM users u
                ORDER BY u.created_at DESC
            ");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formater les données pour le frontend
            $formattedUsers = array_map(function($user) {
                return [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                    'role' => $user['role'], // Garder en minuscules pour la compatibilité
                    'status' => $user['status'],
                    'avatar' => $user['avatar'],
                    'lastLogin' => $user['last_login'],
                    'created' => $user['created_at'],
                    'roleDescription' => ucfirst($user['role']) // Utiliser le rôle comme description
                ];
            }, $users);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedUsers
            ]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
                throw new Exception("Données JSON invalides");
            }

            // Vérifier si c'est une requête de login
        if (isset($data['action']) && $data['action'] === 'login') {
                // Logique de connexion
                if (!isset($data['username']) || !isset($data['password'])) {
                    throw new Exception("Nom d'utilisateur et mot de passe requis");
                }

            $username = $data['username'];
            $password = $data['password'];
            
            // Récupérer les politiques de sécurité
            $policies = getSecurityPolicies($pdo);
            $maxAttempts = $policies['accountLockoutAttempts'] ?? 5;

            // Vérifier les tentatives de connexion
            if (!checkLoginAttempts($pdo, $username, $maxAttempts)) {
                throw new Exception("Compte verrouillé temporairement. Trop de tentatives de connexion échouées.");
            }
            
                // Rechercher l'utilisateur par username ou email
                $stmt = $pdo->prepare("
                    SELECT 
                        u.id,
                        u.username,
                        u.email,
                        u.name,
                        u.password,
                        u.role,
                        u.status,
                        u.avatar,
                        u.last_login,
                        u.created_at
                    FROM users u
                    WHERE (u.username = ? OR u.email = ?) AND u.status = 'active'
                ");
                $stmt->execute([$username, $username]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    logFailedLogin($pdo, $username);
                    throw new Exception("Nom d'utilisateur ou mot de passe incorrect");
                }

                // Vérifier le mot de passe
                if (!password_verify($password, $user['password'])) {
                    logFailedLogin($pdo, $username);
                    throw new Exception("Nom d'utilisateur ou mot de passe incorrect");
                }

                // Mettre à jour la dernière connexion
                $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                $updateStmt->execute([$user['id']]);

                // Créer une session active
                $sessionToken = 'sess_' . bin2hex(random_bytes(16));
                $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
                
                try {
                    // Insérer la session active
                    $sessionStmt = $pdo->prepare("
                        INSERT INTO active_sessions (user_id, session_token, ip_address, user_agent) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $sessionStmt->execute([$user['id'], $sessionToken, $ipAddress, $userAgent]);
                    
                    // Log de la connexion avec informations de session
                    $logStmt = $pdo->prepare("
                        INSERT INTO user_logs (user_id, action, target, details, ip_address, user_agent, created_at) 
                        VALUES (?, 'login', 'user', ?, ?, ?, NOW())
                    ");
                    $logStmt->execute([
                        $user['id'], 
                        "Connexion réussie depuis l'interface web", 
                        $ipAddress, 
                        $userAgent
                    ]);
                } catch (Exception $logError) {
                    // Ignorer les erreurs de logging - ce n'est pas critique
                    error_log("Erreur de logging (non critique): " . $logError->getMessage());
                }

                // Retourner les informations utilisateur (sans le mot de passe)
                unset($user['password']);
                // Garder le rôle en minuscules pour la compatibilité avec le système de permissions
                // $user['role'] = ucfirst($user['role']); // Supprimé pour éviter les problèmes de casse
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Connexion réussie',
                    'user' => $user
                ]);
                break;
            }

            // Logique de création d'utilisateur (code existant)
            // Validation des données
            $requiredFields = ['name', 'email', 'username', 'role', 'password'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            // Vérifier si l'email ou username existe déjà
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ? OR username = ?");
            $checkStmt->execute([$data['email'], $data['username']]);
            if ($checkStmt->fetchColumn() > 0) {
                throw new Exception("L'email ou le nom d'utilisateur existe déjà");
            }

            // Hacher le mot de passe
                $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                
            $pdo->beginTransaction();

            $insertStmt = $pdo->prepare("
                INSERT INTO users (username, password, email, name, role, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $insertStmt->execute([
                $data['username'],
                $hashedPassword,
                $data['email'],
                $data['name'],
                strtolower($data['role']),
                $data['status'] ?? 'active'
                ]);
                
                $userId = $pdo->lastInsertId();

            // Log de l'action (optionnel)
            try {
                $logStmt = $pdo->prepare("INSERT INTO user_logs (user_id, action, target, details, created_at) VALUES (?, 'create_user', 'user', ?, NOW())");
                $logStmt->execute([$userId, "Utilisateur créé: {$data['name']} ({$data['email']})"]);
            } catch (Exception $logError) {
                error_log("Erreur de logging (non critique): " . $logError->getMessage());
            }

            $pdo->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Utilisateur créé avec succès',
                    'user_id' => $userId
                ]);
        break;
        
    case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['id'])) {
                throw new Exception("ID utilisateur requis");
            }

            $pdo->beginTransaction();

            // Vérifier si l'utilisateur existe
            $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $checkStmt->execute([$data['id']]);
            if (!$checkStmt->fetch()) {
                throw new Exception("Utilisateur non trouvé");
            }

            // Construire la requête de mise à jour
            $updateFields = [];
            $updateValues = [];

            $allowedFields = ['name', 'email', 'username', 'role', 'status'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $field === 'role' ? strtolower($data[$field]) : $data[$field];
                }
            }

            if (!empty($updateFields)) {
                $updateValues[] = $data['id'];
                $updateStmt = $pdo->prepare("UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?");
                $updateStmt->execute($updateValues);
            }

            // Log de l'action (optionnel)
            try {
                $logStmt = $pdo->prepare("INSERT INTO user_logs (user_id, action, target, details, created_at) VALUES (?, 'update_user', 'user', ?, NOW())");
                $logStmt->execute([$data['id'], "Utilisateur modifié: " . json_encode($data)]);
            } catch (Exception $logError) {
                error_log("Erreur de logging (non critique): " . $logError->getMessage());
            }

            $pdo->commit();

                echo json_encode([
                    'success' => true,
                    'message' => 'Utilisateur mis à jour avec succès'
                ]);
        break;
        
    case 'DELETE':
            $userId = $_GET['id'] ?? null;
            if (!$userId) {
                throw new Exception("ID utilisateur requis");
            }

            $pdo->beginTransaction();

            // Vérifier si l'utilisateur existe
            $checkStmt = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
            $checkStmt->execute([$userId]);
            $user = $checkStmt->fetch();
            if (!$user) {
                throw new Exception("Utilisateur non trouvé");
            }
            
            // Supprimer l'utilisateur
            $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $deleteStmt->execute([$userId]);

            // Log de l'action (optionnel)
            try {
                $logStmt = $pdo->prepare("INSERT INTO user_logs (user_id, action, target, details, created_at) VALUES (?, 'delete_user', 'user', ?, NOW())");
                $logStmt->execute([$userId, "Utilisateur supprimé: {$user['name']} ({$user['email']})"]);
            } catch (Exception $logError) {
                error_log("Erreur de logging (non critique): " . $logError->getMessage());
            }

            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);
        break;
        
    default:
        http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Erreur dans users.php: " . $e->getMessage());
    http_response_code(500);
        echo json_encode([
            'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
        ]);
}
?>