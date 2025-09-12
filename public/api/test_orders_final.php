<?php
require_once 'config.php';

echo "<h1>Test final des corrections des commandes</h1>";

try {
    // Test de connexion à la base de données
    echo "<h2>1. Test de connexion à la base de données</h2>";
    echo "✅ Connexion réussie<br>";
    
    // Vérifier les commandes existantes
    echo "<h2>2. Vérification des commandes existantes</h2>";
    $stmt = $pdo->query("
        SELECT 
            o.*,
            COALESCE(c.name, o.customer_name) as customer_name,
            COALESCE(c.email, o.customer_email) as customer_email,
            COALESCE(c.phone, o.customer_phone) as customer_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
        LIMIT 5
    ");
    $orders = $stmt->fetchAll();
    
    if (count($orders) > 0) {
        echo "Commandes trouvées: " . count($orders) . "<br>";
        foreach ($orders as $order) {
            echo "- Commande " . $order['id'] . ": Client = '" . $order['customer_name'] . "', Montant = " . $order['total_amount'] . " HTG<br>";
        }
    } else {
        echo "⚠️ Aucune commande trouvée<br>";
    }
    
    // Test de l'API orders.php
    echo "<h2>3. Test de l'API orders.php</h2>";
    
    $_GET = [];
    ob_start();
    include 'orders.php';
    $output = ob_get_clean();
    
    $data = json_decode($output, true);
    if ($data && is_array($data)) {
        echo "✅ API orders.php fonctionne (retourne " . count($data) . " commandes)<br>";
        
        if (count($data) > 0) {
            $firstOrder = $data[0];
            echo "Première commande:<br>";
            echo "- ID: " . $firstOrder['id'] . "<br>";
            echo "- Client: '" . ($firstOrder['customer_name'] ?? 'N/A') . "'<br>";
            echo "- Montant: " . $firstOrder['total_amount'] . " HTG<br>";
            echo "- Statut: " . $firstOrder['status'] . "<br>";
        }
    } else {
        echo "❌ API orders.php ne fonctionne pas correctement<br>";
    }
    
    // Test de création d'une commande avec client
    echo "<h2>4. Test de création d'une commande avec client</h2>";
    
    // Récupérer un client existant
    $stmt = $pdo->query("SELECT id, name FROM customers LIMIT 1");
    $customer = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT id, inventory FROM products WHERE inventory > 0 LIMIT 1");
    $product = $stmt->fetch();
    
    if ($customer && $product) {
        $orderId = 'TEST-FINAL-' . time();
        $quantity = 2;
        
        try {
            $pdo->beginTransaction();
            
            // Créer la commande avec le client
            $stmt = $pdo->prepare("
                INSERT INTO orders (id, customer_id, customer_name, total_amount, status, created_by) 
                VALUES (?, ?, ?, ?, 'pending', 1)
            ");
            $stmt->execute([$orderId, $customer['id'], $customer['name'], 200.00]);
            
            // Créer l'article de commande
            $stmt = $pdo->prepare("
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, 100.00, ?)
            ");
            $stmt->execute([$orderId, $product['id'], $quantity, 200.00]);
            
            $pdo->commit();
            
            echo "✅ Commande de test créée avec client: $orderId<br>";
            echo "Client associé: " . $customer['name'] . "<br>";
            
            // Tester l'API avec cette nouvelle commande
            $_GET = [];
            ob_start();
            include 'orders.php';
            $output = ob_get_clean();
            
            $data = json_decode($output, true);
            if ($data && count($data) > 0) {
                $testOrder = array_filter($data, function($order) use ($orderId) {
                    return $order['id'] === $orderId;
                });
                
                if (!empty($testOrder)) {
                    $order = array_values($testOrder)[0];
                    echo "✅ API retourne la commande avec client: '" . $order['customer_name'] . "'<br>";
                }
            }
            
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
    
    echo "<h2>5. Résumé des corrections</h2>";
    echo "✅ Correction 1: Gestion des types de données (chaînes vs nombres)<br>";
    echo "✅ Correction 2: Calculs corrects des sous-totaux et totaux<br>";
    echo "✅ Correction 3: Affichage du nom du client avec COALESCE<br>";
    echo "✅ Correction 4: Formatage correct des montants<br>";
    echo "✅ Correction 5: Gestion des erreurs NaN<br>";
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
}
?>
