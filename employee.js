// Employee Dashboard JavaScript
class EmployeeDashboard {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        if (!auth.requireAuth()) return;
        
        // Check if user is employee
        if (auth.isAdmin()) {
            window.location.href = 'admin.html';
            return;
        }
        
        // Load user data
        this.loadUserData();
        
        // Load dashboard data
        this.loadDashboardData();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Start auto refresh
        this.startAutoRefresh();
    }

    loadUserData() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        // Update UI with user data
        document.getElementById('userName').textContent = user.name;
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profilePosition').textContent = user.position || 'Karyawan';
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileJoinDate').textContent = 
            user.created_at ? Utils.formatDate(user.created_at) : '-';
    }

    loadDashboardData() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        // Load today's date and day info
        this.loadDateInfo();
        
        // Load today's attendance status
        this.loadTodayAttendance();
        
        // Load employee stats
        this.loadEmployeeStats();
        
        // Load recent history
        this.loadRecentHistory();
        
        // Load today's history
        this.loadTodayHistory();
        
        // Load top employees
        this.loadTopEmployees();
    }

    loadDateInfo() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('currentDate').textContent = dateStr;
        
        // Check if today is Sunday or holiday
        const todayStr = now.toISOString().split('T')[0];
        const holidays = db.getHolidays();
        const isHoliday = holidays.some(h => h.date === todayStr);
        
        if (now.getDay() === 0) {
            document.getElementById('dayInfo').textContent = 'Hari Minggu - Libur';
            document.getElementById('holidayInfo').style.display = 'block';
            document.getElementById('checkInSection').style.display = 'none';
        } else if (isHoliday) {
            const holiday = holidays.find(h => h.date === todayStr);
            document.getElementById('dayInfo').textContent = `Hari Libur - ${holiday.description}`;
            document.getElementById('holidayInfo').style.display = 'block';
            document.getElementById('checkInSection').style.display = 'none';
        } else {
            document.getElementById('dayInfo').textContent = 'Hari Kerja';
        }
    }

    loadTodayAttendance() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        const attendance = db.getTodayAttendance(user.id);
        
        // Update current time in modals
        document.getElementById('currentCheckinTime').textContent = Utils.getCurrentTime();
        document.getElementById('currentCheckoutTime').textContent = Utils.getCurrentTime();
        
        if (!attendance) {
            // Not checked in yet
            document.getElementById('checkInSection').style.display = 'block';
            document.getElementById('checkOutSection').style.display = 'none';
            document.getElementById('alreadyAttended').style.display = 'none';
            
            document.getElementById('attendanceStatus').textContent = 'Belum Absen';
            document.getElementById('attendanceStatus').className = 'status-alfa';
            document.getElementById('lateStatus').textContent = '-';
        } else {
            // Already checked in
            document.getElementById('checkInSection').style.display = 'none';
            document.getElementById('alreadyAttended').style.display = 'block';
            
            document.getElementById('attendanceInfo').innerHTML = `
                <strong>Status:</strong> ${attendance.status}<br>
                <strong>Masuk:</strong> ${Utils.formatTime(attendance.time_in)}<br>
                ${attendance.note ? `<strong>Catatan:</strong> ${attendance.note}<br>` : ''}
                ${attendance.late_minutes > 0 ? 
                    `<strong>Telat:</strong> ${attendance.late_minutes} menit` : ''}
            `;
            
            document.getElementById('attendanceStatus').textContent = attendance.status;
            document.getElementById('attendanceStatus').className = `status-${attendance.status.toLowerCase()}`;
            
            if (attendance.late_minutes > 0) {
                document.getElementById('lateStatus').innerHTML = `
                    <span class="text-danger">Telat ${attendance.late_minutes} menit</span>
                `;
            } else {
                document.getElementById('lateStatus').innerHTML = `
                    <span class="text-success">Tepat Waktu</span>
                `;
            }
            
            if (!attendance.time_out) {
                // Not checked out yet
                document.getElementById('checkOutSection').style.display = 'block';
                document.getElementById('checkoutTime').textContent = 
                    `Waktu keluar standar: 15:30 | Saat ini: ${Utils.getCurrentTime()}`;
            } else {
                // Already checked out
                document.getElementById('alreadyAttended').innerHTML += `
                    <hr>
                    <strong>Keluar:</strong> ${Utils.formatTime(attendance.time_out)}
                `;
            }
        }
    }

    loadEmployeeStats() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        const now = new Date();
        const stats = db.getEmployeeStats(user.id, now.getMonth() + 1, now.getFullYear());
        
        // Update UI
        document.getElementById('attendanceRate').textContent = stats.attendance_rate + '%';
        document.getElementById('attendanceProgress').style.width = stats.attendance_rate + '%';
        
        document.getElementById('presentCount').textContent = stats.present;
        document.getElementById('lateCount').textContent = stats.late;
        document.getElementById('leaveCount').textContent = stats.permission + stats.sick + stats.leave;
        
        // Update profile stats
        document.getElementById('profileAttendance').textContent = stats.attendance_rate + '%';
        document.getElementById('profileLate').textContent = stats.late + 'x';
    }

    loadRecentHistory() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        const attendances = db.getAttendances({ 
            employeeId: user.id 
        }).slice(0, 10); // Get last 10 records
        
        const historyContainer = document.getElementById('recentHistory');
        
        if (attendances.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-history fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Belum ada riwayat absensi</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        attendances.forEach(attendance => {
            const isToday = attendance.date === Utils.getTodayDate();
            const todayClass = isToday ? 'today-history' : '';
            
            html += `
                <div class="history-item ${todayClass}">
                    <div class="history-date">
                        <strong>${Utils.formatDate(attendance.date)}</strong>
                        ${isToday ? '<span class="badge bg-primary">Hari Ini</span>' : ''}
                    </div>
                    <div class="history-details">
                        <div class="row">
                            <div class="col-6">
                                <small>Masuk</small>
                                <div>${Utils.formatTime(attendance.time_in)}</div>
                            </div>
                            <div class="col-6">
                                <small>Keluar</small>
                                <div>${Utils.formatTime(attendance.time_out)}</div>
                            </div>
                        </div>
                        <div class="history-status mt-2">
                            ${Utils.getStatusBadge(attendance.status)}
                            ${Utils.getLateBadge(attendance.late_minutes)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        historyContainer.innerHTML = html;
    }

    loadTodayHistory() {
        const today = Utils.getTodayDate();
        const attendances = db.getAttendances({ date: today });
        
        const tbody = document.getElementById('todayHistoryBody');
        
        if (attendances.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-users fa-2x text-muted mb-2"></i>
                        <p class="text-muted">Belum ada absensi hari ini</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        attendances.forEach(attendance => {
            const employee = db.getEmployeeById(attendance.employee_id);
            
            html += `
                <tr>
                    <td>
                        <strong>${employee.name}</strong>
                        <br>
                        <small class="text-muted">${employee.position}</small>
                    </td>
                    <td>
                        ${Utils.formatTime(attendance.time_in)}
                        ${attendance.late_minutes > 0 ? 
                            `<br><small class="text-danger">Telat ${attendance.late_minutes}m</small>` : ''}
                    </td>
                    <td>${Utils.formatTime(attendance.time_out)}</td>
                    <td>${Utils.getStatusBadge(attendance.status)}</td>
                    <td>${attendance.note || '-'}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    loadTopEmployees() {
        const topEmployees = db.getTopEmployees(5);
        const container = document.getElementById('topEmployees');
        
        if (topEmployees.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-trophy fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Data belum tersedia</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        topEmployees.forEach((employee, index) => {
            const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const medalIcon = index < 3 ? `<i class="fas fa-medal ${medalClass}"></i>` : `<span class="rank">${index + 1}</span>`;
            
            html += `
                <div class="top-employee-item">
                    <div class="employee-rank">
                        ${medalIcon}
                    </div>
                    <div class="employee-info">
                        <strong>${employee.name}</strong>
                        <small class="text-muted d-block">${employee.position}</small>
                    </div>
                    <div class="employee-score">
                        <span class="badge bg-success">${employee.score} poin</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    initEventListeners() {
        // Check-in button
        document.getElementById('checkInBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('checkInModal'));
            modal.show();
        });
        
        // Confirm check-in
        document.getElementById('confirmCheckin').addEventListener('click', () => {
            this.performCheckIn();
        });
        
        // Check-out button
        document.getElementById('checkOutBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('checkOutModal'));
            modal.show();
        });
        
        // Confirm check-out
        document.getElementById('confirmCheckout').addEventListener('click', () => {
            this.performCheckOut();
        });
        
        // Profile button
        document.getElementById('profileBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const modal = new bootstrap.Modal(document.getElementById('profileModal'));
            modal.show();
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Auto update attendance type selection
        document.getElementById('attendanceType').addEventListener('change', (e) => {
            const noteField = document.getElementById('attendanceNote');
            const requiredTypes = ['Izin', 'Sakit', 'Cuti'];
            
            if (requiredTypes.includes(e.target.value)) {
                noteField.setAttribute('required', 'true');
                noteField.setAttribute('placeholder', 'Wajib diisi untuk Izin/Sakit/Cuti');
            } else {
                noteField.removeAttribute('required');
                noteField.setAttribute('placeholder', 'Masukkan alasan jika izin, sakit, atau cuti');
            }
        });
    }

    performCheckIn() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        const attendanceType = document.getElementById('attendanceType').value;
        const note = document.getElementById('attendanceNote').value.trim();
        
        // Validate note for certain types
        const requiresNote = ['Izin', 'Sakit', 'Cuti'].includes(attendanceType);
        if (requiresNote && !note) {
            Utils.showToast('Harap isi catatan untuk status ' + attendanceType, 'error');
            return;
        }
        
        try {
            Utils.showLoading('Memproses absen masuk...');
            
            const attendance = db.checkIn(user.id, attendanceType, note);
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('checkInModal')).hide();
            
            // Update UI
            setTimeout(() => {
                this.loadTodayAttendance();
                this.loadEmployeeStats();
                this.loadRecentHistory();
                this.loadTodayHistory();
                Utils.showToast('Absen masuk berhasil dicatat!', 'success');
                Utils.hideLoading();
            }, 500);
            
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message, 'error');
        }
    }

    performCheckOut() {
        const user = auth.getCurrentUser();
        if (!user) return;
        
        const note = document.getElementById('checkoutNote').value.trim();
        
        try {
            Utils.showLoading('Memproses absen keluar...');
            
            const attendance = db.checkOut(user.id);
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('checkOutModal')).hide();
            
            // Update UI
            setTimeout(() => {
                this.loadTodayAttendance();
                this.loadRecentHistory();
                this.loadTodayHistory();
                Utils.showToast('Absen keluar berhasil dicatat!', 'success');
                Utils.hideLoading();
            }, 500);
            
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message, 'error');
        }
    }

    logout() {
        Utils.confirm('Konfirmasi Logout', 'Apakah Anda yakin ingin logout?', 'Logout', 'Batal')
            .then(confirmed => {
                if (confirmed) {
                    auth.logout();
                }
            });
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        setInterval(() => {
            this.loadTodayAttendance();
            this.loadTodayHistory();
        }, 30000);
        
        // Update time every second
        setInterval(() => {
            document.getElementById('currentTime').textContent = 
                new Date().toLocaleTimeString('id-ID');
        }, 1000);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    new EmployeeDashboard();
});