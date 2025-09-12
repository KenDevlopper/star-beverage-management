<?php
require_once 'config.php';

// La connexion PDO est déjà établie dans config.php

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Récupérer le profil de l'utilisateur
        if (!isset($_GET['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID utilisateur requis']);
            exit;
        }
        
        $user_id = $_GET['user_id'];
        
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    id, username, email, name, role, status, 
                    phone, address, birthday, language, bio, 
                    avatar, created_at, last_login
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'Utilisateur non trouvé']);
                exit;
            }
            
            // Nettoyer les données sensibles
            unset($user['password']);
            
            echo json_encode([
                'success' => true,
                'data' => $user
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la récupération du profil']);
        }
        break;
        
    case 'PUT':
        // Mettre à jour le profil de l'utilisateur
        if (!isset($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID utilisateur requis']);
            exit;
        }
        
        $user_id = $input['user_id'];
        $update_fields = [];
        $update_values = [];
        
        // Champs autorisés pour la mise à jour
        $allowed_fields = ['name', 'email', 'phone', 'address', 'birthday', 'language', 'bio', 'avatar'];
        
        foreach ($allowed_fields as $field) {
            if (isset($input[$field])) {
                $update_fields[] = "$field = ?";
                $update_values[] = $input[$field];
            }
        }
        
        if (empty($update_fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Aucun champ à mettre à jour']);
            exit;
        }
        
        // Ajouter la date de mise à jour
        $update_fields[] = "updated_at = NOW()";
        $update_values[] = $user_id;
        
        try {
            $sql = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($update_values);
            
            if ($result) {
                // Récupérer le profil mis à jour
                $stmt = $pdo->prepare("
                    SELECT 
                        id, username, email, name, role, status, 
                        phone, address, birthday, language, bio, 
                        avatar, created_at, last_login, updated_at
                    FROM users 
                    WHERE id = ?
                ");
                $stmt->execute([$user_id]);
                $updated_user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Profil mis à jour avec succès',
                    'data' => $updated_user
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors de la mise à jour du profil']);
            }
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour du profil']);
        }
        break;
        
    case 'POST':
        // Changer le mot de passe
        if (!isset($input['user_id']) || !isset($input['current_password']) || !isset($input['new_password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données requises manquantes']);
            exit;
        }
        
        $user_id = $input['user_id'];
        $current_password = $input['current_password'];
        $new_password = $input['new_password'];
        
        try {
            // Vérifier le mot de passe actuel
            $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user || !password_verify($current_password, $user['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Mot de passe actuel incorrect']);
                exit;
            }
            
            // Mettre à jour le mot de passe
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
            $result = $stmt->execute([$hashed_password, $user_id]);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Mot de passe modifié avec succès'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors de la modification du mot de passe']);
            }
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la modification du mot de passe']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        break;
}
?>
