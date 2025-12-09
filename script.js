// script.js
class AttendanceSystem {
    constructor() {
        this.START_TIME = '07:30';
        this.END_TIME = '15:30';
    }

    // Check if today is Sunday or holiday
    isDayOff(date = new Date()) {
        const day = date.getDay(); // 0 = Sunday
        if (day === 0) return true;
        
        // Check holidays
        const holidays = JSON.parse(localStorage.getItem('holidays')) || [];
        const dateStr = date.toISOString().split('T')[0];
        return holidays.some(h => h.date === dateStr);
    }

    // Calculate late minutes
    calculateLateMinutes(checkInTime) {
        const [startHour, startMinute] = this.START_TIME.split(':').map(Number);
        const [checkHour, checkMinute] = checkInTime.split(':').map(Number);
        
        const startTotal = startHour * 60 + startMinute;
        const checkTotal = checkHour * 60 + checkMinute;
        
        return Math.max(0, checkTotal - startTotal);
    }

    // Check attendance status
    getAttendanceStatus(checkInTime, status = 'hadir') {
        if (status !== 'hadir') return status;
        
        const lateMinutes = this.calculateLateMinutes(checkInTime);
        if (lateMinutes > 0) return 'terlambat';
        
        return 'hadir';
    }

    // Add new attendance
    addAttendance(employeeId, status = 'hadir', notes = '') {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Check if already checked in today
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const existing = attendances.find(a => 
            a.employeeId === employeeId && a.date === dateStr
        );
        
        if (existing && existing.checkIn && !existing.checkOut) {
            // Check out
            existing.checkOut = timeStr;
            existing.updatedAt = now.toISOString();
            
            localStorage.setItem('attendances', JSON.stringify(attendances));
            return { ...existing, action: 'checkout' };
        } else if (!existing) {
            // Check in
            const lateMinutes = status === 'hadir' ? this.calculateLateMinutes(timeStr) : 0;
            
            const newAttendance = {
                id: attendances.length + 1,
                employeeId,
                date: dateStr,
                checkIn: timeStr,
                checkOut: null,
                status,
                notes,
                lateMinutes,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
            
            attendances.push(newAttendance);
            localStorage.setItem('attendances', JSON.stringify(attendances));
            return { ...newAttendance, action: 'checkin' };
        }
        
        return null;
    }

    // Get today's attendance for employee
    getTodayAttendance(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        
        return attendances.find(a => 
            a.employeeId === employeeId && a.date === today
        );
    }

    // Get attendance history
    getAttendanceHistory(employeeId, limit = 10) {
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        
        return attendances
            .filter(a => a.employeeId === employeeId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Get monthly statistics
    getMonthlyStats(employeeId, year = null, month = null) {
        const now = new Date();
        const currentYear = year || now.getFullYear();
        const currentMonth = month || now.getMonth() + 1;
        
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        
        const monthAttendances = attendances.filter(a => {
            const [aYear, aMonth] = a.date.split('-').map(Number);
            return a.employeeId === employeeId && 
                   aYear === currentYear && 
                   aMonth === currentMonth;
        });
        
        const stats = {
            totalDays: new Date(currentYear, currentMonth, 0).getDate(),
            present: 0,
            late: 0,
            sick: 0,
            permit: 0,
            alfa: 0,
            attendanceRate: 0
        };
        
        monthAttendances.forEach(a => {
            if (a.status === 'sakit') stats.sick++;
            else if (a.status === 'izin' || a.status === 'cuti') stats.permit++;
            else if (a.lateMinutes > 0) {
                stats.present++;
                stats.late++;
            } else if (a.status === 'hadir') stats.present++;
        });
        
        // Calculate alfa (working days minus attended days)
        // Note: Ini sederhana, tidak memperhitungkan libur
        const workingDays = stats.totalDays;
        const attendedDays = stats.present + stats.sick + stats.permit;
        stats.alfa = Math.max(0, workingDays - attendedDays);
        
        stats.attendanceRate = workingDays > 0 ? 
            ((stats.present + stats.sick + stats.permit) / workingDays * 100).toFixed(1) : 0;
        
        return stats;
    }

    // Get all today's attendances (for admin)
    getTodayAllAttendances() {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const employees = JSON.parse(localStorage.getItem('employees'));
        
        return attendances
            .filter(a => a.date === today)
            .map(a => {
                const employee = employees.find(e => e.id === a.employeeId);
                return {
                    ...a,
                    employeeName: employee ? employee.name : 'Unknown'
                };
            });
    }

    // Correct attendance (admin only)
    correctAttendance(attendanceId, updates, adminId) {
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const index = attendances.findIndex(a => a.id === attendanceId);
        
        if (index !== -1) {
            const oldAttendance = { ...attendances[index] };
            
            // Update fields
            if (updates.checkIn) attendances[index].checkIn = updates.checkIn;
            if (updates.checkOut) attendances[index].checkOut = updates.checkOut;
            if (updates.status) attendances[index].status = updates.status;
            if (updates.notes !== undefined) attendances[index].notes = updates.notes;
            
            // Recalculate late minutes
            if (updates.checkIn && attendances[index].status === 'hadir') {
                attendances[index].lateMinutes = this.calculateLateMinutes(updates.checkIn);
            }
            
            attendances[index].updatedAt = new Date().toISOString();
            
            // Log correction
            const corrections = JSON.parse(localStorage.getItem('corrections'));
            corrections.push({
                id: corrections.length + 1,
                attendanceId,
                adminId,
                oldData: oldAttendance,
                newData: attendances[index],
                correctedAt: new Date().toISOString()
            });
            
            localStorage.setItem('corrections', JSON.stringify(corrections));
            localStorage.setItem('attendances', JSON.stringify(attendances));
            
            return true;
        }
        
        return false;
    }

    // Get top performers
    getTopPerformers(limit = 5) {
        const employees = JSON.parse(localStorage.getItem('employees')).filter(e => e.role === 'employee');
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const scores = employees.map(employee => {
            const monthAttendances = attendances.filter(a => {
                const [aYear, aMonth] = a.date.split('-').map(Number);
                return a.employeeId === employee.id && 
                       aYear === currentYear && 
                       aMonth === currentMonth;
            });
            
            const stats = {
                employeeId: employee.id,
                name: employee.name,
                present: 0,
                lateCount: 0,
                lateMinutes: 0,
                sick: 0,
                permit: 0,
                alfa: 0,
                score: 0
            };
            
            monthAttendances.forEach(a => {
                if (a.status === 'hadir') {
                    stats.present++;
                    if (a.lateMinutes > 0) {
                        stats.lateCount++;
                        stats.lateMinutes += a.lateMinutes;
                    }
                } else if (a.status === 'sakit') stats.sick++;
                else if (a.status === 'izin' || a.status === 'cuti') stats.permit++;
            });
            
            // Scoring system: +10 for present, -1 per late minute, -5 for sick/permit, -20 for alfa
            const workingDays = new Date(currentYear, currentMonth, 0).getDate();
            const attendedDays = monthAttendances.length;
            stats.alfa = Math.max(0, workingDays - attendedDays);
            
            stats.score = (stats.present * 10) - 
                         (stats.lateMinutes) - 
                         ((stats.sick + stats.permit) * 5) - 
                         (stats.alfa * 20);
            
            return stats;
        });
        
        return scores.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    // Export to Excel
    exportToExcel(data, filename = 'laporan-absensi.xlsx') {
        // Create a simple CSV (karena ExcelJS butuh library)
        let csv = 'Nama,Tanggal,Masuk,Keluar,Status,Telat (menit),Catatan\n';
        
        data.forEach(item => {
            csv += `"${item.employeeName}","${item.date}","${item.checkIn || '-'}","${item.checkOut || '-'}","${item.status}","${item.lateMinutes || 0}","${item.notes || ''}"\n`;
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    // Export to PDF (simple version)
    exportToPDF(data, filename = 'laporan-absensi.pdf') {
        // Create HTML table and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
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
                        <p>Tanggal: ${formatDate()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
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
                            ${data.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.employeeName}</td>
                                    <td>${item.date}</td>
                                    <td>${item.checkIn || '-'}</td>
                                    <td>${item.checkOut || '-'}</td>
                                    <td>${item.status}</td>
                                    <td>${item.lateMinutes > 0 ? item.lateMinutes + ' menit' : '-'}</td>
                                    <td>${item.notes || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                        <p>Sistem Absensi Digital © 2024</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Initialize attendance system
const attendanceSystem = new AttendanceSystem();
