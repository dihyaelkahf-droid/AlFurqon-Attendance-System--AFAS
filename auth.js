// ============================================
// AUTHENTICATION SYSTEM - ABSENSI KARYAWAN
// ============================================

class AuthSystem {
    constructor() {
        this.initializeDatabase();
        this.currentUser = null;
        this.checkSession();
    }

    // ============================================
    // 1. DATABASE INITIALIZATION
    // ============================================
    
    initializeDatabase() {
        // Employees table
        if (!localStorage.getItem('employees')) {
            const employees = [
                // ADMIN UTAMA
                { id: 1, name: 'Administrator', username: 'admin', password: 'admin123', role: 'admin' },
                
                // KARYAWAN
                { id: 2, name: 'Sutrisno', username: 'sutris', password: 'password123', role: 'employee' },
                { id: 3, name: 'Nita Sri Wahyuningrum, S.Pd', username: 'nita', password: 'password123', role: 'employee' },
                { id: 4, name: 'Heri Kurniawan', username: 'heri', password: 'password123', role: 'employee' },
                { id: 5, name: 'Yian Hidayatul Ulfa, S. Pd.', username: 'yian', password: 'password123', role: 'employee' },
                { id: 6, name: 'Diah Aprilia Devi, S.Pd', username: 'diah', password: 'password123', role: 'employee' },
                { id: 7, name: 'Teguh Setia Isma Ramadan', username: 'teguh', password: 'password123', role: 'employee' },
                { id: 8, name: 'Iskandar Kholif, S.Pd', username: 'iskandar', password: 'password123', role: 'employee' },
                { id: 9, name: 'Dinul Qoyyimah, S. Pd', username: 'dinul', password: 'password123', role: 'employee' },
                { id: 10, name: 'Endah Windarti, S.Pd', username: 'endah', password: 'password123', role: 'employee' },
                { id: 11, name: 'Citra Wulan Sari, S. Pd', username: 'citra', password: 'password123', role: 'employee' },
                { id: 12, name: 'Fajriansyah Abdillah', username: 'fajri', password: 'password123', role: 'employee' },
                { id: 13, name: 'Muh. Abdul Hamid, S.H.I', username: 'hamid', password: 'password123', role: 'employee' },
                { id: 14, name: 'Nurjayati, S.Pd', username: 'nurjayati', password: 'password123', role: 'employee' },
                { id: 15, name: 'Riswan Siregar, M.Pd', username: 'riswan', password: 'password123', role: 'employee' },
                { id: 16, name: 'Rizka Ulfiana, S. Tp', username: 'rizka', password: 'password123', role: 'employee' },
                { id: 17, name: 'Susi Dwi Ratna Sari, S.Pd', username: 'susi', password: 'password123', role: 'employee' },
                { id: 18, name: 'Usamah Hanif', username: 'usamah', password: 'password123', role: 'employee' },
                { id: 19, name: 'Zainap Assaihatus Syahidah S. Si', username: 'zainap', password: 'password123', role: 'employee' }
            ];
            localStorage.setItem('employees', JSON.stringify(employees));
        }
        
        // Attendances table
        if (!localStorage.getItem('attendances')) {
            localStorage.setItem('attendances', JSON.stringify([]));
        }
        
        // Holidays table
        if (!localStorage.getItem('holidays')) {
            localStorage.setItem('holidays', JSON.stringify([]));
        }
        
        // Login attempts (security)
        if (!localStorage.getItem('loginAttempts')) {
            localStorage.setItem('loginAttempts', JSON.stringify({}));
        }
        
        // Session tracking
        if (!localStorage.getItem('sessions')) {
            localStorage.setItem('sessions', JSON.stringify([]));
        }
    }

    // ============================================
    // 2. LOGIN & LOGOUT
    // ============================================
    
    login(username, password) {
        // Validasi input
        if (!username || !password) {
            return { success: false, message: 'Username dan password harus diisi' };
        }
        
        // Cegah brute force
        if (this.isAccountLocked(username)) {
            return { 
                success: false, 
                message: 'Akun terkunci. Coba lagi nanti.',
                locked: true 
            };
        }
        
        // Cari user
        const employees = JSON.parse(localStorage.getItem('employees'));
        const user = employees.find(e => e.username === username);
        
        if (!user) {
            this.recordFailedAttempt(username);
            return { success: false, message: 'Username tidak ditemukan' };
        }
        
        // Verifikasi password
        let isValid = false;
        
        // Admin password
        if (username === 'admin' && password === 'admin123') {
            isValid = true;
        }
        // Employee password
        else if (password === 'password123') {
            isValid = true;
        }
        
        if (!isValid) {
            this.recordFailedAttempt(username);
            const attempts = this.getFailedAttempts(username);
            const remaining = 5 - attempts;
            
            return { 
                success: false, 
                message: `Password salah. ${remaining} percobaan tersisa.`,
                attempts: attempts 
            };
        }
        
        // Reset failed attempts
        this.resetFailedAttempts(username);
        
        // Buat session
        const session = {
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            loginTime: new Date().toISOString(),
            sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ip: this.getClientInfo()
        };
        
        // Simpan session
        localStorage.setItem('currentUser', JSON.stringify(session));
        this.currentUser = session;
        
        // Log session
        this.logSession(session, 'login');
        
        // Update last login
        this.updateLastLogin(user.id);
        
        return {
            success: true,
            user: session,
            redirect: user.role === 'admin' ? 'admin.html' : 'employee.html'
        };
    }
    
