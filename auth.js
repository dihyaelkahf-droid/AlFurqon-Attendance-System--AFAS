/**
 * AUTHENTICATION SYSTEM - SISTEM ABSENSI KARYAWAN
 * Fungsi: Mengelola login, logout, session, dan keamanan
 */

class AuthSystem {
    constructor() {
        // Session timeout: 8 jam (dalam milidetik)
        this.SESSION_TIMEOUT = 8 * 60 * 60 * 1000;
        
        // Security settings
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 menit
        
        // Initialize system
        this.initDatabase();
        this.checkSession();
    }

    // ============================================
    // 1. DATABASE INITIALIZATION
    // ============================================
    
    /**
     * Inisialisasi semua tabel database di localStorage
     * Dipanggil otomatis saat class dibuat
     */
    initDatabase() {
        console.log('🔧 Initializing database...');
        
        // Tabel: employees (data karyawan dan admin)
        if (!localStorage.getItem('employees')) {
            const employees = this.createDefaultEmployees();
            localStorage.setItem('employees', JSON.stringify(employees));
            console.log('✅ Created employees table with', employees.length, 'users');
        }
        
        // Tabel: attendances (data absensi)
        if (!localStorage.getItem('attendances')) {
            localStorage.setItem('attendances', JSON.stringify([]));
            console.log('✅ Created attendances table');
        }
        
        // Tabel: holidays (hari libur)
        if (!localStorage.getItem('holidays')) {
            localStorage.setItem('holidays', JSON.stringify([]));
            console.log('✅ Created holidays table');
        }
        
        // Tabel: corrections (log koreksi absensi)
        if (!localStorage.getItem('corrections')) {
            localStorage.setItem('corrections', JSON.stringify([]));
            console.log('✅ Created corrections table');
        }
        
        // Tabel: login_attempts (keamanan)
        if (!localStorage.getItem('login_attempts')) {
            localStorage.setItem('login_attempts', JSON.stringify({}));
            console.log('✅ Created login_attempts table');
        }
        
        // Tabel: sessions (log session)
        if (!localStorage.getItem('sessions')) {
            localStorage.setItem('sessions', JSON.stringify([]));
            console.log('✅ Created sessions table');
        }
        
        // Tabel: settings (pengaturan sistem)
        if (!localStorage.getItem('settings')) {
            const settings = {
                company_name: 'Perusahaan Kita',
                work_start_time: '07:30',
                work_end_time: '15:30',
                late_threshold: '07:30',
                enable_notifications: true,
                default_password: 'password123'
            };
            localStorage.setItem('settings', JSON.stringify(settings));
            console.log('✅ Created settings table');
        }
    }
    
