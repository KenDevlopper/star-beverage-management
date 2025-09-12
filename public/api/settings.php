<?php
header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=star_beverage', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
            switch ($action) {
                case 'company':
                    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_group = 'company'");
                    $stmt->execute();
                    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
                    
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'name' => $settings['company_name'] ?? 'StarBeverage',
                            'logo' => $settings['company_logo'] ?? '',
                            'email' => $settings['company_email'] ?? 'contact@starbeverage.com',
                            'phone' => $settings['company_phone'] ?? '+1 555-123-4567',
                            'address' => $settings['company_address'] ?? '123 Beverage St, New York, NY 10001',
                            'primaryColor' => $settings['primary_color'] ?? '#1a365d',
                            'secondaryColor' => $settings['secondary_color'] ?? '#3182ce'
                        ]
                    ]);
                    break;

                case 'system':
                    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_group = 'system'");
                    $stmt->execute();
                    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            echo json_encode([
                'success' => true,
                        'data' => [
                            'currency' => $settings['currency'] ?? 'USD',
                            'dateFormat' => $settings['date_format'] ?? 'MM/DD/YYYY',
                            'timeFormat' => $settings['time_format'] ?? '24h',
                            'timezone' => $settings['timezone'] ?? 'UTC-5',
                            'language' => $settings['language'] ?? 'fr'
                        ]
                    ]);
                    break;

                case 'appearance':
                    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_group = 'appearance'");
                    $stmt->execute();
                    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            echo json_encode([
                'success' => true,
                        'data' => [
                            'theme' => $settings['theme'] ?? 'system',
                            'sidebarCollapsed' => $settings['sidebar_collapsed'] === 'true',
                            'denseMode' => $settings['dense_mode'] === 'true',
                            'tableStripes' => $settings['table_stripes'] === 'true',
                            'fontSize' => $settings['font_size'] ?? 'medium',
                            'animationLevel' => $settings['animation_level'] ?? 'medium',
                            'accentColor' => $settings['accent_color'] ?? '#3182ce'
                        ]
                    ]);
                    break;

                default:
            http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Action non spécifiée']);
        }
        break;
        
        case 'POST':
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
                throw new Exception("Données JSON invalides");
            }

            $pdo->beginTransaction();
            
            switch ($action) {
                case 'company':
                    $companyFields = [
                        'company_name' => $data['name'] ?? '',
                        'company_logo' => $data['logo'] ?? '',
                        'company_email' => $data['email'] ?? '',
                        'company_phone' => $data['phone'] ?? '',
                        'company_address' => $data['address'] ?? '',
                        'primary_color' => $data['primaryColor'] ?? '',
                        'secondary_color' => $data['secondaryColor'] ?? ''
                    ];

                    $updateStmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES (?, ?, 'company', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP");
                    
                    foreach ($companyFields as $key => $value) {
                        $updateStmt->execute([$key, $value, "Paramètre $key"]);
                    }
                    break;

                case 'system':
                    $systemFields = [
                        'currency' => $data['currency'] ?? '',
                        'date_format' => $data['dateFormat'] ?? '',
                        'time_format' => $data['timeFormat'] ?? '',
                        'timezone' => $data['timezone'] ?? '',
                        'language' => $data['language'] ?? ''
                    ];

                    $updateStmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES (?, ?, 'system', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP");
                    
                    foreach ($systemFields as $key => $value) {
                        $updateStmt->execute([$key, $value, "Paramètre $key"]);
                    }
                    break;

                case 'appearance':
                    $appearanceFields = [
                        'theme' => $data['theme'] ?? '',
                        'sidebar_collapsed' => $data['sidebarCollapsed'] ? 'true' : 'false',
                        'dense_mode' => $data['denseMode'] ? 'true' : 'false',
                        'table_stripes' => $data['tableStripes'] ? 'true' : 'false',
                        'font_size' => $data['fontSize'] ?? '',
                        'animation_level' => $data['animationLevel'] ?? '',
                        'accent_color' => $data['accentColor'] ?? ''
                    ];

                    $updateStmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value, setting_group, description) VALUES (?, ?, 'appearance', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP");
                    
                    foreach ($appearanceFields as $key => $value) {
                        $updateStmt->execute([$key, $value, "Paramètre $key"]);
                    }
                    break;

                default:
                    throw new Exception("Action non supportée");
            }
            
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Paramètres sauvegardés avec succès']);
        break;
        
    default:
        http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    error_log("Erreur dans settings.php: " . $e->getMessage());
    http_response_code(500);
        echo json_encode([
            'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
        ]);
}
?>