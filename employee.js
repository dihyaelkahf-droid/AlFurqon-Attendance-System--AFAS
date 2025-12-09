// absensi-karyawan/employee.js

let currentUser;
let todayRecord;
const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Autentikasi
    currentUser = checkAuth('employee'); 
    if (!currentUser) return;

    document.getElementById('userGreeting').textContent = `Halo, ${currentUser.name.split(',')[0]}!`;

    // 2. Tampilkan Jam Real-time
    setInterval(updateClock, 1000); 

    // 3. Muat Data
    loadEmployeeDashboard();

    // 4. Inisialisasi Tombol Konfirmasi Modal
    document.getElementById('confirmStatusBtn').addEventListener('click', () => {
        const status = document.getElementById('statusSelect').value;
        const notes = document.getElementById('notesInput').value.trim();

        if (status && notes) {
            handleCheckIn(status, notes);
            statusModal.hide();
        } else {
            showAlert('Pilih status dan isi catatan wajib.', 'warning');
        }
    });
});

function updateClock() {
    const now = new Date();
    document.getElementById('clockDisplay').textContent = now.toLocaleTimeString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function loadEmployeeDashboard() {
    const now = new Date();

    // Cek Hari Libur
    if (isHoliday(now)) {
        document.getElementById('holidayMessage').classList.remove('d-none');
        document.getElementById('statusIndicator').innerHTML = ''; 
        document.getElementById('currentAttendanceInfo').innerHTML = '';
        return;
    }

    // Cek Absensi Hari Ini
    todayRecord = getTodayAttendance(currentUser.id);

    renderAttendanceCard(todayRecord);
    renderPersonalStats();
    renderAttendanceHistory();
    renderRankingList();
}

function renderAttendanceCard(record) {
    const indicatorDiv = document.getElementById('statusIndicator');
    const infoDiv = document.getElementById('currentAttendanceInfo');
    
    indicatorDiv.innerHTML = '';
    infoDiv.innerHTML = '';

    if (!record) {
        // BELUM ABSEN MASUK
        indicatorDiv.innerHTML = `
            <div class="alert alert-warning mb-3 fw-bold">Menunggu Absen Masuk</div>
            <button class="btn btn-success main-action-btn w-100 mb-2" onclick="handleCheckIn('Hadir')">
                <i class="bi bi-clock-fill"></i> ABSEN MASUK
            </button>
            <button class="btn btn-info main-action-btn w-100" onclick="showCheckInModal()">
                <i class="bi bi-file-earmark-text-fill"></i> IZIN/SAKIT/CUTI
            </button>
        `;
    } else if (!record.checkOutTime) {
        // SUDAH ABSEN MASUK, BELUM KELUAR
        const standardOutTime = `${JAM_KELUAR_STANDAR.hour}:${String(JAM_KELUAR_STANDAR.minute).padStart(2, '0')}`;
        const lateInfo = record.isLate ? `<span class="badge bg-danger">Terlambat ${record.lateMinutes} menit</span>` : '<span class="badge bg-success">Tepat Waktu</span>';

        indicatorDiv.innerHTML = `
            <div class="alert alert-primary mb-3 fw-bold">Sudah Absen Masuk. Siap Absen Keluar Pukul ${standardOutTime}</div>
            <button class="btn btn-primary main-action-btn w-100" onclick="handleCheckOut()">
                <i class="bi bi-box-arrow-right"></i> ABSEN KELUAR
            </button>
        `;
        infoDiv.innerHTML = `
            <p class="mt-3">Masuk: **${record.checkInTime}** (${record.status}) ${lateInfo}</p>
        `;
    } else {
        // SUDAH ABSEN KELUAR
        indicatorDiv.innerHTML = `
            <div class="alert alert-success fw-bold">Absensi Hari Ini Selesai!</div>
        `;
        const lateInfo = record.isLate ? `<span class="badge bg-danger">Terlambat ${record.lateMinutes}m</span>` : '<span class="badge bg-success">Tepat Waktu</span>';

        infoDiv.innerHTML = `
            <p class="mt-3">Masuk: **${record.checkInTime}** | Keluar: **${record.checkOutTime}**</p>
            <p class="mb-0">Status: **${record.status}** ${lateInfo}</p>
        `;
    }
}

function showCheckInModal() {
    document.getElementById('statusSelect').value = '';
    document.getElementById('notesInput').value = '';
    statusModal.show();
}

/**
 * Menangani Absen Masuk (Hadir atau Izin/Sakit/Cuti)
 */
function handleCheckIn(status, notes = null) {
    if (getTodayAttendance(currentUser.id)) {
        showAlert('Anda sudah Absen Masuk hari ini.', 'danger');
        return;
    }
    
    const now = new Date();
    const checkInTime = formatTime(now);
    const date = getFormattedDate(now);
    const lateMinutes = calculateLateMinutes(now);
    const isLate = lateMinutes > 0;

    const newRecord = {
        id: Date.now().toString(), // ID unik
        userId: currentUser.id,
        name: currentUser.name,
        date: date,
        status: status,
        checkInTime: checkInTime,
        checkOutTime: null,
        isLate: isLate,
        lateMinutes: lateMinutes,
        notes: notes,
        // Log Perubahan Sederhana
        log: [`Dibuat ${now.toISOString()} oleh ${currentUser.id}`] 
    };

    const records = getAttendanceRecords();
    records.push(newRecord);
    saveAttendanceRecords(records);
    todayRecord = newRecord;

    showAlert(`Absen Masuk Berhasil! Status: ${status}`, 'success');
    loadEmployeeDashboard(); // Muat ulang dashboard
}

/**
 * Menangani Absen Keluar
 */
function handleCheckOut() {
    if (!todayRecord || todayRecord.checkOutTime) {
        showAlert('Anda belum Absen Masuk atau sudah Absen Keluar.', 'danger');
        return;
    }
    
    const now = new Date();
    const checkOutTime = formatTime(now);

    const records = getAttendanceRecords();
    const index = records.findIndex(r => r.id === todayRecord.id);

    if (index !== -1) {
        records[index].checkOutTime = checkOutTime;
        records[index].log.push(`Absen Keluar ${now.toISOString()} oleh ${currentUser.id}`);
        saveAttendanceRecords(records);
        todayRecord = records[index];
        showAlert('Absen Keluar Berhasil!', 'success');
        loadEmployeeDashboard(); // Muat ulang dashboard
    }
}

/**
 * Render Riwayat Singkat 5-10 Absensi Terakhir
 */
function renderAttendanceHistory() {
    const historyBody = document.getElementById('attendanceHistory');
    const allRecords = getAttendanceRecords()
        .filter(r => r.userId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Urutkan terbaru ke terlama

    historyBody.innerHTML = '';
    
    const recordsToShow = allRecords.slice(0, 7);

    if (recordsToShow.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada riwayat absensi.</td></tr>';
        return;
    }

    recordsToShow.forEach(record => {
        let statusClass = '';
        if (record.status === 'Hadir' && record.isLate) statusClass = 'text-danger';
        if (record.status === 'Sakit') statusClass = 'text-info';
        if (record.status === 'Izin' || record.status === 'Cuti') statusClass = 'text-warning';
        if (record.status === 'Alfa') statusClass = 'text-danger fw-bold';

        historyBody.innerHTML += `
            <tr>
                <td>${record.date}</td>
                <td>${record.checkInTime || '-'}</td>
                <td>${record.checkOutTime || '-'}</td>
                <td class="${statusClass}">${record.status}</td>
            </tr>
        `;
    });
}

/**
 * Menghitung dan menampilkan Statistik Pribadi Bulan Ini
 */
function renderPersonalStats() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const records = getAttendanceRecords().filter(r => r.userId === currentUser.id);

    let totalHadir = 0;
    let totalTelat = 0;
    let totalHariKerja = 0;

    // Perhitungan hari kerja dari awal bulan hingga hari ini
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    let currentDate = new Date(startOfMonth);
    
    while (currentDate <= today) {
        if (!isHoliday(currentDate)) {
            totalHariKerja++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    records.forEach(r => {
        const recordDate = new Date(r.date);
        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
            // Hanya hitung status Hadir sebagai 'Hadir' untuk persentase kehadiran
            if (r.status === 'Hadir' || r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti') {
                 // Untuk statistik: Hadir = Status Hadir Tepat Waktu
                if (r.status === 'Hadir' && !r.isLate) {
                    totalHadir++;
                }
            }
            if (r.isLate) {
                totalTelat++;
            }
        }
    });

    const totalAbsenTercatat = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;

    // Jika Hari Kerja > 0, hitung persentase. Kita anggap totalHariKerja adalah dasar absensi wajib
    const attendancePercentage = totalHariKerja > 0 ? Math.round((totalAbsenTercatat / totalHariKerja) * 100) : 0;
    
    document.getElementById('statHadir').textContent = `${attendancePercentage}%`;
    document.getElementById('statTelat').textContent = `${totalTelat}x`;
}

/**
 * Menghitung dan merender Peringkat Teladan (Mockup Kriteria)
 */
function renderRankingList() {
    const listElement = document.getElementById('rankingList');
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
        let nonHadirCount = 0; // Izin, Sakit, Cuti
        let lateCount = 0;

        userRecords.forEach(r => {
            if (r.status === 'Alfa') alfaCount++;
            if (r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti') nonHadirCount++;
            if (r.isLate) lateCount++;
        });

        // Kriteria berlapis: Min Alfa -> Min Izin/Sakit/Cuti -> Min Telat
        return {
            name: user.name,
            alfa: alfaCount,
            nonHadir: nonHadirCount,
            late: lateCount,
            score: (alfaCount * 100) + (nonHadirCount * 10) + lateCount 
            // Skor lebih kecil = lebih baik
        };
    }).sort((a, b) => a.score - b.score);

    const top5 = stats.slice(0, 5);

    top5.forEach((s, index) => {
        let badge;
        if (index === 0) badge = '<span class="badge bg-warning me-2"><i class="bi bi-star-fill"></i> Juara 1</span>';
        else if (index === 1) badge = '<span class="badge bg-secondary me-2">Runner Up 1</span>';
        else if (index === 2) badge = '<span class="badge bg-info me-2">Runner Up 2</span>';
        else badge = `<span class="badge bg-light text-dark me-2">#${index + 1}</span>`;

        listElement.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>${badge} **${s.name.split(',')[0]}**</div>
                <small class="text-muted">A:${s.alfa} | ISC:${s.nonHadir} | T:${s.late}</small>
            </li>
        `;
    });
}
