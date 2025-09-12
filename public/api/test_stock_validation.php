<?php
require_once 'config.php';

echo "=== TEST DE VALIDATION DE STOCK ===\n\n";

try {
    // 1. Vérifier les stocks actuels
    echo "1. STOCKS ACTUELS:\n";
    $stmt = $pdo->query("SELECT id, name, inventory FROM products ORDER BY name");
    $products = $stmt->fetchAll();
    
    foreach ($products as $product) {
        echo "- " . $product['name'] . " (ID: " . $product['id'] . "): " . $product['inventory'] . " en stock\n";
    }
    
    // 2. Test de commande avec stock insuffisant
    echo "\n2. TEST DE COMMANDE AVEC STOCK INSUFFISANT:\n";
    
    $testOrderData = [
        'id' => 'TEST_STOCK_' . time(),
        'customer_name' => 'Test Client',
        'customer_email' => 'test@example.com',
        'customer_phone' => '123456789',
        'status' => 'pending',
        'notes' => 'Test de validation de stock',
        'items' => [
            [
                'productId' => 'PRD-458', // Cola Reall
                'quantity' => 1000, // Quantité énorme pour tester
                'unitPrice' => 1000
            ]
        ]
    ];
    
    echo "Données de test: " . json_encode($testOrderData) . "\n";
    
    // Simuler l'environnement de l'API
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $GLOBALS['test_input'] = json_encode($testOrderData);
    
    ob_start();
    include 'orders.php';
    $output = ob_get_clean();
    
    echo "Réponse API: " . $output . "\n";
    
    $result = json_decode($output, true);
    if ($result && isset($result['success'])) {
        if ($result['success']) {
            echo "❌ ERREUR: La commande a été acceptée alors qu'elle aurait dû être rejetée!\n";
        } else {
            echo "✅ SUCCÈS: La commande a été rejetée comme attendu\n";
            if (isset($result['errors'])) {
                echo "Erreurs détectées:\n";
                foreach ($result['errors'] as $error) {
                    echo "- " . $error . "\n";
                }
            }
        }
    } else {
        echo "❌ Réponse invalide de l'API\n";
    }
    
    // 3. Test de commande avec stock suffisant
    echo "\n3. TEST DE COMMANDE AVEC STOCK SUFFISANT:\n";
    
    $testOrderData2 = [
        'id' => 'TEST_STOCK_OK_' . time(),
        'customer_name' => 'Test Client 2',
        'customer_email' => 'test2@example.com',
        'customer_phone' => '123456789',
        'status' => 'pending',
        'notes' => 'Test de validation de stock OK',
        'items' => [
            [
                'productId' => 'PRD-458', // Cola Reall
                'quantity' => 1, // Quantité raisonnable
                'unitPrice' => 1000
            ]
        ]
    ];
    
    echo "Données de test: " . json_encode($testOrderData2) . "\n";
    
    $GLOBALS['test_input'] = json_encode($testOrderData2);
    
    ob_start();
    include 'orders.php';
    $output2 = ob_get_clean();
    
    echo "Réponse API: " . $output2 . "\n";
    
    $result2 = json_decode($output2, true);
    if ($result2 && isset($result2['success'])) {
        if ($result2['success']) {
            echo "✅ SUCCÈS: La commande a été acceptée comme attendu\n";
            
            // Nettoyer la commande de test
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
            $stmt->execute([$testOrderData2['id']]);
            echo "🧹 Commande de test supprimée\n";
        } else {
            echo "❌ ERREUR: La commande a été rejetée alors qu'elle aurait dû être acceptée\n";
        }
    } else {
        echo "❌ Réponse invalide de l'API\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DU TEST ===\n";
?>
