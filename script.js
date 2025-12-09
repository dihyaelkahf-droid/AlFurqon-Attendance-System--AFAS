// absensi-karyawan/script.js

// --- KONFIGURASI INTI & ATURAN BISNIS ---
const JAM_MASUK_STANDAR = { hour: 7, minute: 30 };
const JAM_KELUAR_STANDAR = { hour: 15, minute: 30 };
const ATTENDANCE_KEY = 'attendanceRecords';
const USERS_KEY = 'systemUsers';
const HOLIDAYS_KEY = 'publicHolidays';

// Data Karyawan Awal (Password hanya disimpan dalam bentuk text sederhana, TIDAK AMAN untuk produksi)
const defaultUsers = [
    { id: 'sutris', pin: 'sutris123', name: 'Sutrisno', role: 'admin' },
    { id: 'nita', pin: 'nita123', name: 'Nita Sri Wahyuningrum, S.Pd', role: 'employee' },
    { id: 'heri', pin: 'heri123', name: 'Heri Kurniawan', role: 'employee' },
    { id: 'yian', pin: 'yian123', name: 'Yian Hidayatul Ulfa, S. Pd.', role: 'employee' },
    { id: 'diah', pin: 'diah123', name: 'Diah Aprilia Devi, S.Pd', role: 'employee' },
    { id: 'teguh', pin: 'teguh123', name: 'Teguh Setia Isma Ramadan', role: 'employee' },
    { id: 'iskandar', pin: 'iskandar123', name: 'Iskandar Kholif, S.Pd', role: 'employee' },
    { id: 'dinul', pin: 'dinul123', name: 'Dinul Qoyyimah, S. Pd', role: 'employee' },
    { id: 'endah', pin: 'endah123', name: 'Endah Windarti, S.Pd', role: 'employee' },
    { id: 'citra', pin: 'citra123', name: 'Citra Wulan Sari, S. Pd', role: 'employee' },
    { id: 'fajri', pin: 'fajri123', name: 'Fajriansyah Abdillah', role: 'employee' },
    { id: 'hamid', pin: 'hamid123', name: 'Muh. Abdul Hamid, S.H.I', role: 'employee' },
    { id: 'nurjayati', pin: 'jayati123', name: 'Nurjayati, S.Pd', role: 'employee' },
    { id: 'riswan', pin: 'riswan123', name: 'Riswan Siregar, M.Pd', role: 'employee' },
    { id: 'rizka', pin: 'rizka123', name: 'Rizka Ulfiana, S. Tp', role: 'employee' },
    { id: 'susi', pin: 'susi123', name: 'Susi Dwi Ratna Sari, S.Pd', role: 'employee' },
    { id: 'usamah', pin: 'usamah123', name: 'Usamah Hanif', role: 'employee' },
    { id: 'zainap', pin: 'zainap123', name: 'Zainap Assaihatus Syahidah S. Si', role: 'employee' },
];

// --- FUNGSI UTAMA DATABASE (LocalStorage) ---

function initializeData() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(ATTENDANCE_KEY)) {
        localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(HOLIDAYS_KEY)) {
        // Format: 'YYYY-MM-DD'
        localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(['2025-12-25', '2026-01-01'])); 
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getAttendanceRecords() {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEY)) || [];
}

function saveAttendanceRecords(records) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

function getHolidays() {
    return JSON.parse(localStorage.getItem(HOLIDAYS_KEY)) || [];
}

function saveHolidays(holidays) {
    localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(holidays));
}

// --- FUNGSI UTILITY WAKTU ---

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD
 */
function getFormattedDate(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format waktu H:MM (misal 08:30)
 */
function formatTime(dateObj) {
    return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
}

/**
 * Menghitung selisih waktu keterlambatan dalam menit.
 */
function calculateLateMinutes(checkInTime) {
    const checkInDate = new Date(checkInTime);
    const standardDate = new Date(checkInTime); 
    
    // Set standard check-in time 07:30
    standardDate.setHours(JAM_MASUK_STANDAR.hour, JAM_MASUK_STANDAR.minute, 0, 0);

    if (checkInDate.getTime() > standardDate.getTime()) {
        const diffMs = checkInDate.getTime() - standardDate.getTime();
        return Math.floor(diffMs / (1000 * 60)); 
    }
    return 0;
}

// --- FUNGSI ABSENSI KHUSUS HARI INI ---

/**
 * Mencari catatan absensi hari ini untuk pengguna tertentu.
 */
function getTodayAttendance(userId, date = getFormattedDate()) {
    const records = getAttendanceRecords();
    return records.find(r => r.userId === userId && r.date === date);
}

/**
 * Pengecekan apakah hari ini adalah hari libur (Minggu atau Libur Nasional).
 */
function isHoliday(dateObj = new Date()) {
    const todayDateStr = getFormattedDate(dateObj);
    const dayOfWeek = dateObj.getDay(); // 0 = Minggu

    // 1. Cek Hari Minggu
    if (dayOfWeek === 0) {
        return true;
    }

    // 2. Cek Hari Libur Nasional
    const holidays = getHolidays();
    if (holidays.includes(todayDateStr)) {
        return true;
    }

    return false;
}

// Inisialisasi data saat pertama kali script dimuat
initializeData();
