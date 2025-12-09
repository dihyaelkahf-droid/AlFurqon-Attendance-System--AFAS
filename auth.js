// Authentication Class
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.redirectBasedOnRole();
        }
    }

    login(username, password) {
        const user = db.login(username, password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { 
            success: false, 
            message: 'Username atau password salah. Coba: sutris / sutris123 (admin) atau nita / nita123 (karyawan)' 
        };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isEmployee() {
        return this.currentUser && this.currentUser.role === 'employee';
    }

    requireAuth() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    requireAdmin() {
        if (!this.requireAuth() || !this.isAdmin()) {
            window.location.href = 'employee.html';
            return false;
        }
        return true;
    }

    redirectBasedOnRole() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!this.currentUser) return;
        
        if (this.currentUser.role === 'admin') {
            if (currentPage === 'index.html' || currentPage === 'employee.html') {
                window.location.href = 'admin.html';
            }
        } else {
            if (currentPage === 'index.html' || currentPage === 'admin.html') {
                window.location.href = 'employee.html';
            }
        }
    }
}

// Initialize global auth instance
const auth = new Auth();