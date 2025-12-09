// employee.js
// Inisialisasi auth
const auth = new Auth();
let currentUser = null;

// Cek login
document.addEventListener('DOMContentLoaded', function() {
    auth.requireAuth();
    currentUser = auth.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'employee') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeEmployeeDashboard();
});

function initializeEmployeeDashboard() {
    // Update UI dengan data user
    document.getElementById('employeeName').textContent = currentUser.name;
    document.getElementById('greeting').textContent = `Selamat Datang, ${currentUser.name.split(' ')[0]}!`;
    
    // Update waktu real-time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load data dashboard
    loadDashboardData();
    loadRecentHistory();
    loadMonthlyStats();
    loadTopPerformers();
    
    // Setup navigation
    setupNavigation();
    
    // Check day off
    checkDayOff();
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDate').textContent = formatDate(now);
    document.getElementById('currentTime').textContent = formatTime(now);
    document.getElementById('attendanceDate').textContent = formatDate(now);
    
    // Update checkout time display jika modal terbuka
    const checkoutDisplay = document.getElementById('checkoutTimeDisplay');
    if (checkoutDisplay) {
        checkoutDisplay.textContent = formatTime(now);
    }
}

function loadDashboardData() {
    // Get today's attendance
    const todayAttendance = attendanceSystem.getTodayAttendance(currentUser.id);
    
    // Update attendance status
    const statusElement = document.getElementById('todayStatus');
    const checkInElement = document.getElementById('checkInTime');
    const checkOutElement = document.getElementById('checkOutTime');
    const notesElement = document.getElementById('notesText');
    const notesContainer = document.getElementById('attendanceNotes');
    
    if (todayAttendance) {
        const status = attendanceSystem.getAttendanceStatus(todayAttendance.checkIn, todayAttendance.status);
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        
        if (todayAttendance.checkIn) {
            checkInElement.textContent = `Masuk: ${todayAttendance.checkIn}`;
        }
        
        if (todayAttendance.checkOut) {
            checkOutElement.textContent = `Keluar: ${todayAttendance.checkOut}`;
        }
        
        if (todayAttendance.notes) {
            notesElement.textContent = todayAttendance.notes;
            notesContainer.style.display = 'block';
        }
        
        // Update tombol absensi
        updateAttendanceButtons(todayAttendance);
    } else {
        statusElement.textContent = 'Belum Absen';
        checkInElement.textContent = 'Masuk: -';
        checkOutElement.textContent = 'Keluar: -';
        
        // Tampilkan tombol absen masuk
        updateAttendanceButtons(null);
    }
    
    // Load monthly statistics
    const monthlyStats = attendanceSystem.getMonthlyStats(currentUser.id);
    
    document.getElementById('presentCount').textContent = monthlyStats.present;
    document.getElementById('attendancePercentage').textContent = `${monthlyStats.attendanceRate}%`;
    document.getElementById('lateCount').textContent = monthlyStats.late;
    document.getElementById('lateMinutes').textContent = `Total menit: ${monthlyStats.late * 5}`; // Estimasi
    document.getElementById('permitCount').textContent = monthlyStats.sick + monthlyStats.permit;
    document.getElementById('sickCount').textContent = monthlyStats.sick;
    document.getElementById('leaveCount').textContent = monthlyStats.permit;
    document.getElementById('absentCount').textContent = monthlyStats.alfa;
}

