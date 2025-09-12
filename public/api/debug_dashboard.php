<?php
require_once 'config.php';

echo "<h1>Debug du tableau de bord</h1>";

try {
    // Test de connexion
    echo "<h2>1. Test de connexion</h2>";
    echo "✅ Connexion réussie<br>";
    
    // Vérifier les tables
    echo "<h2>2. Vérification des tables</h2>";
    $tables = ['orders', 'products', 'customers', 'categories', 'inventory_settings', 'order_items'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table $table existe<br>";
        } else {
            echo "❌ Table $table manquante<br>";
        }
    }
    
    // Test des données réelles
    echo "<h2>3. Test des données réelles</h2>";
    
    // Commandes d'aujourd'hui
    $today = date('Y-m-d');
    echo "<h3>Commandes d'aujourd'hui ($today)</h3>";
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?");
    $stmt->execute([$today]);
    $todayOrders = $stmt->fetch()['count'];
    echo "Commandes aujourd'hui: $todayOrders<br>";
    
    // Chiffre d'affaires mensuel
    $thisMonth = date('Y-m');
    echo "<h3>Chiffre d'affaires mensuel ($thisMonth)</h3>";
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE DATE_FORMAT(created_at, '%Y-%m') = ? AND status != 'cancelled'");
    $stmt->execute([$thisMonth]);
    $monthlyRevenue = $stmt->fetch()['revenue'];
    echo "CA mensuel: " . number_format($monthlyRevenue, 0, ',', ' ') . " HTG<br>";
    
    // Produits en alerte
    echo "<h3>Produits en alerte</h3>";
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM products p
        JOIN inventory_settings i ON p.id = i.product_id
        WHERE p.inventory <= i.minimum_quantity
    ");
    $stmt->execute();
    $lowStockProducts = $stmt->fetch()['count'];
    echo "Produits en alerte: $lowStockProducts<br>";
    
    // Livraisons prévues
    echo "<h3>Livraisons prévues</h3>";
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')");
    $stmt->execute();
    $scheduledDeliveries = $stmt->fetch()['count'];
    echo "Livraisons prévues: $scheduledDeliveries<br>";
    
    // Alertes de stock détaillées
    echo "<h3>Alertes de stock détaillées</h3>";
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.name,
            p.inventory as current,
            i.minimum_quantity as minimum,
            'Caisses' as unit
        FROM products p
        JOIN inventory_settings i ON p.id = i.product_id
        WHERE p.inventory <= i.minimum_quantity
        ORDER BY (p.inventory / i.minimum_quantity) ASC
    ");
    $stmt->execute();
    $stockItems = $stmt->fetchAll();
    
    if (count($stockItems) > 0) {
        echo "Produits en alerte trouvés: " . count($stockItems) . "<br>";
        foreach ($stockItems as $item) {
            $percentage = round(($item['current'] / $item['minimum']) * 100);
            echo "- " . $item['name'] . ": " . $item['current'] . "/" . $item['minimum'] . " " . $item['unit'] . " (" . $percentage . "%)<br>";
        }
    } else {
        echo "Aucun produit en alerte trouvé<br>";
    }
    
    // Test de l'API dashboard.php
    echo "<h2>4. Test de l'API dashboard.php</h2>";
    
    // Test stats
    $_GET['action'] = 'stats';
    ob_start();
    include 'dashboard.php';
    $output = ob_get_clean();
    
    echo "<h3>Réponse API stats:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    $stats = json_decode($output, true);
    if ($stats) {
        echo "<h3>Statistiques décodées:</h3>";
        echo "- todayOrders: " . ($stats['todayOrders'] ?? 'N/A') . "<br>";
        echo "- monthlyRevenue: " . ($stats['monthlyRevenue'] ?? 'N/A') . "<br>";
        echo "- lowStockProducts: " . ($stats['lowStockProducts'] ?? 'N/A') . "<br>";
        echo "- scheduledDeliveries: " . ($stats['scheduledDeliveries'] ?? 'N/A') . "<br>";
    }
    
    // Test low-stock
    $_GET['action'] = 'low-stock';
    ob_start();
    include 'dashboard.php';
    $output = ob_get_clean();
    
    echo "<h3>Réponse API low-stock:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    $stockData = json_decode($output, true);
    if ($stockData && is_array($stockData)) {
        echo "<h3>Données de stock décodées:</h3>";
        echo "Nombre d'éléments: " . count($stockData) . "<br>";
        foreach ($stockData as $item) {
            echo "- " . $item['name'] . ": " . $item['current'] . "/" . $item['minimum'] . "<br>";
        }
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
    echo "Stack trace: " . $e->getTraceAsString() . "<br>";
}
?>