    /**
     * Buat data karyawan default untuk testing
     * @returns {Array} Array of employee objects
     */
    createDefaultEmployees() {
        return [
            // ADMIN UTAMA
            {
                id: 1,
                name: 'Administrator',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                isActive: true,
                createdAt: new Date().toISOString()
            },
            
            // KARYAWAN-KARYAWAN
            { id: 2, name: 'Sutrisno', username: 'sutris', password: 'password123', role: 'employee', isActive: true },
            { id: 3, name: 'Nita Sri Wahyuningrum, S.Pd', username: 'nita', password: 'password123', role: 'employee', isActive: true },
            { id: 4, name: 'Heri Kurniawan', username: 'heri', password: 'password123', role: 'employee', isActive: true },
            { id: 5, name: 'Yian Hidayatul Ulfa, S. Pd.', username: 'yian', password: 'password123', role: 'employee', isActive: true },
            { id: 6, name: 'Diah Aprilia Devi, S.Pd', username: 'diah', password: 'password123', role: 'employee', isActive: true },
            { id: 7, name: 'Teguh Setia Isma Ramadan', username: 'teguh', password: 'password123', role: 'employee', isActive: true },
            { id: 8, name: 'Iskandar Kholif, S.Pd', username: 'iskandar', password: 'password123', role: 'employee', isActive: true },
            { id: 9, name: 'Dinul Qoyyimah, S. Pd', username: 'dinul', password: 'password123', role: 'employee', isActive: true },
            { id: 10, name: 'Endah Windarti, S.Pd', username: 'endah', password: 'password123', role: 'employee', isActive: true },
            { id: 11, name: 'Citra Wulan Sari, S. Pd', username: 'citra', password: 'password123', role: 'employee', isActive: true },
            { id: 12, name: 'Fajriansyah Abdillah', username: 'fajri', password: 'password123', role: 'employee', isActive: true },
            { id: 13, name: 'Muh. Abdul Hamid, S.H.I', username: 'hamid', password: 'password123', role: 'employee', isActive: true },
            { id: 14, name: 'Nurjayati, S.Pd', username: 'nurjayati', password: 'password123', role: 'employee', isActive: true },
            { id: 15, name: 'Riswan Siregar, M.Pd', username: 'riswan', password: 'password123', role: 'employee', isActive: true },
            { id: 16, name: 'Rizka Ulfiana, S. Tp', username: 'rizka', password: 'password123', role: 'employee', isActive: true },
            { id: 17, name: 'Susi Dwi Ratna Sari, S.Pd', username: 'susi', password: 'password123', role: 'employee', isActive: true },
            { id: 18, name: 'Usamah Hanif', username: 'usamah', password: 'password123', role: 'employee', isActive: true },
            { id: 19, name: 'Zainap Assaihatus Syahidah S. Si', username: 'zainap', password: 'password123', role: 'employee', isActive: true }
        ];
    }

    // ============================================
    // 2. AUTHENTICATION - LOGIN & LOGOUT
    // ============================================
    
    /**
     * Proses login user
     * @param {string} username - Username pengguna
     * @param {string} password - Password pengguna
     * @returns {Object} Result object dengan status dan data
     */
    login(username, password) {
        console.log(`🔐 Login attempt for user: ${username}`);
        
        // Validasi input
        if (!username || !password) {
            return this.createResponse(false, 'Username dan password harus diisi');
        }
        
        // Cek apakah akun terkunci
        if (this.isAccountLocked(username)) {
            const lockTime = this.getRemainingLockTime(username);
            return this.createResponse(false, `Akun terkunci. Coba lagi dalam ${lockTime} menit`, { locked: true });
        }
        
        // Cari user di database
        const employees = JSON.parse(localStorage.getItem('employees'));
        const user = employees.find(emp => 
            emp.username.toLowerCase() === username.toLowerCase() && 
            emp.isActive === true
        );
        
        // Jika user tidak ditemukan
        if (!user) {
            this.recordFailedAttempt(username);
            return this.createResponse(false, 'Username tidak ditemukan');
        }
        
        // Verifikasi password
        const isValidPassword = this.verifyPassword(username, password, user.password);
        
        if (!isValidPassword) {
            this.recordFailedAttempt(username);
            const attempts = this.getFailedAttempts(username);
            const remaining = this.MAX_LOGIN_ATTEMPTS - attempts;
            
            return this.createResponse(false, `Password salah. ${remaining} percobaan tersisa`, {
                attempts: attempts
            });
        }
        
        // Reset failed attempts karena login berhasil
        this.resetFailedAttempts(username);
        
        // Buat session data
        const sessionData = {
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            loginTime: new Date().toISOString(),
            sessionId: this.generateSessionId(),
            ip: this.getClientIP(),
            userAgent: navigator.userAgent
        };
        
        // Simpan session ke localStorage
        localStorage.setItem('currentSession', JSON.stringify(sessionData));
        
        // Log session untuk tracking
        this.logSession(sessionData, 'login');
        
        // Update last login time
        this.updateLastLogin(user.id);
        
        console.log(`✅ Login successful for: ${user.name} (${user.role})`);
        
        return this.createResponse(true, 'Login berhasil', {
            user: sessionData,
            redirect: user.role === 'admin' ? 'admin.html' : 'employee.html'
        });
    }
    
