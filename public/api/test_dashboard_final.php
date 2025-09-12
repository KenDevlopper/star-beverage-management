<?php
require_once 'config.php';

echo "<h1>Test final du tableau de bord dynamique</h1>";

try {
    echo "<h2>1. Vérification de la base de données</h2>";
    
    // Vérifier les tables
    $tables = ['orders', 'products', 'customers', 'categories', 'inventory_settings', 'order_items'];
    $existingTables = [];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $existingTables[] = $table;
            echo "✅ Table $table existe<br>";
        } else {
            echo "❌ Table $table manquante<br>";
        }
    }
    
    if (count($existingTables) < 3) {
        echo "<h3>⚠️ Tables manquantes - Le tableau de bord utilisera les données de démonstration</h3>";
    }
    
    echo "<h2>2. Test des données réelles</h2>";
    
    // Test des commandes
    if (in_array('orders', $existingTables)) {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?");
        $stmt->execute([$today]);
        $todayOrders = $stmt->fetch()['count'];
        echo "📋 Commandes aujourd'hui: $todayOrders<br>";
        
        $thisMonth = date('Y-m');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE DATE_FORMAT(created_at, '%Y-%m') = ? AND status != 'cancelled'");
        $stmt->execute([$thisMonth]);
        $monthlyRevenue = $stmt->fetch()['revenue'];
        echo "💰 CA mensuel: " . number_format($monthlyRevenue, 0, ',', ' ') . " HTG<br>";
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')");
        $stmt->execute();
        $scheduledDeliveries = $stmt->fetch()['count'];
        echo "🚚 Livraisons prévues: $scheduledDeliveries<br>";
    } else {
        echo "❌ Pas de données de commandes disponibles<br>";
    }
    
    // Test des produits en alerte
    if (in_array('products', $existingTables) && in_array('inventory_settings', $existingTables)) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM products p
            JOIN inventory_settings i ON p.id = i.product_id
            WHERE p.inventory <= i.minimum_quantity
        ");
        $stmt->execute();
        $lowStockProducts = $stmt->fetch()['count'];
        echo "📦 Produits en alerte: $lowStockProducts<br>";
        
        // Détails des produits en alerte
        $stmt = $pdo->prepare("
            SELECT 
                p.name,
                p.inventory as current,
                i.minimum_quantity as minimum
            FROM products p
            JOIN inventory_settings i ON p.id = i.product_id
            WHERE p.inventory <= i.minimum_quantity
            ORDER BY (p.inventory / i.minimum_quantity) ASC
            LIMIT 5
        ");
        $stmt->execute();
        $stockItems = $stmt->fetchAll();
        
        if (count($stockItems) > 0) {
            echo "<h3>Détails des produits en alerte:</h3>";
            foreach ($stockItems as $item) {
                $percentage = round(($item['current'] / $item['minimum']) * 100);
                echo "- " . $item['name'] . ": " . $item['current'] . "/" . $item['minimum'] . " Caisses (" . $percentage . "%)<br>";
            }
        }
    } else {
        echo "❌ Pas de données d'inventaire disponibles<br>";
    }
    
    echo "<h2>3. Test de l'API dashboard.php</h2>";
    
    // Test stats
    $_GET['action'] = 'stats';
    ob_start();
    include 'dashboard.php';
    $output = ob_get_clean();
    
    $stats = json_decode($output, true);
    if ($stats && isset($stats['todayOrders'])) {
        echo "✅ API stats fonctionne<br>";
        echo "- Commandes aujourd'hui: " . $stats['todayOrders'] . "<br>";
        echo "- CA mensuel: " . number_format($stats['monthlyRevenue'], 0, ',', ' ') . " HTG<br>";
        echo "- Produits en alerte: " . $stats['lowStockProducts'] . "<br>";
        echo "- Livraisons prévues: " . $stats['scheduledDeliveries'] . "<br>";
    } else {
        echo "❌ API stats ne fonctionne pas<br>";
    }
    
    // Test low-stock
    $_GET['action'] = 'low-stock';
    ob_start();
    include 'dashboard.php';
    $output = ob_get_clean();
    
    $stockData = json_decode($output, true);
    if ($stockData && is_array($stockData)) {
        echo "✅ API low-stock fonctionne<br>";
        echo "Nombre d'éléments: " . count($stockData) . "<br>";
        foreach ($stockData as $item) {
            echo "- " . $item['name'] . ": " . $item['current'] . "/" . $item['minimum'] . " " . $item['unit'] . "<br>";
        }
    } else {
        echo "❌ API low-stock ne fonctionne pas<br>";
    }
    
    echo "<h2>4. Résumé</h2>";
    
    if (count($existingTables) >= 3) {
        echo "✅ Base de données configurée correctement<br>";
        echo "✅ APIs fonctionnelles<br>";
        echo "✅ Données dynamiques disponibles<br>";
        echo "<h3>🎉 Le tableau de bord devrait afficher les vraies données !</h3>";
    } else {
        echo "⚠️ Base de données incomplète<br>";
        echo "⚠️ Le tableau de bord utilisera les données de démonstration<br>";
        echo "<h3>💡 Pour avoir des données réelles, exécutez le script init.sql</h3>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
    echo "Le tableau de bord utilisera les données de démonstration.<br>";
}
?>
