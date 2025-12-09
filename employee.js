/**
 * EMPLOYEE DASHBOARD LOGIC - SISTEM ABSENSI
 * Fungsi: Mengelola interaksi dan logika dashboard karyawan
 */

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentUser = null;
let todayAttendance = null;
let attendanceSystem = null;
let isInitialized = false;

// ============================================
// 1. INITIALIZATION FUNCTIONS
// ============================================

/**
 * Initialize dashboard saat halaman dimuat
 * Dipanggil dari event listener DOMContentLoaded
 */
function initializeEmployeeDashboard() {
    console.log('🔄 Initializing employee dashboard...');
    
    // Cek authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Initialize systems
    attendanceSystem = new AttendanceSystem();
    
    // Setup dashboard components
    setupDashboard();
    
    // Load initial data
    loadInitialData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start time updates
    startTimeUpdates();
    
    isInitialized = true;
    console.log('✅ Employee dashboard initialized');
}

/**
 * Cek authentication dan redirect jika belum login
 * @returns {boolean} Status authentication
 */
function checkAuthentication() {
    // Cek apakah user sudah login
    if (!auth.isLoggedIn()) {
        console.log('🚫 User not logged in, redirecting to login page');
        window.location.href = 'index.html';
        return false;
    }
    
    // Dapatkan data user
    currentUser = auth.getCurrentUser();
    
    // Cek role (harus employee)
    if (currentUser.role !== 'employee') {
        console.log(`🚫 User is ${currentUser.role}, redirecting to admin dashboard`);
        window.location.href = 'admin.html';
        return false;
    }
    
    return true;
}

/**
 * Setup UI components dan data awal
 */
function setupDashboard() {
    // Update user info di UI
    updateUserInfo();
    
    // Setup navigation menu
    setupNavigation();
    
    // Setup modal interactions
    setupModalInteractions();
    
    // Update waktu pertama kali
    updateDateTime();
    
    // Check hari libur
    checkDayOff();
}

/**
 * Update informasi user di UI
 */
function updateUserInfo() {
    const employeeNameElement = document.getElementById('employeeName');
    const greetingElement = document.getElementById('greeting');
    
    if (employeeNameElement) {
        employeeNameElement.textContent = currentUser.name;
    }
    
    if (greetingElement) {
        const greeting = getGreeting();
        greetingElement.textContent = `${greeting}, ${currentUser.name.split(' ')[0]}!`;
    }
}

/**
 * Setup semua event listeners
 */
function setupEventListeners() {
    // Form submission
    const checkinForm = document.getElementById('checkinForm');
    if (checkinForm) {
        checkinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitCheckIn();
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.btn-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Logout button
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', logout);
    });
}

/**
 * Start periodic time updates
 */
function startTimeUpdates() {
    // Update waktu setiap detik
    setInterval(updateDateTime, 1000);
    
    // Check session periodically
    setInterval(checkSession, 60000); // Setiap menit
}

// ============================================
// 2. ATTENDANCE MANAGEMENT
// ============================================

/**
 * Buka modal untuk absen masuk
 */
