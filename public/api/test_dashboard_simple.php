<?php
require_once 'config.php';

echo "<h1>Test simple du tableau de bord</h1>";

try {
    echo "<h2>1. Test de l'API stats</h2>";
    $_GET['action'] = 'stats';
    ob_start();
    include 'dashboard.php';
    $output = ob_get_clean();
    
    echo "<h3>Réponse brute:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    $stats = json_decode($output, true);
    if ($stats) {
        echo "<h3>Statistiques décodées:</h3>";
        echo "- Commandes aujourd'hui: " . ($stats['todayOrders'] ?? 'N/A') . "<br>";
        echo "- CA mensuel: " . number_format($stats['monthlyRevenue'] ?? 0, 0, ',', ' ') . " HTG<br>";
        echo "- Produits en alerte: " . ($stats['lowStockProducts'] ?? 'N/A') . "<br>";
        echo "- Livraisons prévues: " . ($stats['scheduledDeliveries'] ?? 'N/A') . "<br>";
    } else {
        echo "❌ Erreur de décodage JSON<br>";
    }
    
    echo "<h2>2. Test de l'API low-stock</h2>";
    $_GET['action'] = 'low-stock';
    ob_start();
    include 'dashboard.php';
    $output = ob_get_clean();
    
    echo "<h3>Réponse brute:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    $stockData = json_decode($output, true);
    if ($stockData && is_array($stockData)) {
        echo "<h3>Données de stock décodées:</h3>";
        echo "Nombre d'éléments: " . count($stockData) . "<br>";
        foreach ($stockData as $item) {
            echo "- " . $item['name'] . ": " . $item['current'] . "/" . $item['minimum'] . " " . $item['unit'] . "<br>";
        }
    } else {
        echo "❌ Erreur de décodage JSON<br>";
    }
    
    echo "<h2>3. Test direct de la base de données</h2>";
    
    // Test direct des commandes d'aujourd'hui
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?");
    $stmt->execute([$today]);
    $todayOrders = $stmt->fetch()['count'];
    echo "Commandes aujourd'hui (direct): $todayOrders<br>";
    
    // Test direct du CA mensuel
    $thisMonth = date('Y-m');
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE DATE_FORMAT(created_at, '%Y-%m') = ? AND status != 'cancelled'");
    $stmt->execute([$thisMonth]);
    $monthlyRevenue = $stmt->fetch()['revenue'];
    echo "CA mensuel (direct): " . number_format($monthlyRevenue, 0, ',', ' ') . " HTG<br>";
    
    // Test direct des produits en alerte
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM products p
        JOIN inventory_settings i ON p.id = i.product_id
        WHERE p.inventory <= i.minimum_quantity
    ");
    $stmt->execute();
    $lowStockProducts = $stmt->fetch()['count'];
    echo "Produits en alerte (direct): $lowStockProducts<br>";
    
    // Test direct des livraisons prévues
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')");
    $stmt->execute();
    $scheduledDeliveries = $stmt->fetch()['count'];
    echo "Livraisons prévues (direct): $scheduledDeliveries<br>";
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
}
?>
