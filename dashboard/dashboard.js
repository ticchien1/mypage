class AnalyticsDashboard {
    constructor() {
        this.apiBaseUrl = '../api/stats.php';
        this.currentDate = new Date().toISOString().split('T')[0];
        this.currentType = 'total';
        this.selectedDomain = '';
        this.charts = {};
        this.refreshInterval = null;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setInitialDate();
        await this.loadInitialData();
        this.startAutoRefresh();
    }
    
    setupEventListeners() {
        // Date picker
        const datePicker = document.getElementById('datePicker');
        datePicker.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.loadDashboardData();
        });
        
        // View toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentType = e.target.dataset.type;
                this.loadDashboardData();
            });
        });
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadDashboardData();
        });
        
        // Domain filter
        document.getElementById('domainFilter').addEventListener('change', (e) => {
            this.selectedDomain = e.target.value;
            this.loadHourlyChart();
        });
    }
    
    setInitialDate() {
        document.getElementById('datePicker').value = this.currentDate;
    }
    
    async loadInitialData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadDomains(),
                this.loadDashboardData()
            ]);
        } catch (error) {
            this.showError('Không thể tải dữ liệu. Vui lòng thử lại.');
            console.error('Error loading initial data:', error);
        } finally {
            this.hideLoading();
        }
    }
    
    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadOverviewStats(),
                this.loadHourlyChart(),
                this.loadDailyChart(),
                this.loadRealtimeStats()
            ]);
        } catch (error) {
            this.showError('Không thể tải dữ liệu dashboard.');
            console.error('Error loading dashboard data:', error);
        }
    }
    
    async loadDomains() {
        try {
            const response = await fetch(`${this.apiBaseUrl}?action=domains`);
            const domains = await response.json();
            
            this.updateDomainsCount(domains.length);
            this.renderDomainsList(domains);
            this.updateDomainFilter(domains);
            
            return domains;
        } catch (error) {
            console.error('Error loading domains:', error);
            throw error;
        }
    }
    
    async loadOverviewStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}?action=domains`);
            const domains = await response.json();
            
            let totalVisits = 0;
            let totalUnique = 0;
            
            domains.forEach(domain => {
                totalVisits += parseInt(domain.today_visits) || 0;
                totalUnique += parseInt(domain.today_unique) || 0;
            });
            
            this.updateOverviewStats(totalVisits, totalUnique, domains.length);
        } catch (error) {
            console.error('Error loading overview stats:', error);
            throw error;
        }
    }
    
    async loadHourlyChart() {
        try {
            const params = new URLSearchParams({
                action: 'hourly',
                date: this.currentDate,
                type: this.currentType
            });
            
            if (this.selectedDomain) {
                params.append('domain', this.selectedDomain);
            }
            
            const response = await fetch(`${this.apiBaseUrl}?${params}`);
            const data = await response.json();
            
            this.renderHourlyChart(data);
        } catch (error) {
            console.error('Error loading hourly chart:', error);
            throw error;
        }
    }
    
    async loadDailyChart() {
        try {
            const params = new URLSearchParams({
                action: 'daily',
                type: this.currentType
            });
            
            if (this.selectedDomain) {
                params.append('domain', this.selectedDomain);
            }
            
            const response = await fetch(`${this.apiBaseUrl}?${params}`);
            const data = await response.json();
            
            this.renderDailyChart(data);
        } catch (error) {
            console.error('Error loading daily chart:', error);
            throw error;
        }
    }
    
    async loadRealtimeStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}?action=realtime`);
            const data = await response.json();
            
            let totalRealtime = 0;
            data.forEach(item => {
                totalRealtime += parseInt(item.visits) || 0;
            });
            
            this.updateRealtimeStats(totalRealtime);
        } catch (error) {
            console.error('Error loading realtime stats:', error);
        }
    }
    
    updateOverviewStats(totalVisits, totalUnique, activeDomains) {
        document.getElementById('totalVisitsToday').textContent = this.formatNumber(totalVisits);
        document.getElementById('uniqueVisitorsToday').textContent = this.formatNumber(totalUnique);
        document.getElementById('activeDomains').textContent = activeDomains;
    }
    
    updateRealtimeStats(realtimeVisitors) {
        const element = document.getElementById('realtimeVisitors');
        element.textContent = this.formatNumber(realtimeVisitors);
        
        if (realtimeVisitors > 0) {
            element.classList.add('pulse');
        } else {
            element.classList.remove('pulse');
        }
    }
    
    updateDomainsCount(count) {
        document.getElementById('domainsSummary').textContent = `${count} trang web`;
    }
    
    renderDomainsList(domains) {
        const container = document.getElementById('domainsList');
        
        if (domains.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Chưa có trang web nào được theo dõi</p>';
            return;
        }
        
        container.innerHTML = domains.map(domain => `
            <div class="domain-item fade-in" data-domain="${domain.domain_name}">
                <div class="domain-name">${domain.domain_name}</div>
                <div class="domain-stats">
                    <div class="stat">
                        <div class="stat-number">${this.formatNumber(domain.today_visits)}</div>
                        <div>Lượt truy cập</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${this.formatNumber(domain.today_unique)}</div>
                        <div>Chủ thể thật</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers for domain items
        container.querySelectorAll('.domain-item').forEach(item => {
            item.addEventListener('click', () => {
                const domain = item.dataset.domain;
                this.selectedDomain = domain;
                document.getElementById('domainFilter').value = domain;
                this.loadHourlyChart();
                this.showToast(`Đã chọn trang web: ${domain}`);
            });
        });
    }
    
    updateDomainFilter(domains) {
        const select = document.getElementById('domainFilter');
        select.innerHTML = '<option value="">Tất cả trang web</option>';
        
        domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain.domain_name;
            option.textContent = domain.domain_name;
            select.appendChild(option);
        });
    }
    
    renderHourlyChart(data) {
        const ctx = document.getElementById('hourlyChart').getContext('2d');
        
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }
        
        if (!data.domains || data.domains.length === 0) {
            this.showNoDataMessage('hourlyChart', 'Không có dữ liệu cho ngày đã chọn');
            return;
        }
        
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];
        
        const datasets = data.domains.map((domain, index) => ({
            label: domain,
            data: data.data[domain] || Array(24).fill(0),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }));
        
        this.charts.hourly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `Thống kê ${this.currentType === 'total' ? 'tổng lượt truy cập' : 'chủ thể thật'} - ${this.formatDate(data.date)}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    renderDailyChart(data) {
        const ctx = document.getElementById('dailyChart').getContext('2d');
        
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }
        
        if (!data || data.length === 0) {
            this.showNoDataMessage('dailyChart', 'Không có dữ liệu cho 30 ngày gần đây');
            return;
        }
        
        // Group data by date
        const groupedData = {};
        data.forEach(item => {
            if (!groupedData[item.date]) {
                groupedData[item.date] = 0;
            }
            groupedData[item.date] += parseInt(item.count) || 0;
        });
        
        const dates = Object.keys(groupedData).sort().reverse().slice(0, 30);
        const values = dates.map(date => groupedData[date]);
        
        this.charts.daily = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [{
                    label: this.currentType === 'total' ? 'Tổng lượt truy cập' : 'Chủ thể thật',
                    data: values,
                    backgroundColor: '#4f46e5',
                    borderColor: '#4f46e5',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `Xu hướng 30 ngày - ${this.currentType === 'total' ? 'Tổng lượt truy cập' : 'Chủ thể thật'}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    showNoDataMessage(chartId, message) {
        const canvas = document.getElementById(chartId);
        const container = canvas.parentElement;
        
        container.innerHTML = `
            <div class="chart-no-data">
                <p>${message}</p>
            </div>
        `;
        
        // Re-add canvas for future use
        setTimeout(() => {
            container.innerHTML = `<canvas id="${chartId}"></canvas>`;
        }, 100);
    }
    
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadRealtimeStats();
            this.loadOverviewStats();
        }, 5 * 60 * 1000);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
    
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit'
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AnalyticsDashboard();
});

// Handle page visibility change to pause/resume auto-refresh
document.addEventListener('visibilitychange', () => {
    if (window.dashboard) {
        if (document.hidden) {
            window.dashboard.stopAutoRefresh();
        } else {
            window.dashboard.startAutoRefresh();
        }
    }
});