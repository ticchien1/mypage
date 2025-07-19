-- Tạo database và bảng cho hệ thống tracking
CREATE DATABASE IF NOT EXISTS domainn4_track;
USE domainn4_track;

-- Bảng lưu thông tin tên miền
CREATE TABLE IF NOT EXISTS domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Bảng lưu thông tin truy cập
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    page_url TEXT,
    referrer TEXT,
    visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    INDEX idx_domain_time (domain_id, visit_time),
    INDEX idx_ip_time (ip_address, visit_time),
    INDEX idx_session (session_id)
);

-- Bảng thống kê theo giờ (để tối ưu truy vấn)
CREATE TABLE IF NOT EXISTS hourly_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT NOT NULL,
    date_hour DATETIME NOT NULL,
    total_visits INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    UNIQUE KEY unique_domain_hour (domain_id, date_hour),
    INDEX idx_date_hour (date_hour)
);

-- Insert một số domain mẫu
INSERT INTO domains (domain_name) VALUES 
('example1.com'),
('example2.com'),
('example3.com');