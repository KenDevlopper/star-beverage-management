<?php
// Middleware pour vérifier et expirer automatiquement les sessions
require_once 'haiti_timezone.php';

function checkAndExpireSessions($pdo) {
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
                s.login_time
            FROM active_sessions s
            WHERE s.is_active = 1 
            AND TIMESTAMPDIFF(MINUTE, s.login_time, NOW()) > ?
        ");
        $stmt->execute([$timeoutMinutes]);
        $expiredSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($expiredSessions as $session) {
            $userId = $session['user_id'];
            $sessionId = $session['id'];
            $loginTime = $session['login_time'];
            
            // Calculer la durée de session en utilisant le fuseau horaire d'Haïti
            $durationMinutes = calculateHaitiDuration($loginTime);
            
            // Marquer la session comme inactive
            $stmt = $pdo->prepare("UPDATE active_sessions SET is_active = 0 WHERE id = ?");
            $stmt->execute([$sessionId]);
            
            // Mettre à jour le log de connexion avec les informations de déconnexion
            $stmt = $pdo->prepare("
                UPDATE user_logs 
                SET logout_time = NOW(), session_duration = ?
                WHERE user_id = ? AND action = 'login' 
                AND created_at >= ? 
                ORDER BY created_at DESC 
                LIMIT 1
            ");
            $stmt->execute([$durationMinutes, $userId, $loginTime]);
            
            // Créer un log de déconnexion automatique
            $stmt = $pdo->prepare("
                INSERT INTO user_logs (user_id, action, target, details, ip_address, user_agent, created_at) 
                VALUES (?, 'logout', 'user', ?, 'system', 'auto-expire', NOW())
            ");
            $stmt->execute([
                $userId, 
                "Déconnexion automatique - Session expirée après {$durationMinutes} minutes (timeout: {$timeoutMinutes}min)"
            ]);
        }
        
        return count($expiredSessions);
        
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification des sessions expirées: " . $e->getMessage());
        return 0;
    }
}

// Fonction pour vérifier si une session est valide
function isSessionValid($pdo, $userId) {
    try {
        // Récupérer la politique de timeout de session
        $stmt = $pdo->prepare("SELECT value_number FROM security_policies WHERE name = 'sessionTimeoutMinutes' AND enabled = 1");
        $stmt->execute();
        $policy = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $timeoutMinutes = $policy ? $policy['value_number'] : 30;
        
        // Vérifier si l'utilisateur a une session active valide
        $stmt = $pdo->prepare("
            SELECT id FROM active_sessions 
            WHERE user_id = ? AND is_active = 1 
            AND TIMESTAMPDIFF(MINUTE, login_time, NOW()) <= ?
        ");
        $stmt->execute([$userId, $timeoutMinutes]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $session !== false;
        
    } catch (Exception $e) {
        error_log("Erreur lors de la vérification de session: " . $e->getMessage());
        return false;
    }
}
?>
