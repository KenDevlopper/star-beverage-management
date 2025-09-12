<?php
// Désactiver l'affichage des erreurs en production
// ini_set('display_errors', 0);

// Activer l'affichage des erreurs en développement - À commenter en production
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Autoriser les requêtes cross-origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'); // Autorise ces méthodes
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // Autorise ces headers
header('Content-Type: application/json');


// Gérer la requête OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// Informations de connexion à la base de données
$host = 'localhost';
$dbname = 'star_beverage'; // Vérifiez que ce nom correspond exactement à votre base de données
$username = 'root';
$password = ''; // Laisser vide par défaut pour WAMP

// Logs de connexion (en développement uniquement)
error_log("Tentative de connexion MySQL: host=$host, db=$dbname, user=$username");

// Configurer le fuseau horaire PHP pour Haïti (UTC-5, pas de changement d'heure)
// Utiliser America/New_York mais forcer UTC-5 dans les calculs
date_default_timezone_set('America/New_York');

// Connexion à la base de données
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Configurer le fuseau horaire pour Haïti (UTC-5)
    $pdo->exec("SET time_zone = '-05:00'");
    
    error_log("Connexion MySQL réussie!");
} catch (PDOException $e) {
    error_log("Erreur connexion MySQL: " . $e->getMessage());
    die(json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données: ' . $e->getMessage()
    ]));
}