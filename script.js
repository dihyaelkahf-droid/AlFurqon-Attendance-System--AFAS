// ================================================
// SCRIPT.JS - CORE BUSINESS LOGIC FOR ATTENDANCE
// ================================================

class AttendanceSystem {
    constructor() {
        // Konfigurasi jam kerja
        this.WORK_START_TIME = "07:30";
        this.WORK_END_TIME = "15:30";
        this.LATE_THRESHOLD = "07:30"; // Batas terlambat
        
        // Status kehadiran
        this.STATUS = {
            PRESENT: 'hadir',
            LATE: 'terlambat',
            SICK: 'sakit',
            PERMIT: 'izin',
            LEAVE: 'cuti',
            ABSENT: 'alfa'
        };
        
        // Inisialisasi database
        this.initDatabase();
    }

    // ================================================
    // 1. DATABASE INITIALIZATION
    // ================================================

    initDatabase() {
        // Pastikan semua tabel ada
        this.ensureTable('attendances', []);
        this.ensureTable('holidays', []);
        this.ensureTable('corrections', []);
        this.ensureTable('settings', {
            company_name: "Perusahaan Kita",
            work_start_time: this.WORK_START_TIME,
            work_end_time: this.WORK_END_TIME,
            late_threshold: this.LATE_THRESHOLD
        });
    }

    ensureTable(tableName, defaultValue) {
        if (!localStorage.getItem(tableName)) {
            localStorage.setItem(tableName, JSON.stringify(defaultValue));
        }
    }

    // ================================================
    // 2. BUSINESS RULES & VALIDATIONS
    // ================================================

    /**
     * Cek apakah hari ini hari libur
     * @param {Date} date - Tanggal yang dicek (default: hari ini)
     * @returns {boolean} - True jika hari libur
     */
    isDayOff(date = new Date()) {
        // 1. Cek hari Minggu (0 = Minggu)
        if (date.getDay() === 0) {
            return true;
        }

        // 2. Cek hari libur nasional/cuti
        const holidays = JSON.parse(localStorage.getItem('holidays')) || [];
        const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        return holidays.some(holiday => holiday.date === dateString);
    }

    /**
     * Hitung menit keterlambatan
     * @param {string} checkInTime - Format: "HH:MM"
     * @returns {number} - Jumlah menit terlambat
     */
    calculateLateMinutes(checkInTime) {
        // Parse waktu
        const [checkHour, checkMinute] = checkInTime.split(':').map(Number);
        const [thresholdHour, thresholdMinute] = this.LATE_THRESHOLD.split(':').map(Number);
        
        // Konversi ke menit
        const checkInMinutes = checkHour * 60 + checkMinute;
        const thresholdMinutes = thresholdHour * 60 + thresholdMinute;
        
        // Hitung selisih
        const lateMinutes = checkInMinutes - thresholdMinutes;
        
        // Return 0 jika tidak terlambat
        return Math.max(0, lateMinutes);
    }

    /**
     * Tentukan status kehadiran berdasarkan waktu dan kondisi
     * @param {string} checkInTime - Waktu check-in
     * @param {string} selectedStatus - Status yang dipilih user
     * @returns {Object} - Status dan keterangan
     */
    getAttendanceStatus(checkInTime, selectedStatus = this.STATUS.PRESENT) {
        // Jika status bukan "hadir" (misal: sakit, izin, cuti)
        if (selectedStatus !== this.STATUS.PRESENT) {
            return {
                status: selectedStatus,
                isLate: false,
                lateMinutes: 0
            };
        }
        
        // Jika status "hadir", cek keterlambatan
        const lateMinutes = this.calculateLateMinutes(checkInTime);
        
        return {
            status: lateMinutes > 0 ? this.STATUS.LATE : this.STATUS.PRESENT,
            isLate: lateMinutes > 0,
            lateMinutes: lateMinutes
        };
    }

    /**
     * Validasi apakah bisa absen masuk
     * @param {number} employeeId - ID karyawan
     * @returns {Object} - Hasil validasi
     */
    validateCheckIn(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        
        // Cek apakah sudah absen masuk hari ini
        const existingAttendance = attendances.find(att => 
            att.employeeId === employeeId && 
            att.date === today
        );
        
        if (existingAttendance) {
            return {
                valid: false,
                message: "Anda sudah melakukan absen masuk hari ini",
                existingData: existingAttendance
            };
        }
        
        // Cek apakah hari libur
        if (this.isDayOff()) {
            return {
                valid: false,
                message: "Hari ini adalah hari libur"
            };
        }
        
        return {
            valid: true,
            message: "Bisa melakukan absen masuk"
        };
    }

