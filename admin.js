// absensi-karyawan/admin.js

let currentAdmin;
const correctionModal = new bootstrap.Modal(document.getElementById('correctionModal'));
const addEmployeeModal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
const holidayModal = new bootstrap.Modal(document.getElementById('holidayModal'));

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Autentikasi
    currentAdmin = checkAuth('admin'); 
    if (!currentAdmin) return;

    document.getElementById('adminGreeting').textContent = `Halo, ${currentAdmin.name.split(',')[0]}!`;
    
    // 2. Navigasi Sidebar
    document.querySelectorAll('.main-sidebar-nav a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            loadSection(section);
            // Update active state
            document.querySelectorAll('.main-sidebar-nav a').forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Load default section (Dashboard Home)
    loadSection('home');
    
    // Inisialisasi form/modal listeners
    document.getElementById('addEmployeeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addEmployee();
    });
    document.getElementById('addHolidayForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addHoliday();
    });
});

/**
 * Mengganti konten utama berdasarkan navigasi sidebar.
 */
function loadSection(section) {
    const content = document.getElementById('mainAdminContent');
    content.innerHTML = '';
    let title = '';

    switch (section) {
        case 'home':
            title = 'Dashboard Utama';
            content.innerHTML = renderHomeDashboard();
            renderAdminCharts();
            renderAlerts();
            renderTopTeladan();
            break;
        case 'monitoring':
            title = 'Monitoring Absensi Hari Ini';
            content.innerHTML = renderMonitoring();
            renderTodayMonitoringTable();
            break;
        case 'management':
            title = 'Manajemen Karyawan & Libur';
            content.innerHTML = renderManagement();
            renderUserList();
            renderHolidayManagement();
            break;
        case 'report':
            title = 'Rekapitulasi & Laporan';
            content.innerHTML = renderReport();
            renderReportFilters();
            break;
        case 'correction':
            title = 'Koreksi Data Absensi';
            content.innerHTML = renderCorrectionSearch();
            setupCorrectionSearch();
            break;
    }

    content.insertAdjacentHTML('afterbegin', `<h2><i class="bi bi-gear-fill"></i> ${title}</h2><hr>`);
}

// --- RENDER SECTIONS ---

function renderHomeDashboard() {
    return `
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <div class="card bg-primary text-white shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Total Karyawan</h5>
                        <h2 id="totalEmployees" class="display-4">0</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card bg-success text-white shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Sudah Absen Masuk Hari Ini</h5>
                        <h2 id="absentTodayCount" class="display-4">0</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card bg-info text-white shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Izin/Sakit Hari Ini</h5>
                        <h2 id="izinSakitTodayCount" class="display-4">0</h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-lg-7">
                <h4>Tren Kehadiran Bulanan</h4>
                <canvas id="attendanceChart" height="150"></canvas>
            </div>
            <div class="col-lg-5">
                <h4>Top 5 Karyawan Teladan</h4>
                <ul class="list-group" id="topTeladanList"></ul>
            </div>
        </div>
        
        <h4 class="mt-4">Peringatan Penting</h4>
        <div id="alertContainerHome" class="mt-2"></div>
    `;
}

