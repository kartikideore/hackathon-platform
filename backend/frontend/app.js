const API_BASE = window.location.origin;

let authToken = localStorage.getItem('hackTrack_token') || null;
let currentAdmin = JSON.parse(localStorage.getItem('hackTrack_admin') || 'null');
let events = [];
let approvedProjects = [];

// ---------------- DOM: Main sections ----------------
const studentSection = document.getElementById('studentSection');
const projectsSection = document.getElementById('projectsSection');
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');

// ---------------- DOM: Buttons ----------------
const studentViewBtn = document.getElementById('studentViewBtn');
const projectsViewBtn = document.getElementById('projectsViewBtn');
const adminViewBtn = document.getElementById('adminViewBtn');
const logoutBtn = document.getElementById('logoutBtn');

// ---------------- DOM: Student events ----------------
const deptFilter = document.getElementById('deptFilter');
const studentEventGrid = document.getElementById('studentEventGrid');
const studentEmptyMessage = document.getElementById('studentEmptyMessage');

// ---------------- DOM: Login ----------------
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const togglePassword = document.getElementById('togglePassword');
const loginError = document.getElementById('loginError');

// ---------------- DOM: Admin events ----------------
const addEventForm = document.getElementById('addEventForm');
const eventNameInput = document.getElementById('eventNameInput');
const eventDeptInput = document.getElementById('eventDeptInput');
const eventLinkInput = document.getElementById('eventLinkInput');
const adminEventTableBody = document.getElementById('adminEventTableBody');
const adminEmptyMessage = document.getElementById('adminEmptyMessage');
const adminNameSpan = document.getElementById('adminName');

// ---------------- DOM: Projects ----------------
const projectDeptFilter = document.getElementById('projectDeptFilter');
const projectsGrid = document.getElementById('projectsGrid');
const projectsEmptyMessage = document.getElementById('projectsEmptyMessage');
const openPostProjectBtn = document.getElementById('openPostProjectBtn');

// ---------------- DOM: Post Project Modal ----------------
const postProjectModal = document.getElementById('postProjectModal');
const closePostModal = document.getElementById('closePostModal');
const postProjectForm = document.getElementById('postProjectForm');

// ---------------- DOM: Request Modal ----------------
const requestModal = document.getElementById('requestModal');
const closeRequestModal = document.getElementById('closeRequestModal');
const requestForm = document.getElementById('requestForm');
const reqProjectId = document.getElementById('reqProjectId');

// ---------------- DOM: Admin lists ----------------
const pendingProjectsList = document.getElementById('pendingProjectsList');
const noPendingProjects = document.getElementById('noPendingProjects');
const adminRequestsList = document.getElementById('adminRequestsList');
const noAdminRequests = document.getElementById('noAdminRequests');

const deptNames = {
  CSE: 'Computer Science', IT: 'Information Tech', ECE: 'Electronics',
  EEE: 'Electrical', MECH: 'Mechanical', CIVIL: 'Civil', AI: 'AI & Data Science'
};

// ============================================================
// UTILITIES
// ============================================================
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

// ============================================================
// ROLE SWITCHING
// ============================================================
function setActiveRole(role) {
  studentViewBtn.classList.remove('active');
  projectsViewBtn.classList.remove('active');
  adminViewBtn.classList.remove('active');
  studentSection.classList.add('hidden');
  projectsSection.classList.add('hidden');
  loginSection.classList.add('hidden');
  adminSection.classList.add('hidden');

  if (role === 'student') {
    studentViewBtn.classList.add('active');
    studentSection.classList.remove('hidden');
    loadStudentEvents();
  } else if (role === 'projects') {
    projectsViewBtn.classList.add('active');
    projectsSection.classList.remove('hidden');
    loadApprovedProjects();
  } else if (role === 'admin') {
    adminViewBtn.classList.add('active');
    if (authToken && currentAdmin) showAdminPanel();
    else loginSection.classList.remove('hidden');
  }
}

studentViewBtn.addEventListener('click', () => setActiveRole('student'));
projectsViewBtn.addEventListener('click', () => setActiveRole('projects'));
adminViewBtn.addEventListener('click', () => setActiveRole('admin'));