    /**
     * Validasi apakah bisa absen keluar
     * @param {number} employeeId - ID karyawan
     * @returns {Object} - Hasil validasi
     */
    validateCheckOut(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        
        // Cek apakah sudah absen masuk
        const existingAttendance = attendances.find(att => 
            att.employeeId === employeeId && 
            att.date === today
        );
        
        if (!existingAttendance) {
            return {
                valid: false,
                message: "Belum melakukan absen masuk"
            };
        }
        
        // Cek apakah sudah absen keluar
        if (existingAttendance.checkOut) {
            return {
                valid: false,
                message: "Anda sudah melakukan absen keluar"
            };
        }
        
        // Cek waktu minimal (tidak bisa absen keluar sebelum jam kerja selesai)
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const [endHour, endMinute] = this.WORK_END_TIME.split(':').map(Number);
        
        // Jika masih sebelum jam kerja berakhir
        if (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            return {
                valid: false,
                message: `Absen keluar baru bisa dilakukan setelah ${this.WORK_END_TIME}`,
                canForce: true // Admin bisa override
            };
        }
        
        return {
            valid: true,
            message: "Bisa melakukan absen keluar",
            checkInTime: existingAttendance.checkIn
        };
    }

    // ================================================
    // 3. ATTENDANCE OPERATIONS
    // ================================================