function renderMonitoring() {
    return `
        <p class="text-muted">Lihat absensi lengkap hari ini secara real-time.</p>
        <div class="mb-3">
            <label for="monitoringStatusFilter" class="form-label">Filter Status</label>
            <select class="form-select w-50" id="monitoringStatusFilter" onchange="renderTodayMonitoringTable()">
                <option value="All">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Cuti">Cuti</option>
                <option value="Belum Absen">Belum Absen</option>
            </select>
        </div>
        <div class="table-responsive">
            <table class="table table-striped" id="monitoringTable">
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>Status</th>
                        <th>Masuk</th>
                        <th>Keluar</th>
                        <th>Telat (Mnt)</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
}

function renderManagement() {
    return `
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-success text-white">Manajemen Karyawan</div>
                    <div class="card-body">
                        <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#addEmployeeModal">
                            <i class="bi bi-person-plus-fill"></i> Tambah Karyawan Baru
                        </button>
                        <h6>Daftar Pengguna Sistem (${getUsers().filter(u => u.role === 'employee').length} Karyawan)</h6>
                        <ul class="list-group" id="userList">
                            </ul>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-info text-white">Manajemen Hari Libur</div>
                    <div class="card-body">
                        <button class="btn btn-info mb-3" data-bs-toggle="modal" data-bs-target="#holidayModal" onclick="renderHolidayManagement()">
                            <i class="bi bi-calendar-plus-fill"></i> Atur Hari Libur Nasional
                        </button>
                        <div id="holidayManagementContent">
                            </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderReport() {
    return `
        <h4>Filter Laporan</h4>
        <div class="card p-3 mb-4 shadow-sm">
            <div class="row g-3">
                <div class="col-md-4">
                    <label for="reportPeriod" class="form-label">Periode Waktu</label>
                    <select class="form-select" id="reportPeriod" onchange="toggleCustomDates()">
                        <option value="today">Hari Ini</option>
                        <option value="week">Minggu Ini</option>
                        <option value="month">Bulan Ini</option>
                        <option value="custom">Kustom Rentang Tanggal</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label for="reportEmployee" class="form-label">Pilih Karyawan</label>
                    <select class="form-select" id="reportEmployee">
                        <option value="all">Semua Karyawan</option>
                    </select>
                </div>
            </div>
            <div class="row g-3 mt-2" id="customDateRange" style="display:none;">
                <div class="col-md-4">
                    <label for="startDate" class="form-label">Tanggal Mulai</label>
                    <input type="date" class="form-control" id="startDate">
                </div>
                <div class="col-md-4">
                    <label for="endDate" class="form-label">Tanggal Akhir</label>
                    <input type="date" class="form-control" id="endDate">
                </div>
            </div>
            <button class="btn btn-primary mt-4 w-50" onclick="generateReportData()">Generate Laporan</button>
        </div>

        <div id="reportResultContainer" class="mt-4 d-none">
            <h4>Hasil Laporan <span id="reportRangeText" class="small text-muted"></span></h4>
            <button class="btn btn-success me-2" onclick="exportReport('xlsx')">
                <i class="bi bi-file-earmark-excel-fill"></i> Export Excel
            </button>
            <button class="btn btn-danger" onclick="exportReport('pdf')">
                <i class="bi bi-file-earmark-pdf-fill"></i> Export PDF (Mockup)
            </button>
            
            <div class="table-responsive mt-3">
                <table class="table table-striped table-hover" id="reportTable">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Tanggal</th>
                            <th>Masuk</th>
                            <th>Keluar</th>
                            <th>Status</th>
                            <th>Telat (Mnt)</th>
                            <th>Catatan</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCorrectionSearch() {
    return `
        <p class="text-muted">Cari absensi karyawan untuk dikoreksi/diubah statusnya. (Hanya bisa mengkoreksi data yang sudah ada)</p>
        <div class="card p-3 mb-4 shadow-sm">
            <div class="row g-3">
                <div class="col-md-6">
                    <label for="correctionUser" class="form-label">Pilih Karyawan</label>
                    <select class="form-select" id="correctionUser" required>
                        <option value="">Pilih Karyawan...</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label for="correctionDateSearch" class="form-label">Pilih Tanggal</label>
                    <input type="date" class="form-control" id="correctionDateSearch" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary w-100" type="button" onclick="searchAttendanceForCorrection()">Cari</button>
                </div>
            </div>
        </div>
        
        <div id="correctionResult" class="mt-4">
            </div>
    `;
}

// --- LOGIKA DASHBOARD HOME ---

function renderAdminCharts() {
    const records = getAttendanceRecords();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const users = getUsers().filter(u => u.role === 'employee');
    const totalEmployees = users.length;
    
    // Ringkasan Real-time
    let alreadyCheckedIn = 0;
    let izinSakitCount = 0;
    const todayDate = getFormattedDate();

    users.forEach(user => {
        const record = records.find(r => r.userId === user.id && r.date === todayDate);
        if (record) {
            alreadyCheckedIn++;
            if (record.status === 'Izin' || record.status === 'Sakit' || record.status === 'Cuti') {
                izinSakitCount++;
            }
        }
    });

    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('absentTodayCount').textContent = alreadyCheckedIn;
    document.getElementById('izinSakitTodayCount').textContent = izinSakitCount;

    // Data untuk Chart (Sederhana: Hitungan Status per Hari Kerja Bulan Ini)
    const chartData = {};
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    let currentDate = new Date(startOfMonth);
    
    while (currentDate <= today) {
        const dateStr = getFormattedDate(currentDate);
        if (!isHoliday(currentDate)) {
            chartData[dateStr] = { Hadir: 0, Telat: 0, IzinSakitCuti: 0, Alfa: 0 };
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    records.forEach(r => {
        const recordDate = new Date(r.date);
        const dateStr = r.date;
        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear && chartData[dateStr]) {
            if (r.status === 'Hadir' && !r.isLate) chartData[dateStr].Hadir++;
            if (r.status === 'Hadir' && r.isLate) chartData[dateStr].Telat++;
            if (r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti') chartData[dateStr].IzinSakitCuti++;
            if (r.status === 'Alfa') chartData[dateStr].Alfa++;
        }
    });
    
    const labels = Object.keys(chartData).map(d => d.substring(5)); // Ambil MM-DD
    const hadirData = labels.map(label => chartData[Object.keys(chartData).find(d => d.endsWith(label))]?.Hadir || 0);
    const telatData = labels.map(label => chartData[Object.keys(chartData).find(d => d.endsWith(label))]?.Telat || 0);
    const nonHadirData = labels.map(label => chartData[Object.keys(chartData).find(d => d.endsWith(label))]?.IzinSakitCuti || 0);
    const alfaData = labels.map(label => chartData[Object.keys(chartData).find(d => d.endsWith(label))]?.Alfa || 0);


    const ctx = document.getElementById('attendanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Hadir', data: hadirData, backgroundColor: 'rgba(40, 167, 69, 0.8)' },
                { label: 'Terlambat', data: telatData, backgroundColor: 'rgba(255, 193, 7, 0.8)' },
                { label: 'Izin/Sakit/Cuti', data: nonHadirData, backgroundColor: 'rgba(23, 162, 184, 0.8)' },
                { label: 'Alfa', data: alfaData, backgroundColor: 'rgba(220, 53, 69, 0.8)' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

function renderAlerts() {
    const alertContainer = document.getElementById('alertContainerHome');
    alertContainer.innerHTML = '';
    const users = getUsers().filter(u => u.role === 'employee');
    const todayDate = getFormattedDate();
    const records = getAttendanceRecords();
    const now = new Date();
    
    let needsAttention = false;
    
    // Alert 1: Belum Absen Masuk setelah 08:00
    if (now.getHours() >= 8) {
        const notCheckedIn = users.filter(user => !records.some(r => r.userId === user.id && r.date === todayDate));
        
        if (notCheckedIn.length > 0) {
            needsAttention = true;
            alertContainer.innerHTML += `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill"></i> **PERINGATAN!** ${notCheckedIn.length} Karyawan Belum Absen Masuk (setelah 08:00).
                    <p class="small mt-1 mb-0">(${notCheckedIn.map(u => u.name.split(',')[0]).join(', ')})</p>
                </div>
            `;
        }
    }
    
    // Alert 2: Alfa dalam 7 hari terakhir (Mockup: Admin perlu menjalankan fungsi ini secara manual/berkala)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAlfa = records.filter(r => r.status === 'Alfa' && new Date(r.date) >= sevenDaysAgo);

    if (recentAlfa.length > 0) {
        needsAttention = true;
        alertContainer.innerHTML += `
            <div class="alert alert-warning">
                <i class="bi bi-archive-fill"></i> **Perlu Koreksi!** Terdapat ${recentAlfa.length} status **Alfa** dalam 7 hari terakhir.
            </div>
        `;
    }

    if (!needsAttention) {
         alertContainer.innerHTML = `<div class="alert alert-success">Semua status terlihat baik saat ini.</div>`;
    }
}

function renderTopTeladan() {
    const listElement = document.getElementById('topTeladanList');
    listElement.innerHTML = '';
    
    const allRecords = getAttendanceRecords();
    const allUsers = getUsers().filter(u => u.role === 'employee');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const stats = allUsers.map(user => {
        const userRecords = allRecords.filter(r => {
            const date = new Date(r.date);
            return r.userId === user.id && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        let alfaCount = 0;
        let nonHadirCount = 0; 
        let lateCount = 0;

        userRecords.forEach(r => {
            if (r.status === 'Alfa') alfaCount++;
            if (r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti') nonHadirCount++;
            if (r.isLate) lateCount++;
        });

        return {
            name: user.name,
            alfa: alfaCount,
            nonHadir: nonHadirCount,
            late: lateCount,
            score: (alfaCount * 100) + (nonHadirCount * 10) + lateCount 
        };
    }).sort((a, b) => a.score - b.score); // Skor terkecil = Terbaik

    const top5 = stats.slice(0, 5);

    top5.forEach((s, index) => {
        let rankIcon;
        if (index === 0) rankIcon = '<i class="bi bi-trophy-fill text-warning me-2"></i>';
        else if (index === 1) rankIcon = '<i class="bi bi-trophy-fill text-secondary me-2"></i>';
        else if (index === 2) rankIcon = '<i class="bi bi-trophy-fill text-info me-2"></i>';
        else rankIcon = `<span class="me-2 text-muted">#${index + 1}</span>`;

        listElement.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>${rankIcon} **${s.name.split(',')[0]}**</div>
                <small class="text-muted">A:${s.alfa} | ISC:${s.nonHadir} | T:${s.late}</small>
            </li>
        `;
    });
}


// --- LOGIKA MONITORING HARI INI ---

function renderTodayMonitoringTable() {
    const tableBody = document.querySelector('#monitoringTable tbody');
    tableBody.innerHTML = '';

    const todayDate = getFormattedDate();
    const allUsers = getUsers().filter(u => u.role === 'employee');
    const allRecords = getAttendanceRecords();
    const filterStatus = document.getElementById('monitoringStatusFilter').value;

    allUsers.forEach(user => {
        const record = allRecords.find(r => r.userId === user.id && r.date === todayDate);
        
        let status = 'Belum Absen';
        let statusClass = 'bg-danger';
        let checkInTime = '-';
        let checkOutTime = '-';
        let lateMinutes = '-';
        let notes = '-';

        if (record) {
            status = record.status;
            checkInTime = record.checkInTime;
            checkOutTime = record.checkOutTime || '-';
            lateMinutes = record.isLate ? record.lateMinutes : '0';
            notes = record.notes || '-';
            
            if (record.status === 'Hadir' && record.isLate) statusClass = 'bg-warning text-dark';
            else if (record.status === 'Hadir' && !record.isLate) statusClass = 'bg-success';
            else if (record.status === 'Izin' || record.status === 'Sakit' || record.status === 'Cuti') statusClass = 'bg-primary';
            else if (record.status === 'Alfa') statusClass = 'bg-danger';

        }
        
        // Cek filter
        let show = true;
        if (filterStatus === 'Terlambat' && (status !== 'Hadir' || lateMinutes === '0')) show = false;
        else if (filterStatus === 'Belum Absen' && record) show = false;
        else if (filterStatus !== 'All' && filterStatus !== 'Terlambat' && filterStatus !== 'Belum Absen' && status !== filterStatus) show = false;
        else if (filterStatus === 'Terlambat' && status === 'Hadir' && lateMinutes !== '0') show = true; // Handle Terlambat
        else if (filterStatus === 'Belum Absen' && record) show = false;
        else if (filterStatus === 'Belum Absen' && !record) show = true;
        
        if (show) {
            tableBody.innerHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>${checkInTime}</td>
                    <td>${checkOutTime}</td>
                    <td>${lateMinutes}</td>
                    <td>${notes}</td>
                </tr>
            `;
        }
    });
}

