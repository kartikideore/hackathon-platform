const API_BASE = window.location.origin;

let authToken = localStorage.getItem('hackhub_token') || null;
let currentAdmin = JSON.parse(localStorage.getItem('hackhub_admin') || 'null');
let events = [];

const studentSection = document.getElementById('studentSection');
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const studentViewBtn = document.getElementById('studentViewBtn');
const adminViewBtn = document.getElementById('adminViewBtn');
const logoutBtn = document.getElementById('logoutBtn');
const deptFilter = document.getElementById('deptFilter');
const studentEventGrid = document.getElementById('studentEventGrid');
const studentEmptyMessage = document.getElementById('studentEmptyMessage');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const addEventForm = document.getElementById('addEventForm');
const eventNameInput = document.getElementById('eventNameInput');
const eventDeptInput = document.getElementById('eventDeptInput');
const eventLinkInput = document.getElementById('eventLinkInput');
const adminEventTableBody = document.getElementById('adminEventTableBody');
const adminEmptyMessage = document.getElementById('adminEmptyMessage');
const adminNameSpan = document.getElementById('adminName');

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function showToast(msg, type='success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function getDeptIcon(dept) {
  const icons = { CSE:'laptop-code', IT:'network-wired', ECE:'microchip', EEE:'bolt', MECH:'cogs', CIVIL:'building', AI:'brain' };
  return icons[dept] || 'calendar';
}

function authHeaders() {
  return { 'Content-Type':'application/json', 'Authorization':`Bearer ${authToken}` };
}

async function apiFetch(path, options={}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || `Request failed (${res.status})`);
  return data;
}

function setActiveRole(role) {
  studentViewBtn.classList.remove('active');
  adminViewBtn.classList.remove('active');
  studentSection.classList.add('hidden');
  loginSection.classList.add('hidden');
  adminSection.classList.add('hidden');

  if (role === 'student') {
    studentViewBtn.classList.add('active');
    studentSection.classList.remove('hidden');
    loadStudentEvents();
  } else if (role === 'admin') {
    adminViewBtn.classList.add('active');
    if (authToken && currentAdmin) showAdminPanel();
    else loginSection.classList.remove('hidden');
  }
}

studentViewBtn.addEventListener('click', () => setActiveRole('student'));
adminViewBtn.addEventListener('click', () => setActiveRole('admin'));

async function loadStudentEvents() {
  const dept = deptFilter.value;
  try {
    const query = dept && dept !== 'all' ? `?department=${encodeURIComponent(dept)}` : '';
    events = await apiFetch(`/api/events${query}`);
    renderStudentEvents();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderStudentEvents() {
  const dept = deptFilter.value;
  let filtered = events;
  if (dept !== 'all') filtered = events.filter(e => e.department === dept);

  if (filtered.length === 0) {
    studentEventGrid.innerHTML = '';
    studentEmptyMessage.classList.remove('hidden');
    return;
  }
  studentEmptyMessage.classList.add('hidden');

  const deptNames = { CSE:'Computer Science', IT:'Information Tech', ECE:'Electronics', EEE:'Electrical', MECH:'Mechanical', CIVIL:'Civil', AI:'AI & Data Science' };

  studentEventGrid.innerHTML = filtered.map(ev => `
    <div class="event-card">
      <span class="event-badge"><i class="fas fa-${getDeptIcon(ev.department)}"></i> ${escapeHtml(ev.department)} · ${deptNames[ev.department]||ev.department}</span>
      <div class="event-name">${escapeHtml(ev.name)}</div>
      <div class="event-meta"><i class="fas fa-link"></i> <span>${escapeHtml(ev.link.substring(0,40))}${ev.link.length>40?'…':''}</span></div>
      <a href="${escapeHtml(ev.link)}" target="_blank" rel="noopener noreferrer" class="event-link-btn"><i class="fas fa-external-link-alt"></i> Go to event</a>
    </div>
  `).join('');
}

deptFilter.addEventListener('change', loadStudentEvents);

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  try {
    const data = await apiFetch('/api/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: loginEmail.value.trim(), password: loginPassword.value })
    });
    authToken = data.token;
    currentAdmin = data.admin;
    localStorage.setItem('hackhub_token', authToken);
    localStorage.setItem('hackhub_admin', JSON.stringify(currentAdmin));
    loginForm.reset();
    showAdminPanel();
    showToast(`Welcome, ${currentAdmin.name}!`, 'success');
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  }
});

function showAdminPanel() {
  adminSection.classList.remove('hidden');
  loginSection.classList.add('hidden');
  studentSection.classList.add('hidden');
  adminNameSpan.textContent = currentAdmin?.name || 'Admin';
  logoutBtn.classList.remove('hidden');
  loadAdminEvents();
}

async function loadAdminEvents() {
  try {
    events = await apiFetch('/api/events');
    renderAdminEvents();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderAdminEvents() {
  if (events.length === 0) {
    adminEventTableBody.innerHTML = '';
    adminEmptyMessage.classList.remove('hidden');
    return;
  }
  adminEmptyMessage.classList.add('hidden');

  const sorted = [...events].sort((a, b) => {
    if (a.department < b.department) return -1;
    if (a.department > b.department) return 1;
    return a.name.localeCompare(b.name);
  });

  adminEventTableBody.innerHTML = sorted.map(ev => `
    <tr>
      <td style="font-weight:500;">${escapeHtml(ev.name)}</td>
      <td><span style="background:#e7f0ff;padding:5px 10px;border-radius:40px;font-size:.8rem;font-weight:600;">${escapeHtml(ev.department)}</span></td>
      <td><a href="${escapeHtml(ev.link)}" target="_blank" class="link-preview"><i class="fas fa-external-link-alt"></i> ${escapeHtml(ev.link.length > 35 ? ev.link.substring(0, 35) + '…' : ev.link)}</a></td>
      <td><button class="delete-btn" data-id="${ev.id}" title="Delete event"><i class="fas fa-trash-alt"></i></button></td>
    </tr>
  `).join('');

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Delete this event?')) return;
      try {
        await apiFetch(`/api/admin/events/${id}`, { method:'DELETE', headers: authHeaders() });
        showToast('Event deleted', 'success');
        loadAdminEvents();
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

addEventForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: eventNameInput.value.trim(),
    department: eventDeptInput.value,
    link: eventLinkInput.value.trim()
  };
  if (!payload.name || !payload.department || !payload.link) {
    showToast('All fields are required', 'error'); return;
  }
  if (!payload.link.startsWith('http://') && !payload.link.startsWith('https://')) {
    showToast('URL must start with http:// or https://', 'error'); return;
  }
  try {
    await apiFetch('/api/admin/events', {
      method:'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    addEventForm.reset();
    showToast('Event added!', 'success');
    loadAdminEvents();
  } catch (err) { showToast(err.message, 'error'); }
});

logoutBtn.addEventListener('click', () => {
  authToken = null;
  currentAdmin = null;
  localStorage.removeItem('hackhub_token');
  localStorage.removeItem('hackhub_admin');
  logoutBtn.classList.add('hidden');
  setActiveRole('student');
  showToast('Logged out', 'success');
});

setActiveRole('student');