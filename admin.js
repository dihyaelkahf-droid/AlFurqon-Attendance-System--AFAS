// admin.js
const auth = new Auth();
let currentAdmin = null;

// Cek login sebagai admin
document.addEventListener('DOMContentLoaded', function() {
    auth.requireAuth();
    currentAdmin = auth.getCurrentUser();
    
    if (!currentAdmin || currentAdmin.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    // Update UI dengan data admin
    document.getElementById('adminName').textContent = currentAdmin.name;
    
    // Update waktu real-time
    updateAdminDateTime();
    setInterval(updateAdminDateTime, 1000);
    
    // Load data dashboard
    loadAdminOverview();
    loadTodaySummary();
    loadEmployeesTable();
    loadHolidaysTable();
    
    // Setup navigation
    setupAdminNavigation();
    
    // Populate dropdowns
    populateEmployeeDropdowns();
}

function updateAdminDateTime() {
    const now = new Date();
    document.getElementById('adminDate').textContent = formatDate(now);
    document.getElementById('adminTime').textContent = formatTime(now);
}

function loadAdminOverview() {
    const employees = auth.getAllEmployees().filter(e => e.role === 'employee');
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    
    // Update stat cards
    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('todayPresent').textContent = todayAttendances.length;
    document.getElementById('todayAbsent').textContent = `${employees.length - todayAttendances.length} belum absen`;
    
    const lateCount = todayAttendances.filter(a => a.lateMinutes > 0).length;
    document.getElementById('todayLate').textContent = lateCount;
    document.getElementById('latePercentage').textContent = todayAttendances.length > 0 ? 
        `${Math.round((lateCount / todayAttendances.length) * 100)}% dari yang hadir` : '0%';
    
    const leaveCount = todayAttendances.filter(a => a.status === 'izin' || a.status === 'sakit' || a.status === 'cuti').length;
    document.getElementById('todayLeave').textContent = leaveCount;
    
    // Load alerts
    loadAlerts();
}

function loadAlerts() {
    const alertsContainer = document.getElementById('alertsContainer');
    const employees = auth.getAllEmployees().filter(e => e.role === 'employee');
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    
    const now = new Date();
    const currentHour = now.getHours();
    
    let alertsHTML = '';
    
    // Alert 1: Karyawan yang belum absen setelah jam 8
    if (currentHour >= 8) {
        const absentEmployees = employees.filter(emp => {
            const hasAttendance = todayAttendances.some(a => a.employeeId === emp.id);
            return !hasAttendance;
        });
        
        if (absentEmployees.length > 0) {
            alertsHTML += `
                <div class="alert" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 10px;">
                    <i class="fas fa-exclamation-circle"></i> <strong>${absentEmployees.length} karyawan belum absen masuk</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">
                        ${absentEmployees.slice(0, 3).map(e => e.name.split(' ')[0]).join(', ')}${absentEmployees.length > 3 ? ` dan ${absentEmployees.length - 3} lainnya` : ''}
                    </p>
                </div>
            `;
        }
    }
    
    // Alert 2: Karyawan dengan status alfa dalam 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr7DaysAgo = sevenDaysAgo.toISOString().split('T')[0];
    
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    const alfaEmployees = new Set();
    
    employees.forEach(emp => {
        const recentAttendances = attendances.filter(a => 
            a.employeeId === emp.id && 
            a.date >= dateStr7DaysAgo
        );
        
        // Hitung hari kerja dalam 7 hari terakhir (exclude Sundays)
        let workingDays = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            if (date.getDay() !== 0) { // Bukan Minggu
                workingDays++;
            }
        }
        
        if (recentAttendances.length < workingDays * 0.5) { // Kurang dari 50% kehadiran
            alfaEmployees.add(emp.name);
        }
    });
    
    if (alfaEmployees.size > 0) {
        const alfaList = Array.from(alfaEmployees);
        alertsHTML += `
            <div class="alert" style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin-bottom: 10px;">
                <i class="fas fa-user-times"></i> <strong>${alfaEmployees.size} karyawan perlu perhatian (alfa ≥ 3 hari)</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">
                    ${alfaList.slice(0, 3).join(', ')}${alfaList.length > 3 ? ` dan ${alfaList.length - 3} lainnya` : ''}
                </p>
            </div>
        `;
    }
    
    // Alert 3: Peringkat teladan
    const topPerformers = attendanceSystem.getTopPerformers(3);
    if (topPerformers.length > 0) {
        alertsHTML += `
            <div class="alert" style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px;">
                <i class="fas fa-trophy"></i> <strong>Top 3 Karyawan Teladan Bulan Ini</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">
                    ${topPerformers.map((p, i) => `${i+1}. ${p.name} (Score: ${p.score})`).join(', ')}
                </p>
            </div>
        `;
    }
    
    alertsContainer.innerHTML = alertsHTML || '<p>Tidak ada notifikasi saat ini.</p>';
}

function loadTodaySummary() {
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    const employees = auth.getAllEmployees().filter(e => e.role === 'employee');
    
    const tbody = document.querySelector('#todaySummary tbody');
    tbody.innerHTML = '';
    
    // Gabungkan semua karyawan dengan absensi hari ini
    employees.forEach(employee => {
        const attendance = todayAttendances.find(a => a.employeeId === employee.id);
        
        const status = attendance ? 
            (attendance.status === 'hadir' && attendance.lateMinutes > 0 ? 'terlambat' : attendance.status) :
            'alfa';
        
        const statusClass = status === 'hadir' ? 'status-present' :
                           status === 'terlambat' ? 'status-late' :
                           status === 'sakit' ? 'status-sick' :
                           status === 'izin' || status === 'cuti' ? 'status-permit' :
                           'status-alfa';
        
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        
        const row = `
            <tr>
                <td>${employee.name}</td>
                <td>${attendance?.checkIn || '-'}</td>
                <td>${attendance?.checkOut || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${attendance?.lateMinutes > 0 ? attendance.lateMinutes + ' menit' : '-'}</td>
                <td>${attendance?.notes || '-'}</td>
                <td>
                    ${attendance ? `
                        <button onclick="openCorrectionModal(${attendance.id})" class="btn btn-warning btn-sm">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    ` : `
                        <button onclick="addManualAttendance(${employee.id})" class="btn btn-info btn-sm">
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    `}
                </td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function openCorrectionModal(attendanceId) {
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    const attendance = attendances.find(a => a.id === attendanceId);
    
    if (!attendance) return;
    
    const employees = auth.getAllEmployees();
    const employee = employees.find(e => e.id === attendance.employeeId);
    
    // Isi form modal
    document.getElementById('correctionAttendanceId').value = attendanceId;
    document.getElementById('correctionEmployeeName').value = employee?.name || 'Unknown';
    document.getElementById('correctionDate').value = attendance.date;
    document.getElementById('correctionCheckIn').value = attendance.checkIn || '';
    document.getElementById('correctionCheckOut').value = attendance.checkOut || '';
    document.getElementById('correctionStatus').value = attendance.status;
    document.getElementById('correctionNotes').value = attendance.notes || '';
    
    // Tampilkan modal
    document.getElementById('correctionModal').classList.add('active');
}

function saveCorrection() {
    const attendanceId = parseInt(document.getElementById('correctionAttendanceId').value);
    const checkIn = document.getElementById('correctionCheckIn').value;
    const checkOut = document.getElementById('correctionCheckOut').value;
    const status = document.getElementById('correctionStatus').value;
    const notes = document.getElementById('correctionNotes').value;
    
    const updates = {
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status,
        notes
    };
    
    const success = attendanceSystem.correctAttendance(
        attendanceId, 
        updates, 
        currentAdmin.id
    );
    
    if (success) {
        showToast('Koreksi absensi berhasil disimpan', 'success');
        closeAdminModal();
        loadAdminOverview();
        loadTodaySummary();
    } else {
        showToast('Gagal menyimpan koreksi', 'error');
    }
}

function addManualAttendance(employeeId) {
    // Buat absensi manual untuk hari ini
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    
    // Cek apakah sudah ada
    const existing = attendances.find(a => 
        a.employeeId === employeeId && a.date === dateStr
    );
    
    if (existing) {
        openCorrectionModal(existing.id);
        return;
    }
    
    // Buat baru
    const newAttendance = {
        id: attendances.length + 1,
        employeeId,
        date: dateStr,
        checkIn: timeStr,
        checkOut: null,
        status: 'hadir',
        notes: 'Ditambahkan manual oleh admin',
        lateMinutes: attendanceSystem.calculateLateMinutes(timeStr),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };
    
    attendances.push(newAttendance);
    localStorage.setItem('attendances', JSON.stringify(attendances));
    
    showToast('Absensi manual berhasil ditambahkan', 'success');
    loadTodaySummary();
}

function loadEmployeesTable() {
    const employees = auth.getAllEmployees();
    const tbody = document.querySelector('#employeesTable tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    employees.forEach(employee => {
        // Hitung statistik karyawan
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const employeeAttendances = attendances.filter(a => a.employeeId === employee.id);
        
        const presentCount = employeeAttendances.filter(a => a.status === 'hadir').length;
        const lateCount = employeeAttendances.filter(a => a.lateMinutes > 0).length;
        const absentCount = employeeAttendances.filter(a => a.status === 'alfa').length;
        
        const row = `
            <tr>
                <td>${employee.id}</td>
                <td>${employee.name}</td>
                <td>${employee.username}</td>
                <td>
                    <span class="status-badge ${employee.role === 'admin' ? 'status-present' : 'status-permit'}">
                        ${employee.role === 'admin' ? 'Admin' : 'Karyawan'}
                    </span>
                </td>
                <td>${new Date().toLocaleDateString('id-ID')}</td>
                <td>
                    ${employee.role === 'employee' ? `
                        <button onclick="resetPassword(${employee.id})" class="btn btn-warning btn-sm">
                            <i class="fas fa-key"></i> Reset Password
                        </button>
                        <button onclick="deleteEmployee(${employee.id})" class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function showAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.add('active');
}

function saveNewEmployee() {
    const name = document.getElementById('newEmployeeName').value.trim();
    const username = document.getElementById('newEmployeeUsername').value.trim();
    
    if (!name || !username) {
        showToast('Harap isi semua field', 'error');
        return;
    }
    
    // Cek username unik
    const employees = auth.getAllEmployees();
    if (employees.some(e => e.username === username)) {
        showToast('Username sudah digunakan', 'error');
        return;
    }
    
    const newEmployee = auth.addEmployee(name, username, 'password123');
    
    if (newEmployee) {
        showToast('Karyawan baru berhasil ditambahkan', 'success');
        closeAdminModal();
        loadEmployeesTable();
        populateEmployeeDropdowns();
    }
}

function resetPassword(employeeId) {
    if (confirm('Reset password karyawan ke default "password123"?')) {
        const success = auth.resetPassword(employeeId);
        
        if (success) {
            showToast('Password berhasil direset', 'success');
        } else {
            showToast('Gagal reset password', 'error');
        }
    }
}

function deleteEmployee(employeeId) {
    if (confirm('Hapus karyawan ini? Data absensi akan tetap tersimpan.')) {
        let employees = auth.getAllEmployees();
        employees = employees.filter(e => e.id !== employeeId);
        localStorage.setItem('employees', JSON.stringify(employees));
        
        showToast('Karyawan berhasil dihapus', 'success');
        loadEmployeesTable();
        populateEmployeeDropdowns();
    }
}

function loadHolidaysTable() {
    const holidays = JSON.parse(localStorage.getItem('holidays')) || [];
    const tbody = document.querySelector('#holidaysTable tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    holidays.forEach(holiday => {
        const row = `
            <tr>
                <td>${formatDate(new Date(holiday.date))}</td>
                <td>${holiday.description}</td>
                <td>
                    <span class="status-badge ${holiday.type === 'nasional' ? 'status-present' : 'status-permit'}">
                        ${holiday.type === 'nasional' ? 'Nasional' : 
                          holiday.type === 'cuti' ? 'Cuti Bersama' : 'Lainnya'}
                    </span>
                </td>
                <td>${new Date(holiday.date).toLocaleDateString('id-ID')}</td>
                <td>
                    <button onclick="deleteHoliday('${holiday.date}')" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function showAddHolidayModal() {
    document.getElementById('addHolidayModal').classList.add('active');
}

function saveNewHoliday() {
    const date = document.getElementById('newHolidayDate').value;
    const description = document.getElementById('newHolidayDesc').value.trim();
    const type = document.getElementById('newHolidayType').value;
    
    if (!date || !description) {
        showToast('Harap isi semua field', 'error');
        return;
    }
    
    const holidays = JSON.parse(localStorage.getItem('holidays')) || [];
    
    // Cek duplikat
    if (holidays.some(h => h.date === date)) {
        showToast('Tanggal libur sudah ada', 'error');
        return;
    }
    
    const newHoliday = {
        id: holidays.length + 1,
        date,
        description,
        type,
        createdAt: new Date().toISOString()
    };
    
    holidays.push(newHoliday);
    localStorage.setItem('holidays', JSON.stringify(holidays));
    
    showToast('Hari libur berhasil ditambahkan', 'success');
    closeAdminModal();
    loadHolidaysTable();
}

function deleteHoliday(date) {
    if (confirm('Hapus hari libur ini?')) {
        let holidays = JSON.parse(localStorage.getItem('holidays')) || [];
        holidays = holidays.filter(h => h.date !== date);
        localStorage.setItem('holidays', JSON.stringify(holidays));
        
        showToast('Hari libur berhasil dihapus', 'success');
        loadHolidaysTable();
    }
}

function populateEmployeeDropdowns() {
    const employees = auth.getAllEmployees().filter(e => e.role === 'employee');
    const dropdowns = [
        document.getElementById('correctionEmployee'),
        document.getElementById('reportEmployee'),
        document.getElementById('correctionEmployee')
    ];
    
    dropdowns.forEach(dropdown => {
        if (dropdown) {
            // Simpan selected value
            const currentValue = dropdown.value;
            dropdown.innerHTML = '<option value="">Pilih Karyawan</option>' +
                employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
            
            // Restore selected value jika ada
            if (currentValue) {
                dropdown.value = currentValue;
            }
        }
    });
    
    // Populate report period options
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            const customRange = document.getElementById('customDateRange');
            customRange.style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }
}

function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    const contents = [
        'overviewContent',
        'monitoringContent', 
        'correctionContent',
        'employeesContent',
        'reportsContent',
        'holidaysContent',
        'rankingContent'
    ];
    
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active class
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            
            // Show selected content
            contents.forEach((contentId, i) => {
                const element = document.getElementById(contentId);
                if (element) {
                    element.style.display = i === index ? 'block' : 'none';
                }
            });
            
            // Load data jika diperlukan
            switch(index) {
                case 1: // Monitoring
                    loadMonitoringTable();
                    break;
                case 2: // Correction
                    populateEmployeeDropdowns();
                    break;
                case 3: // Employees
                    loadEmployeesTable();
                    break;
                case 4: // Reports
                    populateEmployeeDropdowns();
                    break;
                case 5: // Holidays
                    loadHolidaysTable();
                    break;
                case 6: // Ranking
                    loadRanking();
                    break;
            }
        });
    });
}

