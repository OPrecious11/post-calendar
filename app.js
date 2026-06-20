// ── STATE ──
let posts = JSON.parse(localStorage.getItem('postcal-posts')) || {};
let selectedDay      = null;
let editingPostIndex = null;
let currentDate      = new Date();
let currentMonth     = currentDate.getMonth();
let currentYear      = currentDate.getFullYear();
let selectedPlatform = null;
let selectedStatus   = null;

// ── DOM REFS ──
const calendarGrid   = document.getElementById('calendarGrid');
const panelEmpty     = document.getElementById('panelEmpty');
const panelPosts     = document.getElementById('panelPosts');
const panelForm      = document.getElementById('panelForm');
const panelDayLabel  = document.getElementById('panelDayLabel');
const panelFormLabel = document.getElementById('panelFormLabel');
const postsList      = document.getElementById('postsList');
const postTopic      = document.getElementById('postTopic');
const postCaption    = document.getElementById('postCaption');
const postTime       = document.getElementById('postTime');
const saveBtn        = document.getElementById('savePost');
const closeBtn       = document.getElementById('closePanel');
const backToListBtn  = document.getElementById('backToList');
const addNewPostBtn  = document.getElementById('addNewPost');
const scheduledCount = document.getElementById('scheduledCount');
const progressFill   = document.getElementById('progressFill');
const monthLabel     = document.getElementById('monthLabel');
const prevMonthBtn   = document.getElementById('prevMonth');
const nextMonthBtn   = document.getElementById('nextMonth');
const notifyBtn      = document.getElementById('enableNotifications');
const platformTags   = document.getElementById('platformTags');
const panelOverlay   = document.getElementById('panelOverlay');
const detailPanel    = document.getElementById('detailPanel');
const exportBtn      = document.getElementById('exportBtn');
const exportDropdown = document.getElementById('exportDropdown');
const exportCSVBtn   = document.getElementById('exportCSV');
const exportPDFBtn   = document.getElementById('exportPDF');

// ── HELPERS ──
const MONTHS = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
];

const platformIcons = {
  instagram: '📸',
  twitter:   '🐦',
  linkedin:  '💼',
  tiktok:    '🎵'
};

const platformLabels = {
  instagram: 'Instagram',
  twitter:   'Twitter',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok'
};

const statusLabels = {
  draft:  '✏️ Draft',
  ready:  '✅ Ready',
  posted: '🚀 Posted'
};

function storageKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getMonthPosts() {
  const key = storageKey(currentYear, currentMonth);
  return posts[key] || {};
}

function saveMonthPosts(monthPosts) {
  const key = storageKey(currentYear, currentMonth);
  if (Object.keys(monthPosts).length === 0) {
    delete posts[key];
  } else {
    posts[key] = monthPosts;
  }
  localStorage.setItem('postcal-posts', JSON.stringify(posts));
}