function updateAttendanceButtons(attendance) {
    const buttonsContainer = document.getElementById('attendanceButtons');
    buttonsContainer.innerHTML = '';
    
    // Check if today is Sunday or holiday
    if (attendanceSystem.isDayOff()) {
        buttonsContainer.innerHTML = `
            <div class="alert" style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; text-align: center;">
                <i class="fas fa-calendar-times"></i> Hari ini adalah hari libur. Tidak ada absensi.
            </div>
        `;
        return;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    
    if (!attendance) {
        // Belum absen masuk sama sekali
        buttonsContainer.innerHTML = `
            <button onclick="openCheckInModal()" class="btn btn-success btn-attendance">
                <i class="fas fa-sign-in-alt fa-2x"></i>
                <span>ABSEN MASUK</span>
                <small>Sampai pukul 07:30</small>
            </button>
        `;
    } else if (attendance.checkIn && !attendance.checkOut) {
        // Sudah absen masuk, belum absen keluar
        buttonsContainer.innerHTML = `
            <button onclick="openCheckOutModal()" class="btn btn-primary btn-attendance">
                <i class="fas fa-sign-out-alt fa-2x"></i>
                <span>ABSEN KELUAR</span>
                <small>Setelah pukul 15:30</small>
            </button>
        `;
        
        // Disable tombol jika belum waktunya
        if (currentHour < 15) {
            const button = buttonsContainer.querySelector('button');
            button.disabled = true;
            button.style.opacity = '0.6';
            button.innerHTML = `
                <i class="fas fa-clock fa-2x"></i>
                <span>ABSEN KELUAR</span>
                <small>Buka pukul 15:30</small>
            `;
        }
    } else if (attendance.checkIn && attendance.checkOut) {
        // Sudah absen keluar
        buttonsContainer.innerHTML = `
            <div class="alert" style="background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; text-align: center;">
                <i class="fas fa-check-circle"></i> Absensi hari ini sudah selesai.
            </div>
        `;
    }
}

function openCheckInModal() {
    document.getElementById('checkinModal').classList.add('active');
}

function openCheckOutModal() {
    document.getElementById('checkoutModal').classList.add('active');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function submitCheckIn() {
    const status = document.getElementById('attendanceStatusSelect').value;
    const notes = document.getElementById('attendanceNotesInput').value;
    
    // Validasi catatan untuk izin/sakit/cuti
    if (status !== 'hadir' && !notes.trim()) {
        showToast('Harap isi catatan untuk izin/sakit/cuti', 'error');
        return;
    }
    
    const result = attendanceSystem.addAttendance(currentUser.id, status, notes);
    
    if (result) {
        showToast(`Absen ${result.action} berhasil!`, 'success');
        closeModal();
        loadDashboardData();
        loadRecentHistory();
        loadMonthlyStats();
    } else {
        showToast('Gagal melakukan absen', 'error');
    }
}

function submitCheckOut() {
    const result = attendanceSystem.addAttendance(currentUser.id);
    
    if (result && result.action === 'checkout') {
        showToast('Absen keluar berhasil!', 'success');
        closeModal();
        loadDashboardData();
        loadRecentHistory();
    } else {
        showToast('Gagal melakukan absen keluar', 'error');
    }
}

function loadRecentHistory() {
    const history = attendanceSystem.getAttendanceHistory(currentUser.id, 5);
    const tbody = document.querySelector('#recentHistory tbody');
    
    tbody.innerHTML = '';
    
    history.forEach(record => {
        const statusClass = record.status === 'hadir' ? 
            (record.lateMinutes > 0 ? 'status-late' : 'status-present') :
            record.status === 'sakit' ? 'status-sick' :
            record.status === 'izin' || record.status === 'cuti' ? 'status-permit' :
            'status-alfa';
        
        const statusText = record.status === 'hadir' && record.lateMinutes > 0 ? 'Terlambat' : 
                          record.status.charAt(0).toUpperCase() + record.status.slice(1);
        
        const row = `
            <tr>
                <td>${formatDate(new Date(record.date))}</td>
                <td>${record.checkIn || '-'}</td>
                <td>${record.checkOut || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${record.lateMinutes > 0 ? record.lateMinutes + ' menit' : '-'}</td>
                <td>${record.notes || '-'}</td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function loadMonthlyStats() {
    const stats = attendanceSystem.getMonthlyStats(currentUser.id);
    
    // Create simple bar chart dengan HTML
    const chartContainer = document.getElementById('monthlyStatsChart');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="display: flex; align-items: flex-end; height: 200px; gap: 20px; margin: 20px 0;">
                <div style="text-align: center; flex: 1;">
                    <div style="height: ${(stats.present/stats.totalDays)*100}%; background: #27ae60; border-radius: 5px;"></div>
                    <div style="margin-top: 10px;">Hadir: ${stats.present}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="height: ${(stats.late/stats.totalDays)*100}%; background: #f39c12; border-radius: 5px;"></div>
                    <div style="margin-top: 10px;">Terlambat: ${stats.late}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="height: ${((stats.sick + stats.permit)/stats.totalDays)*100}%; background: #3498db; border-radius: 5px;"></div>
                    <div style="margin-top: 10px;">Izin/Sakit: ${stats.sick + stats.permit}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="height: ${(stats.alfa/stats.totalDays)*100}%; background: #e74c3c; border-radius: 5px;"></div>
                    <div style="margin-top: 10px;">Alfa: ${stats.alfa}</div>
                </div>
            </div>
        `;
    }
    
    // Update stats details
    const statsDetails = document.getElementById('statsDetails');
    if (statsDetails) {
        statsDetails.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon present">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Persentase Kehadiran</h3>
                        <div class="number">${stats.attendanceRate}%</div>
                        <p>${stats.present + stats.sick + stats.permit} dari ${stats.totalDays} hari</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon late">
                        <i class="fas fa-running"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Rata-rata Terlambat</h3>
                        <div class="number">${stats.late > 0 ? '5 menit' : '0'}</div>
                        <p>Total ${stats.late} kali terlambat</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon permit">
                        <i class="fas fa-calendar-minus"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Hari Kerja Tersisa</h3>
                        <div class="number">${stats.totalDays - (stats.present + stats.sick + stats.permit)}</div>
                        <p>Masih bisa meningkatkan kehadiran</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function loadAttendanceHistory() {
    // Implementasi filter bulan untuk riwayat lengkap
    const monthFilter = document.getElementById('monthFilter').value;
    // ... implementasi filter
}

function loadTopPerformers() {
    const topPerformers = attendanceSystem.getTopPerformers();
    const tbody = document.querySelector('#topPerformers tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    topPerformers.forEach((performer, index) => {
        const isCurrentUser = performer.employeeId === currentUser.id;
        const rowClass = isCurrentUser ? 'style="background-color: #e3f2fd;"' : '';
        
        const row = `
            <tr ${rowClass}>
                <td>
                    ${index === 0 ? '<i class="fas fa-trophy" style="color: gold;"></i>' : 
                      index === 1 ? '<i class="fas fa-trophy" style="color: silver;"></i>' :
                      index === 2 ? '<i class="fas fa-trophy" style="color: #cd7f32;"></i>' :
                      index + 1}
                </td>
                <td>
                    ${performer.name}
                    ${isCurrentUser ? '<span class="badge" style="background: #3498db; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 5px;">Anda</span>' : ''}
                </td>
                <td>${performer.present}</td>
                <td>${performer.lateCount}</td>
                <td>${performer.sick + performer.permit}</td>
                <td><strong>${performer.score}</strong></td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    const contents = ['dashboardContent', 'historyContent', 'statisticsContent', 'rankingContent'];
    
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
            if (index === 1) { // History
                loadFullHistory();
            } else if (index === 2) { // Statistics
                loadMonthlyStats();
            } else if (index === 3) { // Ranking
                loadTopPerformers();
            }
        });
    });
}

function loadFullHistory() {
    const attendances = JSON.parse(localStorage.getItem('attendances'));
    const employeeAttendances = attendances
        .filter(a => a.employeeId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tbody = document.querySelector('#fullHistory tbody');
    tbody.innerHTML = '';
    
    employeeAttendances.forEach(record => {
        const statusClass = record.status === 'hadir' ? 
            (record.lateMinutes > 0 ? 'status-late' : 'status-present') :
            record.status === 'sakit' ? 'status-sick' :
            record.status === 'izin' || record.status === 'cuti' ? 'status-permit' :
            'status-alfa';
        
        const statusText = record.status === 'hadir' && record.lateMinutes > 0 ? 'Terlambat' : 
                          record.status.charAt(0).toUpperCase() + record.status.slice(1);
        
        const row = `
            <tr>
                <td>${formatDate(new Date(record.date))}</td>
                <td>${record.checkIn || '-'}</td>
                <td>${record.checkOut || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${record.lateMinutes > 0 ? record.lateMinutes + ' menit' : '-'}</td>
                <td>${record.notes || '-'}</td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function checkDayOff() {
    if (attendanceSystem.isDayOff()) {
        showToast('Hari ini adalah hari libur. Tidak ada absensi.', 'info');
    }
}

// Fungsi helper untuk format tanggal
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatTime(date) {
    return date.toTimeString().split(' ')[0].substring(0, 5);
}
