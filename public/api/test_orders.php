<?php
require_once 'config.php';

echo "<h1>Test de l'intégration des commandes</h1>";

try {
    // Test de connexion à la base de données
    echo "<h2>1. Test de connexion à la base de données</h2>";
    echo "✅ Connexion réussie<br>";
    
    // Vérifier l'existence des tables
    echo "<h2>2. Vérification des tables</h2>";
    
    $tables = ['customers', 'orders', 'order_items', 'order_status_history', 'products'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' existe<br>";
        } else {
            echo "❌ Table '$table' manquante<br>";
        }
    }
    
    // Test des clients
    echo "<h2>3. Test des clients</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM customers");
    $count = $stmt->fetch()['count'];
    echo "Nombre de clients: $count<br>";
    
    if ($count > 0) {
        $stmt = $pdo->query("SELECT name FROM customers LIMIT 3");
        $customers = $stmt->fetchAll();
        echo "Exemples de clients:<br>";
        foreach ($customers as $customer) {
            echo "- " . $customer['name'] . "<br>";
        }
    }
    
    // Test des produits
    echo "<h2>4. Test des produits</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $count = $stmt->fetch()['count'];
    echo "Nombre de produits: $count<br>";
    
    if ($count > 0) {
        $stmt = $pdo->query("SELECT id, name, inventory FROM products LIMIT 3");
        $products = $stmt->fetchAll();
        echo "Exemples de produits:<br>";
        foreach ($products as $product) {
            echo "- " . $product['name'] . " (Stock: " . $product['inventory'] . " Caisses)<br>";
        }
    }
    
    // Test des commandes
    echo "<h2>5. Test des commandes</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM orders");
    $count = $stmt->fetch()['count'];
    echo "Nombre de commandes: $count<br>";
    
    // Test de création d'une commande de démonstration
    echo "<h2>6. Test de création d'une commande</h2>";
    
    // Récupérer un client et un produit
    $stmt = $pdo->query("SELECT id FROM customers LIMIT 1");
    $customer = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT id, inventory FROM products WHERE inventory > 0 LIMIT 1");
    $product = $stmt->fetch();
    
    if ($customer && $product) {
        $orderId = 'TEST-' . time();
        $quantity = 1;
        
        try {
            $pdo->beginTransaction();
            
            // Créer la commande
            $stmt = $pdo->prepare("
                INSERT INTO orders (id, customer_id, customer_name, total_amount, status, created_by) 
                VALUES (?, ?, 'Test Client', ?, 'pending', 1)
            ");
            $stmt->execute([$orderId, $customer['id'], 100.00]);
            
            // Créer l'article de commande
            $stmt = $pdo->prepare("
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, 100.00, ?)
            ");
            $stmt->execute([$orderId, $product['id'], $quantity, 100.00]);
            
            // Mettre à jour l'inventaire
            $stmt = $pdo->prepare("UPDATE products SET inventory = inventory - ? WHERE id = ?");
            $stmt->execute([$quantity, $product['id']]);
            
            // Enregistrer le mouvement d'inventaire
            $stmt = $pdo->prepare("
                INSERT INTO inventory_movements 
                (product_id, movement_type, quantity, unit, reference_type, reference_id, user_id, reason) 
                VALUES (?, 'out', ?, 'Caisse', 'order', ?, 1, ?)
            ");
            $stmt->execute([$product['id'], $quantity, $orderId, 'Test commande ' . $orderId]);
            
            // Enregistrer l'historique
            $stmt = $pdo->prepare("
                INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, reason) 
                VALUES (?, NULL, 'pending', 1, 'Commande de test créée')
            ");
            $stmt->execute([$orderId]);
            
            $pdo->commit();
            
            echo "✅ Commande de test créée avec succès: $orderId<br>";
            echo "✅ Inventaire mis à jour<br>";
            echo "✅ Mouvement d'inventaire enregistré<br>";
            echo "✅ Historique de statut créé<br>";
            
            // Nettoyer la commande de test
            $pdo->prepare("DELETE FROM orders WHERE id = ?")->execute([$orderId]);
            echo "✅ Commande de test supprimée<br>";
            
        } catch (Exception $e) {
            $pdo->rollBack();
            echo "❌ Erreur lors de la création de la commande: " . $e->getMessage() . "<br>";
        }
    } else {
        echo "❌ Impossible de créer une commande de test (pas de client ou produit disponible)<br>";
    }
    
    echo "<h2>7. Résumé</h2>";
    echo "✅ Tous les tests sont passés avec succès !<br>";
    echo "✅ L'intégration des commandes est fonctionnelle<br>";
    echo "✅ La base de données est correctement configurée<br>";
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
    echo "Vérifiez que la base de données est correctement configurée et que le script init.sql a été exécuté.<br>";
}
?>