// ── BUILD CALENDAR ──
function buildCalendar() {
  calendarGrid.innerHTML = '';

  const monthPosts  = getMonthPosts();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay    = getFirstDayOfMonth(currentYear, currentMonth);

  monthLabel.textContent = `${MONTHS[currentMonth]} ${currentYear}`;

  // empty cells before day 1
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('day-cell', 'day-empty');
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.classList.add('day-cell');
    cell.dataset.day = day;

    const isToday =
      day === currentDate.getDate() &&
      currentMonth === currentDate.getMonth() &&
      currentYear === currentDate.getFullYear();

    const dayPosts   = monthPosts[day] || [];
    const isScheduled = dayPosts.length > 0;
    const isSelected  = selectedDay === day;

    if (isScheduled) cell.classList.add('scheduled');
    if (isSelected)  cell.classList.add('active');
    if (isToday)     cell.classList.add('today');

    // show first post's platform icon and status dot
    const firstPost = dayPosts[0];
    const icon      = firstPost?.platform ? platformIcons[firstPost.platform] : '';
    const status    = firstPost?.status || '';

    // show count badge if multiple posts
    const countBadge = dayPosts.length > 1
      ? `<span class="day-count">${dayPosts.length}</span>`
      : '';

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-dot"></span>
      ${icon ? `<span class="day-platform">${icon}</span>` : ''}
      ${status ? `<span class="day-status ${status}"></span>` : ''}
      ${countBadge}
    `;

    cell.addEventListener('click', () => selectDay(day));
    calendarGrid.appendChild(cell);
  }

  updateProgress();
  updateStreak();
}

// ── SELECT DAY ──
function selectDay(day) {
  selectedDay = day;
  const monthPosts = getMonthPosts();
  const dayPosts   = monthPosts[day] || [];

  panelDayLabel.textContent = `${MONTHS[currentMonth]} ${day}`;

  if (dayPosts.length > 0) {
    showPostsList(dayPosts);
  } else {
    openForm(null);
  }

  openPanel();
  buildCalendar();
}

// ── SHOW POSTS LIST ──
function showPostsList(dayPosts) {
  panelEmpty.style.display  = 'none';
  panelPosts.style.display  = 'flex';
  panelForm.style.display   = 'none';

  postsList.innerHTML = '';

  dayPosts.forEach((post, index) => {
    const card = document.createElement('div');
    card.classList.add('post-card');

    card.innerHTML = `
      <div class="post-card-top">
        <span class="post-card-topic">${post.topic}</span>
        <div class="post-card-actions">
          <button class="btn-edit" data-index="${index}">✏️ Edit</button>
          <button class="btn-delete" data-index="${index}">🗑</button>
        </div>
      </div>
      <div class="post-card-meta">
        ${post.platform ? `<span class="post-card-platform ${post.platform}">${platformIcons[post.platform]} ${platformLabels[post.platform]}</span>` : ''}
        ${post.status   ? `<span class="post-card-status ${post.status}">${statusLabels[post.status]}</span>` : ''}
        ${post.time     ? `<span class="post-card-time">🕐 ${post.time}</span>` : ''}
      </div>
    `;

    // edit button
    card.querySelector('.btn-edit').addEventListener('click', () => {
      openForm(index);
    });

    // delete button
    card.querySelector('.btn-delete').addEventListener('click', () => {
      deletePost(index);
    });

    postsList.appendChild(card);
  });
}

// ── OPEN FORM ──
function openForm(editIndex) {
  editingPostIndex = editIndex;

  panelEmpty.style.display = 'none';
  panelPosts.style.display = 'none';
  panelForm.style.display  = 'block';

  if (editIndex !== null) {
    // editing existing post
    const monthPosts = getMonthPosts();
    const post       = (monthPosts[selectedDay] || [])[editIndex];

    panelFormLabel.textContent = 'Edit Post';
    postTopic.value            = post.topic   || '';
    postCaption.value          = post.caption || '';
    postTime.value             = post.time    || '09:00';
    selectedPlatform           = post.platform || null;
    selectedStatus             = post.status   || null;
  } else {
    // new post
    panelFormLabel.textContent = 'New Post';
    postTopic.value            = '';
    postCaption.value          = '';
    postTime.value             = '09:00';
    selectedPlatform           = null;
    selectedStatus             = null;
  }

  updatePlatformUI();
  updateStatusUI();
}

// ── SAVE POST ──
saveBtn.addEventListener('click', () => {
  if (selectedDay === null) return;

  const topic   = postTopic.value.trim();
  const caption = postCaption.value.trim();
  const time    = postTime.value;

  if (!topic) {
    showToast('⚠️ Add a post topic first');
    return;
  }

  const monthPosts = getMonthPosts();
  if (!monthPosts[selectedDay]) monthPosts[selectedDay] = [];

  const postData = { topic, caption, time, platform: selectedPlatform, status: selectedStatus };

  if (editingPostIndex !== null) {
    monthPosts[selectedDay][editingPostIndex] = postData;
    showToast('✅ Post updated!');
  } else {
    monthPosts[selectedDay].push(postData);
    showToast(`✅ ${MONTHS[currentMonth]} ${selectedDay} scheduled!`);
  }

  saveMonthPosts(monthPosts);
  buildCalendar();
  showPostsList(monthPosts[selectedDay]);
});

// ── DELETE POST ──
function deletePost(index) {
  const monthPosts = getMonthPosts();
  monthPosts[selectedDay].splice(index, 1);

  if (monthPosts[selectedDay].length === 0) {
    delete monthPosts[selectedDay];
    saveMonthPosts(monthPosts);
    panelPosts.style.display = 'none';
    panelEmpty.style.display = 'flex';
    selectedDay = null;
    buildCalendar();
    return;
  }

  saveMonthPosts(monthPosts);
  buildCalendar();
  showPostsList(monthPosts[selectedDay]);
  showToast('🗑️ Post deleted');
}

// ── BACK TO LIST ──
backToListBtn.addEventListener('click', () => {
  const monthPosts = getMonthPosts();
  const dayPosts   = monthPosts[selectedDay] || [];

  if (dayPosts.length > 0) {
    showPostsList(dayPosts);
  } else {
    panelForm.style.display  = 'none';
    panelEmpty.style.display = 'flex';
    selectedDay = null;
    buildCalendar();
  }
});

// ── ADD NEW POST ──
addNewPostBtn.addEventListener('click', () => openForm(null));

// ── CLOSE PANEL ──
closeBtn.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelPosts.style.display = 'none';
  panelForm.style.display  = 'none';
  closePanel();
  buildCalendar();
});

// ── MONTH NAVIGATION ──
prevMonthBtn.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelPosts.style.display = 'none';
  panelForm.style.display  = 'none';

  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  buildCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelPosts.style.display = 'none';
  panelForm.style.display  = 'none';

  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  buildCalendar();
});

// ── PLATFORM SELECTION ──
platformTags.addEventListener('click', (e) => {
  const btn = e.target.closest('.platform-btn');
  if (!btn) return;
  selectedPlatform = selectedPlatform === btn.dataset.platform ? null : btn.dataset.platform;
  updatePlatformUI();
});

function updatePlatformUI() {
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === selectedPlatform);
  });
}

// ── STATUS SELECTION ──
document.getElementById('statusTags').addEventListener('click', (e) => {
  const btn = e.target.closest('.status-btn');
  if (!btn) return;
  selectedStatus = selectedStatus === btn.dataset.status ? null : btn.dataset.status;
  updateStatusUI();
});

function updateStatusUI() {
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === selectedStatus);
  });
}

// ── PROGRESS ──
function updateProgress() {
  const monthPosts  = getMonthPosts();
  const count       = Object.keys(monthPosts).length;
  const total       = getDaysInMonth(currentYear, currentMonth);

  scheduledCount.textContent = count;
  document.getElementById('totalCount').textContent = total;
  progressFill.style.width = `${(count / total) * 100}%`;
}

// ── TOAST ──
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── REGISTER SERVICE WORKER ──
let swRegistration = null;

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');
  } catch (err) {
    console.error('SW registration failed:', err);
  }
}

// ── NOTIFICATIONS ──
notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    showToast('❌ Notifications not supported');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    notifyBtn.classList.add('active');
    notifyBtn.textContent = '🔔 Reminders On';
    localStorage.setItem('postcal-notify', 'true');
    showToast('🔔 Reminders enabled!');
    await registerSW();
    scheduleNotifications();
  } else {
    showToast('❌ Permission denied');
  }
});

// ── SCHEDULE NOTIFICATIONS VIA SERVICE WORKER ──
function scheduleNotifications() {
  const monthPosts = getMonthPosts();

  Object.entries(monthPosts).forEach(([day, dayPosts]) => {
    dayPosts.forEach((post, index) => {
      if (!post.time) return;

      const [hours, minutes] = post.time.split(':').map(Number);
      const notifyAt = new Date(currentYear, currentMonth, Number(day), hours, minutes);
      const delay    = notifyAt - new Date();

      if (delay <= 0) return;

      const payload = {
        delay,
        title: 'PostCal Reminder 📅',
        body:  `${MONTHS[currentMonth]} ${day}: ${post.topic}`,
        tag:   `postcal-${currentYear}-${currentMonth}-${day}-${index}`
      };

      // use service worker if available, fallback to setTimeout
      if (swRegistration?.active) {
        swRegistration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          payload
        });
      } else {
        setTimeout(() => {
          new Notification(payload.title, { body: payload.body, tag: payload.tag });
        }, delay);
      }
    });
  });
}

// ── STREAK COUNTER ──
function updateStreak() {
  const monthPosts  = getMonthPosts();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const streakEl    = document.getElementById('streakCounter');

  let longestStreak  = 0;
  let currentStreak  = 0;
  let activeStreak   = 0;
  let inActiveStreak = false;

  for (let day = 1; day <= daysInMonth; day++) {
    const hasPost = (monthPosts[day] || []).length > 0;

    if (hasPost) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);

      // check if streak is still active (touching today or in the past)
      const today = currentDate.getDate();
      const isCurrentMonth =
        currentMonth === currentDate.getMonth() &&
        currentYear === currentDate.getFullYear();

      if (isCurrentMonth && day <= today) {
        activeStreak++;
        inActiveStreak = true;
      }
    } else {
      // reset active streak if gap found before today
      const today = currentDate.getDate();
      const isCurrentMonth =
        currentMonth === currentDate.getMonth() &&
        currentYear === currentDate.getFullYear();

      if (isCurrentMonth && day <= today) {
        activeStreak   = 0;
        inActiveStreak = false;
      }
      currentStreak = 0;
    }
  }

  if (!streakEl) return;

  const isCurrentMonth =
    currentMonth === currentDate.getMonth() &&
    currentYear === currentDate.getFullYear();

  if (isCurrentMonth && activeStreak > 0) {
    streakEl.textContent = `🔥 ${activeStreak} day streak`;
  } else if (longestStreak > 0) {
    streakEl.textContent = `⭐ ${longestStreak} day best streak`;
  } else {
    streakEl.textContent = '';
  }
}

// ── EXPORT DROPDOWN TOGGLE ──
exportBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isVisible = exportDropdown.style.display === 'block';
  exportDropdown.style.display = isVisible ? 'none' : 'block';
});

document.addEventListener('click', () => {
  exportDropdown.style.display = 'none';
});

// ── EXPORT CSV ──
exportCSVBtn.addEventListener('click', () => {
  const monthPosts  = getMonthPosts();
  const monthName   = MONTHS[currentMonth];
  const rows        = [['Day', 'Date', 'Topic', 'Caption', 'Platform', 'Status', 'Time']];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayPosts = monthPosts[day] || [];
    if (dayPosts.length === 0) continue;

    dayPosts.forEach(post => {
      rows.push([
        day,
        `${monthName} ${day}, ${currentYear}`,
        post.topic   || '',
        post.caption || '',
        post.platform ? platformLabels[post.platform] : '',
        post.status   ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : '',
        post.time     || ''
      ]);
    });
  }

  const csvContent = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `PostCal-${monthName}-${currentYear}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  exportDropdown.style.display = 'none';
  showToast('📊 CSV exported!');
});