// --- LOGIKA MANAJEMEN ---

function renderUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    const employees = getUsers().filter(u => u.role === 'employee');
    
    employees.forEach(user => {
        userList.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${user.name}</strong> 
                    <small class="text-muted">(${user.id})</small>
                </div>
                <button class="btn btn-sm btn-warning" onclick="resetEmployeePin('${user.id}')">
                    Reset PIN
                </button>
            </li>
        `;
    });
}

function addEmployee() {
    const name = document.getElementById('newEmployeeName').value.trim();
    const username = document.getElementById('newEmployeeUsername').value.trim().toLowerCase();
    const pin = document.getElementById('newEmployeePin').value.trim();
    
    if (!name || !username || !pin) {
        showAlert('Semua field wajib diisi.', 'danger');
        return;
    }
    
    const users = getUsers();
    if (users.some(u => u.id === username)) {
        showAlert('Username sudah digunakan.', 'danger');
        return;
    }

    const newUser = { id: username, pin: pin, name: name, role: 'employee' };
    users.push(newUser);
    saveUsers(users);
    
    showAlert(`Karyawan ${name} berhasil ditambahkan. PIN Default: ${pin}`, 'success');
    addEmployeeModal.hide();
    loadSection('management'); // Reload section
}

function resetEmployeePin(userId) {
    if (confirm(`Anda yakin ingin mereset PIN/Password untuk ${userId} menjadi '12345'?`)) {
        const users = getUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index !== -1) {
            users[index].pin = '12345';
            saveUsers(users);
            showAlert(`PIN/Password ${userId} berhasil direset menjadi **12345**`, 'success');
        }
    }
}

function renderHolidayManagement() {
    const listElement = document.getElementById('holidayList');
    listElement.innerHTML = '';
    const holidays = getHolidays().sort();
    
    if (holidays.length === 0) {
        listElement.innerHTML = '<li class="list-group-item text-center text-muted">Belum ada Hari Libur Nasional yang ditambahkan.</li>';
        return;
    }
    
    holidays.forEach(date => {
        listElement.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${date}
                <button class="btn btn-sm btn-danger" onclick="removeHoliday('${date}')">Hapus</button>
            </li>
        `;
    });
}

