// ================================================
// DATABASE.JS - LOCALSTORAGE DATABASE MANAGEMENT
// ================================================

class Database {
    constructor() {
        // Nama-nama tabel dalam database
        this.TABLES = {
            EMPLOYEES: 'employees',
            ATTENDANCES: 'attendances',
            HOLIDAYS: 'holidays',
            CORRECTIONS: 'corrections',
            SETTINGS: 'settings',
            LOGIN_ATTEMPTS: 'login_attempts',
            SESSIONS: 'sessions',
            ACTIVITIES: 'activities'
        };

        // Default data untuk inisialisasi
        this.DEFAULT_DATA = {
            // Default employees (admin + 18 karyawan)
            employees: [
                {
                    id: 1,
                    name: 'Administrator',
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 2,
                    name: 'Sutrisno',
                    username: 'sutris',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 3,
                    name: 'Nita Sri Wahyuningrum, S.Pd',
                    username: 'nita',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 4,
                    name: 'Heri Kurniawan',
                    username: 'heri',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 5,
                    name: 'Yian Hidayatul Ulfa, S. Pd.',
                    username: 'yian',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 6,
                    name: 'Diah Aprilia Devi, S.Pd',
                    username: 'diah',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 7,
                    name: 'Teguh Setia Isma Ramadan',
                    username: 'teguh',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 8,
                    name: 'Iskandar Kholif, S.Pd',
                    username: 'iskandar',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 9,
                    name: 'Dinul Qoyyimah, S. Pd',
                    username: 'dinul',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 10,
                    name: 'Endah Windarti, S.Pd',
                    username: 'endah',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 11,
                    name: 'Citra Wulan Sari, S. Pd',
                    username: 'citra',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 12,
                    name: 'Fajriansyah Abdillah',
                    username: 'fajri',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 13,
                    name: 'Muh. Abdul Hamid, S.H.I',
                    username: 'hamid',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 14,
                    name: 'Nurjayati, S.Pd',
                    username: 'nurjayati',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 15,
                    name: 'Riswan Siregar, M.Pd',
                    username: 'riswan',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 16,
                    name: 'Rizka Ulfiana, S. Tp',
                    username: 'rizka',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 17,
                    name: 'Susi Dwi Ratna Sari, S.Pd',
                    username: 'susi',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 18,
                    name: 'Usamah Hanif',
                    username: 'usamah',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 19,
                    name: 'Zainap Assaihatus Syahidah S. Si',
                    username: 'zainap',
                    password: 'password123',
                    role: 'employee',
                    createdAt: new Date().toISOString(),
                    isActive: true
                }
            ],
            
            // Default settings
            settings: {
                company_name: 'Perusahaan Kita',
                work_start_time: '07:30',
                work_end_time: '15:30',
                late_threshold: '07:30',
                attendance_method: 'web',
                require_notes_for_leave: true,
                enable_live_tracking: false,
                max_login_attempts: 5,
                session_timeout_hours: 8,
                auto_logout_enabled: true
            }
        };

        // Inisialisasi database
        this.initialize();
    }

    // ================================================
    // 1. DATABASE INITIALIZATION
    // ================================================

    /**
     * Inisialisasi semua tabel database
     */
    initialize() {
        console.log('Initializing database...');
        
        // Inisialisasi setiap tabel
        Object.values(this.TABLES).forEach(tableName => {
            this.ensureTableExists(tableName);
        });
        
        console.log('Database initialized successfully!');
    }

    /**
     * Pastikan tabel ada dengan data default jika diperlukan
     * @param {string} tableName - Nama tabel
     */
    ensureTableExists(tableName) {
        const exists = localStorage.getItem(tableName);
        
        if (!exists) {
            let defaultValue = [];
            
            // Set default value berdasarkan tabel
            switch(tableName) {
                case this.TABLES.EMPLOYEES:
                    defaultValue = this.DEFAULT_DATA.employees;
                    break;
                case this.TABLES.SETTINGS:
                    defaultValue = this.DEFAULT_DATA.settings;
                    break;
                case this.TABLES.LOGIN_ATTEMPTS:
                    defaultValue = {}; // Object untuk login attempts
                    break;
                default:
                    defaultValue = [];
            }
            
            this.set(tableName, defaultValue);
            console.log(`Table ${tableName} created with default data`);
        }
    }

