const API_BASE = window.location.origin;

let authToken = localStorage.getItem('hackTrack_token') || null;
let currentAdmin = JSON.parse(localStorage.getItem('hackTrack_admin') || 'null');
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
const togglePassword = document.getElementById('togglePassword');
const loginError = document.getElementById('loginError');
const addEventForm = document.getElementById('addEventForm');
const eventNameInput = document.getElementById('eventNameInput');
const eventDeptInput = document.getElementById('eventDeptInput');
const eventLinkInput = document.getElementById('eventLinkInput');
const adminEventTableBody = document.getElementById('adminEventTableBody');
const adminEmptyMessage = document.getElementById('adminEmptyMessage');
const adminNameSpan = document.getElementById('adminName');

const deptNames = {
  CSE: 'Computer Science', IT: 'Information Tech', ECE: 'Electronics',
  EEE: 'Electrical', MECH: 'Mechanical', CIVIL: 'Civil', AI: 'AI & Data Science'
};

// ---------------- Utilities ----------------
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

// ---------------- Role switching ----------------
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

// ---------------- STUDENT VIEW ----------------
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

  studentEventGrid.innerHTML = filtered.map(ev => {
    const modeIcon = ev.mode === 'Online' ? 'globe' : ev.mode === 'Offline' ? 'map-marker-alt' : 'wifi';
    const modeLabel = ev.mode || 'N/A';
    const prizeBadge = ev.prize ? `<div class="event-prize">🏆 ${escapeHtml(ev.prize)}</div>` : '';
    const description = ev.description ? `<div class="event-description">${escapeHtml(ev.description)}</div>` : '';

    const chips = [
      ev.mode ? `<span class="info-chip"><i class="fas fa-${modeIcon}"></i> ${escapeHtml(modeLabel)}</span>` : '',
      ev.event_date ? `<span class="info-chip"><i class="fas fa-calendar"></i> ${escapeHtml(ev.event_date)}</span>` : '',
      ev.registration_deadline ? `<span class="info-chip"><i class="fas fa-hourglass-end"></i> ${escapeHtml(ev.registration_deadline)}</span>` : '',
      ev.team_size ? `<span class="info-chip"><i class="fas fa-users"></i> ${escapeHtml(ev.team_size)}</span>` : '',
      ev.venue ? `<span class="info-chip"><i class="fas fa-map-pin"></i> ${escapeHtml(ev.venue)}</span>` : '',
      ev.organizer ? `<span class="info-chip"><i class="fas fa-building"></i> ${escapeHtml(ev.organizer)}</span>` : '',
    ].filter(Boolean).join('');

    return `
      <div class="event-card">
        <span class="event-badge"><i class="fas fa-${getDeptIcon(ev.department)}"></i> ${escapeHtml(ev.department)} · ${deptNames[ev.department]||ev.department}</span>
        <div class="event-name">${escapeHtml(ev.name)}</div>
        ${prizeBadge}
        ${description}
        ${chips ? `<div class="event-extra-info">${chips}</div>` : ''}
        <a href="${escapeHtml(ev.link)}" target="_blank" rel="noopener noreferrer" class="event-link-btn">
          <i class="fas fa-external-link-alt"></i> Register Now
        </a>
      </div>
    `;
  }).join('');
}

deptFilter.addEventListener('change', loadStudentEvents);

// ---------------- LOGIN ----------------
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
    localStorage.setItem('hackTrack_token', authToken);
    localStorage.setItem('hackTrack_admin', JSON.stringify(currentAdmin));
    loginForm.reset();
    showAdminPanel();
    showToast(`Welcome, ${currentAdmin.name}!`, 'success');
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  }
});

// ---------------- ADMIN ----------------
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
      <td>${escapeHtml(ev.mode || '—')}</td>
      <td>${ev.prize ? `<strong style="color:#92400e;">${escapeHtml(ev.prize)}</strong>` : '—'}</td>
      <td>${escapeHtml(ev.event_date || '—')}</td>
      <td>${escapeHtml(ev.registration_deadline || '—')}</td>
      <td><a href="${escapeHtml(ev.link)}" target="_blank" class="link-preview"><i class="fas fa-external-link-alt"></i> Link</a></td>
      <td><button class="delete-btn" data-id="${ev.id}"><i class="fas fa-trash-alt"></i></button></td>
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

// ---------------- ADD EVENT FORM ----------------
addEventForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: eventNameInput.value.trim(),
    department: eventDeptInput.value,
    mode: document.getElementById('eventModeInput').value,
    link: eventLinkInput.value.trim(),
    prize: document.getElementById('eventPrizeInput').value.trim() || null,
    event_date: document.getElementById('eventDateInput').value.trim() || null,
    registration_deadline: document.getElementById('eventDeadlineInput').value.trim() || null,
    team_size: document.getElementById('eventTeamInput').value.trim() || null,
    venue: document.getElementById('eventVenueInput').value.trim() || null,
    organizer: document.getElementById('eventOrganizerInput').value.trim() || null,
    description: document.getElementById('eventDescInput').value.trim() || null,
  };
  if (!payload.name || !payload.department || !payload.link) {
    showToast('Name, department, and link are required', 'error');
    return;
  }
  if (!payload.link.startsWith('http://') && !payload.link.startsWith('https://')) {
    showToast('Link must start with http:// or https://', 'error');
    return;
  }
  try {
    await apiFetch('/api/admin/events', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    addEventForm.reset();
    showToast('Event added!', 'success');
    loadAdminEvents();
  } catch (err) { showToast(err.message, 'error'); }
});

// ---------------- LOGOUT ----------------
logoutBtn.addEventListener('click', () => {
  authToken = null;
  currentAdmin = null;
  localStorage.removeItem('hackTrack_token');
  localStorage.removeItem('hackTrack_admin');
  logoutBtn.classList.add('hidden');
  setActiveRole('student');
  showToast('Logged out', 'success');
});

// ---------------- PASSWORD TOGGLE ----------------
if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    const isHidden = loginPassword.type === 'password';
    loginPassword.type = isHidden ? 'text' : 'password';
    const icon = togglePassword.querySelector('i');
    if (isHidden) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
}

// ---------------- INIT ----------------
setActiveRole('student');