function openCheckInModal() {
    console.log('📝 Opening check-in modal');
    
    // Reset form
    const attendanceType = document.getElementById('attendanceType');
    const notesGroup = document.getElementById('notesGroup');
    const notesTextarea = document.getElementById('attendanceNotes');
    
    if (attendanceType) attendanceType.value = 'hadir';
    if (notesGroup) notesGroup.style.display = 'none';
    if (notesTextarea) notesTextarea.value = '';
    
    // Update waktu di modal
    updateModalTime();
    
    // Show modal
    const modal = document.getElementById('checkinModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Buka modal untuk absen keluar
 */
function openCheckOutModal() {
    console.log('📝 Opening check-out modal');
    
    // Update waktu di modal
    updateModalTime();
    
    // Show modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Proses absen masuk
 */
function submitCheckIn() {
    console.log('✅ Processing check-in');
    
    // Get form data
    const status = document.getElementById('attendanceType')?.value || 'hadir';
    const notes = document.getElementById('attendanceNotes')?.value || '';
    
    // Validasi untuk izin/sakit/cuti
    if (status !== 'hadir' && !notes.trim()) {
        showNotification('Harap isi catatan untuk izin/sakit/cuti', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#checkinModal .btn-success');
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
        submitBtn.innerHTML = '<div class="spinner"></div> Memproses...';
        submitBtn.disabled = true;
    }
    
    // Process attendance
    setTimeout(() => {
        const result = attendanceSystem.addAttendance(currentUser.id, status, notes);
        
        if (result) {
            showNotification(`Absen ${result.action} berhasil!`, 'success');
            closeModal();
            
            // Update dashboard data
            loadDashboardData();
            loadRecentHistory();
            loadMonthlyStats();
            
            // Log activity
            console.log(`📊 User ${currentUser.name} checked in at ${result.checkIn || new Date().toLocaleTimeString()}`);
        } else {
            showNotification('Gagal melakukan absen', 'error');
        }
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 800); // Simulasi network delay
}

/**
 * Proses absen keluar
 */
function submitCheckOut() {
    console.log('✅ Processing check-out');
    
    // Show loading state
    const submitBtn = document.querySelector('#checkoutModal .btn-primary');
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
        submitBtn.innerHTML = '<div class="spinner"></div> Memproses...';
        submitBtn.disabled = true;
    }
    
    // Process attendance
    setTimeout(() => {
        const result = attendanceSystem.addAttendance(currentUser.id);
        
        if (result && result.action === 'checkout') {
            showNotification('Absen keluar berhasil!', 'success');
            closeModal();
            
            // Update dashboard data
            loadDashboardData();
            loadRecentHistory();
            
            // Log activity
            console.log(`📊 User ${currentUser.name} checked out at ${result.checkOut || new Date().toLocaleTimeString()}`);
        } else {
            showNotification('Gagal melakukan absen keluar', 'error');
        }
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 800); // Simulasi network delay
}

/**
 * Tutup semua modal
 */
function closeModal() {
    console.log('🗑️ Closing all modals');
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    document.body.style.overflow = '';
}

// ============================================
// 3. DATA DISPLAY FUNCTIONS
// ============================================

/**
 * Load semua data untuk dashboard
 */
function loadInitialData() {
    console.log('📊 Loading initial dashboard data');
    
    // Load data secara berurutan
    setTimeout(() => loadDashboardData(), 100);
    setTimeout(() => loadRecentHistory(), 200);
    setTimeout(() => loadMonthlyStats(), 300);
    setTimeout(() => loadRankingData(), 400);
}

/**
 * Load dan tampilkan data utama dashboard
 */
function loadDashboardData() {
    console.log('📈 Loading dashboard data');
    
    // Get today's attendance
    todayAttendance = attendanceSystem.getTodayAttendance(currentUser.id);
    
    // Update attendance display
    updateAttendanceDisplay();
    
    // Update attendance buttons
    updateAttendanceButtons();
    
    // Load statistics
    loadStatistics();
}

/**
 * Update tampilan status absensi
 */
function updateAttendanceDisplay() {
    if (!todayAttendance) {
        // Belum absen
        document.getElementById('statusText').textContent = 'Belum Absen';
        document.getElementById('checkInTime').textContent = '-';
        document.getElementById('checkOutTime').textContent = '-';
        document.getElementById('lateMinutes').textContent = '-';
        document.getElementById('notesText').textContent = '';
        document.getElementById('attendanceNotes').style.display = 'none';
        document.getElementById('checkinTimeModal').textContent = '-';
        return;
    }
    
    // Update status text
    const statusText = getAttendanceStatusText(todayAttendance.status, todayAttendance.lateMinutes);
    document.getElementById('statusText').textContent = statusText;
    
    // Update times
    document.getElementById('checkInTime').textContent = todayAttendance.checkIn || '-';
    document.getElementById('checkOutTime').textContent = todayAttendance.checkOut || '-';
    
    // Update late minutes
    if (todayAttendance.lateMinutes > 0) {
        document.getElementById('lateMinutes').textContent = `${todayAttendance.lateMinutes} menit`;
    } else {
        document.getElementById('lateMinutes').textContent = 'Tepat waktu';
    }
    
    // Update checkout modal
    document.getElementById('checkinTimeModal').textContent = todayAttendance.checkIn || '-';
    
    // Update notes if exists
    if (todayAttendance.notes) {
        document.getElementById('notesText').textContent = todayAttendance.notes;
        document.getElementById('attendanceNotes').style.display = 'block';
    } else {
        document.getElementById('attendanceNotes').style.display = 'none';
    }
}

/**
 * Update tombol absensi berdasarkan status
 */
function updateAttendanceButtons() {
    const buttonsContainer = document.getElementById('attendanceButtons');
    if (!buttonsContainer) return;
    
    // Cek hari libur
    if (attendanceSystem.isDayOff()) {
        buttonsContainer.innerHTML = createDayOffMessage();
        return;
    }
    
    if (!todayAttendance) {
        // Belum absen masuk
        buttonsContainer.innerHTML = createCheckInButton();
    } else if (todayAttendance.checkIn && !todayAttendance.checkOut) {
        // Sudah absen masuk, belum keluar
        buttonsContainer.innerHTML = createCheckOutButton();
    } else {
        // Sudah absen keluar
        buttonsContainer.innerHTML = createAttendanceCompleteMessage();
    }
}

/**
 * Load dan tampilkan statistik
 */
function loadStatistics() {
    const stats = attendanceSystem.getMonthlyStats(currentUser.id);
    
    // Update stat cards
    updateStatCard('presentCount', stats.present);
    updateStatCard('lateCount', stats.late);
    updateStatCard('leaveCount', stats.sick + stats.permit);
    updateStatCard('permitCount', stats.permit);
    updateStatCard('sickCount', stats.sick);
    updateStatCard('absentCount', stats.alfa);
    updateStatCard('totalLateMinutes', stats.late * 5); // Estimasi
    
    // Update progress bar
    const percentage = parseFloat(stats.attendanceRate);
    const progressBar = document.getElementById('attendanceProgress');
    const percentText = document.getElementById('attendancePercent');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    if (percentText) {
        percentText.textContent = `${percentage}%`;
    }
}

/**
 * Load dan tampilkan riwayat absensi terbaru
 */
function loadRecentHistory() {
    const history = attendanceSystem.getAttendanceHistory(currentUser.id, 5);
    const tbody = document.querySelector('#recentHistory tbody');
    
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (history.length === 0) {
        tbody.innerHTML = createEmptyHistoryMessage();
        return;
    }
    
    // Add history rows
    history.forEach((record, index) => {
        const row = createHistoryRow(record, index);
        tbody.innerHTML += row;
    });
}

/**
 * Load dan tampilkan statistik bulanan detail
 */
function loadMonthlyStats() {
    const stats = attendanceSystem.getMonthlyStats(currentUser.id);
    
    // Update detailed statistics
    updateStatCard('totalWorkDays', stats.totalDays);
    
    // Calculate average late
    const avgLate = stats.late > 0 ? Math.round((stats.late * 5) / stats.late) : 0;
    updateStatCard('avgLate', avgLate);
    
    // Update attendance percentage
    const percentage = parseFloat(stats.attendanceRate);
    updateStatCard('attendancePercentage', `${percentage}%`);
    
    // Update chart visualization
    updateStatsChart(stats);
}

/**
 * Load dan tampilkan data ranking
 */
function loadRankingData() {
    const topPerformers = attendanceSystem.getTopPerformers(5);
    const rankingList = document.getElementById('rankingList');
    
    if (!rankingList) return;
    
    rankingList.innerHTML = '';
    
    if (topPerformers.length === 0) {
        rankingList.innerHTML = createEmptyRankingMessage();
        return;
    }
    
    topPerformers.forEach((performer, index) => {
        const rankingItem = createRankingItem(performer, index);
        rankingList.appendChild(rankingItem);
    });
}

// ============================================
// 4. TIME MANAGEMENT FUNCTIONS
// ============================================

/**
 * Update waktu dan tanggal di UI secara real-time
 */
function updateDateTime() {
    const now = new Date();
    
    // Format date
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
    
    // Format time
    const timeStr = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Update semua elemen waktu
    updateElementText('currentDate', dateStr);
    updateElementText('currentTime', timeStr);
    updateElementText('todayDate', dateStr);
    
    // Update waktu di modal jika terbuka
    updateModalTime();
}

/**
 * Update waktu di modal
 */
function updateModalTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    updateElementText('currentTimeModal', timeStr);
    updateElementText('checkoutTimeDisplay', timeStr);
}

/**
 * Cek apakah hari ini hari libur
 */
function checkDayOff() {
    if (attendanceSystem.isDayOff()) {
        console.log('🎉 Today is a day off');
        
        // Update UI untuk hari libur
        const buttonsContainer = document.getElementById('attendanceButtons');
        if (buttonsContainer) {
            buttonsContainer.innerHTML = createDayOffMessage();
        }
        
        // Tampilkan notifikasi
        showNotification('Hari ini adalah hari libur. Tidak ada absensi.', 'info');
    }
}

/**
 * Cek session dan auto logout jika expired
 */
function checkSession() {
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
    }
}

// ============================================
// 5. NAVIGATION FUNCTIONS
// ============================================

/**
 * Setup navigation menu
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    const contents = [
        'dashboardContent',
        'historyContent', 
        'statisticsContent',
        'rankingContent'
    ];
    
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active class
            updateActiveNavLink(link);
            
            // Show selected content
            showContentSection(contents, index);
            
            // Load specific data jika diperlukan
            handleNavigationAction(index);
        });
    });
}

/**
 * Setup modal interactions
 */
function setupModalInteractions() {
    // Toggle notes field berdasarkan status
    const attendanceTypeSelect = document.getElementById('attendanceType');
    if (attendanceTypeSelect) {
        attendanceTypeSelect.addEventListener('change', function() {
            const notesGroup = document.getElementById('notesGroup');
            if (notesGroup) {
                notesGroup.style.display = this.value !== 'hadir' ? 'block' : 'none';
            }
        });
    }
}

// ============================================
// 6. UI COMPONENT CREATORS
// ============================================

/**
 * Create check-in button
 */
function createCheckInButton() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isLate = currentHour > 7 || (currentHour === 7 && currentMinute > 30);
    
    return `
        <button onclick="openCheckInModal()" class="btn-attendance btn-checkin">
            <i class="fas fa-sign-in-alt"></i>
            <span>ABSEN MASUK</span>
            <small>${isLate ? 'Terlambat' : 'Sampai 07:30'}</small>
        </button>
    `;
}

/**
 * Create check-out button
 */
function createCheckOutButton() {
    const now = new Date();
    const currentHour = now.getHours();
    const isDisabled = currentHour < 15;
    
    return `
        <button onclick="openCheckOutModal()" class="btn-attendance btn-checkout" 
                ${isDisabled ? 'disabled' : ''}>
            <i class="fas fa-sign-out-alt"></i>
            <span>ABSEN KELUAR</span>
            <small>${isDisabled ? 'Setelah 15:30' : 'Sampai 18:00'}</small>
        </button>
    `;
}

/**
 * Create day off message
 */
function createDayOffMessage() {
    return `
        <div class="attendance-info">
            <p>
                <i class="fas fa-calendar-times"></i>
                Hari ini adalah hari libur. Tidak ada absensi.
            </p>
        </div>
    `;
}

/**
 * Create attendance complete message
 */
function createAttendanceCompleteMessage() {
    return `
        <div class="attendance-info">
            <p>
                <i class="fas fa-check-circle"></i>
                Absensi hari ini sudah selesai. Terima kasih!
            </p>
        </div>
    `;
}

/**
 * Create empty history message
 */
function createEmptyHistoryMessage() {
    return `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-history fa-2x" style="margin-bottom: 10px; display: block;"></i>
                Belum ada riwayat absensi
            </td>
        </tr>
    `;
}

/**
 * Create empty ranking message
 */
function createEmptyRankingMessage() {
    return `
        <div style="text-align: center; padding: 40px; color: var(--gray);">
            <i class="fas fa-trophy fa-2x" style="margin-bottom: 10px; display: block;"></i>
            Belum ada data ranking
        </div>
    `;
}

/**
 * Create history table row
 */
function createHistoryRow(record, index) {
    const statusClass = getStatusClass(record.status, record.lateMinutes);
    const statusText = getStatusText(record.status, record.lateMinutes);
    const lateText = record.lateMinutes > 0 ? `${record.lateMinutes} menit` : '-';
    const formattedDate = formatDisplayDate(record.date);
    
    return `
        <tr>
            <td>${formattedDate}</td>
            <td>${record.checkIn || '-'}</td>
            <td>${record.checkOut || '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${lateText}</td>
            <td>${record.notes || '-'}</td>
        </tr>
    `;
}

/**
 * Create ranking item
 */
function createRankingItem(performer, index) {
    const isCurrentUser = performer.employeeId === currentUser.id;
    const rankClass = `rank-${index + 1}`;
    const userClass = isCurrentUser ? 'me' : '';
    
    const item = document.createElement('div');
    item.className = `ranking-item ${rankClass} ${userClass}`;
    item.innerHTML = `
        <div class="rank-number">${index + 1}</div>
        <div class="rank-info">
            <div class="rank-name">
                ${performer.name} ${isCurrentUser ? '(Anda)' : ''}
            </div>
            <div class="rank-stats">
                <span>Hadir: ${performer.present}</span>
                <span>Telat: ${performer.lateCount}</span>
                <span>Izin: ${performer.permit + performer.sick}</span>
            </div>
        </div>
        <div class="rank-score">${performer.score}</div>
    `;
    
    return item;
}

// ============================================
// 7. UTILITY FUNCTIONS
// ============================================

/**
 * Get greeting based on time of day
 */
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
}

/**
 * Get attendance status text
 */
function getAttendanceStatusText(status, lateMinutes) {
    if (status === 'hadir' && lateMinutes > 0) return 'Terlambat';
    if (status === 'hadir') return 'Hadir';
    if (status === 'izin') return 'Izin';
    if (status === 'sakit') return 'Sakit';
    if (status === 'cuti') return 'Cuti';
    if (status === 'alfa') return 'Alfa';
    return status;
}

/**
 * Get status CSS class
 */
function getStatusClass(status, lateMinutes) {
    if (status === 'hadir' && lateMinutes > 0) return 'badge-late';
    if (status === 'hadir') return 'badge-present';
    if (status === 'sakit') return 'badge-sick';
    if (status === 'izin' || status === 'cuti') return 'badge-permit';
    if (status === 'alfa') return 'badge-absent';
    return '';
}

/**
 * Get status display text
 */
function getStatusText(status, lateMinutes) {
    if (status === 'hadir' && lateMinutes > 0) return 'Terlambat';
    if (status === 'hadir') return 'Hadir';
    if (status === 'sakit') return 'Sakit';
    if (status === 'izin') return 'Izin';
    if (status === 'cuti') return 'Cuti';
    if (status === 'alfa') return 'Alfa';
    return status;
}

/**
 * Format date for display
 */
function formatDisplayDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * Update element text content
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Update stat card value
 */
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Update stats chart visualization
 */
function updateStatsChart(stats) {
    const chartContainer = document.getElementById('statisticsChart');
    if (!chartContainer) return;
    
    // Simple bar chart
    const maxValue = Math.max(stats.present, stats.late, stats.sick + stats.permit, 10);
    const presentHeight = (stats.present / maxValue) * 200;
    const lateHeight = (stats.late / maxValue) * 200;
    const leaveHeight = ((stats.sick + stats.permit) / maxValue) * 200;
    
    chartContainer.innerHTML = `
        <div style="display: flex; align-items: flex-end; height: 100%; gap: 40px; justify-content: center;">
            <div style="text-align: center;">
                <div style="width: 60px; height: ${presentHeight}px; background: var(--success); 
                     border-radius: 8px; margin: 0 auto 10px;"></div>
                <div style="font-weight: 600;">${stats.present}</div>
                <small style="color: var(--gray);">Hadir</small>
            </div>
            <div style="text-align: center;">
                <div style="width: 60px; height: ${lateHeight}px; background: var(--warning); 
                     border-radius: 8px; margin: 0 auto 10px;"></div>
                <div style="font-weight: 600;">${stats.late}</div>
                <small style="color: var(--gray);">Terlambat</small>
            </div>
            <div style="text-align: center;">
                <div style="width: 60px; height: ${leaveHeight}px; background: var(--info); 
                     border-radius: 8px; margin: 0 auto 10px;"></div>
                <div style="font-weight: 600;">${stats.sick + stats.permit}</div>
                <small style="color: var(--gray);">Izin/Sakit</small>
            </div>
        </div>
    `;
}

/**
 * Update active navigation link
 */
function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    
    activeLink.parentElement.classList.add('active');
}

