// employee.js
// Handles employee dashboard and absensi actions (localStorage-based)

const SESSION_KEY = 'absensi_session';
const RECORDS_KEY = 'absensi_records_v1';
const HOLIDAYS_KEY = 'absensi_holidays_v1';
const LOGS_KEY = 'absensi_logs_v1';

const WORK_START = {hour:7, minute:30};
const WORK_END = {hour:15, minute:30};

function getSession() {
  const s = sessionStorage.getItem(SESSION_KEY);
  if (!s) { location.href = 'index.html'; return null; }
  return JSON.parse(s);
}

function getRecords() {
  return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
}

function saveRecords(r) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(r));
}

function getHolidays() {
  return JSON.parse(localStorage.getItem(HOLIDAYS_KEY) || '[]');
}

function addLog(entry) {
  const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  logs.push({...entry, timestamp: new Date().toISOString()});
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

function isSunday(date) {
  return new Date(date).getDay() === 0;
}

function isHoliday(dateStr) {
  const holidays = getHolidays();
  return holidays.includes(dateStr);
}

function fmtTime(date) {
  return date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function toDateString(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function minutesLate(checkinDate) {
  const d = new Date(checkinDate);
  const limit = new Date(d);
  limit.setHours(WORK_START.hour, WORK_START.minute,0,0);
  if (d <= limit) return 0;
  return Math.round((d - limit)/60000);
}

document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if (!session) return;
  const users = JSON.parse(localStorage.getItem('absensi_users_v1'));
  const me = users.find(u => u.username === session.username);
  document.getElementById('userGreeting').innerText = me ? me.name : session.username;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'index.html';
  });

  renderMainCard();
  renderStats();
  renderHistory();
  renderRanking();

  // modal handling
  const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));
  document.getElementById('statusForm').addEventListener('submit', e => {
    e.preventDefault();
    statusModal.hide();
    performCheckIn();
  });

  // Listen for check-out click via event delegation
  document.getElementById('mainCard').addEventListener('click', e => {
    if (e.target && e.target.id === 'btnCheckout') {
      performCheckOut();
    } else if (e.target && e.target.id === 'btnCheckin') {
      // open modal for status selection
      document.getElementById('statusNote').value = '';
      document.getElementById('statusSelect').value = 'Hadir';
      statusModal.show();
    }
  });
});

function todayRecordForUser(username, dateStr) {
  const r = getRecords();
  return r.find(x => x.username === username && x.date === dateStr);
}

function renderMainCard() {
  const session = getSession();
  const users = JSON.parse(localStorage.getItem('absensi_users_v1'));
  const me = users.find(u => u.username === session.username);
  const main = document.getElementById('mainCard');
  const dateStr = toDateString(new Date());
  const isSun = isSunday(new Date());
  const holiday = isHoliday(dateStr);

  let html = '';
  if (isSun || holiday) {
    html = `<div class="alert alert-info">Hari ini adalah hari libur. Anda tidak perlu absen.</div>`;
  } else {
    const rec = todayRecordForUser(session.username, dateStr);
    if (!rec) {
      // show Check-in button
      html = `<button id="btnCheckin" class="btn btn-lg btn-success">ABSEN MASUK</button>`;
      document.getElementById('statusTitle').innerText = 'Menunggu Absen Masuk';
      document.getElementById('statusSubtitle').innerText = 'Tekan ABSEN MASUK saat sampai di kantor.';
    } else {
      // show Check-out if not yet checked out
      const late = rec.lateMinutes && rec.status==='Hadir' ? ` (Terlambat ${rec.lateMinutes} menit)` : '';
      if (!rec.checkoutTime) {
        html = `<div class="mb-2"><strong>Anda sudah Absen Masuk pada ${rec.checkinDisplay}${late}</strong></div>
                <button id="btnCheckout" class="btn btn-lg btn-primary">ABSEN KELUAR</button>
                <div class="mt-2 small text-muted">Waktu keluar ideal: 15:30</div>`;
      } else {
        html = `<div><strong>Sudah Absen Hari Ini</strong></div>
                <div class="small text-muted">Masuk: ${rec.checkinDisplay} — Keluar: ${rec.checkoutDisplay}</div>`;
      }
      document.getElementById('statusTitle').innerText = `Status: ${rec.status || 'Hadir'}`;
      document.getElementById('statusSubtitle').innerText = rec.note ? `Catatan: ${rec.note}` : '';
    }
  }
  main.innerHTML = html;
}

