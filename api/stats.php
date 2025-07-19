<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once '../config/database.php';

try {
    $db = new Database();
    
    $action = $_GET['action'] ?? 'hourly';
    $date = $_GET['date'] ?? date('Y-m-d');
    $domain = $_GET['domain'] ?? null;
    $type = $_GET['type'] ?? 'total'; // total hoặc unique
    
    switch ($action) {
        case 'hourly':
            echo json_encode(getHourlyStats($db, $date, $domain, $type));
            break;
            
        case 'domains':
            echo json_encode(getDomains($db));
            break;
            
        case 'daily':
            echo json_encode(getDailyStats($db, $domain, $type));
            break;
            
        case 'realtime':
            echo json_encode(getRealtimeStats($db, $domain));
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getHourlyStats($db, $date, $domain = null, $type = 'total') {
    $startDate = $date . ' 00:00:00';
    $endDate = $date . ' 23:59:59';
    
    if ($domain) {
        // Stats cho một domain cụ thể
        $domainCondition = "AND d.domain_name = ?";
        $params = [$startDate, $endDate, $domain];
    } else {
        // Stats cho tất cả domain
        $domainCondition = "";
        $params = [$startDate, $endDate];
    }
    
    $column = $type === 'unique' ? 'unique_visitors' : 'total_visits';
    
    $sql = "SELECT 
                HOUR(hs.date_hour) as hour,
                d.domain_name,
                COALESCE(SUM(hs.$column), 0) as count
            FROM domains d
            LEFT JOIN hourly_stats hs ON d.id = hs.domain_id 
                AND hs.date_hour >= ? AND hs.date_hour <= ?
            WHERE d.status = 'active' $domainCondition
            GROUP BY d.domain_name, HOUR(hs.date_hour)
            ORDER BY d.domain_name, hour";
    
    $stmt = $db->query($sql, $params);
    $results = $stmt->fetchAll();
    
    // Tạo cấu trúc dữ liệu cho chart
    $data = [];
    $domains = [];
    
    foreach ($results as $row) {
        if (!in_array($row['domain_name'], $domains)) {
            $domains[] = $row['domain_name'];
        }
        
        if (!isset($data[$row['domain_name']])) {
            $data[$row['domain_name']] = array_fill(0, 24, 0);
        }
        
        if ($row['hour'] !== null) {
            $data[$row['domain_name']][$row['hour']] = (int)$row['count'];
        }
    }
    
    return [
        'domains' => $domains,
        'data' => $data,
        'date' => $date,
        'type' => $type
    ];
}

function getDomains($db) {
    $sql = "SELECT d.domain_name, d.status, d.created_at,
                COALESCE(today_stats.visits, 0) as today_visits,
                COALESCE(today_stats.unique_visitors, 0) as today_unique
            FROM domains d
            LEFT JOIN (
                SELECT domain_id, 
                       SUM(total_visits) as visits,
                       SUM(unique_visitors) as unique_visitors
                FROM hourly_stats 
                WHERE DATE(date_hour) = CURDATE()
                GROUP BY domain_id
            ) today_stats ON d.id = today_stats.domain_id
            WHERE d.status = 'active'
            ORDER BY today_visits DESC";
    
    $stmt = $db->query($sql);
    return $stmt->fetchAll();
}

function getDailyStats($db, $domain = null, $type = 'total') {
    $column = $type === 'unique' ? 'unique_visitors' : 'total_visits';
    
    if ($domain) {
        $domainCondition = "AND d.domain_name = ?";
        $params = [$domain];
    } else {
        $domainCondition = "";
        $params = [];
    }
    
    $sql = "SELECT 
                DATE(hs.date_hour) as date,
                d.domain_name,
                SUM(hs.$column) as count
            FROM hourly_stats hs
            JOIN domains d ON hs.domain_id = d.id
            WHERE DATE(hs.date_hour) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                AND d.status = 'active' $domainCondition
            GROUP BY DATE(hs.date_hour), d.domain_name
            ORDER BY date DESC, d.domain_name";
    
    $stmt = $db->query($sql, $params);
    return $stmt->fetchAll();
}

function getRealtimeStats($db, $domain = null) {
    if ($domain) {
        $domainCondition = "AND d.domain_name = ?";
        $params = [$domain];
    } else {
        $domainCondition = "";
        $params = [];
    }
    
    // Lấy stats 5 phút gần nhất
    $sql = "SELECT 
                d.domain_name,
                COUNT(*) as visits,
                COUNT(DISTINCT v.ip_address) as unique_visitors,
                MAX(v.visit_time) as last_visit
            FROM visits v
            JOIN domains d ON v.domain_id = d.id
            WHERE v.visit_time >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                AND d.status = 'active' $domainCondition
            GROUP BY d.domain_name
            ORDER BY visits DESC";
    
    $stmt = $db->query($sql, $params);
    return $stmt->fetchAll();
}
?>