// ============================================================
// STUDENT EVENTS VIEW
// ============================================================
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
    const prizeBadge = ev.prize ? `<div class="event-prize">🏆 ${escapeHtml(ev.prize)}</div>` : '';
    const description = ev.description ? `<div class="event-description">${escapeHtml(ev.description)}</div>` : '';

    const chips = [
      ev.mode ? `<span class="info-chip"><i class="fas fa-${modeIcon}"></i> ${escapeHtml(ev.mode)}</span>` : '',
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

// ============================================================
// LOGIN
// ============================================================
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

// ============================================================
// ADMIN PANEL
// ============================================================
function showAdminPanel() {
  adminSection.classList.remove('hidden');
  loginSection.classList.add('hidden');
  studentSection.classList.add('hidden');
  projectsSection.classList.add('hidden');
  adminNameSpan.textContent = currentAdmin?.name || 'Admin';
  logoutBtn.classList.remove('hidden');
  loadAdminEvents();
  loadAdminProjects();
  loadAdminRequests();
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

// ============================================================
// ADD EVENT FORM
// ============================================================
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

// ============================================================
// PROJECTS VIEW (Public — browse approved projects)
// ============================================================
async function loadApprovedProjects() {
  const dept = projectDeptFilter.value;
  try {
    const query = dept !== 'all' ? `?department=${encodeURIComponent(dept)}` : '';
    approvedProjects = await apiFetch(`/api/projects${query}`);
    renderProjects();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderProjects() {
  if (approvedProjects.length === 0) {
    projectsGrid.innerHTML = '';
    projectsEmptyMessage.classList.remove('hidden');
    return;
  }
  projectsEmptyMessage.classList.add('hidden');

  projectsGrid.innerHTML = approvedProjects.map(p => {
    const roles = (p.roles_needed || '').split(',').map(r => r.trim()).filter(Boolean);
    return `
      <div class="project-card">
        <span class="event-badge"><i class="fas fa-${getDeptIcon(p.department)}"></i> ${escapeHtml(p.department)} · ${deptNames[p.department]||p.department}</span>
        <div class="project-title">${escapeHtml(p.title)}</div>
        <div class="project-owner">
          <i class="fas fa-user"></i> ${escapeHtml(p.owner_name)}
          ${p.team_name ? ` · <i class="fas fa-users"></i> ${escapeHtml(p.team_name)}` : ''}
        </div>

        <div class="progress-bar"><div class="progress-fill" style="width:${p.progress || 0}%"></div></div>
        <div style="font-size:0.75rem;color:#64748b;text-align:right;">${p.progress || 0}% complete</div>

        ${p.tech_stack ? `<div class="project-section-label">Tech Stack</div><div class="project-text">${escapeHtml(p.tech_stack)}</div>` : ''}
        ${p.what_done ? `<div class="project-section-label">✅ Done</div><div class="project-text">${escapeHtml(p.what_done)}</div>` : ''}
        ${p.what_left ? `<div class="project-section-label">⏳ Left</div><div class="project-text">${escapeHtml(p.what_left)}</div>` : ''}
        ${roles.length ? `<div class="project-section-label">Roles Needed</div><div class="project-roles">${roles.map(r => `<span class="role-tag">${escapeHtml(r)}</span>`).join('')}</div>` : ''}

        <div class="project-actions">
          <a href="${escapeHtml(p.github_link)}" target="_blank" class="btn-secondary">
            <i class="fab fa-github"></i> GitHub
          </a>
          <button class="btn-primary" onclick="openRequestModal(${p.id}, '${escapeHtml(p.title).replace(/'/g, "\\'")}')">
            <i class="fas fa-hand-paper"></i> Request to Join
          </button>
        </div>
      </div>
    `;
  }).join('');
}

projectDeptFilter.addEventListener('change', loadApprovedProjects);

// ============================================================
// POST PROJECT MODAL
// ============================================================
openPostProjectBtn.addEventListener('click', () => {
  postProjectModal.classList.remove('hidden');
});

closePostModal.addEventListener('click', () => {
  postProjectModal.classList.add('hidden');
});

postProjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('projTitle').value.trim(),
    owner_name: document.getElementById('projOwnerName').value.trim(),
    owner_email: document.getElementById('projOwnerEmail').value.trim(),
    team_name: document.getElementById('projTeamName').value.trim() || null,
    department: document.getElementById('projDept').value,
    github_link: document.getElementById('projGithub').value.trim(),
    tech_stack: document.getElementById('projTech').value.trim() || null,
    what_done: document.getElementById('projDone').value.trim() || null,
    what_left: document.getElementById('projLeft').value.trim() || null,
    roles_needed: document.getElementById('projRoles').value.trim() || null,
    progress: parseInt(document.getElementById('projProgress').value) || 0,
  };

  if (!payload.github_link.startsWith('http://') && !payload.github_link.startsWith('https://')) {
    showToast('GitHub link must start with http:// or https://', 'error');
    return;
  }

  try {
    await apiFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    postProjectForm.reset();
    postProjectModal.classList.add('hidden');
    showToast('Project submitted! Admin will review it soon.', 'success');
  } catch (err) { showToast(err.message, 'error'); }
});

// ============================================================
// REQUEST TO JOIN MODAL
// ============================================================
window.openRequestModal = function(projectId, title) {
  reqProjectId.value = projectId;
  document.getElementById('reqMessage').placeholder = `Why do you want to join "${title}"? What will you contribute?`;
  requestModal.classList.remove('hidden');
};

closeRequestModal.addEventListener('click', () => {
  requestModal.classList.add('hidden');
});

requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    project_id: parseInt(reqProjectId.value),
    requester_name: document.getElementById('reqName').value.trim(),
    requester_email: document.getElementById('reqEmail').value.trim(),
    message: document.getElementById('reqMessage').value.trim(),
  };
  try {
    await apiFetch('/api/project-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    requestForm.reset();
    requestModal.classList.add('hidden');
    showToast('Request sent! Owner will be notified.', 'success');
  } catch (err) { showToast(err.message, 'error'); }
});

