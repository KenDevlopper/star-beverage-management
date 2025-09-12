<?php
require_once 'config.php';

echo "<h1>Test simple de l'API inventory.php</h1>";

try {
    // Test direct de l'API
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    ob_start();
    include 'inventory.php';
    $output = ob_get_clean();
    
    echo "<h2>Réponse de l'API:</h2>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    $inventory = json_decode($output, true);
    if ($inventory && is_array($inventory)) {
        echo "<h2>✅ Succès - " . count($inventory) . " produits récupérés</h2>";
        
        if (count($inventory) > 0) {
            echo "<h3>Premier produit:</h3>";
            $first = $inventory[0];
            echo "- ID: " . ($first['id'] ?? 'N/A') . "<br>";
            echo "- Nom: " . ($first['name'] ?? 'N/A') . "<br>";
            echo "- Stock: " . ($first['inventory'] ?? 'N/A') . " " . ($first['unit'] ?? 'N/A') . "<br>";
            echo "- Minimum: " . ($first['minimum_quantity'] ?? 'N/A') . "<br>";
            echo "- Statut: " . ($first['status_text'] ?? 'N/A') . "<br>";
        }
    } else {
        echo "<h2>❌ Erreur - Réponse invalide</h2>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
}
?>