    /**
     * Logout user dan clear session
     * @returns {boolean} Status logout
     */
    logout() {
        const session = this.getCurrentSession();
        
        if (session) {
            // Log logout activity
            this.logSession(session, 'logout');
            
            // Clear session data
            localStorage.removeItem('currentSession');
            
            console.log(`👋 Logout: ${session.name} (${session.username})`);
        }
        
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
    
    /**
     * Cek apakah user sudah login dan session masih valid
     * @returns {boolean} Status login
     */
    isLoggedIn() {
        const session = this.getCurrentSession();
        
        if (!session) {
            return false;
        }
        
        // Cek session timeout
        const loginTime = new Date(session.loginTime);
        const currentTime = new Date();
        const sessionAge = currentTime - loginTime;
        
        if (sessionAge > this.SESSION_TIMEOUT) {
            console.log(`⌛ Session expired for: ${session.username}`);
            this.logout();
            return false;
        }
        
        return true;
    }
    
    /**
     * Dapatkan data user yang sedang login
     * @returns {Object|null} User data atau null
     */
    getCurrentUser() {
        const session = this.getCurrentSession();
        
        if (!session) {
            return null;
        }
        
        // Ambil data lengkap dari database
        const employees = JSON.parse(localStorage.getItem('employees'));
        const user = employees.find(emp => emp.id === session.userId);
        
        if (!user) {
            this.logout();
            return null;
        }
        
        // Gabungkan session data dengan user data
        return {
            ...session,
            ...user,
            // Tambahkan computed properties
            sessionAge: this.getSessionAge(),
            willExpireIn: this.getSessionExpiryTime()
        };
    }
    
    /**
     * Redirect ke login page jika belum login
     * @param {string|null} requiredRole - Role yang dibutuhkan (optional)
     * @returns {boolean} Status authentication
     */
    requireAuth(requiredRole = null) {
        // Cek login status
        if (!this.isLoggedIn()) {
            console.log('🚫 Access denied: Not logged in');
            window.location.href = 'index.html';
            return false;
        }
        
        const user = this.getCurrentUser();
        
        // Cek role jika diperlukan
        if (requiredRole && user.role !== requiredRole) {
            console.log(`🚫 Access denied: Required ${requiredRole}, but user is ${user.role}`);
            
            // Redirect ke dashboard yang sesuai
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'employee.html';
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Cek dan handle session expiration
     */
    checkSession() {
        if (this.isLoggedIn()) {
            const user = this.getCurrentUser();
            const loginTime = new Date(user.loginTime);
            const currentTime = new Date();
            const sessionAge = currentTime - loginTime;
            const remainingTime = this.SESSION_TIMEOUT - sessionAge;
            
            // Tampilkan warning 5 menit sebelum timeout
            if (remainingTime < 5 * 60 * 1000 && remainingTime > 0) {
                const minutes = Math.floor(remainingTime / (60 * 1000));
                console.warn(`⚠️ Session will expire in ${minutes} minutes`);
                
                // Bisa tambahkan notifikasi ke user di sini
                if (minutes === 1) {
                    this.showNotification('Session akan berakhir dalam 1 menit', 'warning');
                }
            }
        }
    }

    // ============================================
    // 4. EMPLOYEE MANAGEMENT (ADMIN ONLY)
    // ============================================
    
    /**
     * Tambah karyawan baru
     * @param {string} name - Nama lengkap karyawan
     * @param {string} username - Username unik
     * @param {string} password - Password (default: password123)
     * @returns {Object} Result object
     */
    addEmployee(name, username, password = 'password123') {
        // Cek apakah user adalah admin
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return this.createResponse(false, 'Hanya admin yang bisa menambah karyawan');
        }
        
        const employees = JSON.parse(localStorage.getItem('employees'));
        
        // Validasi: username harus unik
        if (employees.some(emp => emp.username.toLowerCase() === username.toLowerCase())) {
            return this.createResponse(false, 'Username sudah digunakan');
        }
        
        // Validasi: nama tidak boleh kosong
        if (!name || name.trim().length === 0) {
            return this.createResponse(false, 'Nama tidak boleh kosong');
        }
        
        // Generate ID baru
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        
        const newEmployee = {
            id: newId,
            name: name.trim(),
            username: username.trim(),
            password: password,
            role: 'employee',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        };
        
        employees.push(newEmployee);
        localStorage.setItem('employees', JSON.stringify(employees));
        
        // Log activity
        this.logActivity(currentUser.id, 'add_employee', `Added employee: ${name}`);
        
        console.log(`➕ Added new employee: ${name} (${username})`);
        
        return this.createResponse(true, 'Karyawan berhasil ditambahkan', {
            employee: newEmployee
        });
    }
    
    /**
     * Reset password karyawan ke default
     * @param {number} employeeId - ID karyawan
     * @returns {Object} Result object
     */
    resetPassword(employeeId) {
        // Cek apakah user adalah admin
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return this.createResponse(false, 'Hanya admin yang bisa reset password');
        }
        
        const employees = JSON.parse(localStorage.getItem('employees'));
        const index = employees.findIndex(emp => emp.id === employeeId);
        
        if (index === -1) {
            return this.createResponse(false, 'Karyawan tidak ditemukan');
        }
        
        const settings = JSON.parse(localStorage.getItem('settings'));
        const defaultPassword = settings.default_password || 'password123';
        
        employees[index].password = defaultPassword;
        employees[index].updatedAt = new Date().toISOString();
        employees[index].updatedBy = currentUser.id;
        
        localStorage.setItem('employees', JSON.stringify(employees));
        
        // Log activity
        this.logActivity(currentUser.id, 'reset_password', `Reset password for employee ID: ${employeeId}`);
        
        console.log(`🔄 Reset password for employee ID: ${employeeId}`);
        
        return this.createResponse(true, 'Password berhasil direset ke default');
    }
    
    /**
     * Dapatkan semua karyawan
     * @param {boolean} includeInactive - Include karyawan non-aktif
     * @returns {Array} List of employees
     */
    getAllEmployees(includeInactive = false) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        
        if (includeInactive) {
            return employees;
        }
        
        return employees.filter(emp => emp.isActive === true);
    }
    