function addHoliday() {
    const dateStr = document.getElementById('newHolidayDate').value;
    if (!dateStr) {
        showAlert('Pilih tanggal libur.', 'warning');
        return;
    }
    
    const holidays = getHolidays();
    if (holidays.includes(dateStr)) {
        showAlert('Tanggal ini sudah terdaftar sebagai hari libur.', 'warning');
        return;
    }
    
    holidays.push(dateStr);
    saveHolidays(holidays);
    showAlert(`Tanggal ${dateStr} berhasil ditambahkan sebagai Hari Libur.`, 'success');
    document.getElementById('newHolidayDate').value = '';
    renderHolidayManagement(); 
}

function removeHoliday(dateStr) {
    if (confirm(`Anda yakin ingin menghapus tanggal ${dateStr} dari Hari Libur?`)) {
        let holidays = getHolidays();
        holidays = holidays.filter(d => d !== dateStr);
        saveHolidays(holidays);
        showAlert(`Tanggal ${dateStr} berhasil dihapus.`, 'success');
        renderHolidayManagement();
    }
}

// --- LOGIKA KOREKSI ABSENSI ---

function setupCorrectionSearch() {
    const userSelect = document.getElementById('correctionUser');
    const employees = getUsers().filter(u => u.role === 'employee');
    
    userSelect.innerHTML = '<option value="">Pilih Karyawan...</option>';
    employees.forEach(user => {
        userSelect.innerHTML += `<option value="${user.id}">${user.name} (${user.id})</option>`;
    });
    
    document.getElementById('correctionDateSearch').value = getFormattedDate();
}

