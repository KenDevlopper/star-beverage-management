<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

try {
    // Récupérer les sessions actives avec informations utilisateur
    $stmt = $pdo->query("
        SELECT 
            s.id,
            s.user_id,
            s.session_token,
            s.login_time,
            s.last_activity,
            s.ip_address,
            s.user_agent,
            u.name as user_name,
            u.email as user_email,
            u.role as user_role
        FROM active_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.is_active = 1
        ORDER BY s.last_activity DESC
    ");
    
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formater les données
    $formattedSessions = array_map(function($session) {
        return [
            'id' => $session['id'],
            'userId' => $session['user_id'],
            'userName' => $session['user_name'],
            'userEmail' => $session['user_email'],
            'userRole' => $session['user_role'] ? ucfirst($session['user_role']) : null,
            'loginTime' => $session['login_time'],
            'lastActivity' => $session['last_activity'],
            'ipAddress' => $session['ip_address'],
            'userAgent' => $session['user_agent']
        ];
    }, $sessions);
    
    echo json_encode([
        'success' => true,
        'data' => $formattedSessions,
        'count' => count($formattedSessions)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la récupération des sessions actives: ' . $e->getMessage()]);
}
?>