    logout() {
        const user = this.getCurrentUser();
        if (user) {
            this.logSession(user, 'logout');
        }
        
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        
        // Redirect ke login page
        setTimeout(() => {
            if (!window.location.href.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }, 100);
        
        return true;
    }
    
    // ============================================
    // 3. SESSION MANAGEMENT
    // ============================================
    
    isLoggedIn() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) return false;
        
        try {
            const user = JSON.parse(userData);
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            // Session expired setelah 8 jam
            if (hoursDiff > 8) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    }
    
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const userData = localStorage.getItem('currentUser');
        if (!userData) return null;
        
        try {
            this.currentUser = JSON.parse(userData);
            return this.currentUser;
        } catch (e) {
            return null;
        }
    }
    
    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    requireAdmin() {
        if (!this.requireLogin()) return false;
        
        const user = this.getCurrentUser();
        if (user.role !== 'admin') {
            window.location.href = 'employee.html';
            return false;
        }
        return true;
    }
    
    requireEmployee() {
        if (!this.requireLogin()) return false;
        
        const user = this.getCurrentUser();
        if (user.role !== 'employee') {
            window.location.href = 'admin.html';
            return false;
        }
        return true;
    }
    
    // ============================================
    // 4. EMPLOYEE MANAGEMENT (ADMIN ONLY)
    // ============================================
    
    getAllEmployees() {
        return JSON.parse(localStorage.getItem('employees'));
    }
    
    getEmployeeById(id) {
        const employees = this.getAllEmployees();
        return employees.find(e => e.id === id);
    }
    
    addEmployee(name, username) {
        const employees = this.getAllEmployees();
        
        // Validasi username unik
        if (employees.some(e => e.username === username)) {
            return { success: false, message: 'Username sudah digunakan' };
        }
        
        // Generate ID baru
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        
        const newEmployee = {
            id: newId,
            name: name,
            username: username,
            password: 'password123',
            role: 'employee'
        };
        
        employees.push(newEmployee);
        localStorage.setItem('employees', JSON.stringify(employees));
        
        return {
            success: true,
            employee: newEmployee,
            message: 'Karyawan berhasil ditambahkan'
        };
    }
    
    resetPassword(employeeId) {
        const employees = this.getAllEmployees();
        const index = employees.findIndex(e => e.id === employeeId);
        
        if (index === -1) {
            return { success: false, message: 'Karyawan tidak ditemukan' };
        }
        
        employees[index].password = 'password123';
        localStorage.setItem('employees', JSON.stringify(employees));
        
        return { success: true, message: 'Password berhasil direset ke default' };
    }
    
    updateEmployee(employeeId, data) {
        const employees = this.getAllEmployees();
        const index = employees.findIndex(e => e.id === employeeId);
        
        if (index === -1) {
            return { success: false, message: 'Karyawan tidak ditemukan' };
        }
        
        // Validasi username unik
        if (data.username && data.username !== employees[index].username) {
            if (employees.some(e => e.username === data.username)) {
                return { success: false, message: 'Username sudah digunakan' };
            }
        }
        
        employees[index] = { ...employees[index], ...data };
        localStorage.setItem('employees', JSON.stringify(employees));
        
        return { success: true, message: 'Data berhasil diupdate' };
    }
    
    searchEmployees(query) {
        const employees = this.getAllEmployees();
        const searchTerm = query.toLowerCase();
        
        return employees.filter(e => 
            e.name.toLowerCase().includes(searchTerm) ||
            e.username.toLowerCase().includes(searchTerm)
        );
    }
    
    // ============================================
    // 5. SECURITY FUNCTIONS
    // ============================================
    
    recordFailedAttempt(username) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts'));
        
        if (!attempts[username]) {
            attempts[username] = { count: 1, lastAttempt: new Date().toISOString() };
        } else {
            attempts[username].count++;
            attempts[username].lastAttempt = new Date().toISOString();
        }
        
        localStorage.setItem('loginAttempts', JSON.stringify(attempts));
    }
    
    resetFailedAttempts(username) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts'));
        if (attempts[username]) {
            delete attempts[username];
            localStorage.setItem('loginAttempts', JSON.stringify(attempts));
        }
    }
    
    getFailedAttempts(username) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts'));
        return attempts[username]?.count || 0;
    }
    
    isAccountLocked(username) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts'));
        const userAttempts = attempts[username];
        
        if (!userAttempts || userAttempts.count < 5) return false;
        
        const lastAttempt = new Date(userAttempts.lastAttempt);
        const now = new Date();
        const minutesDiff = (now - lastAttempt) / (1000 * 60);
        
        // Lock selama 15 menit setelah 5 kali gagal
        return minutesDiff < 15;
    }
    
    getLockTimeRemaining(username) {
        const attempts = JSON.parse(localStorage.getItem('loginAttempts'));
        const userAttempts = attempts[username];
        
        if (!userAttempts || userAttempts.count < 5) return 0;
        
        const lastAttempt = new Date(userAttempts.lastAttempt);
        const now = new Date();
        const minutesDiff = (now - lastAttempt) / (1000 * 60);
        const remaining = 15 - minutesDiff;
        
        return Math.max(0, Math.ceil(remaining));
    }
    
    // ============================================
    // 6. UTILITY FUNCTIONS
    // ============================================
    
    getClientInfo() {
        // Simulasi informasi client
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString()
        };
    }
    
    logSession(session, action) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        
        sessions.push({
            userId: session.userId,
            username: session.username,
            action: action,
            timestamp: new Date().toISOString(),
            sessionId: session.sessionId,
            ip: session.ip
        });
        
        // Simpan hanya 100 session terakhir
        if (sessions.length > 100) {
            sessions.splice(0, sessions.length - 100);
        }
        
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }
    
    updateLastLogin(userId) {
        const employees = this.getAllEmployees();
        const index = employees.findIndex(e => e.id === userId);
        
        if (index !== -1) {
            // Tambahkan properti lastLogin jika belum ada
            if (!employees[index].lastLogin) {
                employees[index].lastLogin = new Date().toISOString();
                localStorage.setItem('employees', JSON.stringify(employees));
            }
        }
    }
    
    checkSession() {
        if (this.isLoggedIn()) {
            const user = this.getCurrentUser();
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            // Warning sebelum session expired (7.5 jam)
            if (hoursDiff > 7.5 && hoursDiff <= 8) {
                const minutesLeft = Math.floor((8 - hoursDiff) * 60);
                console.warn(`Session akan berakhir dalam ${minutesLeft} menit`);
            }
        }
    }
    
    // ============================================
    // 7. SYSTEM FUNCTIONS
    // ============================================
    
    resetDatabase() {
        if (confirm('Reset semua data? Ini akan menghapus SEMUA data termasuk absensi dan karyawan!')) {
            localStorage.clear();
            window.location.reload();
        }
    }
    
    exportData() {
        const data = {
            employees: JSON.parse(localStorage.getItem('employees')),
            attendances: JSON.parse(localStorage.getItem('attendances')),
            holidays: JSON.parse(localStorage.getItem('holidays')),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-absensi-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.employees) localStorage.setItem('employees', JSON.stringify(data.employees));
            if (data.attendances) localStorage.setItem('attendances', JSON.stringify(data.attendances));
            if (data.holidays) localStorage.setItem('holidays', JSON.stringify(data.holidays));
            
            return { success: true, message: 'Data berhasil diimport' };
        } catch (e) {
            return { success: false, message: 'Format data tidak valid' };
        }
    }
    
    // ============================================
    // 8. STATISTICS & REPORTING
    // ============================================
    
    getSystemStats() {
        const employees = this.getAllEmployees();
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const today = new Date().toISOString().split('T')[0];
        
        return {
            totalEmployees: employees.length,
            adminCount: employees.filter(e => e.role === 'admin').length,
            employeeCount: employees.filter(e => e.role === 'employee').length,
            todayAttendances: attendances.filter(a => a.date === today).length,
            totalAttendances: attendances.length
        };
    }
}

