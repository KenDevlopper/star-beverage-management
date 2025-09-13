<?php
// Configuration pour ByetHost
// Ce fichier remplacera config.php sur le serveur

// Headers CORS pour ByetHost
header('Access-Control-Allow-Origin: https://www.starbeverage.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration de la base de données pour ByetHost
$host = 'localhost';
$dbname = 'starbeverage_db'; // À créer sur ByetHost
$username = 'YOUR_BYETHOST_USERNAME'; // À remplacer par vos credentials ByetHost
$password = 'YOUR_BYETHOST_PASSWORD'; // À remplacer par vos credentials ByetHost

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base de données']);
    exit();
}

// Configuration du fuseau horaire pour Haïti
date_default_timezone_set('America/Port-au-Prince');

// Configuration des sessions
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);

// Démarrer la session si elle n'est pas déjà démarrée
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Fonction pour logger les erreurs
function logError($message, $context = []) {
    error_log("[" . date('Y-m-d H:i:s') . "] " . $message . " " . json_encode($context));
}

// Fonction pour retourner une réponse JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Fonction pour valider les données d'entrée
function validateInput($data, $required = []) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return false;
        }
    }
    return true;
}

// Configuration de l'environnement
define('ENVIRONMENT', 'production');
define('API_VERSION', '1.0');
define('MAX_LOGIN_ATTEMPTS', 5);
define('SESSION_TIMEOUT', 3600); // 1 heure

echo "Configuration ByetHost chargée avec succès!";
?>
