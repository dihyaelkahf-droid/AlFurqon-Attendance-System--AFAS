// Database Class
class Database {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        // Initialize employees
        if (!localStorage.getItem('employees')) {
            const employees = [
                { id: 1, username: 'sutris', password: 'sutris123', name: 'Sutrisno', role: 'admin', position: 'HRD Manager', created_at: new Date().toISOString() },
                { id: 2, username: 'nita', password: 'nita123', name: 'Nita Sri Wahyuningrum, S.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 3, username: 'heri', password: 'heri123', name: 'Heri Kurniawan', role: 'employee', position: 'Staff', created_at: new Date().toISOString() },
                { id: 4, username: 'yian', password: 'yian123', name: 'Yian Hidayatul Ulfa, S. Pd.', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 5, username: 'diah', password: 'diah123', name: 'Diah Aprilia Devi, S.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 6, username: 'teguh', password: 'teguh123', name: 'Teguh Setia Isma Ramadan', role: 'employee', position: 'Staff', created_at: new Date().toISOString() },
                { id: 7, username: 'iskandar', password: 'iskandar123', name: 'Iskandar Kholif, S.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 8, username: 'dinul', password: 'dinul123', name: 'Dinul Qoyyimah, S. Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 9, username: 'endah', password: 'endah123', name: 'Endah Windarti, S.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 10, username: 'citra', password: 'citra123', name: 'Citra Wulan Sari, S. Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 11, username: 'fajri', password: 'fajri123', name: 'Fajriansyah Abdillah', role: 'employee', position: 'Staff', created_at: new Date().toISOString() },
                { id: 12, username: 'hamid', password: 'hamid123', name: 'Muh. Abdul Hamid, S.H.I', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 13, username: 'nurjayati', password: 'jayati123', name: 'Nurjayati, S.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 14, username: 'riswan', password: 'riswan123', name: 'Riswan Siregar, M.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 15, username: 'rizka', password: 'rizka123', name: 'Rizka Ulfiana, S. Tp', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 16, username: 'susi', password: 'susi123', name: 'Susi Dwi Ratna Sari, S.Pd', role: 'employee', position: 'Guru', created_at: new Date().toISOString() },
                { id: 17, username: 'usamah', password: 'usamah123', name: 'Usamah Hanif', role: 'employee', position: 'Staff', created_at: new Date().toISOString() },
                { id: 18, username: 'zainap', password: 'zainap123', name: 'Zainap Assaihatus Syahidah S. Si', role: 'employee', position: 'Guru', created_at: new Date().toISOString() }
            ];
            localStorage.setItem('employees', JSON.stringify(employees));
        }

        // Initialize attendances
        if (!localStorage.getItem('attendances')) {
            // Generate sample attendance data for current month
            const attendances = this.generateSampleAttendance();
            localStorage.setItem('attendances', JSON.stringify(attendances));
        }

        // Initialize holidays
        if (!localStorage.getItem('holidays')) {
            const holidays = [
                { id: 1, date: '2024-01-01', description: 'Tahun Baru Masehi' },
                { id: 2, date: '2024-03-11', description: 'Hari Raya Nyepi' },
                { id: 3, date: '2024-04-10', description: 'Hari Raya Idul Fitri 1445H' },
                { id: 4, date: '2024-04-11', description: 'Hari Raya Idul Fitri 1445H' },
                { id: 5, date: '2024-05-01', description: 'Hari Buruh Internasional' },
                { id: 6, date: '2024-05-09', description: 'Kenaikan Isa Almasih' },
                { id: 7, date: '2024-05-23', description: 'Hari Raya Waisak 2568 BE' },
                { id: 8, date: '2024-06-01', description: 'Hari Lahir Pancasila' },
                { id: 9, date: '2024-06-17', description: 'Hari Raya Idul Adha 1445H' },
                { id: 10, date: '2024-07-07', description: 'Tahun Baru Islam 1446H' },
                { id: 11, date: '2024-08-17', description: 'Hari Kemerdekaan RI ke-79' },
                { id: 12, date: '2024-09-16', description: 'Maulid Nabi Muhammad SAW' },
                { id: 13, date: '2024-12-25', description: 'Hari Raya Natal' }
            ];
            localStorage.setItem('holidays', JSON.stringify(holidays));
        }

        // Initialize change logs
        if (!localStorage.getItem('change_logs')) {
            localStorage.setItem('change_logs', JSON.stringify([]));
        }
    }

    generateSampleAttendance() {
        const attendances = [];
        const employees = this.getEmployees();
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Generate data for current month
        for (let day = 1; day <= today.getDate(); day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            
            // Skip Sundays and holidays
            const holidays = this.getHolidays();
            const isHoliday = holidays.some(h => h.date === dateStr);
            if (dayOfWeek === 0 || isHoliday) continue;
            
            // Generate attendance for each employee
            employees.forEach(employee => {
                // Skip some days randomly for absent
                if (Math.random() > 0.1) {
                    const timeIn = new Date(date);
                    timeIn.setHours(7, Math.floor(Math.random() * 30), 0); // 07:00-07:30
                    
                    // Some employees come late
                    if (Math.random() > 0.7) {
                        timeIn.setHours(7, 30 + Math.floor(Math.random() * 60), 0);
                    }
                    
                    const timeOut = new Date(timeIn);
                    timeOut.setHours(15, 30 + Math.floor(Math.random() * 30), 0);
                    
                    // Calculate late minutes
                    const standardTime = new Date(date);
                    standardTime.setHours(7, 30, 0, 0);
                    const lateMinutes = timeIn > standardTime ? 
                        Math.round((timeIn - standardTime) / (1000 * 60)) : 0;
                    
                    // Determine status
                    let status = 'Hadir';
                    let note = '';
                    
                    if (Math.random() > 0.9) {
                        status = Math.random() > 0.5 ? 'Izin' : 'Sakit';
                        note = status === 'Izin' ? 'Urusan keluarga' : 'Demam tinggi';
                    }
                    
                    attendances.push({
                        id: attendances.length + 1,
                        employee_id: employee.id,
                        date: dateStr,
                        time_in: timeIn.toTimeString().split(' ')[0].substring(0, 5),
                        time_out: timeOut.toTimeString().split(' ')[0].substring(0, 5),
                        status: status,
                        note: note,
                        late_minutes: lateMinutes,
                        created_at: timeIn.toISOString()
                    });
                }
            });
        }
        
        return attendances;
    }

    // ============ AUTH METHODS ============
    login(username, password) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const user = employees.find(emp => 
            emp.username === username && emp.password === password
        );
        return user;
    }