// ── EXPORT PDF ──
exportPDFBtn.addEventListener('click', () => {
  const monthPosts  = getMonthPosts();
  const monthName   = MONTHS[currentMonth];
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  let html = `
    <html>
    <head>
      <title>PostCal — ${monthName} ${currentYear}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: #fff;
          color: #111;
          padding: 40px;
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 4px;
          color: #111;
        }
        .subtitle {
          font-size: 13px;
          color: #888;
          margin-bottom: 32px;
        }
        .day-block {
          margin-bottom: 24px;
          border-left: 3px solid #7B5EA7;
          padding-left: 16px;
        }
        .day-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7B5EA7;
          margin-bottom: 8px;
        }
        .post-item {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 8px;
        }
        .post-topic {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #111;
        }
        .post-caption {
          font-size: 13px;
          color: #555;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .post-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 99px;
          font-weight: 600;
          background: #ede9f5;
          color: #7B5EA7;
        }
        .badge.time { background: #f0f0f0; color: #555; }
        .empty {
          text-align: center;
          color: #aaa;
          font-size: 14px;
          margin-top: 60px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>PostCal</h1>
      <p class="subtitle">${monthName} ${currentYear} — Content Schedule</p>
  `;

  let hasAnyPost = false;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayPosts = monthPosts[day] || [];
    if (dayPosts.length === 0) continue;

    hasAnyPost = true;

    html += `<div class="day-block">
      <div class="day-label">${monthName} ${day}, ${currentYear}</div>`;

    dayPosts.forEach(post => {
      html += `
        <div class="post-item">
          <div class="post-topic">${post.topic || ''}</div>
          ${post.caption ? `<div class="post-caption">${post.caption}</div>` : ''}
          <div class="post-meta">
            ${post.platform ? `<span class="badge">${platformLabels[post.platform]}</span>` : ''}
            ${post.status   ? `<span class="badge">${post.status.charAt(0).toUpperCase() + post.status.slice(1)}</span>` : ''}
            ${post.time     ? `<span class="badge time">🕐 ${post.time}</span>` : ''}
          </div>
        </div>`;
    });

    html += `</div>`;
  }

  if (!hasAnyPost) {
    html += `<p class="empty">No posts scheduled for ${monthName} ${currentYear}</p>`;
  }

  html += `</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);

  exportDropdown.style.display = 'none';
  showToast('📄 PDF ready to print!');
});

// ── PANEL OPEN / CLOSE (mobile bottom sheet) ──
function openPanel() {
  detailPanel.classList.add('open');
  panelOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  detailPanel.classList.remove('open');
  panelOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

panelOverlay.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelPosts.style.display = 'none';
  panelForm.style.display  = 'none';
  closePanel();
});

// ── INIT ──
if (localStorage.getItem('postcal-notify') === 'true') {
  notifyBtn.classList.add('active');
  notifyBtn.textContent = '🔔 Reminders On';
}

registerSW();
buildCalendar();

// add count badge style
const style = document.createElement('style');
style.textContent = `
  .day-count {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 9px;
    font-weight: 700;
    color: var(--purple-light);
    font-family: 'Syne', sans-serif;
  }
`;
document.head.appendChild(style);

buildCalendar();