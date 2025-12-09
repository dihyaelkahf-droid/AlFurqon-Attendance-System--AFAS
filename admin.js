// admin.js
const SESSION_KEY = 'absensi_session';
const RECORDS_KEY = 'absensi_records_v1';
const HOLIDAYS_KEY = 'absensi_holidays_v1';
const LOGS_KEY = 'absensi_logs_v1';
const USERS_KEY = 'absensi_users_v1';

function getSession() {
  const s = sessionStorage.getItem(SESSION_KEY);
  if (!s) { location.href = 'index.html'; return null; }
  return JSON.parse(s);
}
function getRecords() { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); }
function saveRecords(r) { localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); }
function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getHolidays(){ return JSON.parse(localStorage.getItem(HOLIDAYS_KEY) || '[]'); }
function saveHolidays(h){ localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(h)); }
function addLog(entry){ const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]'); logs.push({...entry, timestamp: new Date().toISOString()}); localStorage.setItem(LOGS_KEY, JSON.stringify(logs)); }

document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if (!session) return;
  const users = getUsers();
  const me = users.find(u => u.username === session.username);
  document.getElementById('adminGreeting').innerText = me ? me.name : session.username;

  document.getElementById('logoutAdmin').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'index.html';
  });

  // init date filter to today
  document.getElementById('filterDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('filterDate').addEventListener('change', renderAttendanceTable);
  document.getElementById('filterName').addEventListener('input', renderAttendanceTable);
  document.getElementById('btnExportExcel').addEventListener('click', exportExcel);
  document.getElementById('btnExportPdf').addEventListener('click', exportPdf);

  // user mgmt
  document.getElementById('btnAddUser').addEventListener('click', handleAddUser);
  renderUserList();

  // holidays
  document.getElementById('addHoliday').addEventListener('click', () => {
    const d = document.getElementById('holidayDate').value;
    if (!d) return showAlert('Pilih tanggal','warning');
    const holidays = getHolidays();
    if (!holidays.includes(d)) {
      holidays.push(d);
      saveHolidays(holidays);
      addLog({action:'addHoliday', by: session.username, date: d});
      showAlert('Libur ditambahkan','success');
      renderHolidayList();
      renderAttendanceTable();
    } else showAlert('Tanggal sudah terdaftar','info');
  });
  renderHolidayList();

  renderAttendanceTable();
  renderSummary();
  renderChart();
});

// user list & reset password
function renderUserList(){
  const users = getUsers();
  const container = document.getElementById('userList');
  container.innerHTML = '';
  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'd-flex align-items-center mb-1';
    div.innerHTML = `<div class="flex-grow-1 small">${u.name} <span class="text-muted">(${u.username})</span></div>
      <button class="btn btn-sm btn-outline-secondary me-1" data-username="${u.username}" onclick="resetPwd(event)">Reset Pw</button>
      <button class="btn btn-sm btn-outline-danger" data-username="${u.username}" onclick="deleteUser(event)">Hapus</button>`;
    container.appendChild(div);
  });
}

function handleAddUser(){
  const name = prompt('Nama karyawan (Lengkap)');
  if (!name) return;
  const username = prompt('Username (unik)');
  if (!username) return;
  const pwd = prompt('Password default');
  if (!pwd) return;
  const users = getUsers();
  if (users.find(u=>u.username===username)) return alert('Username sudah ada');
  users.push({name, username, password: pwd, role:'employee'});
  saveUsers(users);
  addLog({action:'addUser', by: getSession().username, username});
  renderUserList();
  showAlert('Karyawan ditambahkan','success');
}

function resetPwd(ev){
  const username = ev.target.getAttribute('data-username');
  const newPw = prompt('Masukkan password baru untuk ' + username);
  if (!newPw) return;
  const users = getUsers();
  const u = users.find(x=>x.username===username);
  u.password = newPw;
  saveUsers(users);
  addLog({action:'resetPwd', by: getSession().username, username});
  showAlert('Password direset','success');
}