function searchAttendanceForCorrection() {
    const userId = document.getElementById('correctionUser').value;
    const date = document.getElementById('correctionDateSearch').value;
    const resultDiv = document.getElementById('correctionResult');
    resultDiv.innerHTML = '';

    if (!userId || !date) {
        showAlert('Pilih Karyawan dan Tanggal yang ingin dikoreksi.', 'warning');
        return;
    }
    
    const record = getTodayAttendance(userId, date);

    if (record) {
        const userName = getUsers().find(u => u.id === userId).name;
        resultDiv.innerHTML = `
            <div class="alert alert-info d-flex justify-content-between align-items-center">
                Absensi **${userName}** pada tanggal **${date}** ditemukan.
                <button class="btn btn-primary" onclick="openCorrectionModal('${record.id}')">
                    <i class="bi bi-pencil"></i> Edit Data
                </button>
            </div>
        `;
    } else {
        // Jika tidak ada record, tawarkan untuk menambahkan (sebagai Alfa/Izin/Sakit)
        const userName = getUsers().find(u => u.id === userId).name;

        resultDiv.innerHTML = `
             <div class="alert alert-warning">
                Absensi **${userName}** pada tanggal **${date}** belum tercatat. 
                <button class="btn btn-sm btn-danger float-end" onclick="addCorrectionRecord('${userId}', '${date}')">
                    <i class="bi bi-plus-circle"></i> Tambah Record (e.g., set ALFA)
                </button>
            </div>
        `;
    }
}

