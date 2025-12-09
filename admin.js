// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentData = {};
        this.workStartTime = '07:30';
        this.workEndTime = '15:30';
        this.init();
    }

    init() {
        // Check authentication and admin role
        if (!auth.requireAdmin()) return;
        
        // Load work hours from localStorage
        this.loadWorkHours();
        
        // Load admin data
        this.loadAdminData();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load initial page (dashboard)
        this.loadPage('dashboard');
        
        // Start auto refresh
        this.startAutoRefresh();
    }

    loadWorkHours() {
        const savedStart = localStorage.getItem('work_start_time');
        const savedEnd = localStorage.getItem('work_end_time');
        
        if (savedStart) this.workStartTime = savedStart;
        if (savedEnd) this.workEndTime = savedEnd;
    }

    loadAdminData() {
        const user = auth.getCurrentUser();
        if (user) {
            document.getElementById('adminName').textContent = user.name;
        }
        
        // Update current date and time
        this.updateDateTime();
    }

    updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('currentDate').textContent = dateStr;
        document.getElementById('currentTime').textContent = 
            now.toLocaleTimeString('id-ID');
    }

    initEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.nav-link').dataset.page;
                this.loadPage(page);
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.closest('.nav-link').classList.add('active');
            });
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Initialize modals
        this.initModals();
    }

    initModals() {
        // Add employee modal
        document.getElementById('saveEmployeeBtn')?.addEventListener('click', () => {
            this.addEmployee();
        });
        
        // Edit attendance modal
        document.getElementById('saveAttendanceBtn')?.addEventListener('click', () => {
            this.saveAttendanceCorrection();
        });
        
        // Add holiday modal
        document.getElementById('saveHolidayBtn')?.addEventListener('click', () => {
            this.addHoliday();
        });
        
        // Export buttons
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
            this.exportToExcel();
        });
        
        document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
            this.exportToPDF();
        });
    }

    loadPage(page) {
        this.currentPage = page;
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard Admin',
            'employees': 'Data Karyawan',
            'attendance': 'Monitoring Absensi',
            'correction': 'Koreksi Absensi',
            'reports': 'Laporan & Rekap',
            'holidays': 'Manajemen Hari Libur',
            'settings': 'Pengaturan Sistem'
        };
        
        const subtitles = {
            'dashboard': 'Ringkasan dan Statistik Kehadiran',
            'employees': 'Kelola data karyawan dan akun',
            'attendance': 'Pantau absensi real-time',
            'correction': 'Edit dan koreksi data absensi',
            'reports': 'Generate laporan dan rekap',
            'holidays': 'Kelola hari libur nasional',
            'settings': 'Pengaturan sistem absensi'
        };
        
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
        document.getElementById('pageSubtitle').textContent = subtitles[page] || '';
        
        // Load page content
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'employees':
                this.loadEmployees();
                break;
            case 'attendance':
                this.loadAttendanceMonitoring();
                break;
            case 'correction':
                this.loadAttendanceCorrection();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'holidays':
                this.loadHolidays();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // ============ DASHBOARD PAGE ============
    loadDashboard() {
        const content = `
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="stat-card total">
                        <div class="stat-icon text-primary">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-number" id="totalEmployees">0</div>
                        <div class="stat-label">Total Karyawan</div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="stat-card present">
                        <div class="stat-icon text-success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-number" id="presentToday">0</div>
                        <div class="stat-label">Hadir Hari Ini</div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="stat-card late">
                        <div class="stat-icon text-warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-number" id="lateToday">0</div>
                        <div class="stat-label">Terlambat Hari Ini</div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="stat-card absent">
                        <div class="stat-icon text-danger">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-number" id="absentToday">0</div>
                        <div class="stat-label">Belum Absen</div>
                    </div>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-lg-8 mb-4">
                    <div class="chart-container">
                        <h5><i class="fas fa-chart-line me-2"></i>Tren Kehadiran Bulan Ini</h5>
                        <canvas id="attendanceChart" height="250"></canvas>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <div class="chart-container">
                        <h5><i class="fas fa-chart-pie me-2"></i>Status Hari Ini</h5>
                        <canvas id="statusChart" height="250"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-lg-6 mb-4">
                    <div class="alert-box alert-warning-box">
                        <div class="alert-title">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                            <h6 class="mb-0">Perhatian: Karyawan Belum Absen</h6>
                        </div>
                        <div class="mt-2" id="absentList">
                            <!-- List akan diisi -->
                        </div>
                    </div>
                    
                    <div class="alert-box alert-danger-box">
                        <div class="alert-title">
                            <i class="fas fa-user-times text-danger"></i>
                            <h6 class="mb-0">Karyawan dengan Status Alfa (7 Hari Terakhir)</h6>
                        </div>
                        <div class="mt-2" id="alphaList">
                            <!-- List akan diisi -->
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-6 mb-4">
                    <div class="chart-container">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="fas fa-trophy me-2"></i>Top 5 Karyawan Teladan</h5>
                            <button class="btn btn-sm btn-outline-primary" id="viewAllTopBtn">
                                <i class="fas fa-list me-1"></i>Lihat Semua
                            </button>
                        </div>
                        <div id="topEmployeesList">
                            <!-- List akan diisi -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load dashboard data
        this.loadDashboardData();
        
        // Add event listeners for dashboard
        setTimeout(() => {
            document.getElementById('viewAllTopBtn')?.addEventListener('click', () => {
                this.loadPage('reports');
            });
        }, 100);
    }

    loadDashboardData() {
        // Load summary stats
        const employees = db.getEmployees('employee');
        const summary = db.getTodaySummary();
        const topEmployees = db.getTopEmployees(5);
        
        // Update stats
        document.getElementById('totalEmployees').textContent = employees.length;
        document.getElementById('presentToday').textContent = summary.checked_in;
        document.getElementById('lateToday').textContent = summary.late;
        document.getElementById('absentToday').textContent = summary.absent;
        
        // Load absent employees list
        this.loadAbsentEmployees();
        
        // Load alpha employees list
        this.loadAlphaEmployees();
        
        // Load top employees
        this.loadTopEmployeesList(topEmployees);
        
        // Load charts
        this.loadCharts();
    }

    loadAbsentEmployees() {
        const today = Utils.getTodayDate();
        const now = new Date();
        const currentHour = now.getHours();
        
        // Only show after 8 AM
        if (currentHour < 8) {
            document.getElementById('absentList').innerHTML = `
                <p class="text-muted mb-0">
                    <i class="fas fa-info-circle me-1"></i>
                    Belum waktunya untuk menampilkan daftar belum absen (setelah jam 08:00)
                </p>
            `;
            return;
        }
        
        const employees = db.getEmployees('employee');
        const todayAttendances = db.getAttendances({ date: today });
        const absentEmployees = employees.filter(employee => {
            return !todayAttendances.some(att => att.employee_id === employee.id);
        });
        
        if (absentEmployees.length === 0) {
            document.getElementById('absentList').innerHTML = `
                <p class="text-success mb-0">
                    <i class="fas fa-check-circle me-1"></i>
                    Semua karyawan sudah absen hari ini!
                </p>
            `;
            return;
        }
        
        let html = '<div class="list-group">';
        absentEmployees.forEach(employee => {
            html += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${employee.name}</strong>
                            <small class="d-block text-muted">${employee.position}</small>
                        </div>
                        <span class="badge bg-warning">Belum Absen</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        document.getElementById('absentList').innerHTML = html;
    }

    loadAlphaEmployees() {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const startDate = sevenDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const attendances = db.getAttendances({
            startDate: startDate,
            endDate: endDate,
            status: 'Alfa'
        });
        
        // Group by employee
        const alphaCount = {};
        attendances.forEach(att => {
            alphaCount[att.employee_id] = (alphaCount[att.employee_id] || 0) + 1;
        });
        
        const employees = db.getEmployees('employee');
        const alphaEmployees = employees
            .filter(emp => alphaCount[emp.id] > 0)
            .sort((a, b) => alphaCount[b.id] - alphaCount[a.id]);
        
        if (alphaEmployees.length === 0) {
            document.getElementById('alphaList').innerHTML = `
                <p class="text-success mb-0">
                    <i class="fas fa-check-circle me-1"></i>
                    Tidak ada karyawan dengan status Alfa dalam 7 hari terakhir
                </p>
            `;
            return;
        }
        
        let html = '<div class="list-group">';
        alphaEmployees.forEach(employee => {
            const count = alphaCount[employee.id];
            html += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${employee.name}</strong>
                            <small class="d-block text-muted">${employee.position}</small>
                        </div>
                        <div>
                            <span class="badge bg-danger me-2">${count}x Alfa</span>
                            <button class="btn btn-sm btn-outline-primary" 
                                    onclick="window.admin.markAsIzin(${employee.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        document.getElementById('alphaList').innerHTML = html;
    }

    loadTopEmployeesList(topEmployees) {
        const container = document.getElementById('topEmployeesList');
        
        if (!topEmployees || topEmployees.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-trophy fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Belum ada data karyawan teladan</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="list-group">';
        topEmployees.forEach((employee, index) => {
            const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const medalIcon = index < 3 ? 
                `<i class="fas fa-medal ${medalClass} me-2"></i>` : 
                `<span class="badge bg-secondary me-2">${index + 1}</span>`;
            
            html += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            ${medalIcon}
                            <strong>${employee.name}</strong>
                            <small class="d-block text-muted">${employee.position}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-success">${employee.score} poin</span>
                            <small class="d-block text-muted">
                                Hadir: ${employee.present} | Telat: ${employee.late}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    loadCharts() {
        // Get current month data
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        const trendData = db.getAttendanceTrend(month, year);
        
        // Line Chart - Attendance Trend
        const ctx1 = document.getElementById('attendanceChart');
        if (ctx1) {
            // Destroy existing chart if any
            if (window.attendanceChart) {
                window.attendanceChart.destroy();
            }
            
            window.attendanceChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: trendData.dates,
                    datasets: [
                        {
                            label: 'Hadir',
                            data: trendData.presentData,
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Terlambat',
                            data: trendData.lateData,
                            borderColor: '#f39c12',
                            backgroundColor: 'rgba(243, 156, 18, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Alfa',
                            data: trendData.absentData,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
        
        // Pie Chart - Today's Status
        const ctx2 = document.getElementById('statusChart');
        if (ctx2) {
            // Destroy existing chart if any
            if (window.statusChart) {
                window.statusChart.destroy();
            }
            
            const today = Utils.getTodayDate();
            const todayAttendances = db.getAttendances({ date: today });
            const employees = db.getEmployees('employee');
            
            const presentCount = todayAttendances.filter(a => a.status === 'Hadir').length;
            const lateCount = todayAttendances.filter(a => a.late_minutes > 0).length;
            const leaveCount = todayAttendances.filter(a => 
                ['Izin', 'Sakit', 'Cuti'].includes(a.status)
            ).length;
            const absentCount = employees.length - todayAttendances.length;
            
            window.statusChart = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Hadir', 'Terlambat', 'Izin/Sakit', 'Belum Absen'],
                    datasets: [{
                        data: [presentCount, lateCount, leaveCount, absentCount],
                        backgroundColor: [
                            '#27ae60',
                            '#f39c12',
                            '#3498db',
                            '#e74c3c'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        }
    }

    // ============ EMPLOYEES PAGE ============
    loadEmployees() {
        const content = `
            <div class="table-container">
                <div class="table-header d-flex justify-content-between align-items-center p-3">
                    <h5 class="mb-0"><i class="fas fa-users me-2"></i>Daftar Karyawan</h5>
                    <div>
                        <button class="btn btn-primary" id="addEmployeeBtn">
                            <i class="fas fa-plus me-1"></i>Tambah Karyawan
                        </button>
                        <button class="btn btn-outline-secondary ms-2" id="viewLogsBtn">
                            <i class="fas fa-history me-1"></i>Log Perubahan
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="employeesTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nama</th>
                                <th>Username</th>
                                <th>Jabatan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="employeesTableBody">
                            <!-- Data akan diisi -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load employees data
        this.loadEmployeesData();
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
                const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
                modal.show();
            });
            
            document.getElementById('viewLogsBtn')?.addEventListener('click', () => {
                this.viewLogs();
            });
        }, 100);
    }

    loadEmployeesData() {
        const employees = db.getEmployees('employee');
        const tbody = document.getElementById('employeesTableBody');
        
        if (!tbody) return;
        
        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-users fa-2x text-muted mb-3"></i>
                        <p class="text-muted">Belum ada data karyawan</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        employees.forEach((employee, index) => {
            // Get today's attendance status
            const todayAttendance = db.getTodayAttendance(employee.id);
            let statusBadge = '<span class="badge bg-secondary">Belum Absen</span>';
            
            if (todayAttendance) {
                if (todayAttendance.status === 'Hadir') {
                    if (todayAttendance.late_minutes > 0) {
                        statusBadge = `<span class="badge bg-warning">Hadir (Telat ${todayAttendance.late_minutes}m)</span>`;
                    } else {
                        statusBadge = '<span class="badge bg-success">Hadir</span>';
                    }
                } else {
                    const badgeClass = {
                        'Izin': 'warning',
                        'Sakit': 'info',
                        'Cuti': 'primary',
                        'Alfa': 'danger'
                    }[todayAttendance.status] || 'secondary';
                    statusBadge = `<span class="badge bg-${badgeClass}">${todayAttendance.status}</span>`;
                }
            }
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <strong>${employee.name}</strong>
                        <br>
                        <small class="text-muted">ID: ${employee.id}</small>
                    </td>
                    <td>${employee.username}</td>
                    <td>${employee.position}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-action btn-edit" onclick="window.admin.resetPassword(${employee.id})" 
                                title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-sm btn-action btn-view ms-1" onclick="window.admin.viewEmployee(${employee.id})"
                                title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    addEmployee() {
        const form = document.getElementById('addEmployeeForm');
        const formData = new FormData(form);
        
        const employeeData = {
            name: formData.get('name'),
            username: formData.get('username'),
            password: formData.get('password'),
            position: formData.get('position')
        };
        
        // Validate
        if (!employeeData.name || !employeeData.username) {
            Utils.showToast('Nama dan username wajib diisi', 'error');
            return;
        }
        
        // Check if username exists
        const employees = db.getEmployees();
        if (employees.some(emp => emp.username === employeeData.username)) {
            Utils.showToast('Username sudah digunakan', 'error');
            return;
        }
        
        try {
            const newEmployee = db.addEmployee(employeeData);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
            modal.hide();
            
            // Reset form
            form.reset();
            
            // Reload employees data
            this.loadEmployeesData();
            
            // Update dashboard stats
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
            
            Utils.showToast(`Karyawan ${newEmployee.name} berhasil ditambahkan`, 'success');
            
        } catch (error) {
            Utils.showToast('Gagal menambahkan karyawan: ' + error.message, 'error');
        }
    }

    resetPassword(employeeId) {
        const employee = db.getEmployeeById(employeeId);
        if (!employee) return;
        
        Utils.confirm(
            'Reset Password',
            `Reset password untuk ${employee.name} ke default (${employee.username}123)?`,
            'Reset',
            'Batal'
        ).then(confirmed => {
            if (confirmed) {
                db.resetPassword(employeeId);
                Utils.showToast(`Password ${employee.name} berhasil direset`, 'success');
                
                // Log the action
                db.logChange({
                    admin_id: auth.getCurrentUser().id,
                    action: 'reset_password',
                    employee_id: employeeId,
                    details: `Password direset ke default`,
                    changed_at: new Date().toISOString()
                });
            }
        });
    }

    viewEmployee(employeeId) {
        const employee = db.getEmployeeById(employeeId);
        if (!employee) return;
        
        // Get employee stats
        const now = new Date();
        const stats = db.getEmployeeStats(employeeId, now.getMonth() + 1, now.getFullYear());
        
        const content = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">Detail Karyawan</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-3 text-center">
                            <div class="profile-avatar-lg mb-3">
                                <i class="fas fa-user-circle fa-5x"></i>
                            </div>
                            <h4>${employee.name}</h4>
                            <p class="text-muted">${employee.position}</p>
                        </div>
                        <div class="col-md-9">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Username</label>
                                    <input type="text" class="form-control" value="${employee.username}" readonly>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Password</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" value="${employee.password}" readonly id="passwordField${employeeId}">
                                        <button class="btn btn-outline-secondary" type="button" onclick="window.admin.showPassword(${employeeId})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Bergabung</label>
                                    <input type="text" class="form-control" 
                                           value="${employee.created_at ? Utils.formatDate(employee.created_at) : '-'}" 
                                           readonly>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Role</label>
                                    <input type="text" class="form-control" value="${employee.role === 'admin' ? 'Administrator' : 'Karyawan'}" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h5 class="mb-3">Statistik Bulan Ini</h5>
                    <div class="row text-center">
                        <div class="col-3">
                            <div class="stat-box-sm">
                                <h3>${stats.present}</h3>
                                <small>Hadir</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="stat-box-sm">
                                <h3>${stats.late}</h3>
                                <small>Telat</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="stat-box-sm">
                                <h3>${stats.permission + stats.sick}</h3>
                                <small>Izin/Sakit</small>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="stat-box-sm">
                                <h3>${stats.absent}</h3>
                                <small>Alfa</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h6>Riwayat Absensi Terakhir</h6>
                        <div class="table-responsive mt-2">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Masuk</th>
                                        <th>Keluar</th>
                                        <th>Status</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.getEmployeeAttendanceHistory(employeeId)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        `;
        
        Utils.showModal(`Detail Karyawan: ${employee.name}`, content, 'modal-lg');
    }

    getEmployeeAttendanceHistory(employeeId) {
        const attendances = db.getAttendances({ employeeId: employeeId }).slice(0, 10);
        
        if (attendances.length === 0) {
            return `
                <tr>
                    <td colspan="5" class="text-center py-3 text-muted">
                        Belum ada riwayat absensi
                    </td>
                </tr>
            `;
        }
        
        let html = '';
        attendances.forEach(att => {
            html += `
                <tr>
                    <td>${Utils.formatDate(att.date)}</td>
                    <td>${Utils.formatTime(att.time_in)} ${att.late_minutes > 0 ? 
                        `<span class="badge bg-danger">${att.late_minutes}m</span>` : ''}</td>
                    <td>${Utils.formatTime(att.time_out)}</td>
                    <td>${Utils.getStatusBadge(att.status)}</td>
                    <td>${att.note || '-'}</td>
                </tr>
            `;
        });
        
        return html;
    }

    showPassword(employeeId) {
        const passwordField = document.getElementById(`passwordField${employeeId}`);
        if (passwordField) {
            passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
        }
    }

    viewLogs() {
        const logs = db.getChangeLogs();
        const tbody = document.getElementById('logsTableBody');
        
        if (!tbody) return;
        
        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-history fa-2x text-muted mb-3"></i>
                        <p class="text-muted">Belum ada log perubahan</p>
                    </td>
                </tr>
            `;
        } else {
            let html = '';
            logs.forEach(log => {
                const admin = db.getEmployeeById(log.admin_id);
                const employee = db.getEmployeeById(log.employee_id);
                
                let changeDetails = '';
                if (log.old_data && log.new_data) {
                    const changes = [];
                    if (log.old_data.status !== log.new_data.status) {
                        changes.push(`Status: ${log.old_data.status} → ${log.new_data.status}`);
                    }
                    if (log.old_data.time_in !== log.new_data.time_in) {
                        changes.push(`Jam Masuk: ${log.old_data.time_in || '-'} → ${log.new_data.time_in || '-'}`);
                    }
                    if (log.old_data.note !== log.new_data.note) {
                        changes.push(`Catatan diubah`);
                    }
                    changeDetails = changes.join(', ');
                } else if (log.action === 'reset_password') {
                    changeDetails = log.details;
                }
                
                html += `
                    <tr>
                        <td>${Utils.formatDateTime(log.changed_at)}</td>
                        <td>${admin?.name || 'System'}</td>
                        <td>${employee?.name || '-'}</td>
                        <td>${changeDetails}</td>
                        <td>${log.reason || log.details || '-'}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
        
        new bootstrap.Modal(document.getElementById('viewLogsModal')).show();
    }

    // ============ ATTENDANCE MONITORING PAGE ============
    loadAttendanceMonitoring() {
        const content = `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-filter me-2"></i>Filter Data</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Tanggal</label>
                            <input type="date" class="form-control" id="filterDate" value="${Utils.getTodayDate()}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filterStatus">
                                <option value="">Semua Status</option>
                                <option value="Hadir">Hadir</option>
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Cuti">Cuti</option>
                                <option value="Alfa">Alfa</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Karyawan</label>
                            <select class="form-select" id="filterEmployee">
                                <option value="">Semua Karyawan</option>
                                <!-- Options will be loaded -->
                            </select>
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button class="btn btn-primary w-100" id="applyFilterBtn">
                                <i class="fas fa-search me-1"></i>Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <div class="table-header d-flex justify-content-between align-items-center p-3">
                    <h5 class="mb-0"><i class="fas fa-calendar-check me-2"></i>Monitoring Absensi</h5>
                    <div>
                        <button class="btn btn-success" id="exportDataBtn">
                            <i class="fas fa-download me-1"></i>Ekspor Data
                        </button>
                        <button class="btn btn-outline-primary ms-2" onclick="window.admin.loadPage('correction')">
                            <i class="fas fa-edit me-1"></i>Koreksi Data
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="monitoringTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nama</th>
                                <th>Jabatan</th>
                                <th>Tanggal</th>
                                <th>Jam Masuk</th>
                                <th>Jam Keluar</th>
                                <th>Status</th>
                                <th>Keterlambatan</th>
                                <th>Catatan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="monitoringTableBody">
                            <!-- Data akan diisi -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load employee options for filter
        this.loadEmployeeOptions();
        
        // Load initial data
        this.loadMonitoringData();
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('applyFilterBtn')?.addEventListener('click', () => {
                this.loadMonitoringData();
            });
            
            document.getElementById('exportDataBtn')?.addEventListener('click', () => {
                new bootstrap.Modal(document.getElementById('exportModal')).show();
            });
        }, 100);
    }

    loadEmployeeOptions() {
        const employees = db.getEmployees('employee');
        const select = document.getElementById('filterEmployee');
        
        if (!select) return;
        
        let options = '<option value="">Semua Karyawan</option>';
        employees.forEach(employee => {
            options += `<option value="${employee.id}">${employee.name}</option>`;
        });
        
        select.innerHTML = options;
    }

    loadMonitoringData() {
        const filters = {};
        
        const date = document.getElementById('filterDate')?.value;
        if (date) filters.date = date;
        
        const status = document.getElementById('filterStatus')?.value;
        if (status) filters.status = status;
        
        const employeeId = document.getElementById('filterEmployee')?.value;
        if (employeeId) filters.employeeId = employeeId;
        
        const attendances = db.getAttendances(filters);
        const tbody = document.getElementById('monitoringTableBody');
        
        if (!tbody) return;
        
        if (attendances.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                        <p class="text-muted">Tidak ada data absensi</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        attendances.forEach((attendance, index) => {
            const employee = db.getEmployeeById(attendance.employee_id);
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <strong>${employee.name}</strong>
                        <br>
                        <small class="text-muted">${employee.username}</small>
                    </td>
                    <td>${employee.position}</td>
                    <td>${Utils.formatDate(attendance.date)}</td>
                    <td>
                        ${Utils.formatTime(attendance.time_in)}
                        ${attendance.late_minutes > 0 ? 
                            `<br><small class="text-danger">Telat ${attendance.late_minutes}m</small>` : ''}
                    </td>
                    <td>${Utils.formatTime(attendance.time_out)}</td>
                    <td>${Utils.getStatusBadge(attendance.status)}</td>
                    <td>${attendance.late_minutes > 0 ? 
                        `<span class="badge bg-danger">${attendance.late_minutes} menit</span>` : 
                        `<span class="badge bg-success">Tepat waktu</span>`}
                    </td>
                    <td>${attendance.note || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-action btn-edit" onclick="window.admin.editAttendance(${attendance.id})"
                                title="Edit Absensi">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-action btn-view ms-1" 
                                onclick="window.admin.viewAttendanceDetails(${attendance.id})"
                                title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    // ============ ATTENDANCE CORRECTION PAGE ============
    loadAttendanceCorrection() {
        const content = `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-search me-2"></i>Cari Data untuk Dikoreksi</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Karyawan</label>
                            <select class="form-select" id="searchEmployee">
                                <option value="">Pilih Karyawan</option>
                                <!-- Options will be loaded -->
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Dari Tanggal</label>
                            <input type="date" class="form-control" id="searchStartDate">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Sampai Tanggal</label>
                            <input type="date" class="form-control" id="searchEndDate" value="${Utils.getTodayDate()}">
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button class="btn btn-primary w-100" id="searchBtn">
                                <i class="fas fa-search me-1"></i>Cari
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <div class="table-header d-flex justify-content-between align-items-center p-3">
                    <h5 class="mb-0"><i class="fas fa-edit me-2"></i>Data Absensi untuk Koreksi</h5>
                    <button class="btn btn-outline-success" id="markAbsentBtn">
                        <i class="fas fa-user-times me-1"></i>Tandai Alfa
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover" id="correctionTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nama</th>
                                <th>Tanggal</th>
                                <th>Jam Masuk</th>
                                <th>Jam Keluar</th>
                                <th>Status</th>
                                <th>Keterlambatan</th>
                                <th>Catatan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="correctionTableBody">
                            <!-- Data akan diisi -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load employee options
        this.loadEmployeeOptionsForSearch();
        
        // Set default dates (last 7 days)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const startDateInput = document.getElementById('searchStartDate');
        if (startDateInput) {
            startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
        }
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('searchBtn')?.addEventListener('click', () => {
                this.searchAttendance();
            });
            
            document.getElementById('markAbsentBtn')?.addEventListener('click', () => {
                this.showMarkAbsentModal();
            });
        }, 100);
    }

    loadEmployeeOptionsForSearch() {
        const employees = db.getEmployees('employee');
        const select = document.getElementById('searchEmployee');
        
        if (!select) return;
        
        let options = '<option value="">Pilih Karyawan</option>';
        employees.forEach(employee => {
            options += `<option value="${employee.id}">${employee.name}</option>`;
        });
        
        select.innerHTML = options;
    }

    searchAttendance() {
        const employeeId = document.getElementById('searchEmployee')?.value;
        const startDate = document.getElementById('searchStartDate')?.value;
        const endDate = document.getElementById('searchEndDate')?.value;
        
        if (!employeeId || !startDate || !endDate) {
            Utils.showToast('Harap pilih karyawan dan rentang tanggal', 'error');
            return;
        }
        
        const filters = {
            employeeId: employeeId,
            startDate: startDate,
            endDate: endDate
        };
        
        const attendances = db.getAttendances(filters);
        this.currentData.correctionResults = attendances;
        
        const tbody = document.getElementById('correctionTableBody');
        
        if (!tbody) return;
        
        if (attendances.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                        <p class="text-muted">Tidak ada data absensi</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        attendances.forEach((attendance, index) => {
            const employee = db.getEmployeeById(attendance.employee_id);
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <strong>${employee.name}</strong>
                        <br>
                        <small class="text-muted">${employee.position}</small>
                    </td>
                    <td>${Utils.formatDate(attendance.date)}</td>
                    <td>${Utils.formatTime(attendance.time_in)}</td>
                    <td>${Utils.formatTime(attendance.time_out)}</td>
                    <td>${Utils.getStatusBadge(attendance.status)}</td>
                    <td>${attendance.late_minutes > 0 ? 
                        `<span class="badge bg-danger">${attendance.late_minutes}m</span>` : 
                        `<span class="badge bg-success">Tepat waktu</span>`}
                    </td>
                    <td>${attendance.note || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-action btn-edit" 
                                onclick="window.admin.editAttendance(${attendance.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    editAttendance(attendanceId) {
        const attendance = db.getAttendances().find(a => a.id == attendanceId);
        if (!attendance) return;
        
        const employee = db.getEmployeeById(attendance.employee_id);
        
        // Fill modal form
        document.getElementById('editEmployeeName').value = employee.name;
        document.getElementById('editAttendanceDate').value = attendance.date;
        document.getElementById('editTimeIn').value = attendance.time_in || '08:00';
        document.getElementById('editTimeOut').value = attendance.time_out || '16:00';
        document.getElementById('editStatus').value = attendance.status;
        document.getElementById('editLateMinutes').value = attendance.late_minutes || 0;
        document.getElementById('editNote').value = attendance.note || '';
        document.getElementById('editReason').value = '';
        
        // Store current attendance ID
        const form = document.getElementById('editAttendanceForm');
        if (form) {
            form.dataset.attendanceId = attendanceId;
        }
        
        // Show modal
        new bootstrap.Modal(document.getElementById('editAttendanceModal')).show();
    }

    saveAttendanceCorrection() {
        const form = document.getElementById('editAttendanceForm');
        const attendanceId = form?.dataset.attendanceId;
        
        if (!attendanceId) {
            Utils.showToast('Data absensi tidak ditemukan', 'error');
            return;
        }
        
        const timeIn = document.getElementById('editTimeIn').value;
        const timeOut = document.getElementById('editTimeOut').value;
        const status = document.getElementById('editStatus').value;
        const note = document.getElementById('editNote').value;
        const reason = document.getElementById('editReason').value;
        
        if (!reason.trim()) {
            Utils.showToast('Harap isi alasan koreksi', 'error');
            return;
        }
        
        const updateData = {
            time_in: timeIn,
            time_out: timeOut || null,
            status: status,
            note: note
        };
        
        try {
            const admin = auth.getCurrentUser();
            const updatedAttendance = db.updateAttendance(attendanceId, updateData, admin.id, reason);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'));
            modal.hide();
            
            // Reset form
            form.reset();
            delete form.dataset.attendanceId;
            
            // Reload current page data
            if (this.currentPage === 'correction') {
                this.searchAttendance();
            } else if (this.currentPage === 'attendance') {
                this.loadMonitoringData();
            }
            
            // Update dashboard if on dashboard
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
            
            Utils.showToast('Data absensi berhasil diperbarui', 'success');
            
        } catch (error) {
            Utils.showToast('Gagal memperbarui data: ' + error.message, 'error');
        }
    }

    showMarkAbsentModal() {
        const employees = db.getEmployees('employee');
        const today = Utils.getTodayDate();
        
        let options = '';
        employees.forEach(employee => {
            const todayAttendance = db.getTodayAttendance(employee.id);
            if (!todayAttendance) {
                options += `<option value="${employee.id}">${employee.name}</option>`;
            }
        });
        
        if (!options) {
            Utils.showToast('Semua karyawan sudah memiliki data absensi hari ini', 'info');
            return;
        }
        
        const content = `
            <div class="mb-3">
                <label class="form-label">Pilih Karyawan</label>
                <select class="form-select" id="absentEmployee">
                    ${options}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Tanggal</label>
                <input type="date" class="form-control" id="absentDate" value="${today}">
            </div>
            <div class="mb-3">
                <label class="form-label">Catatan</label>
                <textarea class="form-control" id="absentNote" rows="2" 
                          placeholder="Alasan menandai sebagai alfa"></textarea>
            </div>
        `;
        
        Utils.showModal('Tandai Sebagai Alfa', content, '', `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-danger" id="confirmMarkAbsent">Tandai Alfa</button>
        `).then(modal => {
            document.getElementById('confirmMarkAbsent')?.addEventListener('click', () => {
                this.markAsAbsent();
                modal.hide();
            });
        });
    }

    markAsAbsent() {
        const employeeId = document.getElementById('absentEmployee')?.value;
        const date = document.getElementById('absentDate')?.value;
        const note = document.getElementById('absentNote')?.value;
        
        if (!employeeId || !date) {
            Utils.showToast('Harap pilih karyawan dan tanggal', 'error');
            return;
        }
        
        try {
            const admin = auth.getCurrentUser();
            const attendance = db.markAbsent(employeeId, date, note);
            
            // Log the action
            db.logChange({
                admin_id: admin.id,
                action: 'mark_absent',
                employee_id: employeeId,
                details: `Ditandai sebagai Alfa pada ${date}`,
                changed_at: new Date().toISOString()
            });
            
            // Reload current page
            if (this.currentPage === 'correction') {
                this.searchAttendance();
            } else if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
            
            Utils.showToast('Karyawan berhasil ditandai sebagai Alfa', 'success');
            
        } catch (error) {
            Utils.showToast('Gagal menandai alfa: ' + error.message, 'error');
        }
    }

    markAsIzin(employeeId) {
        const employee = db.getEmployeeById(employeeId);
        if (!employee) return;
        
        Utils.confirm(
            'Ubah Status ke Izin',
            `Ubah status hari ini untuk ${employee.name} menjadi Izin?`,
            'Ubah',
            'Batal'
        ).then(confirmed => {
            if (confirmed) {
                const today = Utils.getTodayDate();
                const admin = auth.getCurrentUser();
                
                // Check if already has attendance today
                const existingAttendance = db.getTodayAttendance(employeeId);
                
                if (existingAttendance) {
                    // Update existing attendance
                    const updateData = {
                        status: 'Izin',
                        time_in: null,
                        time_out: null,
                        late_minutes: 0
                    };
                    
                    db.updateAttendance(existingAttendance.id, updateData, admin.id, 
                        'Diubah oleh admin karena lapor izin');
                } else {
                    // Create new attendance record
                    const attendance = db.markAbsent(employeeId, today, 'Diubah oleh admin karena lapor izin');
                    
                    // Then update to Izin
                    const updateData = {
                        status: 'Izin',
                        note: 'Diubah oleh admin karena lapor izin'
                    };
                    
                    db.updateAttendance(attendance.id, updateData, admin.id, 
                        'Diubah oleh admin karena lapor izin');
                }
                
                // Reload data
                if (this.currentPage === 'dashboard') {
                    this.loadDashboardData();
                    this.loadAlphaEmployees();
                }
                
                Utils.showToast(`Status ${employee.name} berhasil diubah menjadi Izin`, 'success');
            }
        });
    }

    viewAttendanceDetails(attendanceId) {
        const attendance = db.getAttendances().find(a => a.id == attendanceId);
        if (!attendance) return;
        
        const employee = db.getEmployeeById(attendance.employee_id);
        
        const content = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Nama Karyawan</label>
                        <input type="text" class="form-control" value="${employee.name}" readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Jabatan</label>
                        <input type="text" class="form-control" value="${employee.position}" readonly>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Tanggal</label>
                        <input type="text" class="form-control" value="${Utils.formatDate(attendance.date, true)}" readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <div class="form-control">${Utils.getStatusBadge(attendance.status)}</div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Jam Masuk</label>
                        <input type="text" class="form-control" value="${Utils.formatTime(attendance.time_in)}" readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Jam Keluar</label>
                        <input type="text" class="form-control" value="${Utils.formatTime(attendance.time_out)}" readonly>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Keterlambatan</label>
                        <input type="text" class="form-control" 
                               value="${attendance.late_minutes > 0 ? attendance.late_minutes + ' menit' : 'Tepat waktu'}" 
                               readonly>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Waktu Pencatatan</label>
                        <input type="text" class="form-control" 
                               value="${Utils.formatDateTime(attendance.created_at)}" 
                               readonly>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Catatan</label>
                <textarea class="form-control" rows="3" readonly>${attendance.note || '-'}</textarea>
            </div>
        `;
        
        Utils.showModal('Detail Absensi', content);
    }

    // ============ REPORTS PAGE ============
    loadReports() {
        const content = `
            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-file-excel fa-3x text-success mb-3"></i>
                            <h5>Laporan Excel</h5>
                            <p class="text-muted">Ekspor data mentah untuk analisis HRD</p>
                            <button class="btn btn-success w-100" onclick="window.admin.showExportModal()">
                                <i class="fas fa-download me-2"></i>Buat Laporan Excel
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                            <h5>Laporan PDF</h5>
                            <p class="text-muted">Format rapi untuk arsip dan presentasi</p>
                            <button class="btn btn-danger w-100" onclick="window.admin.showExportModal()">
                                <i class="fas fa-download me-2"></i>Buat Laporan PDF
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-trophy fa-3x text-warning mb-3"></i>
                            <h5>Rekap Karyawan Teladan</h5>
                            <p class="text-muted">Ranking dan penghargaan karyawan</p>
                            <button class="btn btn-warning w-100" onclick="window.admin.showTopEmployeesReport()">
                                <i class="fas fa-chart-bar me-2"></i>Lihat Rekap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-calculator me-2"></i>Generate Laporan Custom</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3 mb-4">
                        <div class="col-md-3">
                            <label class="form-label">Periode</label>
                            <select class="form-select" id="reportPeriod">
                                <option value="month">Bulan Ini</option>
                                <option value="week">Minggu Ini</option>
                                <option value="today">Hari Ini</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Dari Tanggal</label>
                            <input type="date" class="form-control" id="reportStartDate" 
                                   value="${this.getFirstDayOfMonth()}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Sampai Tanggal</label>
                            <input type="date" class="form-control" id="reportEndDate" 
                                   value="${Utils.getTodayDate()}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Karyawan</label>
                            <select class="form-select" id="reportEmployee">
                                <option value="all">Semua Karyawan</option>
                                <!-- Options will be loaded -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" id="generateReportBtn">
                            <i class="fas fa-chart-bar me-2"></i>Generate Laporan
                        </button>
                        <button class="btn btn-outline-secondary" id="previewReportBtn">
                            <i class="fas fa-eye me-2"></i>Preview Data
                        </button>
                    </div>
                    
                    <div class="mt-4" id="reportPreview">
                        <!-- Report preview will be shown here -->
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load employee options
        this.loadReportEmployeeOptions();
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
                this.updateReportDates(e.target.value);
            });
            
            document.getElementById('generateReportBtn')?.addEventListener('click', () => {
                this.generateReport();
            });
            
            document.getElementById('previewReportBtn')?.addEventListener('click', () => {
                this.previewReport();
            });
        }, 100);
    }

    getFirstDayOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }

    loadReportEmployeeOptions() {
        const employees = db.getEmployees('employee');
        const select = document.getElementById('reportEmployee');
        
        if (!select) return;
        
        let options = '<option value="all">Semua Karyawan</option>';
        employees.forEach(employee => {
            options += `<option value="${employee.id}">${employee.name}</option>`;
        });
        
        select.innerHTML = options;
        
        // Also load for export modal
        const exportSelect = document.getElementById('exportEmployee');
        if (exportSelect) {
            exportSelect.innerHTML = options;
        }
    }

    updateReportDates(period) {
        const now = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'today':
                startDate = endDate = Utils.getTodayDate();
                break;
            case 'week':
                const monday = new Date(now);
                monday.setDate(now.getDate() - now.getDay() + 1);
                startDate = monday.toISOString().split('T')[0];
                endDate = Utils.getTodayDate();
                break;
            case 'month':
                startDate = this.getFirstDayOfMonth();
                endDate = Utils.getTodayDate();
                break;
            case 'custom':
                // Don't change dates
                return;
        }
        
        document.getElementById('reportStartDate').value = startDate;
        document.getElementById('reportEndDate').value = endDate;
    }

    generateReport() {
        const startDate = document.getElementById('reportStartDate')?.value;
        const endDate = document.getElementById('reportEndDate')?.value;
        const employeeId = document.getElementById('reportEmployee')?.value;
        
        if (!startDate || !endDate) {
            Utils.showToast('Harap pilih rentang tanggal', 'error');
            return;
        }
        
        const filters = {
            startDate: startDate,
            endDate: endDate
        };
        
        if (employeeId && employeeId !== 'all') {
            filters.employeeId = employeeId;
        }
        
        const reportData = db.generateReport(filters);
        this.currentData.report = reportData;
        
        const previewContainer = document.getElementById('reportPreview');
        if (!previewContainer) return;
        
        if (reportData.length === 0) {
            previewContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Tidak ada data absensi dalam periode yang dipilih
                </div>
            `;
            return;
        }
        
        // Calculate summary
        const summary = {
            totalRecords: reportData.length,
            totalEmployees: new Set(reportData.map(r => r.NIK)).size,
            totalPresent: reportData.filter(r => r.Status === 'Hadir').length,
            totalLate: reportData.filter(r => r['Keterangan Telat'] === 'Ya').length,
            totalAbsent: reportData.filter(r => r.Status === 'Alfa').length
        };
        
        const preview = `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Preview Laporan</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="stat-box-sm">
                                <h3>${summary.totalRecords}</h3>
                                <small>Total Data</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box-sm">
                                <h3>${summary.totalEmployees}</h3>
                                <small>Total Karyawan</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box-sm">
                                <h3>${summary.totalPresent}</h3>
                                <small>Total Hadir</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-box-sm">
                                <h3>${summary.totalLate}</h3>
                                <small>Total Telat</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex gap-2 mb-3">
                        <button class="btn btn-success" onclick="window.admin.exportReportToExcel()">
                            <i class="fas fa-file-excel me-2"></i>Download Excel
                        </button>
                        <button class="btn btn-danger" onclick="window.admin.exportReportToPDF()">
                            <i class="fas fa-file-pdf me-2"></i>Download PDF
                        </button>
                        <button class="btn btn-outline-primary" onclick="window.admin.printReport()">
                            <i class="fas fa-print me-2"></i>Print
                        </button>
                    </div>
                    
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                        <table class="table table-sm table-bordered" id="reportTable">
                            <thead>
                                <tr>
                                    <th>NIK</th>
                                    <th>Nama</th>
                                    <th>Tanggal</th>
                                    <th>Masuk</th>
                                    <th>Keluar</th>
                                    <th>Status</th>
                                    <th>Telat</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.slice(0, 20).map(row => `
                                    <tr>
                                        <td>${row.NIK}</td>
                                        <td>${row.Nama}</td>
                                        <td>${row.Tanggal}</td>
                                        <td>${row['Jam Masuk']}</td>
                                        <td>${row['Jam Keluar']}</td>
                                        <td>${row.Status}</td>
                                        <td>${row['Keterangan Telat']}</td>
                                        <td>${row.Catatan}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${reportData.length > 20 ? 
                        `<p class="text-muted mt-2">Menampilkan 20 dari ${reportData.length} data. Download untuk melihat semua data.</p>` : ''}
                </div>
            </div>
        `;
        
        previewContainer.innerHTML = preview;
    }

    previewReport() {
        // Similar to generateReport but just show data without export options
        this.generateReport();
    }

    showExportModal() {
        new bootstrap.Modal(document.getElementById('exportModal')).show();
    }

    exportToExcel() {
        const startDate = document.getElementById('exportStartDate')?.value;
        const endDate = document.getElementById('exportEndDate')?.value;
        const employeeId = document.getElementById('exportEmployee')?.value;
        
        if (!startDate || !endDate) {
            Utils.showToast('Harap pilih rentang tanggal', 'error');
            return;
        }
        
        const filters = {
            startDate: startDate,
            endDate: endDate
        };
        
        if (employeeId && employeeId !== 'all') {
            filters.employeeId = employeeId;
        }
        
        const reportData = db.generateReport(filters);
        
        if (reportData.length === 0) {
            Utils.showToast('Tidak ada data untuk diekspor', 'error');
            return;
        }
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);
        
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
        
        // Generate filename
        const period = startDate === endDate ? 
            startDate : `${startDate}_sd_${endDate}`;
        const filename = `Laporan_Absensi_${period}.xlsx`;
        
        // Export
        XLSX.writeFile(wb, filename);
        
        Utils.showToast('Laporan Excel berhasil diunduh', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        if (modal) modal.hide();
    }

    exportToPDF() {
        const startDate = document.getElementById('exportStartDate')?.value;
        const endDate = document.getElementById('exportEndDate')?.value;
        const employeeId = document.getElementById('exportEmployee')?.value;
        
        if (!startDate || !endDate) {
            Utils.showToast('Harap pilih rentang tanggal', 'error');
            return;
        }
        
        const filters = {
            startDate: startDate,
            endDate: endDate
        };
        
        if (employeeId && employeeId !== 'all') {
            filters.employeeId = employeeId;
        }
        
        const reportData = db.generateReport(filters);
        
        if (reportData.length === 0) {
            Utils.showToast('Tidak ada data untuk diekspor', 'error');
            return;
        }
        
        const employee = employeeId !== 'all' ? 
            db.getEmployeeById(employeeId) : null;
        
        // Create HTML content for PDF
        const now = new Date();
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #2c3e50; margin-bottom: 5px;">LAPORAN ABSENSI KARYAWAN</h2>
                    <h3 style="color: #7f8c8d; margin-top: 0;">
                        ${employee ? employee.name : 'Semua Karyawan'}
                    </h3>
                    <p style="color: #95a5a6;">
                        Periode: ${Utils.formatDate(startDate)} - ${Utils.formatDate(endDate)}
                    </p>
                    <p style="color: #95a5a6;">
                        Dicetak: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}
                    </p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
                            <th style="padding: 10px; border: 1px solid #ddd;">NIK</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Nama</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Masuk</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Keluar</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Telat</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(row => `
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 8px;">${row.NIK}</td>
                                <td style="padding: 8px;">${row.Nama}</td>
                                <td style="padding: 8px;">${row.Tanggal}</td>
                                <td style="padding: 8px;">${row['Jam Masuk']}</td>
                                <td style="padding: 8px;">${row['Jam Keluar']}</td>
                                <td style="padding: 8px;">${row.Status}</td>
                                <td style="padding: 8px;">${row['Keterangan Telat']}</td>
                                <td style="padding: 8px;">${row.Catatan}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: right;">
                    <div style="border-top: 2px solid #2c3e50; padding-top: 20px; width: 300px; margin-left: auto;">
                        <p style="margin: 0;">Hormat kami,</p>
                        <p style="margin: 0; font-weight: bold;">Admin HRD</p>
                        <p style="margin: 0;">Sistem Absensi Digital</p>
                    </div>
                </div>
            </div>
        `;
        
        // Create temporary div for PDF generation
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        document.body.appendChild(element);
        
        // Generate PDF
        const opt = {
            margin: 1,
            filename: `Laporan_Absensi_${startDate}_sd_${endDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            document.body.removeChild(element);
            Utils.showToast('Laporan PDF berhasil diunduh', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
            if (modal) modal.hide();
        });
    }

    exportReportToExcel() {
        if (!this.currentData.report || this.currentData.report.length === 0) {
            Utils.showToast('Tidak ada data untuk diekspor', 'error');
            return;
        }
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(this.currentData.report);
        
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
        
        const startDate = document.getElementById('reportStartDate')?.value;
        const endDate = document.getElementById('reportEndDate')?.value;
        const filename = `Laporan_Absensi_${startDate}_sd_${endDate}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        Utils.showToast('Laporan Excel berhasil diunduh', 'success');
    }

    exportReportToPDF() {
        if (!this.currentData.report || this.currentData.report.length === 0) {
            Utils.showToast('Tidak ada data untuk diekspor', 'error');
            return;
        }
        
        const startDate = document.getElementById('reportStartDate')?.value;
        const endDate = document.getElementById('reportEndDate')?.value;
        const employeeId = document.getElementById('reportEmployee')?.value;
        const employee = employeeId !== 'all' ? 
            db.getEmployeeById(employeeId) : null;
        
        const now = new Date();
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #2c3e50; margin-bottom: 5px;">LAPORAN ABSENSI KARYAWAN</h2>
                    <h3 style="color: #7f8c8d; margin-top: 0;">
                        ${employee ? employee.name : 'Semua Karyawan'}
                    </h3>
                    <p style="color: #95a5a6;">
                        Periode: ${Utils.formatDate(startDate)} - ${Utils.formatDate(endDate)}
                    </p>
                    <p style="color: #95a5a6;">
                        Dicetak: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}
                    </p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
                            <th style="padding: 10px; border: 1px solid #ddd;">NIK</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Nama</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Masuk</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Keluar</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Telat</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.currentData.report.map(row => `
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 8px;">${row.NIK}</td>
                                <td style="padding: 8px;">${row.Nama}</td>
                                <td style="padding: 8px;">${row.Tanggal}</td>
                                <td style="padding: 8px;">${row['Jam Masuk']}</td>
                                <td style="padding: 8px;">${row['Jam Keluar']}</td>
                                <td style="padding: 8px;">${row.Status}</td>
                                <td style="padding: 8px;">${row['Keterangan Telat']}</td>
                                <td style="padding: 8px;">${row.Catatan}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: right;">
                    <div style="border-top: 2px solid #2c3e50; padding-top: 20px; width: 300px; margin-left: auto;">
                        <p style="margin: 0;">Hormat kami,</p>
                        <p style="margin: 0; font-weight: bold;">Admin HRD</p>
                        <p style="margin: 0;">Sistem Absensi Digital</p>
                    </div>
                </div>
            </div>
        `;
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        document.body.appendChild(element);
        
        const opt = {
            margin: 1,
            filename: `Laporan_Absensi_${startDate}_sd_${endDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            document.body.removeChild(element);
            Utils.showToast('Laporan PDF berhasil diunduh', 'success');
        });
    }

    printReport() {
        const printContent = document.getElementById('reportPreview')?.innerHTML;
        if (!printContent) return;
        
        const originalContent = document.body.innerHTML;
        
        document.body.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="text-align: center; margin-bottom: 30px;">Laporan Absensi</h2>
                ${printContent}
            </div>
        `;
        
        window.print();
        
        setTimeout(() => {
            document.body.innerHTML = originalContent;
            this.loadPage('reports'); // Reload the page
        }, 500);
    }

    showTopEmployeesReport() {
        const topEmployees = db.getTopEmployees(10);
        const now = new Date();
        
        let html = '<div class="list-group">';
        topEmployees.forEach((employee, index) => {
            const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const medalIcon = index < 3 ? 
                `<i class="fas fa-medal ${medalClass} fa-2x me-3"></i>` : 
                `<span class="rank-badge">${index + 1}</span>`;
            
            html += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex align-items-center">
                        <div class="me-3" style="width: 50px; text-align: center;">
                            ${medalIcon}
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="mb-1">${employee.name}</h5>
                            <p class="mb-1 text-muted">${employee.position}</p>
                            <div class="d-flex gap-3">
                                <small><i class="fas fa-check text-success"></i> Hadir: ${employee.present} hari</small>
                                <small><i class="fas fa-clock text-warning"></i> Telat: ${employee.late}x</small>
                                <small><i class="fas fa-times text-danger"></i> Alfa: ${employee.absent}x</small>
                                <small><i class="fas fa-star text-warning"></i> Skor: ${employee.score}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        const content = `
            <div class="card">
                <div class="card-header bg-warning text-white">
                    <h4 class="card-title mb-0">
                        <i class="fas fa-trophy me-2"></i>Rekap Karyawan Teladan
                    </h4>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-4">
                        Periode: ${Utils.getMonthName(now.getMonth() + 1)} ${now.getFullYear()}
                        <br>
                        <small>Ranking berdasarkan: Minim Alfa → Minim Izin/Sakit → Minim Telat</small>
                    </p>
                    
                    ${html}
                    
                    <div class="mt-4 text-center">
                        <button class="btn btn-warning me-2" onclick="window.admin.exportTopEmployees()">
                            <i class="fas fa-download me-2"></i>Ekspor sebagai Pengumuman
                        </button>
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        Utils.showModal('Rekap Karyawan Teladan', content, 'modal-lg');
    }

    exportTopEmployees() {
        const topEmployees = db.getTopEmployees(10);
        const now = new Date();
        const monthYear = `${Utils.getMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 30px; text-align: center;">
                <div style="margin-bottom: 40px;">
                    <h1 style="color: #f39c12; margin-bottom: 10px;">PENGHARGAAN KARYAWAN TELADAN</h1>
                    <h2 style="color: #2c3e50; margin-top: 0;">Periode ${monthYear}</h2>
                    <p style="color: #7f8c8d; font-size: 18px;">
                        Atas dedikasi dan prestasi dalam menjaga kehadiran dan kedisiplinan
                    </p>
                </div>
                
                <div style="display: flex; justify-content: center; gap: 40px; margin-bottom: 50px;">
                    ${topEmployees.slice(0, 3).map((emp, index) => `
                        <div style="text-align: center;">
                            <div style="font-size: 60px; color: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'};">
                                <i class="fas fa-medal"></i>
                            </div>
                            <h3 style="margin: 10px 0; color: #2c3e50;">${emp.name}</h3>
                            <p style="color: #7f8c8d; margin: 5px 0;">${emp.position}</p>
                            <p style="color: #27ae60; font-weight: bold; margin: 5px 0;">
                                Skor: ${emp.score} | Hadir: ${emp.present} hari
                            </p>
                        </div>
                    `).join('')}
                </div>
                
                ${topEmployees.length > 3 ? `
                    <div style="text-align: left; margin: 40px auto; max-width: 800px;">
                        <h3 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                            Karyawan Berprestasi Lainnya
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            ${topEmployees.slice(3).map((emp, index) => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 15px; width: 50px; text-align: center; font-weight: bold; color: #7f8c8d;">
                                        ${index + 4}
                                    </td>
                                    <td style="padding: 15px;">
                                        <strong style="color: #2c3e50;">${emp.name}</strong>
                                        <br>
                                        <span style="color: #7f8c8d;">${emp.position}</span>
                                    </td>
                                    <td style="padding: 15px; text-align: right;">
                                        <span style="color: #27ae60; font-weight: bold;">Skor: ${emp.score}</span>
                                        <br>
                                        <small style="color: #95a5a6;">Hadir: ${emp.present} | Telat: ${emp.late} | Alfa: ${emp.absent}</small>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                ` : ''}
                
                <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #eee;">
                    <p style="color: #95a5a6;">Dicetak: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}</p>
                    <p style="color: #2c3e50; font-weight: bold;">Departemen HRD</p>
                    <p style="color: #7f8c8d;">Sistem Absensi Digital</p>
                </div>
            </div>
        `;
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        document.body.appendChild(element);
        
        const opt = {
            margin: 1,
            filename: `Pengumuman_Karyawan_Teladan_${monthYear.replace(' ', '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            document.body.removeChild(element);
            Utils.showToast('Pengumuman berhasil diunduh', 'success');
        });
    }

    // ============ HOLIDAYS PAGE ============
    loadHolidays() {
        const content = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0"><i class="fas fa-calendar-times me-2"></i>Manajemen Hari Libur</h5>
                    <button class="btn btn-primary" id="addHolidayBtn">
                        <i class="fas fa-plus me-1"></i>Tambah Hari Libur
                    </button>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Hari Minggu otomatis dianggap libur. Sistem akan menonaktifkan tombol absen pada hari libur.
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-hover" id="holidaysTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tanggal</th>
                                    <th>Keterangan</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="holidaysTableBody">
                                <!-- Data akan diisi -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load holidays data
        this.loadHolidaysData();
        
        // Add event listener
        setTimeout(() => {
            document.getElementById('addHolidayBtn')?.addEventListener('click', () => {
                // Reset form
                document.getElementById('holidayDate').value = Utils.getTodayDate();
                document.getElementById('holidayDescription').value = '';
                
                new bootstrap.Modal(document.getElementById('addHolidayModal')).show();
            });
        }, 100);
    }

    loadHolidaysData() {
        const holidays = db.getHolidays();
        const tbody = document.getElementById('holidaysTableBody');
        
        if (!tbody) return;
        
        if (holidays.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                        <p class="text-muted">Belum ada hari libur yang ditambahkan</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        holidays.forEach((holiday, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <strong>${Utils.formatDate(holiday.date, true)}</strong>
                        <br>
                        <small class="text-muted">${holiday.date}</small>
                    </td>
                    <td>${holiday.description}</td>
                    <td>
                        <button class="btn btn-sm btn-action btn-delete" 
                                onclick="window.admin.deleteHoliday(${holiday.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    addHoliday() {
        const date = document.getElementById('holidayDate')?.value;
        const description = document.getElementById('holidayDescription')?.value.trim();
        
        if (!date || !description) {
            Utils.showToast('Harap isi tanggal dan keterangan', 'error');
            return;
        }
        
        // Check if date already exists
        const holidays = db.getHolidays();
        if (holidays.some(h => h.date === date)) {
            Utils.showToast('Tanggal ini sudah ditambahkan sebagai hari libur', 'error');
            return;
        }
        
        const holiday = {
            date: date,
            description: description
        };
        
        try {
            const newHoliday = db.addHoliday(holiday);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addHolidayModal'));
            modal.hide();
            
            // Reset form
            const form = document.getElementById('addHolidayForm');
            if (form) form.reset();
            
            // Reload holidays data
            this.loadHolidaysData();
            
            Utils.showToast(`Hari libur berhasil ditambahkan: ${description}`, 'success');
            
        } catch (error) {
            Utils.showToast('Gagal menambahkan hari libur: ' + error.message, 'error');
        }
    }

    deleteHoliday(holidayId) {
        const holidays = db.getHolidays();
        const holiday = holidays.find(h => h.id == holidayId);
        
        if (!holiday) return;
        
        Utils.confirm(
            'Hapus Hari Libur',
            `Hapus hari libur ${holiday.description} (${Utils.formatDate(holiday.date)})?`,
            'Hapus',
            'Batal'
        ).then(confirmed => {
            if (confirmed) {
                db.deleteHoliday(holidayId);
                this.loadHolidaysData();
                Utils.showToast('Hari libur berhasil dihapus', 'success');
            }
        });
    }

    // ============ SETTINGS PAGE ============
    loadSettings() {
        const content = `
            <div class="row">
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-clock me-2"></i>Pengaturan Jam Kerja</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Jam Masuk Standar</label>
                                <input type="time" class="form-control" id="workStartTime" value="${this.workStartTime}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jam Keluar Standar</label>
                                <input type="time" class="form-control" id="workEndTime" value="${this.workEndTime}">
                            </div>
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Perubahan jam kerja akan mempengaruhi perhitungan keterlambatan.
                            </div>
                            <button class="btn btn-primary" id="saveWorkHoursBtn">
                                <i class="fas fa-save me-2"></i>Simpan Pengaturan
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0"><i class="fas fa-database me-2"></i>Manajemen Data</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Backup Data</label>
                                <p class="text-muted">Ekspor semua data sistem ke file JSON</p>
                                <button class="btn btn-outline-success w-100 mb-2" id="backupDataBtn">
                                    <i class="fas fa-download me-2"></i>Backup Data
                                </button>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Restore Data</label>
                                <p class="text-muted">Import data dari file backup</p>
                                <input type="file" class="form-control mb-2" id="restoreFile" accept=".json">
                                <button class="btn btn-outline-warning w-100" id="restoreDataBtn">
                                    <i class="fas fa-upload me-2"></i>Restore Data
                                </button>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Reset Data</label>
                                <p class="text-muted">Reset semua data ke kondisi awal</p>
                                <button class="btn btn-outline-danger w-100" id="resetDataBtn">
                                    <i class="fas fa-trash me-2"></i>Reset Semua Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-info-circle me-2"></i>Informasi Sistem</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <div class="info-box">
                                <i class="fas fa-users fa-2x text-primary mb-3"></i>
                                <h5 id="totalEmployeesCount">0</h5>
                                <p class="text-muted mb-0">Total Karyawan</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="info-box">
                                <i class="fas fa-calendar-check fa-2x text-success mb-3"></i>
                                <h5 id="totalAttendanceCount">0</h5>
                                <p class="text-muted mb-0">Total Absensi</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="info-box">
                                <i class="fas fa-hdd fa-2x text-info mb-3"></i>
                                <h5 id="storageUsed">0 KB</h5>
                                <p class="text-muted mb-0">Penyimpanan</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h6>Versi Sistem</h6>
                        <p>Sistem Absensi Karyawan v1.0</p>
                        <p class="text-muted">Dibangun dengan HTML, CSS, JavaScript & LocalStorage</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentContainer').innerHTML = content;
        
        // Load system info
        this.loadSystemInfo();
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('saveWorkHoursBtn')?.addEventListener('click', () => {
                this.saveWorkHours();
            });
            
            document.getElementById('backupDataBtn')?.addEventListener('click', () => {
                this.backupData();
            });
            
            document.getElementById('restoreDataBtn')?.addEventListener('click', () => {
                this.restoreData();
            });
            
            document.getElementById('resetDataBtn')?.addEventListener('click', () => {
                this.resetData();
            });
        }, 100);
    }

    loadSystemInfo() {
        const employees = db.getEmployees('employee');
        const attendances = db.getAttendances();
        
        document.getElementById('totalEmployeesCount').textContent = employees.length;
        document.getElementById('totalAttendanceCount').textContent = attendances.length;
        
        // Calculate storage usage
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + (value ? value.length : 0);
        }
        
        const sizeInKB = Math.round(totalSize / 1024);
        document.getElementById('storageUsed').textContent = sizeInKB + ' KB';
    }

    saveWorkHours() {
        const startTime = document.getElementById('workStartTime')?.value;
        const endTime = document.getElementById('workEndTime')?.value;
        
        if (!startTime || !endTime) {
            Utils.showToast('Harap isi jam kerja', 'error');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('work_start_time', startTime);
        localStorage.setItem('work_end_time', endTime);
        
        this.workStartTime = startTime;
        this.workEndTime = endTime;
        
        Utils.showToast('Pengaturan jam kerja berhasil disimpan', 'success');
    }

    backupData() {
        const backup = {};
        
        // Collect all data from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        
        // Create download link
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `absensi_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        Utils.showToast('Backup data berhasil diunduh', 'success');
    }

    restoreData() {
        const fileInput = document.getElementById('restoreFile');
        const file = fileInput?.files[0];
        
        if (!file) {
            Utils.showToast('Pilih file backup terlebih dahulu', 'error');
            return;
        }
        
        Utils.confirm(
            'Restore Data',
            'Restore data akan mengganti semua data saat ini. Lanjutkan?',
            'Restore',
            'Batal'
        ).then(confirmed => {
            if (!confirmed) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Clear current data
                    localStorage.clear();
                    
                    // Restore data
                    Object.keys(backup).forEach(key => {
                        localStorage.setItem(key, backup[key]);
                    });
                    
                    // Reinitialize database
                    new Database();
                    
                    Utils.showToast('Data berhasil direstore', 'success');
                    
                    // Reload page
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                    
                } catch (error) {
                    Utils.showToast('File backup tidak valid', 'error');
                }
            };
            
            reader.readAsText(file);
        });
    }

    resetData() {
        Utils.confirm(
            'Reset Semua Data',
            'Reset akan menghapus semua data kecuali akun admin. Data tidak dapat dikembalikan!',
            'Reset',
            'Batal'
        ).then(confirmed => {
            if (!confirmed) return;
            
            // Keep only admin account
            const adminUser = auth.getCurrentUser();
            
            // Clear all data
            localStorage.clear();
            
            // Reinitialize with default data
            new Database();
            
            // Restore admin login
            if (adminUser) {
                localStorage.setItem('currentUser', JSON.stringify(adminUser));
            }
            
            Utils.showToast('Semua data berhasil direset', 'success');
            
            // Reload page
            setTimeout(() => {
                location.reload();
            }, 1000);
        });
    }

    // ============ UTILITY METHODS ============
    logout() {
        Utils.confirm('Logout', 'Apakah Anda yakin ingin logout?', 'Logout', 'Batal')
            .then(confirmed => {
                if (confirmed) {
                    auth.logout();
                }
            });
    }

    startAutoRefresh() {
        // Update time every second
        setInterval(() => {
            this.updateDateTime();
        }, 1000);
        
        // Refresh dashboard data every 30 seconds if on dashboard
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }
}

// Initialize admin dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.admin = new AdminDashboard();
});