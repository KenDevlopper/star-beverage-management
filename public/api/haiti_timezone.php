<?php
/**
 * Fonctions utilitaires pour gérer le fuseau horaire d'Haïti
 * Haïti utilise UTC-5 toute l'année (pas de changement d'heure)
 */

// Fonction pour obtenir le fuseau horaire d'Haïti (UTC-5)
function getHaitiTimezone() {
    return new DateTimeZone('-05:00');
}

// Fonction pour créer un DateTime avec le fuseau horaire d'Haïti
function createHaitiDateTime($time = 'now') {
    return new DateTime($time, getHaitiTimezone());
}

// Fonction pour formater un DateTime avec le fuseau horaire d'Haïti
function formatHaitiTime($datetime, $format = 'Y-m-d H:i:s') {
    if (is_string($datetime)) {
        $datetime = new DateTime($datetime, getHaitiTimezone());
    }
    return $datetime->format($format);
}

// Fonction pour calculer la durée entre deux dates en utilisant le fuseau horaire d'Haïti
function calculateHaitiDuration($startTime, $endTime = null) {
    if ($endTime === null) {
        $endTime = 'now';
    }
    
    $start = new DateTime($startTime, getHaitiTimezone());
    $end = new DateTime($endTime, getHaitiTimezone());
    $duration = $end->diff($start);
    
    return ($duration->days * 24 * 60) + ($duration->h * 60) + $duration->i;
}

// Fonction pour obtenir le temps actuel en Haïti
function getHaitiNow() {
    return createHaitiDateTime();
}

// Test des fonctions
if (php_sapi_name() === 'cli') {
    echo "Test des fonctions de fuseau horaire d'Haïti:\n\n";
    
    $now = getHaitiNow();
    echo "1. Temps actuel en Haïti: " . $now->format('Y-m-d H:i:s T') . "\n";
    
    // Test avec les exemples de l'utilisateur
    $loginTime = '2025-09-12 17:14:30';
    $logoutTime = '2025-09-12 17:17:53';
    $duration = calculateHaitiDuration($loginTime, $logoutTime);
    
    echo "2. Test de calcul de durée:\n";
    echo "   Login: " . formatHaitiTime($loginTime) . "\n";
    echo "   Logout: " . formatHaitiTime($logoutTime) . "\n";
    echo "   Durée: {$duration} minutes\n";
    echo "   Correct: " . ($duration == 3 ? 'OUI' : 'NON') . "\n";
}
?>
