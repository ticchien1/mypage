# Hướng dẫn cài đặt Website Analytics System

## Tổng quan
Hệ thống quản lý và thống kê truy cập website với các tính năng:
- Theo dõi lượt truy cập theo giờ và ngày
- Phân biệt tổng lượt truy cập và chủ thể thật (theo IP)
- Dashboard trực quan với biểu đồ
- Theo dõi thời gian thực
- Hỗ trợ nhiều trang web

## Cấu trúc dự án
```
website-analytics/
├── config/
│   └── database.php          # Cấu hình database
├── api/
│   ├── track.php            # API nhận dữ liệu tracking
│   └── stats.php            # API lấy thống kê
├── dashboard/
│   ├── index.html           # Trang dashboard
│   ├── styles.css           # CSS dashboard
│   └── dashboard.js         # JavaScript dashboard
├── tracking.js              # Mã JS để chèn vào website
├── database.sql             # Schema database
└── SETUP_GUIDE.md          # Hướng dẫn này
```

## Bước 1: Cài đặt Database

### 1.1. Tạo Database
```sql
-- Chạy file database.sql hoặc thực hiện các lệnh sau:
CREATE DATABASE website_analytics;
USE website_analytics;

-- Tạo các bảng như trong file database.sql
```

### 1.2. Cấu hình kết nối
Chỉnh sửa file `config/database.php`:
```php
define('DB_HOST', 'localhost');     // Host database
define('DB_NAME', 'website_analytics'); // Tên database
define('DB_USER', 'root');          // Username
define('DB_PASS', '');              // Password
```

## Bước 2: Cài đặt Backend

### 2.1. Upload files lên server
- Upload tất cả file PHP lên server web (Apache/Nginx)
- Đảm bảo PHP >= 7.4 và có extension PDO MySQL

### 2.2. Cấu hình Web Server
Ví dụ cho Apache `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [QSA,L]
```

### 2.3. Test API
Kiểm tra các endpoint:
- `GET /api/stats.php?action=domains` - Lấy danh sách domain
- `POST /api/track.php` - Nhận dữ liệu tracking

## Bước 3: Cấu hình Tracking

### 3.1. Chỉnh sửa tracking.js
Thay đổi URL API trong file `tracking.js`:
```javascript
const config = {
    apiUrl: 'https://yourdomain.com/api/track.php', // Thay bằng URL thật
    sessionTimeout: 30 * 60 * 1000,
    trackingEnabled: true
};
```

### 3.2. Chèn mã tracking vào website
Thêm vào trước thẻ `</body>` của mỗi trang web:
```html
<script src="https://yourdomain.com/tracking.js"></script>
```

Hoặc chèn trực tiếp:
```html
<script>
// Sao chép toàn bộ nội dung file tracking.js vào đây
// Và thay đổi apiUrl thành URL thật của bạn
</script>
```

## Bước 4: Cài đặt Dashboard

### 4.1. Upload dashboard
Upload thư mục `dashboard/` lên server

### 4.2. Cấu hình API URL
Chỉnh sửa trong file `dashboard/dashboard.js`:
```javascript
constructor() {
    this.apiBaseUrl = '../api/stats.php'; // Đảm bảo đường dẫn đúng
    // ...
}
```

### 4.3. Truy cập dashboard
Mở trình duyệt và truy cập: `https://yourdomain.com/dashboard/`

## Bước 5: Kiểm tra và Test

### 5.1. Test tracking
1. Truy cập một trang web đã chèn mã tracking
2. Mở Developer Console, kiểm tra không có lỗi
3. Kiểm tra database có dữ liệu mới

### 5.2. Test dashboard
1. Truy cập dashboard
2. Kiểm tra hiển thị dữ liệu
3. Test các tính năng filter, chọn ngày

## Tính năng nâng cao

### Custom Events
Bạn có thể track custom events:
```javascript
// Track button click
analytics.track('button_click', {
    button_name: 'subscribe',
    page: 'homepage'
});

// Track form submission
analytics.track('form_submit', {
    form_type: 'contact',
    success: true
});
```

### Cấu hình tracking
```javascript
// Disable tracking
analytics.config({
    trackingEnabled: false
});

// Change session timeout
analytics.config({
    sessionTimeout: 60 * 60 * 1000 // 1 hour
});
```

## Bảo mật

### 1. Bảo vệ API
Thêm authentication cho API nếu cần:
```php
// Trong api/stats.php
$validTokens = ['your-secret-token'];
$token = $_GET['token'] ?? '';
if (!in_array($token, $validTokens)) {
    http_response_code(401);
    exit('Unauthorized');
}
```

### 2. Rate Limiting
Thêm rate limiting để tránh spam:
```php
// Giới hạn số request từ một IP
$redis = new Redis();
$key = 'rate_limit:' . $ip;
$current = $redis->get($key);
if ($current > 100) { // Max 100 requests per hour
    http_response_code(429);
    exit('Rate limit exceeded');
}
$redis->incr($key);
$redis->expire($key, 3600);
```

### 3. CORS Security
Cấu hình CORS chặt chẽ hơn:
```php
// Chỉ cho phép domain cụ thể
$allowedOrigins = ['https://yourdomain.com', 'https://anotherdomain.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
```

## Tối ưu hiệu suất

### 1. Database Index
```sql
-- Thêm index cho truy vấn nhanh hơn
CREATE INDEX idx_visit_time ON visits(visit_time);
CREATE INDEX idx_domain_date ON hourly_stats(domain_id, date_hour);
```

### 2. Caching
Sử dụng Redis hoặc Memcached:
```php
$redis = new Redis();
$cacheKey = 'stats:' . $date . ':' . $domain;
$cached = $redis->get($cacheKey);
if ($cached) {
    return json_decode($cached, true);
}
// ... query database ...
$redis->setex($cacheKey, 300, json_encode($result)); // Cache 5 phút
```

### 3. Async Tracking
Sử dụng queue để xử lý tracking không đồng bộ:
```php
// Thêm job vào queue thay vì xử lý trực tiếp
$queue->push('ProcessVisit', $visitData);
```

## Troubleshooting

### Lỗi thường gặp:

1. **CORS Error**: Kiểm tra cấu hình CORS trong API
2. **Database Connection**: Kiểm tra thông tin database
3. **404 API**: Kiểm tra đường dẫn và cấu hình web server
4. **Không có dữ liệu**: Kiểm tra mã tracking đã chạy đúng chưa

### Debug:
```javascript
// Bật debug mode trong tracking
analytics.config({
    debug: true // Sẽ log thông tin ra console
});
```

```php
// Bật error reporting trong PHP
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

## Backup và Maintenance

### 1. Backup Database
```bash
mysqldump website_analytics > backup_$(date +%Y%m%d).sql
```

### 2. Clean old data
```sql
-- Xóa dữ liệu cũ hơn 6 tháng
DELETE FROM visits WHERE visit_time < DATE_SUB(NOW(), INTERVAL 6 MONTH);
DELETE FROM hourly_stats WHERE date_hour < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

### 3. Monitor logs
Thiết lập logging để theo dõi:
```php
error_log("Analytics: " . $message, 3, "/var/log/analytics.log");
```

## Support

Nếu có vấn đề, hãy kiểm tra:
1. Log của web server (Apache/Nginx)
2. Log PHP errors
3. Browser console
4. Database connection
5. File permissions

Chúc bạn sử dụng thành công! 🚀