    // ============ EMPLOYEE METHODS ============
    getEmployees(role = null) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        if (role) {
            return employees.filter(emp => emp.role === role);
        }
        return employees;
    }

    getEmployeeById(id) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        return employees.find(emp => emp.id === id);
    }

    addEmployee(data) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const newId = Math.max(...employees.map(e => e.id)) + 1;
        
        const employee = {
            id: newId,
            username: data.username,
            password: data.password || data.username + '123',
            name: data.name,
            role: 'employee',
            position: data.position || 'Staff',
            created_at: new Date().toISOString()
        };
        
        employees.push(employee);
        localStorage.setItem('employees', JSON.stringify(employees));
        return employee;
    }

    updateEmployee(id, data) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const index = employees.findIndex(emp => emp.id == id);
        
        if (index !== -1) {
            employees[index] = { ...employees[index], ...data };
            localStorage.setItem('employees', JSON.stringify(employees));
            return employees[index];
        }
        return null;
    }

    resetPassword(id) {
        const employee = this.getEmployeeById(id);
        if (employee) {
            employee.password = employee.username + '123';
            this.updateEmployee(id, employee);
            return true;
        }
        return false;
    }

    // ============ ATTENDANCE METHODS ============
    getAttendances(filters = {}) {
        let attendances = JSON.parse(localStorage.getItem('attendances'));
        
        if (filters.employeeId) {
            attendances = attendances.filter(a => a.employee_id == filters.employeeId);
        }
        
        if (filters.startDate && filters.endDate) {
            attendances = attendances.filter(a => {
                const date = new Date(a.date);
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59);
                return date >= start && date <= end;
            });
        }
        
        if (filters.status) {
            attendances = attendances.filter(a => a.status === filters.status);
        }
        
        if (filters.date) {
            attendances = attendances.filter(a => a.date === filters.date);
        }
        
        return attendances.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getTodayAttendance(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        return attendances.find(a => 
            a.employee_id == employeeId && a.date === today
        );
    }

    checkIn(employeeId, status = 'Hadir', note = '', timeIn = null) {
        const today = new Date().toISOString().split('T')[0];
        const now = timeIn || new Date();
        const timeInStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Check if Sunday
        if (now.getDay() === 0) {
            throw new Error('Hari Minggu libur, tidak bisa absen');
        }
        
        // Check if holiday
        const holidays = this.getHolidays();
        const isHoliday = holidays.some(h => h.date === today);
        if (isHoliday) {
            throw new Error('Hari libur nasional, tidak bisa absen');
        }
        
        // Check if already checked in
        const existing = this.getTodayAttendance(employeeId);
        if (existing) {
            throw new Error('Anda sudah melakukan absen masuk hari ini');
        }
        
        // Calculate late minutes
        const standardTime = new Date(now);
        standardTime.setHours(7, 30, 0, 0);
        const lateMinutes = now > standardTime ? 
            Math.round((now - standardTime) / (1000 * 60)) : 0;
        
        const attendance = {
            id: Date.now(),
            employee_id: employeeId,
            date: today,
            time_in: timeInStr,
            time_out: null,
            status: status,
            note: note,
            late_minutes: lateMinutes,
            created_at: new Date().toISOString()
        };
        
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        attendances.push(attendance);
        localStorage.setItem('attendances', JSON.stringify(attendances));
        
        return attendance;
    }

    checkOut(employeeId, timeOut = null) {
        const attendance = this.getTodayAttendance(employeeId);
        if (!attendance) {
            throw new Error('Anda belum melakukan absen masuk hari ini');
        }
        
        if (attendance.time_out) {
            throw new Error('Anda sudah melakukan absen keluar hari ini');
        }
        
        const now = timeOut || new Date();
        attendance.time_out = now.toTimeString().split(' ')[0].substring(0, 5);
        
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const index = attendances.findIndex(a => a.id === attendance.id);
        if (index !== -1) {
            attendances[index] = attendance;
            localStorage.setItem('attendances', JSON.stringify(attendances));
        }
        
        return attendance;
    }

    updateAttendance(attendanceId, data, adminId, reason) {
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        const index = attendances.findIndex(a => a.id == attendanceId);
        
        if (index !== -1) {
            const oldData = { ...attendances[index] };
            
            // Recalculate late minutes if time_in changed
            if (data.time_in) {
                const date = new Date(attendances[index].date);
                const timeParts = data.time_in.split(':');
                const timeIn = new Date(date.setHours(timeParts[0], timeParts[1], 0));
                
                const standardTime = new Date(date);
                standardTime.setHours(7, 30, 0, 0);
                
                data.late_minutes = timeIn > standardTime ? 
                    Math.round((timeIn - standardTime) / (1000 * 60)) : 0;
            }
            
            attendances[index] = { ...attendances[index], ...data };
            
            // Log the change
            this.logChange({
                id: Date.now(),
                attendance_id: attendanceId,
                admin_id: adminId,
                old_data: oldData,
                new_data: attendances[index],
                reason: reason,
                changed_at: new Date().toISOString()
            });
            
            localStorage.setItem('attendances', JSON.stringify(attendances));
            return attendances[index];
        }
        return null;
    }

    markAbsent(employeeId, date, note = '') {
        const attendance = {
            id: Date.now(),
            employee_id: employeeId,
            date: date,
            time_in: null,
            time_out: null,
            status: 'Alfa',
            note: note,
            late_minutes: 0,
            created_at: new Date().toISOString()
        };
        
        const attendances = JSON.parse(localStorage.getItem('attendances'));
        attendances.push(attendance);
        localStorage.setItem('attendances', JSON.stringify(attendances));
        
        return attendance;
    }

    // ============ HOLIDAY METHODS ============
    getHolidays() {
        return JSON.parse(localStorage.getItem('holidays'));
    }

    addHoliday(holiday) {
        const holidays = JSON.parse(localStorage.getItem('holidays'));
        const newId = Math.max(...holidays.map(h => h.id)) + 1;
        
        holiday.id = newId;
        holidays.push(holiday);
        localStorage.setItem('holidays', JSON.stringify(holidays));
        return holiday;
    }

    deleteHoliday(id) {
        const holidays = JSON.parse(localStorage.getItem('holidays'));
        const filtered = holidays.filter(h => h.id != id);
        localStorage.setItem('holidays', JSON.stringify(filtered));
        return true;
    }

    // ============ CHANGE LOGS ============
    logChange(log) {
        const logs = JSON.parse(localStorage.getItem('change_logs'));
        logs.push(log);
        localStorage.setItem('change_logs', JSON.stringify(logs));
    }

    getChangeLogs() {
        return JSON.parse(localStorage.getItem('change_logs')).sort((a, b) => 
            new Date(b.changed_at) - new Date(a.changed_at)
        );
    }

    // ============ STATISTICS METHODS ============
    getEmployeeStats(employeeId, month = null, year = null) {
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();
        
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0);
        
        const attendances = this.getAttendances({
            employeeId: employeeId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        
        const present = attendances.filter(a => a.status === 'Hadir').length;
        const late = attendances.filter(a => a.late_minutes > 0).length;
        const permission = attendances.filter(a => a.status === 'Izin').length;
        const sick = attendances.filter(a => a.status === 'Sakit').length;
        const leave = attendances.filter(a => a.status === 'Cuti').length;
        const absent = attendances.filter(a => a.status === 'Alfa').length;
        
        const totalWorkingDays = this.getWorkingDays(targetMonth, targetYear);
        const attendanceRate = totalWorkingDays > 0 ? 
            Math.round((present / totalWorkingDays) * 100) : 0;
        
        return {
            present,
            late,
            permission,
            sick,
            leave,
            absent,
            total_working_days: totalWorkingDays,
            attendance_rate: attendanceRate
        };
    }

    getWorkingDays(month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const holidays = this.getHolidays();
        
        let workingDays = 0;
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            const dateStr = currentDate.toISOString().split('T')[0];
            const isHoliday = holidays.some(h => h.date === dateStr);
            
            if (dayOfWeek !== 0 && !isHoliday) {
                workingDays++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return workingDays;
    }

    getTodaySummary() {
        const today = new Date().toISOString().split('T')[0];
        const employees = this.getEmployees('employee');
        const attendances = this.getAttendances({ date: today });
        
        const checkedIn = attendances.filter(a => a.time_in).length;
        const onLeave = attendances.filter(a => 
            ['Izin', 'Sakit', 'Cuti'].includes(a.status)
        ).length;
        
        return {
            total_employees: employees.length,
            checked_in: checkedIn,
            on_leave: onLeave,
            absent: employees.length - attendances.length,
            late: attendances.filter(a => a.late_minutes > 0).length
        };
    }

    getTopEmployees(limit = 5) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        const employees = this.getEmployees('employee');
        const stats = employees.map(employee => {
            const employeeStats = this.getEmployeeStats(employee.id, month, year);
            return {
                ...employee,
                ...employeeStats,
                score: this.calculateEmployeeScore(employeeStats)
            };
        });
        
        return stats
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    calculateEmployeeScore(stats) {
        // Higher score is better
        let score = 100;
        
        // Penalty for absent
        score -= stats.absent * 20;
        
        // Penalty for late
        score -= Math.min(stats.late * 5, 30);
        
        // Small penalty for leave
        score -= (stats.permission + stats.sick + stats.leave) * 2;
        
        // Bonus for perfect attendance
        if (stats.absent === 0 && stats.late === 0) {
            score += 20;
        }
        
        return Math.max(0, score);
    }

    getAttendanceTrend(month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const attendances = this.getAttendances({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        
        const dates = [];
        const presentData = [];
        const lateData = [];
        const absentData = [];
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            if (currentDate.getDay() !== 0) { // Skip Sundays
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayAttendances = attendances.filter(a => a.date === dateStr);
                
                dates.push(dateStr.substring(8, 10));
                presentData.push(dayAttendances.filter(a => a.status === 'Hadir').length);
                lateData.push(dayAttendances.filter(a => a.late_minutes > 0).length);
                absentData.push(dayAttendances.filter(a => a.status === 'Alfa').length);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { dates, presentData, lateData, absentData };
    }

    // ============ REPORT METHODS ============
    generateReport(filters = {}) {
        let attendances = this.getAttendances(filters);
        
        // Enrich with employee data
        const report = attendances.map(attendance => {
            const employee = this.getEmployeeById(attendance.employee_id);
            return {
                'NIK': employee.id,
                'Nama': employee.name,
                'Jabatan': employee.position,
                'Tanggal': attendance.date,
                'Jam Masuk': attendance.time_in || '-',
                'Jam Keluar': attendance.time_out || '-',
                'Status': attendance.status,
                'Telat (menit)': attendance.late_minutes || 0,
                'Keterangan Telat': attendance.late_minutes > 0 ? 'Ya' : 'Tidak',
                'Catatan': attendance.note || '-',
                'Waktu Absen': attendance.created_at ? 
                    new Date(attendance.created_at).toLocaleString('id-ID') : '-'
            };
        });
        
        return report;
    }
}

// Initialize global database instance
const db = new Database();