function performCheckIn() {
  const session = getSession();
  const users = JSON.parse(localStorage.getItem('absensi_users_v1'));
  const me = users.find(u => u.username === session.username);

  const status = document.getElementById('statusSelect').value;
  const note = document.getElementById('statusNote').value.trim();

  if (['Izin','Sakit','Cuti'].includes(status) && !note) {
    showAlert('Catatan wajib diisi untuk Izin/Sakit/Cuti','warning');
    return;
  }

  const now = new Date();
  const dateStr = toDateString(now);
  // check sunday or holiday
  if (isSunday(now) || isHoliday(dateStr)) {
    showAlert('Hari ini hari libur, tidak perlu absen.','info');
    return;
  }

  // check duplicate
  if (todayRecordForUser(session.username, dateStr)) {
    showAlert('Anda sudah melakukan absen hari ini.','warning');
    renderMainCard();
    return;
  }

  // create record
  const rec = {
    username: session.username,
    name: me.name,
    date: dateStr,
    checkinTime: now.toISOString(),
    checkinDisplay: fmtTime(now),
    checkoutTime: null,
    checkoutDisplay: null,
    status: status,
    note: note,
    lateMinutes: status === 'Hadir' ? minutesLate(now) : 0,
    editedBy: null,
    editedAt: null
  };

  const records = getRecords();
  records.push(rec);
  saveRecords(records);
  addLog({action:'checkin', username: session.username, by: session.username, date: dateStr});
  showAlert('Absen masuk berhasil','success');
  renderMainCard();
  renderHistory();
  renderStats();
  renderRanking();
}

function performCheckOut() {
  const session = getSession();
  const now = new Date();
  const dateStr = toDateString(now);
  const records = getRecords();
  const rec = records.find(x => x.username === session.username && x.date === dateStr);
  if (!rec) {
    showAlert('Anda belum absen masuk hari ini.','warning');
    return;
  }
  if (rec.checkoutTime) {
    showAlert('Anda sudah absen keluar hari ini.','info');
    return;
  }
  rec.checkoutTime = now.toISOString();
  rec.checkoutDisplay = fmtTime(now);
  saveRecords(records);
  addLog({action:'checkout', username: session.username, by: session.username, date: dateStr});
  showAlert('Absen keluar berhasil','success');
  renderMainCard();
  renderHistory();
  renderStats();
  renderRanking();
}

function showAlert(msg, type='info') {
  const el = document.getElementById('alert-placeholder');
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(()=> el.innerHTML = '', 3000);
}

function renderHistory() {
  const session = getSession();
  const recs = getRecords().filter(r => r.username === session.username)
    .sort((a,b)=> b.date.localeCompare(a.date))
    .slice(0,10);

  const container = document.getElementById('historyArea');
  if (recs.length === 0) {
    container.innerHTML = '<div class="small text-muted">Belum ada riwayat.</div>';
    return;
  }
  let html = `<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr>
      <th>Tanggal</th><th>Masuk</th><th>Keluar</th><th>Status</th></tr></thead><tbody>`;
  recs.forEach(r => {
    html += `<tr><td>${r.date}</td><td>${r.checkinDisplay||'-'}</td><td>${r.checkoutDisplay||'-'}</td><td>${r.status}${r.lateMinutes>0?` (Terlambat ${r.lateMinutes}m)`:''}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderStats() {
  const session = getSession();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const recs = getRecords().filter(r => {
    const d = new Date(r.date);
    return r.username === session.username && d.getMonth() === month && d.getFullYear() === year;
  });

  const totalDays = recs.length; // days with any action
  const hadir = recs.filter(r => r.status==='Hadir').length;
  const izin = recs.filter(r => r.status==='Izin').length;
  const sakit = recs.filter(r => r.status==='Sakit').length;
  const cuti = recs.filter(r => r.status==='Cuti').length;
  const telat = recs.filter(r => r.lateMinutes>0).length;

  const area = document.getElementById('statsArea');
  area.innerHTML = `
    <div class="row text-center">
      <div class="col-6 mb-2"><div class="h4">${hadir}</div><div class="small text-muted">Hadir</div></div>
      <div class="col-6 mb-2"><div class="h4">${telat}</div><div class="small text-muted">Terlambat</div></div>
      <div class="col-6 mb-2"><div class="h4">${izin}</div><div class="small text-muted">Izin</div></div>
      <div class="col-6 mb-2"><div class="h4">${sakit + cuti}</div><div class="small text-muted">Sakit/Cuti</div></div>
    </div>
  `;
}

function renderRanking() {
  // Simple ranking calculation for top 5: fewer Alfa (not tracked client-side automatically),
  // We'll base on attendance rate and tardiness: higher hadir & lower telat ranks higher.
  const users = JSON.parse(localStorage.getItem('absensi_users_v1'));
  const records = getRecords();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const scores = users.map(u => {
    const recs = records.filter(r => r.username === u.username && new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year);
    const hadir = recs.filter(r => r.status === 'Hadir').length;
    const telat = recs.filter(r => r.lateMinutes>0).length;
    const score = (hadir*10) - (telat*2) + recs.length;
    return {username: u.username, name: u.name, score, hadir, telat};
  });

  scores.sort((a,b)=> b.score - a.score);
  const top5 = scores.slice(0,5);
  const ol = document.getElementById('rankingArea');
  ol.innerHTML = '';
  top5.forEach(s => {
    const li = document.createElement('li');
    li.innerText = `${s.name} — Hadir:${s.hadir} Terlambat:${s.telat}`;
    ol.appendChild(li);
  });
}