function deleteUser(ev){
  const username = ev.target.getAttribute('data-username');
  if (!confirm('Hapus user '+username+'?')) return;
  let users = getUsers();
  users = users.filter(u=>u.username!==username);
  saveUsers(users);
  addLog({action:'deleteUser', by: getSession().username, username});
  renderUserList();
  showAlert('User dihapus','success');
}

// holiday list
function renderHolidayList(){
  const list = getHolidays();
  const ul = document.getElementById('holidayList');
  ul.innerHTML = '';
  list.forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `${d} <button class="btn btn-sm btn-link p-0" onclick="removeHoliday('${d}')">hapus</button>`;
    ul.appendChild(li);
  });
}
function removeHoliday(d){
  if (!confirm('Hapus libur '+d+'?')) return;
  let list = getHolidays();
  list = list.filter(x=>x!==d);
  saveHolidays(list);
  addLog({action:'removeHoliday', by: getSession().username, date: d});
  renderHolidayList();
  renderAttendanceTable();
  showAlert('Libur dihapus','success');
}

// attendance table
function renderAttendanceTable(){
  const date = document.getElementById('filterDate').value;
  const q = document.getElementById('filterName').value.toLowerCase();
  const users = getUsers();
  const records = getRecords();
  const rows = users.map(u => {
    const rec = records.find(r=> r.username===u.username && r.date===date);
    return {username:u.username, name:u.name, rec};
  }).filter(r=> r.name.toLowerCase().includes(q) || r.username.includes(q));

  let html = `<table class="table table-sm"><thead><tr><th>Nama</th><th>Masuk</th><th>Keluar</th><th>Status</th><th>Telat</th><th>Aksi</th></tr></thead><tbody>`;
  rows.forEach(r => {
    const rec = r.rec;
    html += `<tr>
      <td>${r.name} <div class="text-muted small">${r.username}</div></td>
      <td>${rec ? (rec.checkinDisplay || '-') : '-'}</td>
      <td>${rec ? (rec.checkoutDisplay || '-') : '-'}</td>
      <td>${rec ? rec.status : '-'}</td>
      <td>${rec ? (rec.lateMinutes? rec.lateMinutes+' m':'-') : '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="openEdit('${r.username}','${date}')">Koreksi</button>
        <button class="btn btn-sm btn-outline-danger" onclick="markAlfa('${r.username}','${date}')">Set Alfa</button>
      </td>
    </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('attendanceTable').innerHTML = html;
  renderSummary();
  renderChart();
}

function openEdit(username, date) {
  const rec = getRecords().find(r=> r.username===username && r.date===date) || null;
  document.getElementById('editUsername').value = username;
  document.getElementById('editDate').value = date;
  document.getElementById('editCheckin').value = rec && rec.checkinTime ? rec.checkinTime.slice(11,16) : '';
  document.getElementById('editCheckout').value = rec && rec.checkoutTime ? rec.checkoutTime.slice(11,16) : '';
  document.getElementById('editStatus').value = rec ? rec.status : 'Hadir';
  document.getElementById('editNote').value = rec ? (rec.note||'') : '';
  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();

  document.getElementById('editForm').onsubmit = function(e) {
    e.preventDefault();
    saveEdit();
    modal.hide();
  };
}

function saveEdit(){
  const username = document.getElementById('editUsername').value;
  const date = document.getElementById('editDate').value;
  const checkin = document.getElementById('editCheckin').value;
  const checkout = document.getElementById('editCheckout').value;
  const status = document.getElementById('editStatus').value;
  const note = document.getElementById('editNote').value;

  const records = getRecords();
  let rec = records.find(r=> r.username===username && r.date===date);
  const before = JSON.stringify(rec || {});
  if (!rec) {
    // create record
    rec = {
      username, name: getUsers().find(u=>u.username===username).name, date,
      checkinTime: checkin ? new Date(date+'T'+checkin+':00').toISOString() : null,
      checkinDisplay: checkin || null,
      checkoutTime: checkout ? new Date(date+'T'+checkout+':00').toISOString() : null,
      checkoutDisplay: checkout || null,
      status, note, lateMinutes:0, editedBy: getSession().username, editedAt: new Date().toISOString()
    };
    records.push(rec);
  } else {
    if (checkin) { rec.checkinTime = new Date(date+'T'+checkin+':00').toISOString(); rec.checkinDisplay = checkin; } else { rec.checkinTime = null; rec.checkinDisplay = null; }
    if (checkout) { rec.checkoutTime = new Date(date+'T'+checkout+':00').toISOString(); rec.checkoutDisplay = checkout; } else { rec.checkoutTime = null; rec.checkoutDisplay = null; }
    rec.status = status; rec.note = note;
    // recompute late if hadir
    if (rec.checkinTime && status === 'Hadir') {
      const m = minutesLate(new Date(rec.checkinTime));
      rec.lateMinutes = m;
    } else rec.lateMinutes = 0;
    rec.editedBy = getSession().username; rec.editedAt = new Date().toISOString();
  }
  saveRecords(records);
  addLog({action:'editRecord', by: getSession().username, username, date, before, after: JSON.stringify(rec)});
  showAlert('Perubahan tersimpan','success');
  renderAttendanceTable();
}

function markAlfa(username, date) {
  if (!confirm('Set status Alfa untuk '+username+' pada '+date+'?')) return;
  const records = getRecords();
  let rec = records.find(r=> r.username===username && r.date===date);
  if (!rec) {
    rec = { username, name: getUsers().find(u=>u.username===username).name, date, checkinTime:null, checkinDisplay:null, checkoutTime:null, checkoutDisplay:null, status:'Alfa', note:'Ditandai Admin', lateMinutes:0, editedAt:new Date().toISOString(), editedBy:getSession().username };
    records.push(rec);
  } else {
    rec.status = 'Alfa'; rec.note = 'Ditandai Admin'; rec.editedBy = getSession().username; rec.editedAt = new Date().toISOString();
  }
  saveRecords(records);
  addLog({action:'setAlfa', by: getSession().username, username, date});
  showAlert('Di-set Alfa','success');
  renderAttendanceTable();
}

// summary
function renderSummary(){
  const users = getUsers();
  const records = getRecords();
  const date = document.getElementById('filterDate') ? document.getElementById('filterDate').value : new Date().toISOString().slice(0,10);
  const total = users.length;
  const hadir = records.filter(r=> r.date===date && r.status==='Hadir').length;
  const izin = records.filter(r=> r.date===date && r.status==='Izin').length;
  const sakit = records.filter(r=> r.date===date && r.status==='Sakit').length;
  const alfa = records.filter(r=> r.date===date && r.status==='Alfa').length;
  const container = document.getElementById('summaryArea');
  container.innerHTML = `<div class="small">Total Karyawan: <b>${total}</b></div>
    <div class="small">Sudah absen: <b>${hadir}</b></div>
    <div class="small">Izin: <b>${izin}</b> Sakit: <b>${sakit}</b> Alfa: <b>${alfa}</b>`;
  // alerts area
  const alerts = document.getElementById('alertsArea');
  const notYet = users.length - (hadir + izin + sakit + alfa);
  alerts.innerHTML = `<div class="small text-danger">Belum absen hari ini: <b>${notYet}</b></div>`;
}

// tiny helpers used also in admin: minutesLate
function minutesLate(checkinDate) {
  const d = new Date(checkinDate);
  const limit = new Date(d);
  limit.setHours(7,30,0,0);
  if (d <= limit) return 0;
  return Math.round((d - limit)/60000);
}

function getRecords() { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); }
function saveRecords(r){ localStorage.setItem(RECORDS_KEY, JSON.stringify(r)); }

// Export Excel (xlsx) via SheetJS
function exportExcel(){
  const date = document.getElementById('filterDate').value;
  const users = getUsers();
  const records = getRecords();
  const rows = [];
  rows.push(["Nama","Username","Tanggal","Masuk","Keluar","Status","Terlambat (menit)","Catatan"]);
  users.forEach(u => {
    const rec = records.find(r=> r.username===u.username && r.date===date);
    rows.push([u.name, u.username, date, rec?rec.checkinDisplay:'', rec?rec.checkoutDisplay:'', rec?rec.status:'', rec?rec.lateMinutes:'', rec?rec.note:'']);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
  const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
  const blob = new Blob([wbout], {type:'application/octet-stream'});
  const filename = `rekap_${date}.xlsx`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  addLog({action:'exportExcel', by: getSession().username, date});
}

// Export PDF via jsPDF
async function exportPdf(){
  const { jsPDF } = window.jspdf;
  const date = document.getElementById('filterDate').value;
  const users = getUsers();
  const records = getRecords();
  const doc = new jsPDF('p','pt','a4');
  doc.setFontSize(14);
  doc.text('Rekap Absensi - '+date, 40, 40);
  doc.setFontSize(10);
  let y = 60;
  doc.text('Generated: '+new Date().toLocaleString(), 40, 54);
  doc.setFontSize(9);
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidths = [120,70,60,60,60,80,70];
  // header
  doc.text('Nama',40,y); doc.text('Username',160,y); doc.text('Masuk',240,y); doc.text('Keluar',300,y); doc.text('Status',360,y); doc.text('Terlambat',420,y); doc.text('Catatan',490,y);
  y += 12;
  users.forEach(u => {
    const rec = records.find(r=> r.username===u.username && r.date===date);
    const row = [u.name, u.username, rec?rec.checkinDisplay:'', rec?rec.checkoutDisplay:'', rec?rec.status:'', rec?String(rec.lateMinutes):'', rec?rec.note||'':''];
    // wrap text if needed
    if (y > 750) { doc.addPage(); y = 40; }
    doc.text(row[0].slice(0,30),40,y); doc.text(row[1],160,y); doc.text(row[2],240,y); doc.text(row[3],300,y); doc.text(row[4],360,y); doc.text(row[5],420,y); doc.text(row[6].slice(0,30),490,y);
    y += 12;
  });
  doc.save(`rekap_${date}.pdf`);
  addLog({action:'exportPdf', by: getSession().username, date});
}

function showAlert(msg, type='info') {
  const p = `<div class="alert alert-${type}">${msg}</div>`;
  document.getElementById('alert-placeholder').innerHTML = p;
  setTimeout(()=> document.getElementById('alert-placeholder').innerHTML = '', 3000);
}

// simple chart of counts for current month
function renderChart(){
  const ctx = document.getElementById('chartCanvas');
  if(!ctx) return;
  const date = document.getElementById('filterDate').value || new Date().toISOString().slice(0,10);
  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();
  const records = getRecords();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const labels = Array.from({length: daysInMonth}, (_,i)=> String(i+1));
  const hadirArr = [];
  const izinArr = [];
  const sakitArr = [];
  for (let d=1; d<=daysInMonth; d++){
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayRecords = records.filter(r=> r.date === ds);
    hadirArr.push(dayRecords.filter(x=> x.status==='Hadir').length);
    izinArr.push(dayRecords.filter(x=> x.status==='Izin').length);
    sakitArr.push(dayRecords.filter(x=> x.status==='Sakit' || x.status==='Cuti' ).length);
  }
  // destroy existing chart if exists
  if (window._attChart) window._attChart.destroy();
  window._attChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {label:'Hadir', data: hadirArr},
        {label:'Izin', data: izinArr},
        {label:'Sakit/Cuti', data: sakitArr}
      ]
    },
    options: {responsive:true, plugins:{legend:{position:'top'}}}
  });
}
