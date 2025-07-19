# Website Analytics System

Hệ thống quản lý và thống kê truy cập website hoàn chỉnh với HTML/CSS/JS frontend và PHP backend.

## 🚀 Tính năng chính

- ✅ **Theo dõi truy cập realtime** - Theo dõi lượt truy cập theo thời gian thực
- ✅ **Thống kê theo giờ** - Biểu đồ chi tiết từng giờ trong ngày  
- ✅ **Phân biệt chủ thể thật** - Lọc theo IP để loại bỏ bot/spam
- ✅ **Quản lý đa trang web** - Hỗ trợ nhiều domain trong một hệ thống
- ✅ **Dashboard trực quan** - Giao diện đẹp với biểu đồ tương tác
- ✅ **Responsive design** - Tương thích mọi thiết bị
- ✅ **API RESTful** - Backend PHP linh hoạt và mở rộng được

## 📊 Screenshots

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Analytics)

### Hourly Statistics  
![Charts](https://via.placeholder.com/800x300?text=Hourly+Charts)

## 🛠️ Công nghệ sử dụng

**Frontend:**
- HTML5, CSS3, JavaScript ES6+
- Chart.js cho biểu đồ
- Responsive design với CSS Grid/Flexbox

**Backend:**  
- PHP 7.4+ với PDO
- MySQL/MariaDB database
- RESTful API architecture

**Tracking:**
- Vanilla JavaScript (không dependency)
- Session management
- Event tracking (clicks, scroll, time on page)

## 📁 Cấu trúc dự án

```
website-analytics/
├── 📂 config/           # Cấu hình database
├── 📂 api/             # API endpoints (PHP)
├── 📂 dashboard/       # Frontend dashboard  
├── 📂 demo/           # Trang demo test
├── 📄 tracking.js     # Mã tracking cho websites
├── 📄 database.sql    # Database schema
└── 📄 SETUP_GUIDE.md  # Hướng dẫn cài đặt chi tiết
```

## ⚡ Quick Start

1. **Cài đặt database:**
```sql
mysql -u root -p < database.sql
```

2. **Cấu hình kết nối:** 
```php
// config/database.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'domainn4_track'); 
define('DB_USER', 'domainn4_track');
define('DB_PASS', 'domainn4_track');
```

3. **Chèn tracking code:**
```html
<script src="https://yourdomain.com/tracking.js"></script>
```

4. **Truy cập dashboard:**
```
https://yourdomain.com/dashboard/
```

## 🎯 Tính năng nâng cao

- **Custom Events:** Track button clicks, form submissions
- **Session Management:** Automatic session tracking  
- **Scroll Depth:** Monitor user engagement
- **Real-time Updates:** Auto-refresh every 5 minutes
- **Date Filtering:** View statistics for any date
- **Domain Filtering:** Focus on specific websites

## 📈 Metrics được theo dõi

| Metric | Mô tả |
|--------|-------|
| **Page Views** | Tổng số lượt xem trang |
| **Unique Visitors** | Số IP duy nhất (chủ thể thật) |
| **Session Duration** | Thời gian ở lại trang |
| **Bounce Rate** | Tỷ lệ thoát nhanh |
| **Real-time Active** | Người dùng online hiện tại |
| **Hourly Distribution** | Phân bố truy cập theo giờ |

## 🔧 Cài đặt chi tiết

Xem file [SETUP_GUIDE.md](SETUP_GUIDE.md) để có hướng dẫn cài đặt chi tiết từng bước.

## 🧪 Demo & Test

Mở file `demo/test-page.html` để test tracking functionality trước khi triển khai thực tế.

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License - Xem file LICENSE để biết chi tiết.

---

Được phát triển với ❤️ cho cộng đồng Vietnamese developers