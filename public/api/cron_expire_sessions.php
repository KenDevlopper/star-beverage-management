<?php
/**
 * Script de cron pour expirer automatiquement les sessions
 * À exécuter toutes les 5 minutes via une tâche cron ou un scheduler
 * 
 * Exemple de tâche cron (toutes les 5 minutes):
 * 0,5,10,15,20,25,30,35,40,45,50,55 * * * * php /path/to/star-beverage-flow-main-v.0/public/api/cron_expire_sessions.php
 */

// Désactiver l'affichage des erreurs pour les tâches cron
ini_set('display_errors', 0);
error_reporting(E_ERROR | E_WARNING | E_PARSE);

require_once 'config.php';
require_once 'session_middleware.php';

try {
    // Vérifier et expirer les sessions
    $expiredCount = checkAndExpireSessions($pdo);
    
    // Log de l'activité
    $logMessage = date('Y-m-d H:i:s') . " - Expiration des sessions: {$expiredCount} sessions expirées\n";
    file_put_contents(__DIR__ . '/../logs/session_expiry.log', $logMessage, FILE_APPEND | LOCK_EX);
    
    // Afficher le résultat (pour les tests manuels)
    if (php_sapi_name() === 'cli') {
        echo $logMessage;
    }
    
} catch (Exception $e) {
    $errorMessage = date('Y-m-d H:i:s') . " - Erreur lors de l'expiration des sessions: " . $e->getMessage() . "\n";
    file_put_contents(__DIR__ . '/../logs/session_expiry.log', $errorMessage, FILE_APPEND | LOCK_EX);
    
    if (php_sapi_name() === 'cli') {
        echo $errorMessage;
    }
}
?>