function addCorrectionRecord(userId, date) {
    if (confirm(`Anda yakin ingin menambahkan record baru untuk ${userId} pada ${date}? Ini sering digunakan untuk setting status ALFA atau Izin/Sakit mendadak.`)) {
        const records = getAttendanceRecords();
        const userName = getUsers().find(u => u.id === userId).name;

        const newRecord = {
            id: Date.now().toString(),
            userId: userId,
            name: userName,
            date: date,
            status: 'Alfa',
            checkInTime: null,
            checkOutTime: null,
            isLate: false,
            lateMinutes: 0,
            notes: 'Diatur ALFA secara manual oleh Admin.',
            log: [`Dibuat manual ${new Date().toISOString()} oleh ${currentAdmin.id}`]
        };
        
        records.push(newRecord);
        saveAttendanceRecords(records);
        showAlert(`Record Alfa untuk ${userId} pada ${date} berhasil ditambahkan.`, 'success');
        searchAttendanceForCorrection(); // Muat ulang hasil
    }
}

function openCorrectionModal(recordId) {
    const records = getAttendanceRecords();
    const record = records.find(r => r.id === recordId);
    
    if (!record) return;

    // Isi Modal
    document.getElementById('correctionRecordId').value = record.id;
    document.getElementById('correctionDate').value = record.date;
    document.getElementById('correctionStatus').value = record.status;
    document.getElementById('correctionCheckIn').value = record.checkInTime || '';
    document.getElementById('correctionCheckOut').value = record.checkOutTime || '';
    document.getElementById('correctionNotes').value = record.notes || 'Koreksi Admin';
    
    // Tampilkan Log Perubahan (Sederhana)
    const logText = record.log.join(' | ');
    document.getElementById('correctionLog').textContent = `Log: ${logText}`;

    correctionModal.show();
}

