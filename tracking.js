(function() {
    'use strict';
    
    // Cấu hình
    const config = {
        apiUrl: 'https://yourdomain.com/api/track.php', // Thay đổi thành URL API của bạn
        sessionTimeout: 30 * 60 * 1000, // 30 phút
        trackingEnabled: true
    };
    
    // Tạo hoặc lấy session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session', sessionId);
            sessionStorage.setItem('analytics_session_start', Date.now().toString());
        }
        
        // Kiểm tra timeout
        const sessionStart = parseInt(sessionStorage.getItem('analytics_session_start') || '0');
        if (Date.now() - sessionStart > config.sessionTimeout) {
            // Tạo session mới
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session', sessionId);
            sessionStorage.setItem('analytics_session_start', Date.now().toString());
        }
        
        return sessionId;
    }
    
    // Lấy domain name
    function getDomain() {
        return window.location.hostname;
    }
    
    // Gửi dữ liệu tracking
    function sendTrackingData(data) {
        if (!config.trackingEnabled) return;
        
        const payload = {
            domain: getDomain(),
            url: window.location.href,
            referrer: document.referrer || '',
            sessionId: getSessionId(),
            timestamp: Date.now(),
            ...data
        };
        
        // Sử dụng sendBeacon nếu có thể, fallback về fetch
        if (navigator.sendBeacon) {
            try {
                const blob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
                navigator.sendBeacon(config.apiUrl, blob);
                return;
            } catch (e) {
                console.warn('SendBeacon failed, falling back to fetch');
            }
        }
        
        // Fallback về fetch
        fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(error => {
            console.warn('Analytics tracking failed:', error);
        });
    }
    
    // Track page view
    function trackPageView() {
        sendTrackingData({
            event: 'pageview',
            title: document.title,
            path: window.location.pathname
        });
    }
    
    // Track events
    function trackEvent(eventName, eventData = {}) {
        sendTrackingData({
            event: eventName,
            data: eventData
        });
    }
    
    // Theo dõi thời gian ở lại trang
    let pageStartTime = Date.now();
    let isVisible = true;
    
    function trackTimeOnPage() {
        if (isVisible) {
            const timeOnPage = Date.now() - pageStartTime;
            sendTrackingData({
                event: 'time_on_page',
                duration: timeOnPage
            });
        }
    }
    
    // Theo dõi visibility changes
    function handleVisibilityChange() {
        if (document.hidden) {
            isVisible = false;
            trackTimeOnPage();
        } else {
            isVisible = true;
            pageStartTime = Date.now();
        }
    }
    
    // Theo dõi clicks
    function trackClicks() {
        document.addEventListener('click', function(e) {
            const target = e.target;
            if (target.tagName === 'A') {
                trackEvent('link_click', {
                    url: target.href,
                    text: target.textContent.trim().substring(0, 100)
                });
            }
        });
    }
    
    // Theo dõi scroll depth
    let maxScrollDepth = 0;
    function trackScrollDepth() {
        const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            
            // Gửi milestone scroll depths
            if (maxScrollDepth >= 25 && maxScrollDepth < 50 && !window.analytics_scroll_25) {
                window.analytics_scroll_25 = true;
                trackEvent('scroll_depth', { depth: 25 });
            } else if (maxScrollDepth >= 50 && maxScrollDepth < 75 && !window.analytics_scroll_50) {
                window.analytics_scroll_50 = true;
                trackEvent('scroll_depth', { depth: 50 });
            } else if (maxScrollDepth >= 75 && maxScrollDepth < 90 && !window.analytics_scroll_75) {
                window.analytics_scroll_75 = true;
                trackEvent('scroll_depth', { depth: 75 });
            } else if (maxScrollDepth >= 90 && !window.analytics_scroll_90) {
                window.analytics_scroll_90 = true;
                trackEvent('scroll_depth', { depth: 90 });
            }
        }
    }
    
    // Khởi tạo tracking
    function init() {
        // Track page view ngay lập tức
        trackPageView();
        
        // Thiết lập event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', trackTimeOnPage);
        window.addEventListener('scroll', debounce(trackScrollDepth, 100));
        
        // Track clicks
        trackClicks();
        
        // Heartbeat để duy trì session
        setInterval(function() {
            if (isVisible) {
                trackEvent('heartbeat');
            }
        }, 60000); // Mỗi phút
    }
    
    // Utility function: debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Public API
    window.analytics = {
        track: trackEvent,
        config: function(newConfig) {
            Object.assign(config, newConfig);
        }
    };
    
    // Khởi tạo khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();