function loadMonitoringTable() {
    const employees = auth.getAllEmployees().filter(e => e.role === 'employee');
    const todayAttendances = attendanceSystem.getTodayAllAttendances();
    const tbody = document.querySelector('#monitoringTable tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    employees.forEach(employee => {
        const attendance = todayAttendances.find(a => a.employeeId === employee.id);
        
        const status = attendance ? 
            (attendance.status === 'hadir' && attendance.lateMinutes > 0 ? 'terlambat' : attendance.status) :
            'alfa';
        
        // Simulasi data lokasi dan IP
        const locations = ['Kantor Utama', 'Kantor Cabang', 'WFH'];
        const ips = ['192.168.1.' + Math.floor(Math.random() * 255)];
        
        const row = `
            <tr>
                <td>${employee.name}</td>
                <td>${attendance?.checkIn || '-'}</td>
                <td>${attendance?.checkOut || '-'}</td>
                <td>
                    <span class="status-badge ${status === 'hadir' ? 'status-present' :
                                       status === 'terlambat' ? 'status-late' :
                                       status === 'sakit' ? 'status-sick' :
                                       status === 'izin' || status === 'cuti' ? 'status-permit' :
                                       'status-alfa'}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </td>
                <td>${attendance?.lateMinutes > 0 ? attendance.lateMinutes + ' menit' : 'Tepat waktu'}</td>
                <td>${attendance ? locations[Math.floor(Math.random() * locations.length)] : '-'}</td>
                <td>${attendance ? ips[0] : '-'}</td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function generateExcelReport() {
    const period = document.getElementById('reportPeriod').value;
    const employeeId = document.getElementById('reportEmployee').value;
    
    // Filter data berdasarkan periode dan karyawan
    let attendances = JSON.parse(localStorage.getItem('attendances'));
    const employees = auth.getAllEmployees();
    
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
            const fromDate = document.getElementById('reportDateFrom').value;
            const toDate = document.getElementById('reportDateTo').value;
            if (fromDate && toDate) {
                filteredAttendances = attendances.filter(a => a.date >= fromDate && a.date <= toDate);
            }
            break;
        default:
            filteredAttendances = attendances;
    }
    
    // Add employee names
    const reportData = filteredAttendances.map(a => {
        const employee = employees.find(e => e.id === a.employeeId);
        return {
            ...a,
            employeeName: employee?.name || 'Unknown'
        };
    });
    
    // Generate Excel
    attendanceSystem.exportToExcel(reportData, `laporan-absensi-${period}.xlsx`);
}

function generatePDFReport() {
    // Filter data sama seperti Excel
    const period = document.getElementById('reportPeriod').value;
    const employeeId = document.getElementById('reportEmployee').value;
    
    let attendances = JSON.parse(localStorage.getItem('attendances'));
    const employees = auth.getAllEmployees();
    
    if (employeeId && employeeId !== 'all') {
        attendances = attendances.filter(a => a.employeeId === parseInt(employeeId));
    }
    
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
        default:
            filteredAttendances = attendances.slice(-50); // Batasi untuk PDF
    }
    
    // Add employee names
    const reportData = filteredAttendances.map(a => {
        const employee = employees.find(e => e.id === a.employeeId);
        return {
            ...a,
            employeeName: employee?.name || 'Unknown'
        };
    });
    
    // Generate PDF
    attendanceSystem.exportToPDF(reportData, `laporan-absensi-${period}.pdf`);
}

function loadRanking() {
    const period = document.getElementById('rankingPeriod')?.value || 'month';
    const topPerformers = attendanceSystem.getTopPerformers(10);
    
    const rankingResults = document.getElementById('rankingResults');
    if (!rankingResults) return;
    
    let html = `
        <div class="ranking-list" style="display: grid; gap: 15px;">
    `;
    
    topPerformers.forEach((performer, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
            <div class="ranking-item" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div style="font-size: 24px; margin-right: 15px; width: 50px; text-align: center;">
                    ${medal}
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0;">${performer.name}</h4>
                    <div style="display: flex; gap: 15px; font-size: 14px;">
                        <span><i class="fas fa-user-check"></i> Hadir: ${performer.present}</span>
                        <span><i class="fas fa-clock"></i> Telat: ${performer.lateCount}</span>
                        <span><i class="fas fa-file-medical"></i> Izin/Sakit: ${performer.sick + performer.permit}</span>
                    </div>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">
                    ${performer.score}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    rankingResults.innerHTML = html;
}

function closeAdminModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function logout() {
    auth.logout();
}

// Fungsi helper
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatTime(date) {
    return date.toTimeString().split(' ')[0].substring(0, 5);
}