// ============================================
// GLOBAL AUTH INSTANCE & HELPER FUNCTIONS
// ============================================

// Buat instance global
const auth = new AuthSystem();

// Helper function untuk notification
function showNotification(message, type = 'info') {
    // Hapus notifikasi lama
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Tambahkan CSS jika belum ada
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                max-width: 400px;
            }
            .notification.success { background: #27ae60; }
            .notification.error { background: #e74c3c; }
            .notification.info { background: #3498db; }
            .notification.warning { background: #f39c12; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Hapus setelah 3 detik
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format tanggal Indonesia
function formatDate(date = new Date()) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
}

// Format waktu
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Validasi email sederhana
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Debounce function untuk input
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

// ============================================
// AUTO-INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Auto-login check
    if (!window.location.href.includes('index.html')) {
        if (!auth.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    }
    
    // Handle login form jika ada di halaman
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            const result = auth.login(username, password);
            
            if (result.success) {
                showNotification('Login berhasil!', 'success');
                
                // Redirect setelah 1 detik
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1000);
            } else {
                showNotification(result.message, 'error');
                
                // Tampilkan lockout info jika ada
                if (result.locked) {
                    const remaining = auth.getLockTimeRemaining(username);
                    if (remaining > 0) {
                        showNotification(`Akun terkunci selama ${remaining} menit`, 'warning');
                    }
                }
            }
        });
    }
    
    // Update waktu real-time jika ada elemen dengan id 'currentTime'
    if (document.getElementById('currentTime')) {
        setInterval(() => {
            document.getElementById('currentTime').textContent = formatTime();
        }, 1000);
    }
    
    // Update tanggal jika ada elemen dengan id 'currentDate'
    if (document.getElementById('currentDate')) {
        document.getElementById('currentDate').textContent = formatDate();
    }
});

// Export ke global scope
window.auth = auth;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatTime = formatTime;
