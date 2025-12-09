// auth.js
class Auth {
    constructor() {
        this.initData();
    }

    // Inisialisasi data default
    initData() {
        if (!localStorage.getItem('employees')) {
            const defaultEmployees = [
                { id: 1, name: 'Sutrisno', username: 'sutris', password: 'password123', role: 'admin' },
                { id: 2, name: 'Nita Sri Wahyuningrum, S.Pd', username: 'nita', password: 'password123', role: 'employee' },
                { id: 3, name: 'Heri Kurniawan', username: 'heri', password: 'password123', role: 'employee' },
                { id: 4, name: 'Yian Hidayatul Ulfa, S. Pd.', username: 'yian', password: 'password123', role: 'employee' },
                { id: 5, name: 'Diah Aprilia Devi, S.Pd', username: 'diah', password: 'password123', role: 'employee' },
                { id: 6, name: 'Teguh Setia Isma Ramadan', username: 'teguh', password: 'password123', role: 'employee' },
                { id: 7, name: 'Iskandar Kholif, S.Pd', username: 'iskandar', password: 'password123', role: 'employee' },
                { id: 8, name: 'Dinul Qoyyimah, S. Pd', username: 'dinul', password: 'password123', role: 'employee' },
                { id: 9, name: 'Endah Windarti, S.Pd', username: 'endah', password: 'password123', role: 'employee' },
                { id: 10, name: 'Citra Wulan Sari, S. Pd', username: 'citra', password: 'password123', role: 'employee' },
                { id: 11, name: 'Fajriansyah Abdillah', username: 'fajri', password: 'password123', role: 'employee' },
                { id: 12, name: 'Muh. Abdul Hamid, S.H.I', username: 'hamid', password: 'password123', role: 'employee' },
                { id: 13, name: 'Nurjayati, S.Pd', username: 'nurjayati', password: 'password123', role: 'employee' },
                { id: 14, name: 'Riswan Siregar, M.Pd', username: 'riswan', password: 'password123', role: 'employee' },
                { id: 15, name: 'Rizka Ulfiana, S. Tp', username: 'rizka', password: 'password123', role: 'employee' },
                { id: 16, name: 'Susi Dwi Ratna Sari, S.Pd', username: 'susi', password: 'password123', role: 'employee' },
                { id: 17, name: 'Usamah Hanif', username: 'usamah', password: 'password123', role: 'employee' },
                { id: 18, name: 'Zainap Assaihatus Syahidah S. Si', username: 'zainap', password: 'password123', role: 'employee' }
            ];
            localStorage.setItem('employees', JSON.stringify(defaultEmployees));
        }

        if (!localStorage.getItem('attendances')) {
            localStorage.setItem('attendances', JSON.stringify([]));
        }

        if (!localStorage.getItem('holidays')) {
            localStorage.setItem('holidays', JSON.stringify([]));
        }

        if (!localStorage.getItem('corrections')) {
            localStorage.setItem('corrections', JSON.stringify([]));
        }
    }

    // Login function
    login(username, password) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const user = employees.find(emp => emp.username === username && emp.password === password);
        
        if (user) {
            // Simpan user yang login
            const userData = {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            return userData;
        }
        return null;
    }

    // Logout function
    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    // Get current user
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('currentUser') !== null;
    }

    // Redirect if not logged in
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    }

    // Add new employee (admin only)
    addEmployee(name, username, password) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        
        const newEmployee = {
            id: newId,
            name,
            username,
            password,
            role: 'employee'
        };
        
        employees.push(newEmployee);
        localStorage.setItem('employees', JSON.stringify(employees));
        return newEmployee;
    }

    // Reset password (admin only)
    resetPassword(employeeId, newPassword = 'password123') {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const index = employees.findIndex(e => e.id === employeeId);
        
        if (index !== -1) {
            employees[index].password = newPassword;
            localStorage.setItem('employees', JSON.stringify(employees));
            return true;
        }
        return false;
    }

    // Get all employees
    getAllEmployees() {
        return JSON.parse(localStorage.getItem('employees'));
    }
}

// Initialize auth when page loads
document.addEventListener('DOMContentLoaded', function() {
    const auth = new Auth();
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const user = auth.login(username, password);
            
            if (user) {
                showToast('Login berhasil!', 'success');
                
                // Redirect berdasarkan role
                setTimeout(() => {
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'employee.html';
                    }
                }, 1000);
            } else {
                showToast('Username atau password salah!', 'error');
            }
        });
    }
});

// Utility function untuk toast notification
function showToast(message, type = 'info') {
    // Hapus toast sebelumnya
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // Buat toast baru
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Hapus toast setelah 3 detik
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Function untuk format tanggal
function formatDate(date = new Date()) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Function untuk format waktu
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