/**
 * Show selected content section
 */
function showContentSection(contents, activeIndex) {
    contents.forEach((contentId, index) => {
        const element = document.getElementById(contentId);
        if (element) {
            element.style.display = index === activeIndex ? 'block' : 'none';
        }
    });
}

/**
 * Handle navigation actions
 */
function handleNavigationAction(index) {
    switch(index) {
        case 0: // Dashboard
            loadDashboardData();
            break;
        case 1: // History
            loadFullHistory();
            break;
        case 2: // Statistics
            loadMonthlyStats();
            break;
        case 3: // Ranking
            loadFullRanking();
            break;
    }
}

/**
 * Load full history with filters
 */
function loadFullHistory() {
    console.log('📋 Loading full history...');
    // Implementasi load history dengan filter
}

/**
 * Load full ranking with filters
 */
function loadFullRanking() {
    console.log('🏆 Loading full ranking...');
    // Implementasi load ranking dengan filter
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Use global notification function
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Logout user
 */
function logout() {
    console.log('👋 Logging out...');
    auth.logout();
}

// ============================================
// 8. EVENT LISTENERS & INITIALIZATION
// ============================================

/**
 * Initialize when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, initializing employee dashboard...');
    initializeEmployeeDashboard();
});

/**
 * Handle page visibility change
 */
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isInitialized) {
        // Page became visible, refresh data
        console.log('🔄 Page became visible, refreshing data...');
        loadDashboardData();
    }
});

// ============================================
// 9. GLOBAL EXPORTS
// ============================================

// Export functions for inline HTML event handlers
window.openCheckInModal = openCheckInModal;
window.openCheckOutModal = openCheckOutModal;
window.submitCheckIn = submitCheckIn;
window.submitCheckOut = submitCheckOut;
window.closeModal = closeModal;
window.logout = logout;
window.loadHistory = loadFullHistory;
window.loadRanking = loadFullRanking;

console.log('✅ employee.js loaded successfully');
