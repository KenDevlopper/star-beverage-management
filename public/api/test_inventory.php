<?php
require_once 'config.php';

// Test de connexion et des tables
try {
    echo "<h2>Test de connexion à la base de données</h2>";
    
    // Vérifier la connexion
    if ($pdo) {
        echo "✅ Connexion à la base de données réussie<br>";
    } else {
        echo "❌ Échec de la connexion à la base de données<br>";
        exit;
    }
    
    // Vérifier les tables
    $tables = ['products', 'categories', 'inventory_settings', 'inventory_movements', 'inventory_adjustments'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' existe<br>";
        } else {
            echo "❌ Table '$table' n'existe pas<br>";
        }
    }
    
    // Test de la requête d'inventaire
    echo "<h3>Test de la requête d'inventaire</h3>";
    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.id,
                p.name,
                p.inventory,
                p.unit,
                p.status,
                c.name as category_name,
                COALESCE(ins.minimum_quantity, 5) as minimum_quantity,
                COALESCE(ins.reorder_point, 5) as reorder_point,
                CASE 
                    WHEN p.inventory <= 0 THEN 'Rupture de stock'
                    WHEN p.inventory < COALESCE(ins.minimum_quantity, 5) THEN 'Stock limité'
                    ELSE 'En stock'
                END as status_text
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN inventory_settings ins ON p.id = ins.product_id
            WHERE p.status = 'active'
            ORDER BY p.name
        ");
        $stmt->execute();
        $inventory = $stmt->fetchAll();
        
        echo "✅ Requête d'inventaire réussie - " . count($inventory) . " produits trouvés<br>";
        
        if (count($inventory) > 0) {
            echo "<h4>Premier produit :</h4>";
            echo "<pre>" . print_r($inventory[0], true) . "</pre>";
        }
        
    } catch (PDOException $e) {
        echo "❌ Erreur dans la requête d'inventaire: " . $e->getMessage() . "<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur générale: " . $e->getMessage() . "<br>";
}
?>
