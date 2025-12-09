// absensi-karyawan/auth.js

const CURRENT_USER_KEY = 'currentUser';

/**
 * Menangani proses login.
 */
function handleLogin(userId, pin) {
    const users = getUsers(); 
    // Dalam implementasi nyata, pin harus di-hash dan diverifikasi
    const user = users.find(u => u.id === userId && u.pin === pin); 

    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'employee.html';
        }
        return true;
    } else {
        showAlert('Username atau Password salah!', 'danger');
        return false;
    }
}

/**
 * Memeriksa status autentikasi dan otorisasi.
 */
function checkAuth(requiredRole) {
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }

    if (requiredRole && currentUser.role !== requiredRole) {
        // Redireksi ke dashboard sesuai peran jika tidak sesuai
        window.location.href = currentUser.role === 'admin' ? 'admin.html' : 'employee.html';
        return null;
    }

    return currentUser;
}

/**
 * Logout pengguna.
 */
function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = 'index.html';
}

/**
 * Fungsi untuk menampilkan notifikasi menggunakan Bootstrap Alert.
 */
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        const body = document.querySelector('body');
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
        container.style.zIndex = 1050;
        body.appendChild(container);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-lg`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.getElementById('alertContainer').appendChild(alertDiv);
    
    // Hilangkan otomatis setelah 4 detik
    setTimeout(() => {
        const bsAlert = bootstrap.Alert.getInstance(alertDiv) || new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 4000);
}
