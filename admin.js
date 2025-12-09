/**
 * ADMIN DASHBOARD LOGIC - SISTEM ABSENSI
 * Fungsi: Mengelola semua fungsi administratif sistem
 */

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentAdmin = null;
let attendanceSystem = null;
let isInitialized = false;
let liveMonitoringInterval = null;
let selectedAttendanceId = null;
let selectedEmployeeId = null;

// ============================================
// 1. INITIALIZATION FUNCTIONS
// ============================================

/**
 * Initialize admin dashboard saat halaman dimuat
 */
function initializeAdminDashboard() {
    console.log('🔄 Initializing admin dashboard...');
    
    // Cek authentication dan role admin
    if (!checkAdminAuth()) {
        return;
    }
    
    // Initialize systems
    attendanceSystem = new AttendanceSystem();
    currentAdmin = auth.getCurrentUser();
    
    // Setup UI components
    setupAdminDashboard();
    
    // Load initial data
    loadInitialData();
    
    // Setup event listeners
    setupAdminEventListeners();
    
    // Start time updates
    startAdminTimeUpdates();
    
    isInitialized = true;
    console.log('✅ Admin dashboard initialized');
}

/**
 * Cek authentication dan role admin
 * @returns {boolean} Status authorization
 */
function checkAdminAuth() {
    // Cek login
    if (!auth.isLoggedIn()) {
        console.log('🚫 Not logged in, redirecting to login');
        window.location.href = 'index.html';
        return false;
    }
    
    // Cek role (harus admin)
    const user = auth.getCurrentUser();
    if (user.role !== 'admin') {
        console.log(`🚫 User is ${user.role}, redirecting to employee dashboard`);
        window.location.href = 'employee.html';
        return false;
    }
    
    return true;
}

/**
 * Setup UI components admin dashboard
 */
function setupAdminDashboard() {
    // Update admin info
    updateAdminInfo();
    
    // Setup navigation
    setupAdminNavigation();
    
    // Setup modal handlers
    setupModalHandlers();
    
    // Setup filter handlers
    setupFilterHandlers();
    
    // Update initial time
    updateAdminDateTime();
}

/**
 * Update informasi admin di UI
 */
function updateAdminInfo() {
    const adminNameElement = document.getElementById('adminName');
    const greetingElement = document.querySelector('.header-info h1');
    
    if (adminNameElement) {
        adminNameElement.textContent = currentAdmin.name;
    }
    
    if (greetingElement) {
        greetingElement.innerHTML = `<i class="fas fa-user-shield"></i> Dashboard Administrator`;
    }
}

/**
 * Setup semua event listeners
 */
function setupAdminEventListeners() {
    // Export buttons
    document.getElementById('exportTodayExcel')?.addEventListener('click', exportTodayExcel);
    document.getElementById('exportExcel')?.addEventListener('click', exportExcelReport);
    document.getElementById('exportPDF')?.addEventListener('click', exportPDFReport);
    
    // Modal buttons
    document.querySelectorAll('.btn-close').forEach(btn => {
        btn.addEventListener('click', closeAdminModal);
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAdminModal();
            }
        });
    });
    
    // Escape key untuk close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAdminModal();
        }
    });
    
    // Logout buttons
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', logoutAdmin);
    });
}

/**
 * Start periodic updates untuk admin
 */
function startAdminTimeUpdates() {
    // Update waktu setiap detik
    setInterval(updateAdminDateTime, 1000);
    
    // Auto refresh data setiap 30 detik
    setInterval(refreshOverviewData, 30000);
    
    // Session check setiap menit
    setInterval(checkAdminSession, 60000);
}

// ============================================
// 2. DASHBOARD ADMIN FUNCTIONS
// ============================================

/**
 * Load data awal untuk dashboard
 */
function loadInitialData() {
    console.log('📊 Loading initial admin data...');
    
    // Load secara berurutan
    setTimeout(() => loadAdminOverview(), 100);
    setTimeout(() => loadTodaySummary(), 200);
    setTimeout(() => loadAlerts(), 300);
    setTimeout(() => loadEmployeesTable(), 400);
    setTimeout(() => loadHolidaysTable(), 500);
    setTimeout(() => loadRanking(), 600);
}

