<?php
require_once 'config.php';
require_once 'session_middleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Forcer l'expiration de toutes les sessions expirées
    $expiredCount = checkAndExpireSessions($pdo);
    
    // Récupérer les sessions actives restantes
    $stmt = $pdo->query("
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
    $activeSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => "Expiration forcée terminée. {$expiredCount} sessions expirées.",
        'data' => [
            'expiredCount' => $expiredCount,
            'activeSessions' => $activeSessions,
            'activeCount' => count($activeSessions)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de l\'expiration forcée des sessions: ' . $e->getMessage()
    ]);
}
?>
