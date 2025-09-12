<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Récupérer la politique de timeout de session
    $stmt = $pdo->prepare("SELECT value_number FROM security_policies WHERE name = 'sessionTimeoutMinutes' AND enabled = 1");
    $stmt->execute();
    $policy = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $timeoutMinutes = $policy ? $policy['value_number'] : 30; // 30 minutes par défaut
    
    // Trouver les sessions actives qui ont dépassé le timeout
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.user_id,
            s.login_time,
            u.name as user_name,
            TIMESTAMPDIFF(MINUTE, s.login_time, NOW()) as current_duration_minutes
        FROM active_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.is_active = 1 
        AND TIMESTAMPDIFF(MINUTE, s.login_time, NOW()) > ?
    ");
    $stmt->execute([$timeoutMinutes]);
    $expiredSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Trouver les sessions actives qui approchent du timeout (dans les 5 prochaines minutes)
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.user_id,
            s.login_time,
            u.name as user_name,
            TIMESTAMPDIFF(MINUTE, s.login_time, NOW()) as current_duration_minutes
        FROM active_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.is_active = 1 
        AND TIMESTAMPDIFF(MINUTE, s.login_time, NOW()) BETWEEN ? AND ?
    ");
    $stmt->execute([$timeoutMinutes - 5, $timeoutMinutes]);
    $expiringSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Trouver toutes les sessions actives
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.user_id,
            s.login_time,
            u.name as user_name,
            TIMESTAMPDIFF(MINUTE, s.login_time, NOW()) as current_duration_minutes
        FROM active_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.is_active = 1
        ORDER BY s.login_time DESC
    ");
    $stmt->execute();
    $activeSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'timeoutMinutes' => $timeoutMinutes,
            'expiredSessions' => $expiredSessions,
            'expiringSessions' => $expiringSessions,
            'activeSessions' => $activeSessions,
            'expiredCount' => count($expiredSessions),
            'expiringCount' => count($expiringSessions),
            'activeCount' => count($activeSessions)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la vérification des sessions: ' . $e->getMessage()
    ]);
}
?>