// ============================================================
// ADMIN — PENDING PROJECTS
// ============================================================
async function loadAdminProjects() {
  try {
    const projects = await apiFetch('/api/admin/projects', { headers: authHeaders() });
    const pending = projects.filter(p => p.status === 'pending');

    if (pending.length === 0) {
      pendingProjectsList.innerHTML = '';
      noPendingProjects.classList.remove('hidden');
    } else {
      noPendingProjects.classList.add('hidden');
      pendingProjectsList.innerHTML = pending.map(p => `
        <div class="admin-item">
          <div class="admin-item-info">
            <div class="admin-item-title">${escapeHtml(p.title)}</div>
            <div class="admin-item-meta">
              <i class="fas fa-user"></i> ${escapeHtml(p.owner_name)} ·
              ${escapeHtml(p.department)} ·
              <a href="${escapeHtml(p.github_link)}" target="_blank">GitHub</a> ·
              Progress: ${p.progress || 0}%
            </div>
          </div>
          <div class="admin-item-actions">
            <button class="btn-success" data-approve="${p.id}"><i class="fas fa-check"></i> Approve</button>
            <button class="btn-danger" data-reject="${p.id}"><i class="fas fa-times"></i> Reject</button>
          </div>
        </div>
      `).join('');

      pendingProjectsList.querySelectorAll('[data-approve]').forEach(btn => {
        btn.addEventListener('click', () => approveProject(btn.dataset.approve));
      });
      pendingProjectsList.querySelectorAll('[data-reject]').forEach(btn => {
        btn.addEventListener('click', () => rejectProject(btn.dataset.reject));
      });
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function approveProject(id) {
  try {
    await apiFetch(`/api/admin/projects/${id}/approve`, {
      method: 'PUT', headers: authHeaders()
    });
    showToast('Project approved!', 'success');
    loadAdminProjects();
  } catch (err) { showToast(err.message, 'error'); }
}

async function rejectProject(id) {
  try {
    await apiFetch(`/api/admin/projects/${id}/reject`, {
      method: 'PUT', headers: authHeaders()
    });
    showToast('Project rejected', 'success');
    loadAdminProjects();
  } catch (err) { showToast(err.message, 'error'); }
}

// ============================================================
// ADMIN — JOIN REQUESTS
// ============================================================
async function loadAdminRequests() {
  try {
    const requests = await apiFetch('/api/admin/project-requests', { headers: authHeaders() });

    if (requests.length === 0) {
      adminRequestsList.innerHTML = '';
      noAdminRequests.classList.remove('hidden');
    } else {
      noAdminRequests.classList.add('hidden');
      adminRequestsList.innerHTML = requests.map(r => `
        <div class="admin-item">
          <div class="admin-item-info">
            <div class="admin-item-title">
              ${escapeHtml(r.requester_name)} wants to join project #${r.project_id}
            </div>
            <div class="admin-item-meta">
              <i class="fas fa-envelope"></i> ${escapeHtml(r.requester_email)} ·
              Status: <strong>${escapeHtml(r.status)}</strong>
            </div>
            ${r.message ? `<div class="project-text" style="margin-top:6px;">"${escapeHtml(r.message)}"</div>` : ''}
          </div>
          ${r.status === 'pending' ? `
            <div class="admin-item-actions">
              <button class="btn-success" data-approve-req="${r.id}"><i class="fas fa-check"></i> Approve</button>
              <button class="btn-danger" data-reject-req="${r.id}"><i class="fas fa-times"></i> Reject</button>
            </div>
          ` : `<span style="background:#e2ebf5;padding:6px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;">${escapeHtml(r.status)}</span>`}
        </div>
      `).join('');

      adminRequestsList.querySelectorAll('[data-approve-req]').forEach(btn => {
        btn.addEventListener('click', () => approveRequest(btn.dataset.approveReq));
      });
      adminRequestsList.querySelectorAll('[data-reject-req]').forEach(btn => {
        btn.addEventListener('click', () => rejectRequest(btn.dataset.rejectReq));
      });
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function approveRequest(id) {
  try {
    await apiFetch(`/api/admin/project-requests/${id}/approve`, {
      method: 'PUT', headers: authHeaders()
    });
    showToast('Request approved', 'success');
    loadAdminRequests();
  } catch (err) { showToast(err.message, 'error'); }
}

async function rejectRequest(id) {
  try {
    await apiFetch(`/api/admin/project-requests/${id}/reject`, {
      method: 'PUT', headers: authHeaders()
    });
    showToast('Request rejected', 'success');
    loadAdminRequests();
  } catch (err) { showToast(err.message, 'error'); }
}

// ============================================================
// LOGOUT
// ============================================================
logoutBtn.addEventListener('click', () => {
  authToken = null;
  currentAdmin = null;
  localStorage.removeItem('hackTrack_token');
  localStorage.removeItem('hackTrack_admin');
  logoutBtn.classList.add('hidden');
  setActiveRole('student');
  showToast('Logged out', 'success');
});

// ============================================================
// PASSWORD SHOW / HIDE TOGGLE
// ============================================================
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

// ============================================================
// INIT
// ============================================================
setActiveRole('student');
