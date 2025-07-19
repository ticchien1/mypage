<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Xử lý OPTIONS request cho CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once '../config/database.php';

try {
    $db = new Database();
    
    // Lấy dữ liệu từ request
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($input['domain']) || !isset($input['url'])) {
        throw new Exception('Missing required fields');
    }
    
    $domain = filter_var($input['domain'], FILTER_SANITIZE_STRING);
    $url = filter_var($input['url'], FILTER_SANITIZE_URL);
    $referrer = isset($input['referrer']) ? filter_var($input['referrer'], FILTER_SANITIZE_URL) : '';
    $sessionId = isset($input['sessionId']) ? filter_var($input['sessionId'], FILTER_SANITIZE_STRING) : '';
    
    // Lấy thông tin client
    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Xử lý IPv6 và multiple IPs
    if (strpos($ipAddress, ',') !== false) {
        $ipAddress = trim(explode(',', $ipAddress)[0]);
    }
    
    // Kiểm tra hoặc tạo domain
    $stmt = $db->query("SELECT id FROM domains WHERE domain_name = ?", [$domain]);
    $domainRecord = $stmt->fetch();
    
    if (!$domainRecord) {
        $db->query("INSERT INTO domains (domain_name) VALUES (?)", [$domain]);
        $domainId = $db->lastInsertId();
    } else {
        $domainId = $domainRecord['id'];
    }
    
    // Lưu visit
    $db->query("INSERT INTO visits (domain_id, ip_address, user_agent, page_url, referrer, session_id) VALUES (?, ?, ?, ?, ?, ?)", 
        [$domainId, $ipAddress, $userAgent, $url, $referrer, $sessionId]);
    
    // Cập nhật hourly stats
    $currentHour = date('Y-m-d H:00:00');
    
    // Kiểm tra xem đã có record cho giờ này chưa
    $stmt = $db->query("SELECT id FROM hourly_stats WHERE domain_id = ? AND date_hour = ?", [$domainId, $currentHour]);
    $hourlyRecord = $stmt->fetch();
    
    if ($hourlyRecord) {
        // Cập nhật stats hiện có
        $db->query("UPDATE hourly_stats SET 
            total_visits = total_visits + 1,
            unique_visitors = (
                SELECT COUNT(DISTINCT ip_address) 
                FROM visits 
                WHERE domain_id = ? AND visit_time >= ? AND visit_time < DATE_ADD(?, INTERVAL 1 HOUR)
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?", 
            [$domainId, $currentHour, $currentHour, $hourlyRecord['id']]);
    } else {
        // Tạo record mới
        $uniqueVisitors = $db->query("SELECT COUNT(DISTINCT ip_address) as count FROM visits WHERE domain_id = ? AND visit_time >= ? AND visit_time < DATE_ADD(?, INTERVAL 1 HOUR)", 
            [$domainId, $currentHour, $currentHour])->fetch()['count'];
        
        $db->query("INSERT INTO hourly_stats (domain_id, date_hour, total_visits, unique_visitors) VALUES (?, ?, 1, ?)", 
            [$domainId, $currentHour, $uniqueVisitors]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Visit recorded']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>