    /**
     * Cari karyawan berdasarkan keyword
     * @param {string} keyword - Kata kunci pencarian
     * @returns {Array} Hasil pencarian
     */
    searchEmployees(keyword) {
        const employees = this.getAllEmployees();
        const searchTerm = keyword.toLowerCase();
        
        return employees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.username.toLowerCase().includes(searchTerm) ||
            (emp.email && emp.email.toLowerCase().includes(searchTerm))
        );
    }

    // ============================================
    // 5. SECURITY FUNCTIONS
    // ============================================
    
    /**
     * Cek apakah akun terkunci karena terlalu banyak percobaan gagal
     * @param {string} username - Username yang dicek
     * @returns {boolean} Status lock
     */
    isAccountLocked(username) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts'));
        const userAttempts = attempts[username];
        
        if (!userAttempts) {
            return false;
        }
        
        const lastAttempt = new Date(userAttempts.lastAttempt);
        const currentTime = new Date();
        const timeSinceLastAttempt = currentTime - lastAttempt;
        
        // Jika percobaan >= MAX_LOGIN_ATTEMPTS dan masih dalam lockout duration
        return userAttempts.count >= this.MAX_LOGIN_ATTEMPTS && 
               timeSinceLastAttempt < this.LOCKOUT_DURATION;
    }
    
    /**
     * Dapatkan sisa waktu lock dalam menit
     * @param {string} username - Username yang dicek
     * @returns {number} Menit tersisa
     */
    getRemainingLockTime(username) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts'));
        const userAttempts = attempts[username];
        
        if (!userAttempts || userAttempts.count < this.MAX_LOGIN_ATTEMPTS) {
            return 0;
        }
        
        const lastAttempt = new Date(userAttempts.lastAttempt);
        const currentTime = new Date();
        const timeSinceLastAttempt = currentTime - lastAttempt;
        const remainingTime = this.LOCKOUT_DURATION - timeSinceLastAttempt;
        
        return Math.max(0, Math.ceil(remainingTime / (60 * 1000)));
    }
    
    /**
     * Catat percobaan login gagal
     * @param {string} username - Username yang gagal login
     */
    recordFailedAttempt(username) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts'));
        
        if (!attempts[username]) {
            attempts[username] = {
                count: 1,
                lastAttempt: new Date().toISOString(),
                ip: this.getClientIP()
            };
        } else {
            attempts[username].count += 1;
            attempts[username].lastAttempt = new Date().toISOString();
            attempts[username].ip = this.getClientIP();
        }
        
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
        
        console.log(`❌ Failed login attempt for ${username}. Total attempts: ${attempts[username].count}`);
        
        // Kirim warning jika mendekati lockout
        if (attempts[username].count >= this.MAX_LOGIN_ATTEMPTS - 2) {
            console.warn(`⚠️ WARNING: ${username} has ${attempts[username].count} failed attempts`);
        }
    }
    
    /**
     * Reset percobaan gagal untuk username tertentu
     * @param {string} username - Username yang direset
     */
    resetFailedAttempts(username) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts'));
        
        if (attempts[username]) {
            delete attempts[username];
            localStorage.setItem('login_attempts', JSON.stringify(attempts));
            console.log(`🔄 Reset failed attempts for: ${username}`);
        }
    }
    
    /**
     * Dapatkan jumlah percobaan gagal
     * @param {string} username - Username yang dicek
     * @returns {number} Jumlah percobaan gagal
     */
    getFailedAttempts(username) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts'));
        return attempts[username]?.count || 0;
    }

    // ============================================
    // 6. UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Verifikasi password
     * @param {string} username - Username
     * @param {string} inputPassword - Password yang diinput
     * @param {string} storedPassword - Password yang tersimpan
     * @returns {boolean} Status validasi
     */
    verifyPassword(username, inputPassword, storedPassword) {
        // Admin password khusus
        if (username.toLowerCase() === 'admin') {
            return inputPassword === 'admin123';
        }
        
        // Employee password default
        return inputPassword === storedPassword;
    }
    
    /**
     * Generate session ID unik
     * @returns {string} Session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Dapatkan session saat ini dari localStorage
     * @returns {Object|null} Session data
     */
    getCurrentSession() {
        try {
            return JSON.parse(localStorage.getItem('currentSession'));
        } catch (error) {
            console.error('Error parsing session data:', error);
            return null;
        }
    }
    
    /**
     * Dapatkan IP client (simulasi untuk localStorage)
     * @returns {string} Client IP
     */
    getClientIP() {
        // Simulasi IP address untuk localStorage-based app
        return 'local_' + Math.floor(Math.random() * 255) + '.' + 
               Math.floor(Math.random() * 255) + '.' + 
               Math.floor(Math.random() * 255);
    }
    
    /**
     * Update last login time untuk user
     * @param {number} userId - ID user
     */
    updateLastLogin(userId) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const index = employees.findIndex(emp => emp.id === userId);
        
        if (index !== -1) {
            employees[index].lastLogin = new Date().toISOString();
            localStorage.setItem('employees', JSON.stringify(employees));
        }
    }
    
    /**
     * Log session activity
     * @param {Object} session - Session data
     * @param {string} action - Action type (login/logout)
     */
    logSession(session, action) {
        try {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            
            sessions.push({
                userId: session.userId,
                username: session.username,
                action: action,
                timestamp: new Date().toISOString(),
                sessionId: session.sessionId,
                ip: session.ip,
                userAgent: session.userAgent
            });
            
            // Simpan hanya 100 session terakhir
            if (sessions.length > 100) {
                sessions.splice(0, sessions.length - 100);
            }
            
            localStorage.setItem('sessions', JSON.stringify(sessions));
        } catch (error) {
            console.error('Error logging session:', error);
        }
    }
    
    /**
     * Log activity untuk audit trail
     * @param {number} userId - ID user
     * @param {string} action - Action type
     * @param {string} details - Action details
     */
    logActivity(userId, action, details) {
        try {
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');
            
            activities.push({
                userId: userId,
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                ip: this.getClientIP()
            });
            
            // Simpan hanya 500 activity terakhir
            if (activities.length > 500) {
                activities.splice(0, activities.length - 500);
            }
            
            localStorage.setItem('activities', JSON.stringify(activities));
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
    
    /**
     * Dapatkan usia session dalam menit
     * @returns {number} Session age in minutes
     */
    getSessionAge() {
        const session = this.getCurrentSession();
        if (!session) return 0;
        
        const loginTime = new Date(session.loginTime);
        const currentTime = new Date();
        return Math.floor((currentTime - loginTime) / (60 * 1000));
    }
    
    /**
     * Dapatkan waktu sampai session expired
     * @returns {number} Menit tersisa
     */
    getSessionExpiryTime() {
        const session = this.getCurrentSession();
        if (!session) return 0;
        
        const loginTime = new Date(session.loginTime);
        const currentTime = new Date();
        const sessionAge = currentTime - loginTime;
        const remaining = this.SESSION_TIMEOUT - sessionAge;
        
        return Math.max(0, Math.floor(remaining / (60 * 1000)));
    }
    
    /**
     * Helper untuk membuat response object
     * @param {boolean} success - Status success
     * @param {string} message - Response message
     * @param {Object} data - Additional data
     * @returns {Object} Response object
     */
    createResponse(success, message, data = {}) {
        return {
            success: success,
            message: message,
            ...data,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Tampilkan notifikasi ke user
     * @param {string} message - Pesan notifikasi
     * @param {string} type - Jenis notifikasi (success/error/info/warning)
     */
    showNotification(message, type = 'info') {
        // Implementasi bisa menggunakan alert atau custom notification
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Untuk testing, gunakan alert sederhana
        if (type === 'error' || type === 'warning') {
            // alert(message);
        }
    }
    
    /**
     * Reset semua data di localStorage
     * PERINGATAN: Ini akan menghapus semua data!
     */
    resetDatabase() {
        if (confirm('PERINGATAN: Ini akan menghapus SEMUA data termasuk absensi dan karyawan! Apakah Anda yakin?')) {
            localStorage.clear();
            console.log('🗑️ Database reset successfully');
            window.location.reload();
        }
    }
    
    /**
     * Export semua data ke file JSON
     */
    exportData() {
        const data = {
            employees: JSON.parse(localStorage.getItem('employees')),
            attendances: JSON.parse(localStorage.getItem('attendances')),
            holidays: JSON.parse(localStorage.getItem('holidays')),
            settings: JSON.parse(localStorage.getItem('settings')),
            exportDate: new Date().toISOString(),
            exportBy: this.getCurrentUser()?.name || 'System'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `absensi-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📤 Data exported successfully');
    }
}

// ============================================
// GLOBAL INSTANCE & EXPORT
// ============================================

// Buat instance global
const auth = new AuthSystem();

// Export untuk penggunaan di file lain
if (typeof window !== 'undefined') {
    window.auth = auth;
}

console.log('✅ Auth system initialized successfully');

// ============================================
// HELPER FUNCTIONS (Global)
// ============================================

/**
 * Format tanggal Indonesia
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date = new Date()) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
}

/**
 * Format waktu (HH:MM)
 * @param {Date} date - Date object
 * @returns {string} Formatted time
 */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

/**
 * Tampilkan notifikasi ke user
 * @param {string} message - Pesan
 * @param {string} type - Jenis (success/error/info/warning)
 */
function showNotification(message, type = 'info') {
    // Hapus notifikasi lama
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'error' ? 'exclamation-circle' : 
                               type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Tambahkan styles jika belum ada
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
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove setelah 3 detik
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Export helper functions
if (typeof window !== 'undefined') {
    window.formatDate = formatDate;
    window.formatTime = formatTime;
    window.showNotification = showNotification;
}

console.log('✅ Helper functions loaded');