function saveCorrection() {
    const recordId = document.getElementById('correctionRecordId').value;
    const status = document.getElementById('correctionStatus').value;
    const checkIn = document.getElementById('correctionCheckIn').value;
    const checkOut = document.getElementById('correctionCheckOut').value;
    const notes = document.getElementById('correctionNotes').value;
    const dateStr = document.getElementById('correctionDate').value;
    
    if (!status || !notes) {
        showAlert('Status dan Catatan Koreksi wajib diisi.', 'warning');
        return;
    }
    
    const records = getAttendanceRecords();
    const index = records.findIndex(r => r.id === recordId);
    
    if (index !== -1) {
        const record = records[index];
        const now = new Date();
        const checkInTimeFull = new Date(`${dateStr}T${checkIn}:00`);
        
        // Hitung ulang keterlambatan jika ada CheckIn baru
        let lateMinutes = 0;
        let isLate = false;
        if (checkIn) {
            lateMinutes = calculateLateMinutes(checkInTimeFull);
            isLate = lateMinutes > 0;
        }

        record.status = status;
        record.checkInTime = checkIn || null;
        record.checkOutTime = checkOut || null;
        record.notes = notes;
        record.isLate = isLate;
        record.lateMinutes = lateMinutes;
        
        record.log.push(`Dikoreksi ${now.toISOString()} oleh ${currentAdmin.id}. Status Baru: ${status}.`);
        
        saveAttendanceRecords(records);
        showAlert('Data absensi berhasil dikoreksi!', 'success');
        correctionModal.hide();
        searchAttendanceForCorrection(); // Muat ulang hasil pencarian
    }
}

// --- LOGIKA PELAPORAN (REKAP) ---

function renderReportFilters() {
    const employeeSelect = document.getElementById('reportEmployee');
    const employees = getUsers().filter(u => u.role === 'employee');
    
    employeeSelect.innerHTML = '<option value="all">Semua Karyawan</option>';
    employees.forEach(user => {
        employeeSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });
}

function toggleCustomDates() {
    const period = document.getElementById('reportPeriod').value;
    document.getElementById('customDateRange').style.display = period === 'custom' ? 'flex' : 'none';
}

function getReportDateRange() {
    const period = document.getElementById('reportPeriod').value;
    let startDate, endDate;
    const today = new Date();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Senin

    switch (period) {
        case 'today':
            startDate = getFormattedDate(today);
            endDate = getFormattedDate(today);
            break;
        case 'week':
            startDate = getFormattedDate(startOfWeek);
            endDate = getFormattedDate(today);
            break;
        case 'month':
            startDate = getFormattedDate(new Date(today.getFullYear(), today.getMonth(), 1));
            endDate = getFormattedDate(today);
            break;
        case 'custom':
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            if (!startDate || !endDate) {
                showAlert('Isi rentang tanggal kustom.', 'danger');
                return null;
            }
            break;
    }
    return { startDate, endDate };
}