    // ================================================
    // 2. CRUD OPERATIONS - GENERIC
    // ================================================

    /**
     * CREATE - Tambah data baru ke tabel
     * @param {string} tableName - Nama tabel
     * @param {Object} data - Data yang akan ditambahkan
     * @param {boolean} autoId - Generate ID otomatis
     * @returns {Object} - Data yang berhasil ditambahkan
     */
    create(tableName, data, autoId = true) {
        try {
            let tableData = this.get(tableName);
            
            // Generate ID otomatis jika diperlukan
            if (autoId && data.id === undefined) {
                const maxId = tableData.length > 0 
                    ? Math.max(...tableData.map(item => item.id || 0)) 
                    : 0;
                data.id = maxId + 1;
            }
            
            // Tambahkan timestamp
            if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
            }
            
            data.updatedAt = new Date().toISOString();
            
            // Tambahkan ke array
            tableData.push(data);
            
            // Simpan ke localStorage
            this.set(tableName, tableData);
            
            return {
                success: true,
                data: data,
                message: 'Data berhasil ditambahkan'
            };
            
        } catch (error) {
            console.error('Create error:', error);
            return {
                success: false,
                message: `Gagal menambahkan data: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * READ - Ambil semua data dari tabel
     * @param {string} tableName - Nama tabel
     * @param {Function} filterFn - Fungsi filter opsional
     * @returns {Array} - Array data
     */
    read(tableName, filterFn = null) {
        try {
            let data = this.get(tableName);
            
            // Apply filter jika ada
            if (filterFn && typeof filterFn === 'function') {
                data = data.filter(filterFn);
            }
            
            return data;
            
        } catch (error) {
            console.error('Read error:', error);
            return [];
        }
    }

    /**
     * READ BY ID - Ambil data berdasarkan ID
     * @param {string} tableName - Nama tabel
     * @param {number|string} id - ID data
     * @returns {Object|null} - Data atau null jika tidak ditemukan
     */
    readById(tableName, id) {
        try {
            const data = this.get(tableName);
            return data.find(item => item.id == id) || null;
            
        } catch (error) {
            console.error('Read by ID error:', error);
            return null;
        }
    }

    /**
     * READ BY FIELD - Ambil data berdasarkan field tertentu
     * @param {string} tableName - Nama tabel
     * @param {string} field - Nama field
     * @param {any} value - Nilai yang dicari
     * @returns {Array} - Array data yang cocok
     */
    readByField(tableName, field, value) {
        try {
            const data = this.get(tableName);
            return data.filter(item => item[field] == value);
            
        } catch (error) {
            console.error('Read by field error:', error);
            return [];
        }
    }

    /**
     * UPDATE - Update data berdasarkan ID
     * @param {string} tableName - Nama tabel
     * @param {number|string} id - ID data
     * @param {Object} updates - Data yang akan diupdate
     * @returns {Object} - Hasil update
     */
    update(tableName, id, updates) {
        try {
            let tableData = this.get(tableName);
            const index = tableData.findIndex(item => item.id == id);
            
            if (index === -1) {
                return {
                    success: false,
                    message: 'Data tidak ditemukan'
                };
            }
            
            // Backup data lama
            const oldData = { ...tableData[index] };
            
            // Update data
            tableData[index] = {
                ...tableData[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Simpan perubahan
            this.set(tableName, tableData);
            
            return {
                success: true,
                data: tableData[index],
                oldData: oldData,
                message: 'Data berhasil diupdate'
            };
            
        } catch (error) {
            console.error('Update error:', error);
            return {
                success: false,
                message: `Gagal mengupdate data: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * DELETE - Hapus data berdasarkan ID
     * @param {string} tableName - Nama tabel
     * @param {number|string} id - ID data
     * @param {boolean} softDelete - Soft delete (hanya set flag)
     * @returns {Object} - Hasil delete
     */
    delete(tableName, id, softDelete = false) {
        try {
            let tableData = this.get(tableName);
            
            if (softDelete) {
                // Soft delete - hanya update flag
                return this.update(tableName, id, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                });
            } else {
                // Hard delete - hapus dari array
                const initialLength = tableData.length;
                tableData = tableData.filter(item => item.id != id);
                
                if (tableData.length === initialLength) {
                    return {
                        success: false,
                        message: 'Data tidak ditemukan'
                    };
                }
                
                this.set(tableName, tableData);
                
                return {
                    success: true,
                    message: 'Data berhasil dihapus'
                };
            }
            
        } catch (error) {
            console.error('Delete error:', error);
            return {
                success: false,
                message: `Gagal menghapus data: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * BATCH CREATE - Tambah banyak data sekaligus
     * @param {string} tableName - Nama tabel
     * @param {Array} dataArray - Array data
     * @returns {Object} - Hasil batch create
     */
    batchCreate(tableName, dataArray) {
        try {
            let tableData = this.get(tableName);
            const startId = tableData.length > 0 
                ? Math.max(...tableData.map(item => item.id || 0)) + 1 
                : 1;
            
            const now = new Date().toISOString();
            const processedData = dataArray.map((data, index) => ({
                ...data,
                id: startId + index,
                createdAt: now,
                updatedAt: now
            }));
            
            tableData.push(...processedData);
            this.set(tableName, tableData);
            
            return {
                success: true,
                count: processedData.length,
                message: `${processedData.length} data berhasil ditambahkan`
            };
            
        } catch (error) {
            console.error('Batch create error:', error);
            return {
                success: false,
                message: `Gagal menambahkan batch data: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * SEARCH - Cari data dengan query
     * @param {string} tableName - Nama tabel
     * @param {string} searchTerm - Kata kunci pencarian
     * @param {Array} fields - Field yang akan dicari
     * @returns {Array} - Hasil pencarian
     */
    search(tableName, searchTerm, fields = []) {
        try {
            const data = this.get(tableName);
            
            if (!searchTerm.trim()) return data;
            
            const term = searchTerm.toLowerCase();
            
            return data.filter(item => {
                // Jika fields spesifik diberikan
                if (fields.length > 0) {
                    return fields.some(field => {
                        const value = item[field];
                        return value && value.toString().toLowerCase().includes(term);
                    });
                }
                
                // Cari di semua field string
                return Object.values(item).some(value => {
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(term);
                    }
                    return false;
                });
            });
            
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // ================================================
    // 3. SPECIFIC TABLE OPERATIONS
    // ================================================

    /**
     * EMPLOYEES TABLE OPERATIONS
     */
    
    getEmployees(activeOnly = true) {
        if (activeOnly) {
            return this.read(this.TABLES.EMPLOYEES, emp => emp.isActive !== false);
        }
        return this.read(this.TABLES.EMPLOYEES);
    }
    
    getEmployeeById(id) {
        return this.readById(this.TABLES.EMPLOYEES, id);
    }
    
    getEmployeeByUsername(username) {
        const employees = this.getEmployees();
        return employees.find(emp => emp.username === username) || null;
    }
    
    addEmployee(employeeData) {
        // Validasi username unik
        const existing = this.getEmployeeByUsername(employeeData.username);
        if (existing) {
            return {
                success: false,
                message: 'Username sudah digunakan'
            };
        }
        
        return this.create(this.TABLES.EMPLOYEES, {
            ...employeeData,
            role: 'employee',
            isActive: true
        });
    }
    
    updateEmployee(id, updates) {
        // Validasi username unik jika diupdate
        if (updates.username) {
            const existing = this.getEmployeeByUsername(updates.username);
            if (existing && existing.id != id) {
                return {
                    success: false,
                    message: 'Username sudah digunakan'
                };
            }
        }
        
        return this.update(this.TABLES.EMPLOYEES, id, updates);
    }
    
    deactivateEmployee(id) {
        return this.update(this.TABLES.EMPLOYEES, id, {
            isActive: false,
            deactivatedAt: new Date().toISOString()
        });
    }

    /**
     * ATTENDANCES TABLE OPERATIONS
     */
    
    getAttendances(filterFn = null) {
        return this.read(this.TABLES.ATTENDANCES, filterFn);
    }
    
    getTodayAttendances() {
        const today = new Date().toISOString().split('T')[0];
        return this.getAttendances(att => att.date === today);
    }
    
    getEmployeeAttendance(employeeId, date = null) {
        if (date) {
            return this.getAttendances(att => 
                att.employeeId == employeeId && att.date === date
            )[0] || null;
        }
        return this.getAttendances(att => att.employeeId == employeeId);
    }
    
    addAttendance(attendanceData) {
        // Cek duplikat (satu karyawan satu absensi per hari)
        const existing = this.getEmployeeAttendance(
            attendanceData.employeeId, 
            attendanceData.date
        );
        
        if (existing) {
            return {
                success: false,
                message: 'Sudah ada absensi untuk hari ini'
            };
        }
        
        return this.create(this.TABLES.ATTENDANCES, attendanceData);
    }
    
    updateAttendance(id, updates) {
        return this.update(this.TABLES.ATTENDANCES, id, updates);
    }

    /**
     * SETTINGS TABLE OPERATIONS
     */
    
    getSettings() {
        const settings = this.get(this.TABLES.SETTINGS);
        return typeof settings === 'object' ? settings : {};
    }
    
    updateSettings(updates) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...updates };
        this.set(this.TABLES.SETTINGS, newSettings);
        
        return {
            success: true,
            data: newSettings,
            message: 'Pengaturan berhasil diupdate'
        };
    }
    
    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    /**
     * HOLIDAYS TABLE OPERATIONS
     */
    
    getHolidays() {
        return this.read(this.TABLES.HOLIDAYS);
    }
    
    isHoliday(date) {
        const dateStr = date.toISOString().split('T')[0];
        const holidays = this.getHolidays();
        return holidays.some(h => h.date === dateStr);
    }
    
    addHoliday(holidayData) {
        // Validasi format tanggal
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(holidayData.date)) {
            return {
                success: false,
                message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD'
            };
        }
        
        // Cek duplikat
        const existing = this.getHolidays().find(h => h.date === holidayData.date);
        if (existing) {
            return {
                success: false,
                message: 'Tanggal libur sudah ada'
            };
        }
        
        return this.create(this.TABLES.HOLIDAYS, holidayData);
    }

    /**
     * CORRECTIONS TABLE OPERATIONS
     */
    
    addCorrection(correctionData) {
        return this.create(this.TABLES.CORRECTIONS, correctionData);
    }
    
    getCorrectionsByAttendance(attendanceId) {
        return this.readByField(this.TABLES.CORRECTIONS, 'attendanceId', attendanceId);
    }

    // ================================================
    // 4. SECURITY & LOGGING
    // ================================================

    /**
     * Login attempts tracking
     */
    
    recordLoginAttempt(username, success = false, ip = null) {
        const attempts = this.get(this.TABLES.LOGIN_ATTEMPTS);
        
        if (!attempts[username]) {
            attempts[username] = {
                count: 1,
                successful: success ? 1 : 0,
                failed: success ? 0 : 1,
                lastAttempt: new Date().toISOString(),
                lastIp: ip,
                history: []
            };
        } else {
            attempts[username].count++;
            if (success) {
                attempts[username].successful++;
            } else {
                attempts[username].failed++;
            }
            attempts[username].lastAttempt = new Date().toISOString();
            attempts[username].lastIp = ip;
        }
        
        // Simpan history
        attempts[username].history.push({
            timestamp: new Date().toISOString(),
            success: success,
            ip: ip
        });
        
        // Batasi history
        if (attempts[username].history.length > 50) {
            attempts[username].history = attempts[username].history.slice(-50);
        }
        
        this.set(this.TABLES.LOGIN_ATTEMPTS, attempts);
        
        return attempts[username];
    }
    
    getLoginAttempts(username) {
        const attempts = this.get(this.TABLES.LOGIN_ATTEMPTS);
        return attempts[username] || null;
    }
    
    resetLoginAttempts(username) {
        const attempts = this.get(this.TABLES.LOGIN_ATTEMPTS);
        if (attempts[username]) {
            delete attempts[username];
            this.set(this.TABLES.LOGIN_ATTEMPTS, attempts);
            return true;
        }
        return false;
    }
    
    isAccountLocked(username) {
        const attempts = this.getLoginAttempts(username);
        if (!attempts) return false;
        
        const maxAttempts = this.getSetting('max_login_attempts', 5);
        const lockoutMinutes = 15; // 15 menit lockout
        
        if (attempts.failed >= maxAttempts) {
            const lastAttempt = new Date(attempts.lastAttempt);
            const now = new Date();
            const minutesDiff = (now - lastAttempt) / (1000 * 60);
            
            return minutesDiff < lockoutMinutes;
        }
        
        return false;
    }

    /**
     * Session management
     */
    
    createSession(sessionData) {
        const sessions = this.get(this.TABLES.SESSIONS);
        
        // Hapus session lama untuk user yang sama
        const filteredSessions = sessions.filter(s => s.userId !== sessionData.userId);
        
        const session = {
            ...sessionData,
            id: this.generateId('session'),
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        filteredSessions.push(session);
        this.set(this.TABLES.SESSIONS, filteredSessions);
        
        return session;
    }
    
    updateSession(sessionId, updates) {
        let sessions = this.get(this.TABLES.SESSIONS);
        const index = sessions.findIndex(s => s.id === sessionId);
        
        if (index === -1) return null;
        
        sessions[index] = {
            ...sessions[index],
            ...updates,
            lastActivity: new Date().toISOString()
        };
        
        this.set(this.TABLES.SESSIONS, sessions);
        return sessions[index];
    }
    
    getSession(sessionId) {
        const sessions = this.get(this.TABLES.SESSIONS);
        return sessions.find(s => s.id === sessionId) || null;
    }
    
    deleteSession(sessionId) {
        let sessions = this.get(this.TABLES.SESSIONS);
        const initialLength = sessions.length;
        
        sessions = sessions.filter(s => s.id !== sessionId);
        
        if (sessions.length < initialLength) {
            this.set(this.TABLES.SESSIONS, sessions);
            return true;
        }
        
        return false;
    }
    
    cleanupExpiredSessions(timeoutHours = 8) {
        let sessions = this.get(this.TABLES.SESSIONS);
        const initialLength = sessions.length;
        const now = new Date();
        const timeoutMs = timeoutHours * 60 * 60 * 1000;
        
        sessions = sessions.filter(session => {
            const lastActivity = new Date(session.lastActivity || session.createdAt);
            return (now - lastActivity) < timeoutMs;
        });
        
        if (sessions.length < initialLength) {
            this.set(this.TABLES.SESSIONS, sessions);
            console.log(`Cleaned up ${initialLength - sessions.length} expired sessions`);
        }
        
        return initialLength - sessions.length;
    }

    /**
     * Activity logging
     */
    
    logActivity(userId, action, details = null, ip = null) {
        const activity = {
            id: this.generateId('activity'),
            userId: userId,
            action: action,
            details: details,
            ip: ip,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        const activities = this.get(this.TABLES.ACTIVITIES);
        activities.push(activity);
        
        // Batasi jumlah log (simpan 1000 terakhir)
        if (activities.length > 1000) {
            activities.splice(0, activities.length - 1000);
        }
        
        this.set(this.TABLES.ACTIVITIES, activities);
        
        return activity;
    }
    
    getActivities(filterFn = null) {
        return this.read(this.TABLES.ACTIVITIES, filterFn);
    }

    // ================================================
    // 5. UTILITY FUNCTIONS
    // ================================================

    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string} - Unique ID
     */
    generateId(prefix = 'id') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} - Parsed data
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return null;
        }
    }