/**
 * Load dan tampilkan ringkasan sistem
 */
function loadAdminOverview() {
    console.log('📈 Loading admin overview...');
    
    // Ambil data statistik
    const employees = auth.getAllEmployees(true);
    const activeEmployees = employees.filter(e => e.isActive !== false);
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    
    // Hitung statistik
    const presentToday = todayAttendances.filter(a => 
        a.status === 'hadir' || (a.status === 'hadir' && a.lateMinutes > 0)
    ).length;
    
    const lateToday = todayAttendances.filter(a => a.lateMinutes > 0).length;
    const leaveToday = todayAttendances.filter(a => 
        a.status === 'izin' || a.status === 'sakit' || a.status === 'cuti'
    ).length;
    
    const permitToday = todayAttendances.filter(a => a.status === 'izin' || a.status === 'cuti').length;
    const sickToday = todayAttendances.filter(a => a.status === 'sakit').length;
    
    // Update stat cards
    updateStatCard('totalEmployees', activeEmployees.length);
    updateStatCard('activeEmployees', activeEmployees.filter(e => e.isActive === true).length);
    updateStatCard('presentToday', presentToday);
    updateStatCard('presentPercent', activeEmployees.length > 0 ? 
        Math.round((presentToday / activeEmployees.length) * 100) + '%' : '0%');
    updateStatCard('lateToday', lateToday);
    updateStatCard('latePercent', presentToday > 0 ? 
        Math.round((lateToday / presentToday) * 100) + '%' : '0%');
    updateStatCard('leaveToday', leaveToday);
    updateStatCard('permitToday', permitToday);
    updateStatCard('sickToday', sickToday);
}

/**
 * Load dan tampilkan tabel absensi hari ini
 */
function loadTodaySummary() {
    console.log('📋 Loading today summary...');
    
    const employees = auth.getAllEmployees(true).filter(e => e.isActive !== false);
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    const tbody = document.querySelector('#todaySummary tbody');
    
    if (!tbody) return;
    
    // Clear loading indicator
    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        tbody.innerHTML = createEmptyTableRow('Belum ada data karyawan');
        return;
    }
    
    // Loop semua karyawan
    employees.forEach(employee => {
        const attendance = todayAttendances.find(a => a.employeeId === employee.id);
        const row = createTodaySummaryRow(employee, attendance);
        tbody.innerHTML += row;
    });
}

/**
 * Load dan tampilkan alerts/warnings untuk admin
 */
