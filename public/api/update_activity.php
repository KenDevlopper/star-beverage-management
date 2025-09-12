<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $action = $input['action'] ?? 'activity';
    $target = $input['target'] ?? 'system';
    $details = $input['details'] ?? 'Activité utilisateur détectée';
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID utilisateur requis']);
        exit;
    }
    
    $now = date('Y-m-d H:i:s');
    
    // Mettre à jour la dernière activité de la session
    $stmt = $pdo->prepare("
        UPDATE active_sessions 
        SET last_activity = ? 
        WHERE user_id = ? AND is_active = 1
    ");
    $stmt->execute([$now, $userId]);
    
    if ($stmt->rowCount() > 0) {
        // Créer un log d'activité (seulement pour certaines actions importantes)
        $shouldLog = in_array($action, ['login', 'logout', 'admin_action', 'data_change']);
        
        if ($shouldLog) {
            $logStmt = $pdo->prepare("
                INSERT INTO user_logs (user_id, action, target, details, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $logStmt->execute([
                $userId, 
                $action,
                $target,
                $details,
                $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
                $now
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Activité mise à jour',
            'data' => [
                'user_id' => $userId,
                'last_activity' => $now,
                'logged' => $shouldLog
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Aucune session active trouvée pour cet utilisateur'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la mise à jour de l\'activité: ' . $e->getMessage()]);
}
?>