    /**
     * Set data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error writing ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all data (dangerous!)
     * @param {boolean} confirm - Konfirmasi
     * @returns {Object} - Result
     */
    clearAll(confirm = false) {
        if (!confirm) {
            return {
                success: false,
                message: 'Konfirmasi diperlukan'
            };
        }
        
        try {
            Object.values(this.TABLES).forEach(table => {
                localStorage.removeItem(table);
            });
            
            // Re-initialize
            this.initialize();
            
            return {
                success: true,
                message: 'Semua data berhasil direset'
            };
            
        } catch (error) {
            console.error('Clear all error:', error);
            return {
                success: false,
                message: `Gagal reset data: ${error.message}`
            };
        }
    }

    /**
     * Export semua data ke file
     * @returns {Object} - All database data
     */
    exportAll() {
        const exportData = {};
        
        Object.values(this.TABLES).forEach(table => {
            exportData[table] = this.get(table);
        });
        
        exportData.exportedAt = new Date().toISOString();
        exportData.version = '1.0';
        
        return exportData;
    }

    /**
     * Import data dari file
     * @param {Object} importData - Data yang akan diimport
     * @param {boolean} merge - Merge dengan data existing
     * @returns {Object} - Hasil import
     */
    importAll(importData, merge = false) {
        try {
            if (!importData || typeof importData !== 'object') {
                throw new Error('Data tidak valid');
            }
            
            let importedCount = 0;
            
            Object.values(this.TABLES).forEach(table => {
                if (importData[table]) {
                    if (merge) {
                        // Merge dengan data existing
                        const existing = this.get(table) || [];
                        const newData = Array.isArray(importData[table]) 
                            ? importData[table] 
                            : [importData[table]];
                        
                        // Gabungkan, hindari duplikat berdasarkan ID
                        const merged = [...existing];
                        newData.forEach(item => {
                            const existingIndex = merged.findIndex(ex => ex.id === item.id);
                            if (existingIndex === -1) {
                                merged.push(item);
                                importedCount++;
                            }
                        });
                        
                        this.set(table, merged);
                    } else {
                        // Replace semua data
                        this.set(table, importData[table]);
                        importedCount++;
                    }
                }
            });
            
            return {
                success: true,
                importedCount: importedCount,
                message: `Berhasil import ${importedCount} tabel`
            };
            
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                message: `Gagal import data: ${error.message}`
            };
        }
    }

    /**
     * Backup database ke file
     */
    backup() {
        const data = this.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `attendance-backup-${timestamp}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Log backup activity
        this.logActivity(0, 'database_backup', 'Backup created');
        
        return {
            success: true,
            message: 'Backup berhasil dibuat'
        };
    }

    /**
     * Get database statistics
     * @returns {Object} - Statistics
     */
    getStats() {
        const stats = {};
        
        Object.values(this.TABLES).forEach(table => {
            const data = this.get(table);
            if (Array.isArray(data)) {
                stats[table] = {
                    count: data.length,
                    active: table === this.TABLES.EMPLOYEES 
                        ? data.filter(e => e.isActive !== false).length 
                        : data.length
                };
            } else if (typeof data === 'object') {
                stats[table] = {
                    count: Object.keys(data).length,
                    keys: Object.keys(data)
                };
            }
        });
        
        stats.totalSize = this.calculateTotalSize();
        stats.lastUpdated = new Date().toISOString();
        
        return stats;
    }

    /**
     * Calculate total storage size
     * @returns {string} - Size in KB/MB
     */
    calculateTotalSize() {
        let totalBytes = 0;
        
        Object.values(this.TABLES).forEach(table => {
            const data = localStorage.getItem(table);
            if (data) {
                totalBytes += new Blob([data]).size;
            }
        });
        
        if (totalBytes < 1024) return `${totalBytes} bytes`;
        if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(2)} KB`;
        return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    /**
     * Check database health
     * @returns {Object} - Health status
     */
    healthCheck() {
        const issues = [];
        
        // Check semua tabel ada
        Object.values(this.TABLES).forEach(table => {
            if (!localStorage.getItem(table)) {
                issues.push(`Table ${table} missing`);
            }
        });
        
        // Check data integrity
        const employees = this.getEmployees();
        if (employees.length === 0) {
            issues.push('No employees found');
        }
        
        // Check settings
        const settings = this.getSettings();
        if (!settings.company_name) {
            issues.push('Company name not set');
        }
        
        return {
            healthy: issues.length === 0,
            issues: issues,
            tables: Object.values(this.TABLES).length,
            totalRecords: Object.values(this.TABLES).reduce((total, table) => {
                const data = this.get(table);
                return total + (Array.isArray(data) ? data.length : 1);
            }, 0)
        };
    }
}

// ================================================
// GLOBAL INSTANCE & EXPORTS
// ================================================

// Buat instance global
const db = new Database();

// Export untuk penggunaan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Database, db };
} else {
    window.db = db;
}

// Auto cleanup expired sessions setiap 5 menit
setInterval(() => {
    const timeoutHours = db.getSetting('session_timeout_hours', 8);
    db.cleanupExpiredSessions(timeoutHours);
}, 5 * 60 * 1000); // 5 menit

console.log('Database system ready!');