function loadAlerts() {
    console.log('⚠️ Loading admin alerts...');
    
    const alerts = generateAdminAlerts();
    const alertList = document.getElementById('alertList');
    const alertCount = document.getElementById('alertCount');
    
    if (!alertList) return;
    
    // Update alert count
    if (alertCount) {
        alertCount.textContent = alerts.length;
    }
    
    // Clear existing alerts
    alertList.innerHTML = '';
    
    if (alerts.length === 0) {
        alertList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Tidak Ada Peringatan</h4>
                <p>Semua sistem berjalan normal</p>
            </div>
        `;
        return;
    }
    
    // Add alerts
    alerts.forEach(alert => {
        const alertElement = createAlertElement(alert);
        alertList.appendChild(alertElement);
    });
}

/**
 * Generate alerts berdasarkan kondisi sistem
 */
function generateAdminAlerts() {
    const alerts = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Data untuk analysis
    const employees = auth.getAllEmployees(true).filter(e => e.isActive === true);
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    
    // 1. Alert: Karyawan belum absen setelah jam 8
    if (currentHour >= 8) {
        const absentEmployees = employees.filter(emp => {
            const hasAttendance = todayAttendances.some(a => a.employeeId === emp.id);
            return !hasAttendance;
        });
        
        if (absentEmployees.length > 0) {
            alerts.push({
                type: 'warning',
                title: `${absentEmployees.length} Karyawan Belum Absen`,
                description: `Masuk pukul 08:00. ${absentEmployees.slice(0, 3).map(e => e.name).join(', ')}${absentEmployees.length > 3 ? ' dan lainnya' : ''}`,
                time: 'Hari ini',
                icon: 'fa-clock'
            });
        }
    }
    
    // 2. Alert: Karyawan dengan alfa 3+ hari dalam seminggu
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    employees.forEach(employee => {
        const lastWeekAttendances = attendanceSystem.getAttendanceHistory(employee.id)
            .filter(a => new Date(a.date) >= oneWeekAgo);
        
        if (lastWeekAttendances.length === 0) {
            alerts.push({
                type: 'danger',
                title: `Karyawan ${employee.name.split(' ')[0]} Tidak Ada Absensi`,
                description: 'Tidak ada absensi dalam 7 hari terakhir',
                time: 'Minggu ini',
                icon: 'fa-user-times'
            });
        }
    });
    
    // 3. Alert: Keterlambatan berlebihan
    const excessiveLate = todayAttendances.filter(a => a.lateMinutes > 30);
    if (excessiveLate.length > 0) {
        alerts.push({
            type: 'warning',
            title: `${excessiveLate.length} Karyawan Terlambat > 30 Menit`,
            description: 'Perlu penanganan khusus',
            time: 'Hari ini',
            icon: 'fa-running'
        });
    }
    
    // 4. Info: Statistik hari ini
    if (todayAttendances.length > 0) {
        const presentRate = Math.round((todayAttendances.length / employees.length) * 100);
        if (presentRate < 70) {
            alerts.push({
                type: 'info',
                title: `Kehadiran Hari Ini ${presentRate}%`,
                description: `Hanya ${todayAttendances.length} dari ${employees.length} karyawan yang absen`,
                time: 'Hari ini',
                icon: 'fa-chart-line'
            });
        }
    }
    
    return alerts.slice(0, 5); // Max 5 alerts
}

// ============================================
// 3. EMPLOYEE MANAGEMENT FUNCTIONS
// ============================================

/**
 * Load dan tampilkan tabel karyawan
 */
function loadEmployeesTable() {
    console.log('👥 Loading employees table...');
    
    const employees = auth.getAllEmployees(true);
    const tbody = document.querySelector('#employeesTable tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        tbody.innerHTML = createEmptyTableRow('Belum ada data karyawan');
        return;
    }
    
    // Add employee rows
    employees.forEach(employee => {
        const row = createEmployeeRow(employee);
        tbody.innerHTML += row;
    });
    
    // Setup row actions
    setupEmployeeRowActions();
}

/**
 * Show modal untuk tambah karyawan baru
 */
function showAddEmployeeModal() {
    console.log('➕ Showing add employee modal');
    
    // Reset form
    const form = document.getElementById('addEmployeeForm');
    if (form) {
        form.reset();
    }
    
    // Show modal
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Proses tambah karyawan baru
 */
function addNewEmployee() {
    console.log('✅ Processing new employee addition');
    
    const nameInput = document.getElementById('newEmployeeName');
    const usernameInput = document.getElementById('newEmployeeUsername');
    
    if (!nameInput || !usernameInput) {
        showNotification('Form tidak lengkap', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    
    // Validasi input
    if (!name || !username) {
        showNotification('Nama dan username harus diisi', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('Username minimal 3 karakter', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#addEmployeeModal .btn-success');
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
        submitBtn.innerHTML = '<div class="spinner"></div> Memproses...';
        submitBtn.disabled = true;
    }
    
    // Process
    setTimeout(() => {
        const result = auth.addEmployee(name, username);
        
        if (result.success) {
            showNotification('Karyawan berhasil ditambahkan', 'success');
            closeAdminModal();
            
            // Refresh data
            loadEmployeesTable();
            loadAdminOverview();
            
            // Log
            console.log(`➕ Added new employee: ${name} (${username})`);
        } else {
            showNotification(result.message, 'error');
        }
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 800);
}

/**
 * Reset password karyawan
 */
function resetPassword(employeeId) {
    if (!confirm('Reset password karyawan ke default "password123"?')) {
        return;
    }
    
    console.log(`🔄 Resetting password for employee ID: ${employeeId}`);
    
    const result = auth.resetPassword(employeeId);
    
    if (result.success) {
        showNotification('Password berhasil direset', 'success');
    } else {
        showNotification('Gagal reset password', 'error');
    }
}

/**
 * Toggle status aktif karyawan
 */
function toggleEmployeeStatus(employeeId) {
    const employees = auth.getAllEmployees(true);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee) {
        showNotification('Karyawan tidak ditemukan', 'error');
        return;
    }
    
    const action = employee.isActive ? 'nonaktifkan' : 'aktifkan';
    
    if (!confirm(`Apakah Anda yakin ingin ${action} karyawan ini?`)) {
        return;
    }
    
    // Update status
    const employeesData = JSON.parse(localStorage.getItem('employees'));
    const index = employeesData.findIndex(e => e.id === employeeId);
    
    if (index !== -1) {
        employeesData[index].isActive = !employee.isActive;
        employeesData[index].updatedAt = new Date().toISOString();
        localStorage.setItem('employees', JSON.stringify(employeesData));
        
        showNotification(`Karyawan berhasil di${action}`, 'success');
        loadEmployeesTable();
        loadAdminOverview();
    }
}

// ============================================
// 4. ATTENDANCE CORRECTION FUNCTIONS
// ============================================

/**
 * Show modal untuk koreksi absensi
 */
function openCorrectionModal(attendanceId, employeeId = null) {
    console.log(`✏️ Opening correction modal for attendance: ${attendanceId}`);
    
    selectedAttendanceId = attendanceId;
    selectedEmployeeId = employeeId;
    
    // Reset form
    const form = document.getElementById('correctionForm');
    if (form) {
        form.reset();
    }
    
    // Load data jika edit existing
    if (attendanceId) {
        loadAttendanceForCorrection(attendanceId);
    } 
    // Jika manual entry
    else if (employeeId) {
        loadEmployeeForManualEntry(employeeId);
    }
    
    // Show modal
    const modal = document.getElementById('correctionModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Load data absensi untuk koreksi
 */
function loadAttendanceForCorrection(attendanceId) {
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    const attendance = attendances.find(a => a.id === attendanceId);
    
    if (!attendance) {
        showNotification('Data absensi tidak ditemukan', 'error');
        return;
    }
    
    // Load employee data
    const employees = auth.getAllEmployees();
    const employee = employees.find(e => e.id === attendance.employeeId);
    
    // Fill form
    const employeeNameInput = document.getElementById('correctionEmployeeName');
    const dateInput = document.getElementById('correctionDate');
    const checkinInput = document.getElementById('correctionCheckIn');
    const checkoutInput = document.getElementById('correctionCheckOut');
    const statusSelect = document.getElementById('correctionStatus');
    const notesTextarea = document.getElementById('correctionNotes');
    
    if (employeeNameInput) employeeNameInput.value = employee?.name || 'Unknown';
    if (dateInput) dateInput.value = attendance.date;
    if (checkinInput) checkinInput.value = attendance.checkIn || '';
    if (checkoutInput) checkoutInput.value = attendance.checkOut || '';
    if (statusSelect) statusSelect.value = attendance.status;
    if (notesTextarea) notesTextarea.value = attendance.notes || '';
    
    // Disable some fields for edit
    if (employeeNameInput) employeeNameInput.disabled = true;
    if (dateInput) dateInput.disabled = true;
}

/**
 * Load data employee untuk manual entry
 */
function loadEmployeeForManualEntry(employeeId) {
    const employees = auth.getAllEmployees();
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee) {
        showNotification('Karyawan tidak ditemukan', 'error');
        return;
    }
    
    // Fill form
    const employeeNameInput = document.getElementById('correctionEmployeeName');
    const dateInput = document.getElementById('correctionDate');
    const checkinInput = document.getElementById('correctionCheckIn');
    const checkoutInput = document.getElementById('correctionCheckOut');
    const statusSelect = document.getElementById('correctionStatus');
    
    if (employeeNameInput) employeeNameInput.value = employee.name;
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (checkinInput) checkinInput.value = '07:30';
    if (checkoutInput) checkoutInput.value = '15:30';
    if (statusSelect) statusSelect.value = 'hadir';
    
    // Enable fields for manual entry
    if (employeeNameInput) employeeNameInput.disabled = true;
    if (dateInput) dateInput.disabled = false;
}

/**
 * Save correction atau manual entry
 */
function saveCorrection() {
    console.log('💾 Saving attendance correction...');
    
    // Get form data
    const date = document.getElementById('correctionDate')?.value;
    const checkIn = document.getElementById('correctionCheckIn')?.value;
    const checkOut = document.getElementById('correctionCheckOut')?.value;
    const status = document.getElementById('correctionStatus')?.value;
    const notes = document.getElementById('correctionNotes')?.value;
    
    // Validasi
    if (!date) {
        showNotification('Tanggal harus diisi', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#correctionModal .btn-primary');
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
        submitBtn.innerHTML = '<div class="spinner"></div> Menyimpan...';
        submitBtn.disabled = true;
    }
    
    // Process
    setTimeout(() => {
        let success = false;
        
        // Jika edit existing
        if (selectedAttendanceId) {
            success = saveAttendanceCorrection(selectedAttendanceId, {
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                status: status,
                notes: notes || ''
            });
        } 
        // Jika manual entry
        else if (selectedEmployeeId) {
            success = addManualAttendance(selectedEmployeeId, {
                date: date,
                checkIn: checkIn,
                checkOut: checkOut,
                status: status,
                notes: notes
            });
        }
        
        if (success) {
            showNotification('Data berhasil disimpan', 'success');
            closeAdminModal();
            
            // Refresh data
            loadTodaySummary();
            loadAdminOverview();
        } else {
            showNotification('Gagal menyimpan data', 'error');
        }
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 800);
}

/**
 * Save attendance correction
 */
function saveAttendanceCorrection(attendanceId, updates) {
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    const index = attendances.findIndex(a => a.id === attendanceId);
    
    if (index === -1) {
        return false;
    }
    
    // Save old data for log
    const oldData = { ...attendances[index] };
    
    // Update data
    attendances[index] = {
        ...attendances[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    // Recalculate late minutes
    if (updates.checkIn && attendances[index].status === 'hadir') {
        const [startHour, startMinute] = [7, 30]; // 07:30
        const [checkHour, checkMinute] = updates.checkIn.split(':').map(Number);
        
        const startTotal = startHour * 60 + startMinute;
        const checkTotal = checkHour * 60 + checkMinute;
        
        attendances[index].lateMinutes = Math.max(0, checkTotal - startTotal);
    }
    
    // Save to localStorage
    localStorage.setItem('attendances', JSON.stringify(attendances));
    
    // Log correction
    logAttendanceCorrection(attendanceId, oldData, attendances[index]);
    
    return true;
}

/**
 * Add manual attendance entry
 */
function addManualAttendance(employeeId, data) {
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    
    // Cek apakah sudah ada absensi di tanggal yang sama
    const existing = attendances.find(a => 
        a.employeeId === employeeId && a.date === data.date
    );
    
    if (existing) {
        // Update existing
        return saveAttendanceCorrection(existing.id, {
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            status: data.status,
            notes: data.notes
        });
    }
    
    // Create new attendance
    const newId = attendances.length > 0 ? Math.max(...attendances.map(a => a.id)) + 1 : 1;
    
    // Calculate late minutes
    let lateMinutes = 0;
    if (data.status === 'hadir' && data.checkIn) {
        const [startHour, startMinute] = [7, 30];
        const [checkHour, checkMinute] = data.checkIn.split(':').map(Number);
        
        const startTotal = startHour * 60 + startMinute;
        const checkTotal = checkHour * 60 + checkMinute;
        lateMinutes = Math.max(0, checkTotal - startTotal);
    }
    
    const newAttendance = {
        id: newId,
        employeeId: employeeId,
        date: data.date,
        checkIn: data.checkIn || null,
        checkOut: data.checkOut || null,
        status: data.status || 'hadir',
        notes: data.notes || '',
        lateMinutes: lateMinutes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    attendances.push(newAttendance);
    localStorage.setItem('attendances', JSON.stringify(attendances));
    
    // Log activity
    logManualAttendanceEntry(employeeId, newAttendance);
    
    return true;
}

// ============================================
// 5. REPORTS & EXPORT FUNCTIONS
// ============================================

/**
 * Export today's attendance to Excel
 */
function exportTodayExcel() {
    console.log('📊 Exporting today summary to Excel');
    
    const employees = auth.getAllEmployees(true).filter(e => e.isActive !== false);
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    const today = new Date().toISOString().split('T')[0];
    
    // Prepare data
    const reportData = employees.map(employee => {
        const attendance = todayAttendances.find(a => a.employeeId === employee.id);
        
        return {
            'Nama Karyawan': employee.name,
            'Username': employee.username,
            'Tanggal': formatDate(new Date(today)),
            'Waktu Masuk': attendance?.checkIn || '-',
            'Waktu Keluar': attendance?.checkOut || '-',
            'Status': getStatusText(attendance?.status || 'alfa', attendance?.lateMinutes || 0),
            'Keterlambatan': attendance?.lateMinutes > 0 ? `${attendance.lateMinutes} menit` : '-',
            'Catatan': attendance?.notes || '-',
            'Departemen': employee.department || '-',
            'Jabatan': employee.position || '-'
        };
    });
    
    // Generate Excel
    generateExcelFile(reportData, `rekap-absensi-harian-${today}.xlsx`);
    showNotification('File Excel berhasil diunduh', 'success');
}

/**
 * Export report to Excel dengan filter
 */
function exportExcelReport() {
    console.log('📊 Exporting custom report to Excel');
    
    // Get filter values
    const period = document.getElementById('reportPeriod')?.value || 'today';
    const employeeId = document.getElementById('reportEmployee')?.value;
    const dateFrom = document.getElementById('reportDateFrom')?.value;
    const dateTo = document.getElementById('reportDateTo')?.value;
    
    // Get filtered data
    const reportData = getFilteredReportData(period, employeeId, dateFrom, dateTo);
    
    if (reportData.length === 0) {
        showNotification('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Generate filename
    const filename = `rekap-absensi-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Generate Excel
    generateExcelFile(reportData, filename);
    showNotification('File Excel berhasil diunduh', 'success');
}

/**
 * Export report to PDF
 */
function exportPDFReport() {
    console.log('📄 Exporting report to PDF');
    
    // Get filter values
    const period = document.getElementById('reportPeriod')?.value || 'today';
    const employeeId = document.getElementById('reportEmployee')?.value;
    const dateFrom = document.getElementById('reportDateFrom')?.value;
    const dateTo = document.getElementById('reportDateTo')?.value;
    
    // Get filtered data
    const reportData = getFilteredReportData(period, employeeId, dateFrom, dateTo);
    
    if (reportData.length === 0) {
        showNotification('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Generate PDF using browser print
    generatePDFFile(reportData);
    showNotification('Membuat PDF...', 'info');
}

/**
 * Get filtered report data
 */
function getFilteredReportData(period, employeeId, dateFrom, dateTo) {
    let attendances = JSON.parse(localStorage.getItem('attendances'));
    const employees = auth.getAllEmployees(true);
    
    // Filter by employee
    if (employeeId && employeeId !== 'all') {
        attendances = attendances.filter(a => a.employeeId === parseInt(employeeId));
    }
    
    // Filter by period
    const now = new Date();
    let filteredAttendances = [];
    
    switch(period) {
        case 'today':
            const today = now.toISOString().split('T')[0];
            filteredAttendances = attendances.filter(a => a.date === today);
            break;
        case 'week':
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
            filteredAttendances = attendances.filter(a => a.date >= weekAgoStr);
            break;
        case 'month':
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayStr = firstDay.toISOString().split('T')[0];
            filteredAttendances = attendances.filter(a => a.date >= firstDayStr);
            break;
        case 'custom':
            if (dateFrom && dateTo) {
                filteredAttendances = attendances.filter(a => a.date >= dateFrom && a.date <= dateTo);
            } else {
                filteredAttendances = attendances;
            }
            break;
        default:
            filteredAttendances = attendances;
    }
    
    // Map to report format
    return filteredAttendances.map(attendance => {
        const employee = employees.find(e => e.id === attendance.employeeId);
        return {
            'Nama Karyawan': employee?.name || 'Unknown',
            'Username': employee?.username || '-',
            'Tanggal': formatDate(new Date(attendance.date)),
            'Waktu Masuk': attendance.checkIn || '-',
            'Waktu Keluar': attendance.checkOut || '-',
            'Status': getStatusText(attendance.status, attendance.lateMinutes),
            'Keterlambatan': attendance.lateMinutes > 0 ? `${attendance.lateMinutes} menit` : '-',
            'Catatan': attendance.notes || '-',
            'Departemen': employee?.department || '-',
            'Jabatan': employee?.position || '-'
        };
    });
}

/**
 * Generate Excel file
 */
function generateExcelFile(data, filename) {
    // Create CSV content
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => 
        Object.values(item).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate PDF file using print
 */
function generatePDFFile(data) {
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Generate HTML for print
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Absensi</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #2c3e50; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #2c3e50; color: white; }
                .header { text-align: center; margin-bottom: 30px; }
                .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Laporan Absensi Karyawan</h1>
                <p>Perusahaan: Sistem Absensi Digital</p>
                <p>Tanggal Cetak: ${formatDate(new Date())}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>Dicetak oleh: ${currentAdmin?.name || 'Administrator'}</p>
                <p>Sistem Absensi Digital © 2024</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// 6. HOLIDAY MANAGEMENT FUNCTIONS
// ============================================

/**
 * Load dan tampilkan tabel hari libur
 */
function loadHolidaysTable() {
    console.log('🎉 Loading holidays table...');
    
    const holidays = JSON.parse(localStorage.getItem('holidays') || '[]');
    const tbody = document.querySelector('#holidaysTable tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (holidays.length === 0) {
        tbody.innerHTML = createEmptyTableRow('Belum ada data hari libur');
        return;
    }
    
    // Sort by date (newest first)
    holidays.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add holiday rows
    holidays.forEach(holiday => {
        const row = createHolidayRow(holiday);
        tbody.innerHTML += row;
    });
    
    // Setup delete buttons
    setupHolidayDeleteButtons();
}

/**
 * Show modal untuk tambah hari libur
 */
function showAddHolidayModal() {
    console.log('➕ Showing add holiday modal');
    
    // Reset form
    const form = document.getElementById('addHolidayForm');
    if (form) {
        form.reset();
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = document.getElementById('newHolidayDate');
        if (dateInput) {
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
    }
    
    // Show modal
    const modal = document.getElementById('addHolidayModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Proses tambah hari libur
 */
function addNewHoliday() {
    console.log('✅ Adding new holiday...');
    
    const dateInput = document.getElementById('newHolidayDate');
    const descInput = document.getElementById('newHolidayDesc');
    const typeSelect = document.getElementById('newHolidayType');
    
    if (!dateInput || !descInput || !typeSelect) {
        showNotification('Form tidak lengkap', 'error');
        return;
    }
    
    const date = dateInput.value;
    const description = descInput.value.trim();
    const type = typeSelect.value;
    
    // Validasi
    if (!date || !description) {
        showNotification('Tanggal dan deskripsi harus diisi', 'error');
        return;
    }
    
    // Cek apakah tanggal sudah ada
    const holidays = JSON.parse(localStorage.getItem('holidays') || '[]');
    if (holidays.some(h => h.date === date)) {
        showNotification('Tanggal libur sudah ada', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#addHolidayModal .btn-success');
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
        submitBtn.innerHTML = '<div class="spinner"></div> Men