function generateReportData() {
    const dateRange = getReportDateRange();
    if (!dateRange) return;
    
    const { startDate, endDate } = dateRange;
    const employeeId = document.getElementById('reportEmployee').value;
    const tableBody = document.querySelector('#reportTable tbody');
    tableBody.innerHTML = '';
    
    const allRecords = getAttendanceRecords();
    const allUsers = getUsers();
    
    // Filter data
    const filteredRecords = allRecords.filter(r => {
        const date = new Date(r.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Agar endDate termasuk
        
        const isDateInRange = date >= start && date < end;
        const isUserMatch = employeeId === 'all' || r.userId === employeeId;
        
        return isDateInRange && isUserMatch;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));


    if (filteredRecords.length === 0) {
        document.getElementById('reportResultContainer').classList.add('d-none');
        showAlert('Tidak ada data absensi untuk filter tersebut.', 'info');
        return;
    }
    
    // Render Tabel
    filteredRecords.forEach(record => {
        const userName = allUsers.find(u => u.id === record.userId)?.name || record.userId;
        let statusClass = '';
        if (record.status === 'Hadir' && record.isLate) statusClass = 'text-danger';
        if (record.status === 'Izin' || record.status === 'Sakit' || record.status === 'Cuti') statusClass = 'text-warning';
        if (record.status === 'Alfa') statusClass = 'text-danger fw-bold';

        tableBody.innerHTML += `
            <tr>
                <td>${userName}</td>
                <td>${record.date}</td>
                <td>${record.checkInTime || '-'}</td>
                <td>${record.checkOutTime || '-'}</td>
                <td class="${statusClass}">${record.status}</td>
                <td>${record.isLate ? record.lateMinutes : '0'}</td>
                <td>${record.notes || '-'}</td>
            </tr>
        `;
    });
    
    document.getElementById('reportRangeText').textContent = `(${startDate} s.d. ${endDate})`;
    document.getElementById('reportResultContainer').classList.remove('d-none');
    showAlert(`Laporan berhasil digenerate: ${filteredRecords.length} record.`, 'success');
}

function exportReport(format) {
    const table = document.getElementById('reportTable');
    const tableData = [];
    
    // Ambil Header
    const headers = Array.from(table.querySelector('thead tr').children).map(th => th.textContent);
    tableData.push(headers);
    
    // Ambil Data Baris
    table.querySelectorAll('tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(td => td.textContent);
        tableData.push(rowData);
    });

    if (format === 'xlsx') {
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Absensi_Rekap");
        
        const dateRange = document.getElementById('reportRangeText').textContent.replace(/[^\w\s]/gi, '');
        XLSX.writeFile(wb, `Rekap_Absensi_${dateRange}.xlsx`);
        
        showAlert('Data berhasil di-export ke Excel!', 'success');
    } else if (format === 'pdf') {
        // --- MOCKUP PDF EXPORT ---
        // Karena ini front-end murni, kita tidak bisa membuat PDF yang powerful
        // Solusi Nyata: Gunakan pustaka seperti jsPDF atau kirim ke server untuk generate
        // Di sini, kita hanya memberi simulasi sukses
        showAlert('Export PDF (Mockup) berhasil! Gunakan Export Excel untuk hasil nyata.', 'info');
    }
}

// Fungsi untuk menjalankan pengecekan Alfa Otomatis (Admin harus menjalankan ini secara manual/berkala)
function checkAndSetAlfa() {
    if (!confirm("Anda akan menjalankan pengecekan dan setting status ALFA untuk semua karyawan yang belum absen di hari kerja sebelumnya. Lanjutkan?")) {
        return;
    }
    
    const records = getAttendanceRecords();
    const users = getUsers().filter(u => u.role === 'employee');
    const today = new Date();
    
    // Cek hari kemarin (atau rentang yang ditentukan)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDateStr = getFormattedDate(yesterday);
    
    // Hanya proses jika kemarin adalah hari kerja
    if (isHoliday(yesterday)) {
        showAlert('Kemarin adalah Hari Libur (Minggu/Nasional), tidak ada ALFA yang diproses.', 'info');
        return;
    }
    
    let alfaCount = 0;
    
    users.forEach(user => {
        const hasRecord = records.some(r => r.userId === user.id && r.date === yesterdayDateStr);
        
        if (!hasRecord) {
            // Set ALFA
            const newRecord = {
                id: Date.now().toString() + user.id, // ID unik
                userId: user.id,
                name: user.name,
                date: yesterdayDateStr,
                status: 'Alfa',
                checkInTime: null,
                checkOutTime: null,
                isLate: false,
                lateMinutes: 0,
                notes: 'Otomatis diatur ALFA karena tidak ada absensi masuk.',
                log: [`Diatur ALFA otomatis ${new Date().toISOString()} oleh sistem (${currentAdmin.id})`]
            };
            records.push(newRecord);
            alfaCount++;
        }
    });
    
    if (alfaCount > 0) {
        saveAttendanceRecords(records);
        showAlert(`**Berhasil!** ${alfaCount} karyawan diatur ALFA untuk tanggal ${yesterdayDateStr}.`, 'success');
    } else {
        showAlert('Semua karyawan sudah memiliki status absensi untuk hari kemarin.', 'info');
    }
}
