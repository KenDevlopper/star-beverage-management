<?php
// Script de test pour vérifier la connexion ByetHost
echo "=== TEST DE CONNEXION BYETHOST ===\n\n";

// Test 1: Vérifier PHP
echo "1. Version PHP: " . phpversion() . "\n";
echo "2. Extensions disponibles:\n";
$extensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'gd', 'zip'];
foreach ($extensions as $ext) {
    $status = extension_loaded($ext) ? "✅" : "❌";
    echo "   $status $ext\n";
}

// Test 2: Vérifier les permissions
echo "\n3. Permissions des dossiers:\n";
$dirs = ['public_html', 'public_html/api'];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        $writable = is_writable($dir) ? "✅" : "❌";
        echo "   $writable $dir (écriture)\n";
    } else {
        echo "   ❌ $dir (n'existe pas)\n";
    }
}

// Test 3: Vérifier la configuration
echo "\n4. Configuration serveur:\n";
echo "   Serveur: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "   Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "   Script Path: " . $_SERVER['SCRIPT_NAME'] . "\n";

// Test 4: Vérifier les variables d'environnement
echo "\n5. Variables d'environnement:\n";
$env_vars = ['HTTP_HOST', 'SERVER_NAME', 'REQUEST_METHOD'];
foreach ($env_vars as $var) {
    $value = isset($_SERVER[$var]) ? $_SERVER[$var] : 'Non défini';
    echo "   $var: $value\n";
}

echo "\n=== FIN DU TEST ===\n";
echo "Si tous les tests passent, vous pouvez procéder à l'upload des fichiers.\n";
?>
