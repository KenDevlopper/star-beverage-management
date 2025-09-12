<?php
require_once 'config.php';

echo "<h1>Test de l'API inventory.php corrigée</h1>";

try {
    echo "<h2>Test de l'API inventory.php</h2>";
    
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    include 'inventory.php';
    $output = ob_get_clean();
    
    echo "<h3>Réponse de l'API:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    $inventory = json_decode($output, true);
    if ($inventory && is_array($inventory)) {
        echo "<h3>✅ Succès - " . count($inventory) . " produits récupérés</h3>";
        
        if (count($inventory) > 0) {
            echo "<h4>Premier produit:</h4>";
            $first = $inventory[0];
            echo "- ID: " . ($first['id'] ?? 'N/A') . "<br>";
            echo "- Nom: " . ($first['name'] ?? 'N/A') . "<br>";
            echo "- Stock: " . ($first['inventory'] ?? 'N/A') . " " . ($first['unit'] ?? 'N/A') . "<br>";
            echo "- Minimum: " . ($first['minimum_quantity'] ?? 'N/A') . "<br>";
            echo "- Statut: " . ($first['status_text'] ?? 'N/A') . "<br>";
        }
        
        echo "<h4>Tous les produits:</h4>";
        foreach ($inventory as $item) {
            echo "- " . $item['name'] . ": " . $item['inventory'] . " " . $item['unit'] . " (" . $item['status_text'] . ")<br>";
        }
    } else {
        echo "<h3>❌ Erreur - Réponse invalide</h3>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo "Erreur: " . $e->getMessage() . "<br>";
}
?>
