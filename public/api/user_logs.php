<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'session_middleware.php';

// Vérifier et expirer automatiquement les sessions expirées
checkAndExpireSessions($pdo);

try {

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Paramètres de filtrage
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $userId = $_GET['user_id'] ?? null;
            $action = $_GET['action'] ?? null;
            $target = $_GET['target'] ?? null;
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;
            $search = $_GET['search'] ?? null;

            // Construction de la requête
            $whereConditions = [];
            $params = [];

            if ($userId) {
                $whereConditions[] = "ul.user_id = ?";
                $params[] = $userId;
            }

            if ($action) {
                $whereConditions[] = "ul.action LIKE ?";
                $params[] = "%$action%";
            }

            if ($target) {
                $whereConditions[] = "ul.target LIKE ?";
                $params[] = "%$target%";
            }

            if ($dateFrom) {
                $whereConditions[] = "ul.created_at >= ?";
                $params[] = $dateFrom . " 00:00:00";
            }

            if ($dateTo) {
                $whereConditions[] = "ul.created_at <= ?";
                $params[] = $dateTo . " 23:59:59";
            }

            if ($search) {
                $whereConditions[] = "(ul.action LIKE ? OR ul.target LIKE ? OR ul.details LIKE ? OR u.name LIKE ?)";
                $searchParam = "%$search%";
                $params[] = $searchParam;
                $params[] = $searchParam;
                $params[] = $searchParam;
                $params[] = $searchParam;
            }

            $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";

            // Requête pour compter le total
            $countQuery = "
                SELECT COUNT(*) as total
                FROM user_logs ul
                LEFT JOIN users u ON ul.user_id = u.id
                $whereClause
            ";
            $countStmt = $pdo->prepare($countQuery);
            $countStmt->execute($params);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Requête principale
            $query = "
                SELECT 
                    ul.id,
                    ul.user_id,
                    ul.action,
                    ul.target,
                    ul.details,
                    ul.ip_address,
                    ul.user_agent,
                    ul.created_at,
                    ul.logout_time,
                    ul.session_duration,
                    u.name as user_name,
                    u.email as user_email,
                    u.role as user_role
                FROM user_logs ul
                LEFT JOIN users u ON ul.user_id = u.id
                $whereClause
                ORDER BY ul.created_at DESC
                LIMIT $limit OFFSET $offset
            ";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formater les données
            $formattedLogs = array_map(function($log) {
                // Calculer la durée de session formatée (seulement pour les déconnexions)
                $sessionDuration = null;
                if ($log['session_duration'] && $log['action'] === 'logout' && $log['session_duration'] > 0) {
                    $minutes = (int)$log['session_duration'];
                    if ($minutes < 60) {
                        $sessionDuration = $minutes . ' min';
                    } else {
                        $hours = floor($minutes / 60);
                        $remainingMinutes = $minutes % 60;
                        if ($remainingMinutes > 0) {
                            $sessionDuration = $hours . 'h ' . $remainingMinutes . 'min';
                        } else {
                            $sessionDuration = $hours . 'h';
                        }
                    }
                }
                
                return [
                    'id' => $log['id'],
                    'userId' => $log['user_id'],
                    'userName' => $log['user_name'] ?? 'Système',
                    'userEmail' => $log['user_email'],
                    'userRole' => $log['user_role'] ? ucfirst($log['user_role']) : null,
                    'action' => $log['action'],
                    'target' => $log['target'],
                    'details' => $log['details'],
                    'ipAddress' => $log['ip_address'],
                    'userAgent' => $log['user_agent'],
                    'timestamp' => $log['created_at'],
                    'logoutTime' => $log['logout_time'],
                    'sessionDuration' => $sessionDuration,
                    'sessionDurationMinutes' => $log['session_duration']
                ];
            }, $logs);

            // Statistiques des actions
            $statsQuery = "
                SELECT 
                    action,
                    COUNT(*) as count
                FROM user_logs ul
                LEFT JOIN users u ON ul.user_id = u.id
                $whereClause
                GROUP BY action
                ORDER BY count DESC
                LIMIT 10
            ";

            $statsStmt = $pdo->prepare($statsQuery);
            $statsStmt->execute($params); // Utiliser les mêmes paramètres que la requête principale
            $actionStats = $statsStmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => [
                    'logs' => $formattedLogs,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => (int)$total,
                        'pages' => ceil($total / $limit)
                    ],
                    'statistics' => [
                        'totalLogs' => (int)$total,
                        'actionStats' => $actionStats
                    ]
                ]
            ]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                throw new Exception("Données JSON invalides");
            }

            // Validation des données
            $requiredFields = ['action'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new Exception("Le champ '$field' est requis");
                }
            }

            $pdo->beginTransaction();

            $insertStmt = $pdo->prepare("
                INSERT INTO user_logs (user_id, action, target, details, ip_address, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $insertStmt->execute([
                $data['user_id'] ?? null,
                $data['action'],
                $data['target'] ?? null,
                $data['details'] ?? null,
                $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'] ?? null
            ]);

            $logId = $pdo->lastInsertId();

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Log créé avec succès',
                'data' => ['id' => $logId]
            ]);
            break;

        default:
            throw new Exception("Méthode non autorisée");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
