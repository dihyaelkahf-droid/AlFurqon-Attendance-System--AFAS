// Utility Functions
class Utils {
    // Formatting
    static formatDate(dateStr, withDay = false) {
        if (!dateStr) return '-';
        
        const date = new Date(dateStr);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        if (withDay) {
            options.weekday = 'long';
        }
        
        return date.toLocaleDateString('id-ID', options);
    }

    static formatTime(timeStr) {
        if (!timeStr) return '-';
        return timeStr;
    }

    static formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '-';
        return new Date(dateTimeStr).toLocaleString('id-ID');
    }

    static getStatusBadge(status) {
        const badges = {
            'Hadir': 'success',
            'Izin': 'warning',
            'Sakit': 'info',
            'Cuti': 'primary',
            'Alfa': 'danger'
        };
        return `<span class="badge bg-${badges[status] || 'secondary'}">${status}</span>`;
    }

    static getLateBadge(minutes) {
        if (!minutes || minutes <= 0) return '';
        return `<span class="badge bg-danger">Telat ${minutes}m</span>`;
    }

    // Time functions
    static getCurrentTime() {
        return new Date().toTimeString().split(' ')[0].substring(0, 5);
    }

    static getCurrentDateTime() {
        return new Date().toLocaleString('id-ID');
    }

    static getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    static isWeekend() {
        return new Date().getDay() === 0;
    }

    // UI Components
    static showToast(message, type = 'success') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static showLoading(message = 'Memproses...') {
        const loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    static hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.remove();
    }

    static confirm(title, message, confirmText = 'Ya', cancelText = 'Batal') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn btn-primary" id="confirmBtn">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const modalInstance = new bootstrap.Modal(modal);
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });
            
            document.getElementById('confirmBtn').addEventListener('click', () => {
                modalInstance.hide();
                resolve(true);
            });
            
            modalInstance.show();
        });
    }

    static showModal(title, body, size = '', footer = '') {
        // Remove existing modal if any
        const existingModal = document.getElementById('customModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'customModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog ${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        return modalInstance;
    }

    // Form validation
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[0-9]{10,13}$/;
        return re.test(phone);
    }

    // Data manipulation
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }

    static sortBy(array, key, order = 'asc') {
        return array.sort((a, b) => {
            if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true;
                return String(item[key]).toLowerCase().includes(filters[key].toLowerCase());
            });
        });
    }

    // Date functions
    static getDaysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }

    static getMonthName(month) {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[month - 1];
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static getDateRange(type) {
        const today = new Date();
        const start = new Date();
        const end = new Date();
        
        switch (type) {
            case 'today':
                return { start: today, end: today };
                
            case 'week':
                start.setDate(today.getDate() - today.getDay() + 1);
                end.setDate(start.getDate() + 6);
                return { start, end };
                
            case 'month':
                start.setDate(1);
                end.setMonth(today.getMonth() + 1, 0);
                return { start, end };
                
            case 'year':
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                return { start, end };
                
            default:
                return { start, end };
        }
    }

    // Export functions
    static exportToCSV(data, filename) {
        if (!data.length) {
            this.showToast('Tidak ada data untuk diekspor', 'error');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => 
                `"${String(row[header] || '').replace(/"/g, '""')}"`
            ).join(','))
        ].join('\n');
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, filename + '.csv');
    }

    static downloadFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    static printElement(elementId) {
        const printContent = document.getElementById(elementId).innerHTML;
        const originalContent = document.body.innerHTML;
        
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        location.reload();
    }

    // DOM manipulation
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'dataset') {
                Object.keys(attributes[key]).forEach(dataKey => {
                    element.dataset[dataKey] = attributes[key][dataKey];
                });
            } else if (key.startsWith('on')) {
                element.addEventListener(key.substring(2).toLowerCase(), attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    static debounce(func, wait) {
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

    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Auto update current time
    function updateCurrentTime() {
        const timeElements = document.querySelectorAll('.current-time');
        if (timeElements.length > 0) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            timeElements.forEach(el => {
                el.textContent = timeString;
            });
        }
    }
    
    // Update time every second
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
    
    // Add active class to current nav link
    const currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
    
    // Handle back button
    window.addEventListener('popstate', function() {
        auth.redirectBasedOnRole();
    });
});