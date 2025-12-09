// auth.js
// Simple client-side auth for demo. Uses localStorage to persist initial users.

const USERS_KEY = 'absensi_users_v1';

// initial 18 users including Admin Sutrisno (sutris)
const initialUsers = [
  {name:"Sutrisno", username:"sutris", password:"sutris123", role:"admin"},
  {name:"Nita Sri Wahyuningrum, S.Pd", username:"nita", password:"nita123", role:"employee"},
  {name:"Heri Kurniawan", username:"heri", password:"heri123", role:"employee"},
  {name:"Yian Hidayatul Ulfa, S. Pd.", username:"yian", password:"yian123", role:"employee"},
  {name:"Diah Aprilia Devi, S.Pd", username:"diah", password:"diah123", role:"employee"},
  {name:"Teguh Setia Isma Ramadan", username:"teguh", password:"teguh123", role:"employee"},
  {name:"Iskandar Kholif, S.Pd", username:"iskandar", password:"iskandar123", role:"employee"},
  {name:"Dinul Qoyyimah, S. Pd", username:"dinul", password:"dinul123", role:"employee"},
  {name:"Endah Windarti, S.Pd", username:"endah", password:"endah123", role:"employee"},
  {name:"Citra Wulan Sari, S. Pd", username:"citra", password:"citra123", role:"employee"},
  {name:"Fajriansyah Abdillah", username:"fajri", password:"fajri123", role:"employee"},
  {name:"Muh. Abdul Hamid, S.H.I", username:"hamid", password:"hamid123", role:"employee"},
  {name:"Nurjayati, S.Pd", username:"nurjayati", password:"jayati123", role:"employee"},
  {name:"Riswan Siregar, M.Pd", username:"riswan", password:"riswan123", role:"employee"},
  {name:"Rizka Ulfiana, S. Tp", username:"rizka", password:"rizka123", role:"employee"},
  {name:"Susi Dwi Ratna Sari, S.Pd", username:"susi", password:"susi123", role:"employee"},
  {name:"Usamah Hanif", username:"usamah", password:"usamah123", role:"employee"},
  {name:"Zainap Assaihatus Syahidah S. Si", username:"zainap", password:"zainap123", role:"employee"}
];

function ensureUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  }
}

function getUsers() {
  ensureUsers();
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function findUser(username) {
  return getUsers().find(u => u.username === username);
}

function resetPassword(username, newPassword) {
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return false;
  u.password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function updateUser(username, payload) {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return false;
  users[idx] = {...users[idx], ...payload};
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}

// login handling on index.html
document.addEventListener('DOMContentLoaded', () => {
  ensureUsers();
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const user = findUser(username);
    if (!user || user.password !== password) {
      showAlert('Username atau password salah','danger');
      return;
    }
    // store session
    sessionStorage.setItem('absensi_session', JSON.stringify({username:user.username, role: user.role}));
    // redirect
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'employee.html';
    }
  });
});

function showAlert(message, type='info') {
  const p = `<div class="alert alert-${type} alert-sm" role="alert">${message}</div>`;
  document.getElementById('alert-placeholder').innerHTML = p;
}