    /**
     * Proses absen masuk/keluar
     * @param {number} employeeId - ID karyawan
     * @param {string} status - Status kehadiran
     * @param {string} notes - Catatan (untuk izin/sakit/cuti)
     * @returns {Object} - Hasil proses absensi
     */
    addAttendance(employeeId, status = this.STATUS.PRESENT, notes = '') {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        
        let attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        
        // Cari absensi hari ini
        const todayAttendanceIndex = attendances.findIndex(att => 
            att.employeeId === employeeId && 
            att.date === dateString
        );
        
        // Jika belum ada absensi hari ini → ABSEN MASUK
        if (todayAttendanceIndex === -1) {
            const attendanceStatus = this.getAttendanceStatus(timeString, status);
            
            const newAttendance = {
                id: this.generateId('attendance'),
                employeeId: employeeId,
                date: dateString,
                checkIn: timeString,
                checkOut: null,
                status: attendanceStatus.status,
                notes: notes,
                lateMinutes: attendanceStatus.lateMinutes,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
            
            attendances.push(newAttendance);
            localStorage.setItem('attendances', JSON.stringify(attendances));
            
            return {
                success: true,
                action: 'checkin',
                data: newAttendance,
                message: 'Absen masuk berhasil'
            };
        }
        
        // Jika sudah ada absensi → ABSEN KELUAR
        const existingAttendance = attendances[todayAttendanceIndex];
        
        // Validasi: harus sudah check-in dan belum check-out
        if (!existingAttendance.checkIn || existingAttendance.checkOut) {
            return {
                success: false,
                action: 'error',
                message: 'Tidak bisa melakukan absen keluar'
            };
        }
        
        // Update data absensi
        existingAttendance.checkOut = timeString;
        existingAttendance.updatedAt = now.toISOString();
        
        // Hitung durasi kerja (dalam menit)
        const [inHour, inMinute] = existingAttendance.checkIn.split(':').map(Number);
        const [outHour, outMinute] = timeString.split(':').map(Number);
        
        const checkInMinutes = inHour * 60 + inMinute;
        const checkOutMinutes = outHour * 60 + outMinute;
        existingAttendance.workDuration = checkOutMinutes - checkInMinutes;
        
        attendances[todayAttendanceIndex] = existingAttendance;
        localStorage.setItem('attendances', JSON.stringify(attendances));
        
        return {
            success: true,
            action: 'checkout',
            data: existingAttendance,
            message: 'Absen keluar berhasil'
        };
    }

    /**
     * Ambil data absensi hari ini untuk karyawan tertentu
     * @param {number} employeeId - ID karyawan
     * @returns {Object|null} - Data absensi hari ini
     */
    getTodayAttendance(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        
        return attendances.find(att => 
            att.employeeId === employeeId && 
            att.date === today
        ) || null;
    }

    /**
     * Ambil riwayat absensi karyawan
     * @param {number} employeeId - ID karyawan
     * @param {number} limit - Jumlah data maksimal
     * @param {string} startDate - Filter tanggal mulai (YYYY-MM-DD)
     * @param {string} endDate - Filter tanggal akhir (YYYY-MM-DD)
     * @returns {Array} - Data riwayat absensi
     */
    getAttendanceHistory(employeeId, limit = 10, startDate = null, endDate = null) {
        let attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        
        // Filter berdasarkan employee
        let filtered = attendances.filter(att => att.employeeId === employeeId);
        
        // Filter berdasarkan tanggal jika ada
        if (startDate && endDate) {
            filtered = filtered.filter(att => 
                att.date >= startDate && att.date <= endDate
            );
        }
        
        // Urutkan berdasarkan tanggal (terbaru dulu)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Batasi jumlah data
        return filtered.slice(0, limit);
    }

    /**
     * Generate ID unik untuk data baru
     * @param {string} prefix - Prefix untuk ID
     * @returns {string} - ID unik
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ================================================
    // 4. STATISTICS & REPORTS
    // ================================================

    /**
     * Hitung statistik bulanan karyawan
     * @param {number} employeeId - ID karyawan
     * @param {number} year - Tahun (default: tahun sekarang)
     * @param {number} month - Bulan (1-12, default: bulan sekarang)
     * @returns {Object} - Statistik bulanan
     */
    getMonthlyStats(employeeId, year = null, month = null) {
        const now = new Date();
        const currentYear = year || now.getFullYear();
        const currentMonth = month || now.getMonth() + 1;
        
        const attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        
        // Filter absensi bulan ini
        const monthAttendances = attendances.filter(att => {
            if (att.employeeId !== employeeId) return false;
            
            const [attYear, attMonth] = att.date.split('-').map(Number);
            return attYear === currentYear && attMonth === currentMonth;
        });
        
        // Hitung hari kerja dalam bulan (exclude Sundays)
        const workingDays = this.calculateWorkingDays(currentYear, currentMonth);
        
        // Inisialisasi statistik
        const stats = {
            year: currentYear,
            month: currentMonth,
            workingDays: workingDays,
            totalPresent: 0,
            totalLate: 0,
            totalSick: 0,
            totalPermit: 0,
            totalLeave: 0,
            totalAbsent: 0,
            totalLateMinutes: 0,
            attendanceRate: 0
        };
        
        // Hitung berdasarkan status
        monthAttendances.forEach(att => {
            switch(att.status) {
                case this.STATUS.PRESENT:
                    stats.totalPresent++;
                    break;
                case this.STATUS.LATE:
                    stats.totalPresent++;
                    stats.totalLate++;
                    stats.totalLateMinutes += att.lateMinutes || 0;
                    break;
                case this.STATUS.SICK:
                    stats.totalSick++;
                    break;
                case this.STATUS.PERMIT:
                    stats.totalPermit++;
                    break;
                case this.STATUS.LEAVE:
                    stats.totalLeave++;
                    break;
            }
        });
        
        // Hitung alfa (hari kerja - total kehadiran)
        const totalAttended = stats.totalPresent + stats.totalSick + 
                            stats.totalPermit + stats.totalLeave;
        stats.totalAbsent = Math.max(0, workingDays - totalAttended);
        
        // Hitung persentase kehadiran
        stats.attendanceRate = workingDays > 0 
            ? Math.round((totalAttended / workingDays) * 100) 
            : 0;
        
        // Rata-rata keterlambatan
        stats.averageLateMinutes = stats.totalLate > 0 
            ? Math.round(stats.totalLateMinutes / stats.totalLate) 
            : 0;
        
        return stats;
    }

    /**
     * Hitung hari kerja dalam bulan (exclude Sundays)
     * @param {number} year - Tahun
     * @param {number} month - Bulan
     * @returns {number} - Jumlah hari kerja
     */
    calculateWorkingDays(year, month) {
        let workingDays = 0;
        const daysInMonth = new Date(year, month, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            // 0 = Sunday, 6 = Saturday
            if (date.getDay() !== 0) { // Exclude Sundays
                workingDays++;
            }
        }
        
        return workingDays;
    }

    /**
     * Ranking karyawan teladan berdasarkan kriteria
     * @param {number} limit - Jumlah ranking yang ditampilkan
     * @param {number} year - Tahun (default: sekarang)
     * @param {number} month - Bulan (default: sekarang)
     * @returns {Array} - Ranking karyawan
     */
    getTopPerformers(limit = 5, year = null, month = null) {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const employeeList = employees.filter(emp => emp.role === 'employee');
        
        const now = new Date();
        const currentYear = year || now.getFullYear();
        const currentMonth = month || now.getMonth() + 1;
        
        // Hitung skor untuk setiap karyawan
        const performers = employeeList.map(employee => {
            const stats = this.getMonthlyStats(employee.id, currentYear, currentMonth);
            
            // Sistem poin:
            // +10 untuk setiap hadir tepat waktu
            // +5 untuk setiap hadir terlambat (kurang baik)
            // 0 untuk izin/sakit (netral)
            // -10 untuk setiap alfa
            // Bonus: -1 untuk setiap menit terlambat
            
            let score = 0;
            score += stats.totalPresent * 10; // Hadir tepat waktu
            score += stats.totalLate * 5;     // Hadir terlambat (masih lebih baik dari alfa)
            score -= stats.totalAbsent * 10;  // Pengurangan untuk alfa
            score -= stats.totalLateMinutes;  // Pengurangan untuk menit terlambat
            
            return {
                id: employee.id,
                name: employee.name,
                username: employee.username,
                ...stats,
                score: score
            };
        });
        
        // Urutkan berdasarkan skor (tertinggi ke terendah)
        performers.sort((a, b) => b.score - a.score);
        
        // Tambahkan ranking
        performers.forEach((performer, index) => {
            performer.rank = index + 1;
            performer.medal = index === 0 ? '🥇' : 
                             index === 1 ? '🥈' : 
                             index === 2 ? '🥉' : `${index + 1}`;
        });
        
        return performers.slice(0, limit);
    }

    /**
     * Ambil semua data absensi hari ini untuk admin
     * @returns {Array} - Data absensi hari ini semua karyawan
     */
    getTodayAllAttendances() {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        
        // Gabungkan dengan data karyawan
        const todayAttendances = attendances
            .filter(att => att.date === today)
            .map(att => {
                const employee = employees.find(emp => emp.id === att.employeeId);
                return {
                    ...att,
                    employeeName: employee ? employee.name : 'Unknown',
                    employeeUsername: employee ? employee.username : 'unknown'
                };
            });
        
        // Tambahkan karyawan yang belum absen
        const absentEmployees = employees
            .filter(emp => emp.role === 'employee')
            .filter(emp => !todayAttendances.some(att => att.employeeId === emp.id))
            .map(emp => ({
                id: `absent_${emp.id}`,
                employeeId: emp.id,
                employeeName: emp.name,
                employeeUsername: emp.username,
                date: today,
                checkIn: null,
                checkOut: null,
                status: this.STATUS.ABSENT,
                notes: 'Belum absen',
                lateMinutes: 0,
                isAbsent: true
            }));
        
        return [...todayAttendances, ...absentEmployees];
    }

    // ================================================
    // 5. ATTENDANCE CORRECTION (ADMIN ONLY)
    // ================================================

    /**
     * Koreksi data absensi oleh admin
     * @param {number} attendanceId - ID absensi yang akan dikoreksi
     * @param {Object} updates - Data yang akan diupdate
     * @param {number} adminId - ID admin yang melakukan koreksi
     * @returns {Object} - Hasil koreksi
     */
    correctAttendance(attendanceId, updates, adminId) {
        let attendances = JSON.parse(localStorage.getItem('attendances')) || [];
        const index = attendances.findIndex(att => att.id === attendanceId);
        
        if (index === -1) {
            return {
                success: false,
                message: 'Data absensi tidak ditemukan'
            };
        }
        
        // Simpan data lama untuk log
        const oldData = { ...attendances[index] };
        
        // Update data
        if (updates.checkIn !== undefined) {
            attendances[index].checkIn = updates.checkIn;
            
            // Hitung ulang keterlambatan jika status hadir
            if (attendances[index].status === this.STATUS.PRESENT || 
                attendances[index].status === this.STATUS.LATE) {
                const lateMinutes = this.calculateLateMinutes(updates.checkIn);
                attendances[index].lateMinutes = lateMinutes;
                attendances[index].status = lateMinutes > 0 ? this.STATUS.LATE : this.STATUS.PRESENT;
            }
        }
        
        if (updates.checkOut !== undefined) {
            attendances[index].checkOut = updates.checkOut;
        }
        
        if (updates.status !== undefined) {
            attendances[index].status = updates.status;
            
            // Reset lateMinutes jika status bukan hadir/terlambat
            if (updates.status !== this.STATUS.PRESENT && 
                updates.status !== this.STATUS.LATE) {
                attendances[index].lateMinutes = 0;
            }
        }
        
        if (updates.notes !== undefined) {
            attendances[index].notes = updates.notes;
        }
        
        attendances[index].updatedAt = new Date().toISOString();
        attendances[index].correctedBy = adminId;
        attendances[index].correctionCount = (attendances[index].correctionCount || 0) + 1;
        
        // Simpan perubahan
        localStorage.setItem('attendances', JSON.stringify(attendances));
        
        // Log koreksi
        this.logCorrection({
            attendanceId: attendanceId,
            adminId: adminId,
            oldData: oldData,
            newData: attendances[index],
            correctedAt: new Date().toISOString()
        });
        
        return {
            success: true,
            message: 'Koreksi berhasil disimpan',
            data: attendances[index]
        };
    }

    /**
     * Log setiap koreksi yang dilakukan admin
     * @param {Object} correctionData - Data koreksi
     */
    logCorrection(correctionData) {
        let corrections = JSON.parse(localStorage.getItem('corrections')) || [];
        correctionData.id = this.generateId('correction');
        corrections.push(correctionData);
        
        // Simpan maksimal 1000 log terakhir
        if (corrections.length > 1000) {
            corrections = corrections.slice(-1000);
        }
        
        localStorage.setItem('corrections', JSON.stringify(corrections));
    }

    // ================================================
    // 6. EXPORT & REPORTING
    // ================================================

    /**
     * Export data absensi ke Excel (CSV format)
     * @param {Array} data - Data yang akan diexport
     * @param {string} filename - Nama file
     */
    exportToExcel(data, filename = 'laporan-absensi.csv') {
        if (!data || data.length === 0) {
            alert('Tidak ada data untuk diexport');
            return;
        }
        
        // Buat header CSV
        const headers = [
            'Nama Karyawan',
            'Tanggal',
            'Jam Masuk',
            'Jam Keluar',
            'Status',
            'Menit Terlambat',
            'Durasi Kerja (menit)',
            'Catatan'
        ];
        
        // Buat baris data
        const rows = data.map(item => {
            return [
                `"${item.employeeName || item.name || ''}"`,
                item.date,
                item.checkIn || '-',
                item.checkOut || '-',
                item.status,
                item.lateMinutes || 0,
                item.workDuration || 0,
                `"${item.notes || ''}"`
            ].join(',');
        });
        
        // Gabungkan header dan data
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        // Buat blob dan download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export data absensi ke PDF (menggunakan window.print)
     * @param {Array} data - Data yang akan diexport
     * @param {string} title - Judul laporan
     */
    exportToPDF(data, title = 'Laporan Absensi') {
        // Buat halaman baru untuk print
        const printWindow = window.open('', '_blank');
        
        // Buat HTML untuk print
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #2c3e50;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        color: #2c3e50;
                        margin: 0;
                    }
                    .header .subtitle {
                        color: #7f8c8d;
                        margin-top: 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                        font-size: 12px;
                    }
                    th {
                        background-color: #2c3e50;
                        color: white;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    .status-badge {
                        padding: 3px 10px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: bold;
                        display: inline-block;
                    }
                    .status-hadir { background: #d4edda; color: #155724; }
                    .status-terlambat { background: #fff3cd; color: #856404; }
                    .status-sakit { background: #d1ecf1; color: #0c5460; }
                    .status-izin { background: #e2e3e5; color: #383d41; }
                    .status-cuti { background: #cce5ff; color: #004085; }
                    .status-alfa { background: #f8d7da; color: #721c24; }
                    .footer {
                        margin-top: 30px;
                        text-align: right;
                        font-size: 11px;
                        color: #7f8c8d;
                    }
                    @media print {
                        .no-print { display: none; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <div class="subtitle">
                        Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Karyawan</th>
                            <th>Tanggal</th>
                            <th>Jam Masuk</th>
                            <th>Jam Keluar</th>
                            <th>Status</th>
                            <th>Keterlambatan</th>
                            <th>Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.employeeName || item.name || ''}</td>
                                <td>${new Date(item.date).toLocaleDateString('id-ID')}</td>
                                <td>${item.checkIn || '-'}</td>
                                <td>${item.checkOut || '-'}</td>
                                <td>
                                    <span class="status-badge status-${item.status}">
                                        ${this.getStatusText(item.status)}
                                    </span>
                                </td>
                                <td>${item.lateMinutes ? item.lateMinutes + ' menit' : '-'}</td>
                                <td>${item.notes || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Sistem Absensi Karyawan &copy; ${new Date().getFullYear()}</p>
                    <p>Total Data: ${data.length} record</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #2c3e50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🖨️ Cetak Laporan
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        ✖️ Tutup
                    </button>
                </div>
                
                <script>
                    // Auto print
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    /**
     * Get text untuk status kehadiran
     * @param {string} status - Status code
     * @returns {string} - Status text
     */
    getStatusText(status) {
        const statusMap = {
            [this.STATUS.PRESENT]: 'Hadir',
            [this.STATUS.LATE]: 'Terlambat',
            [this.STATUS.SICK]: 'Sakit',
            [this.STATUS.PERMIT]: 'Izin',
            [this.STATUS.LEAVE]: 'Cuti',
            [this.STATUS.ABSENT]: 'Alfa'
        };
        
        return statusMap[status] || status;
    }

    // ================================================
    // 7. HOLIDAY MANAGEMENT
    // ================================================

    /**
     * Tambah hari libur
     * @param {string} date - Tanggal (YYYY-MM-DD)
     * @param {string} description - Deskripsi libur
     * @param {string} type - Jenis libur
     * @returns {Object} - Hasil operasi
     */
    addHoliday(date, description, type = 'nasional') {
        const holidays = JSON.parse(localStorage.getItem('holidays')) || [];
        
        // Validasi format tanggal
        if (!this.isValidDate(date)) {
            return {
                success: false,
                message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD'
            };
        }
        
        // Cek duplikat
        if (holidays.some(h => h.date === date)) {
            return {
                success: false,
                message: 'Tanggal libur sudah ada'
            };
        }
        
        const newHoliday = {
            id: this.generateId('holiday'),
            date: date,
            description: description,
            type: type,
            createdAt: new Date().toISOString()
        };
        
        holidays.push(newHoliday);
        localStorage.setItem('holidays', JSON.stringify(holidays));
        
        return {
            success: true,
            message: 'Hari libur berhasil ditambahkan',
            data: newHoliday
        };
    }

    /**
     * Hapus hari libur
     * @param {string} holidayId - ID hari libur
     * @returns {Object} - Hasil operasi
     */
    deleteHoliday(holidayId) {
        let holidays = JSON.parse(localStorage.getItem('holidays')) || [];
        const initialLength = holidays.length;
        
        holidays = holidays.filter(h => h.id !== holidayId);
        
        if (holidays.length === initialLength) {
            return {
                success: false,
                message: 'Hari libur tidak ditemukan'
            };
        }
        
        localStorage.setItem('holidays', JSON.stringify(holidays));
        
        return {
            success: true,
            message: 'Hari libur berhasil dihapus'
        };
    }

    /**
     * Validasi format tanggal
     * @param {string} dateString - String tanggal
     * @returns {boolean} - True jika valid
     */
    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // ================================================
    // 8. UTILITY FUNCTIONS
    // ================================================

    /**
     * Format tanggal ke Bahasa Indonesia
     * @param {Date|string} date - Tanggal
     * @returns {string} - Tanggal yang diformat
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format waktu ke HH:MM
     * @param {Date|string} time - Waktu
     * @returns {string} - Waktu yang diformat
     */
    formatTime(time) {
        if (!time) return '';
        
        const d = new Date(`2000-01-01T${time}`);
        if (isNaN(d.getTime())) return time;
        
        return d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Reset semua data (untuk testing)
     * @returns {Object} - Hasil reset
     */
    resetAllData() {
        if (confirm('Reset semua data? Tindakan ini tidak bisa dibatalkan!')) {
            localStorage.removeItem('attendances');
            localStorage.removeItem('holidays');
            localStorage.removeItem('corrections');
            this.initDatabase();
            
            return {
                success: true,
                message: 'Semua data berhasil direset'
            };
        }
        
        return {
            success: false,
            message: 'Reset dibatalkan'
        };
    }
}

// ================================================
// GLOBAL INSTANCE
// ================================================

// Buat instance global untuk digunakan di file lain
const attendanceSystem = new AttendanceSystem();

// Export untuk penggunaan di modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AttendanceSystem, attendanceSystem };
} else {
    window.attendanceSystem = attendanceSystem;
}
