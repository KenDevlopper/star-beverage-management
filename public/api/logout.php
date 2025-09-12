<?php
require_once 'config.php';
require_once 'haiti_timezone.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

try {
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID utilisateur requis']);
        exit;
    }
    
    // Récupérer la session active de l'utilisateur
    $stmt = $pdo->prepare("
        SELECT id, login_time 
        FROM active_sessions 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY login_time DESC 
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($session) {
        // Calculer la durée de session en utilisant le fuseau horaire d'Haïti
        $durationMinutes = calculateHaitiDuration($session['login_time']);
        
        // Mettre à jour la session comme inactive
        $stmt = $pdo->prepare("UPDATE active_sessions SET is_active = 0 WHERE id = ?");
        $stmt->execute([$session['id']]);
        
        // Mettre à jour le log de connexion avec les informations de déconnexion
        $stmt = $pdo->prepare("
            UPDATE user_logs 
            SET logout_time = NOW(), session_duration = ?
            WHERE user_id = ? AND action = 'login' 
            AND created_at >= ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$durationMinutes, $userId, $session['login_time']]);
        
        // Créer un log de déconnexion
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        $stmt = $pdo->prepare("
            INSERT INTO user_logs (user_id, action, target, details, ip_address, user_agent, created_at) 
            VALUES (?, 'logout', 'user', ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId, 
            "Déconnexion - Session de {$durationMinutes} minutes", 
            $ipAddress, 
            $userAgent
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Déconnexion enregistrée avec succès',
            'session_duration' => $durationMinutes
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Aucune session active trouvée'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la déconnexion: ' . $e->getMessage()]);
}
?>



