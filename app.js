// ── STATE ──
let posts = JSON.parse(localStorage.getItem('postcal-posts')) || {};
let selectedDay = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// ── DOM REFS ──
const calendarGrid    = document.getElementById('calendarGrid');
const panelEmpty      = document.getElementById('panelEmpty');
const panelForm       = document.getElementById('panelForm');
const panelDayLabel   = document.getElementById('panelDayLabel');
const postTopic       = document.getElementById('postTopic');
const postCaption     = document.getElementById('postCaption');
const postTime        = document.getElementById('postTime');
const saveBtn         = document.getElementById('savePost');
const clearBtn        = document.getElementById('clearPost');
const closeBtn        = document.getElementById('closePanel');
const scheduledCount  = document.getElementById('scheduledCount');
const progressFill    = document.getElementById('progressFill');
const monthLabel      = document.getElementById('monthLabel');
const prevMonthBtn    = document.getElementById('prevMonth');
const nextMonthBtn    = document.getElementById('nextMonth');
const notifyBtn       = document.getElementById('enableNotifications');

// ── HELPERS ──
const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

function storageKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // 0 = Sunday ... 6 = Saturday
  // We want 0 = Monday so we shift
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

// ── BUILD CALENDAR ──
function buildCalendar() {
  calendarGrid.innerHTML = '';

  const key        = storageKey(currentYear, currentMonth);
  const monthPosts = posts[key] || {};
  const daysInMonth  = getDaysInMonth(currentYear, currentMonth);
  const firstDay     = getFirstDayOfMonth(currentYear, currentMonth);

  // update month label
  monthLabel.textContent = `${MONTHS[currentMonth]} ${currentYear}`;

  // empty cells before day 1
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('day-cell', 'day-empty');
    calendarGrid.appendChild(empty);
  }

  // day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.classList.add('day-cell');
    cell.dataset.day = day;

    const isToday =
      day === currentDate.getDate() &&
      currentMonth === currentDate.getMonth() &&
      currentYear === currentDate.getFullYear();

    const isScheduled = !!monthPosts[day];
    const isSelected  = selectedDay === day;

    if (isScheduled) cell.classList.add('scheduled');
    if (isSelected)  cell.classList.add('active');
    if (isToday)     cell.classList.add('today');

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-dot"></span>
    `;

    cell.addEventListener('click', () => selectDay(day));
    calendarGrid.appendChild(cell);
  }

  updateProgress();
}

// ── SELECT DAY ──
function selectDay(day) {
  selectedDay = day;

  panelEmpty.style.display = 'none';
  panelForm.style.display  = 'block';

  const key        = storageKey(currentYear, currentMonth);
  const monthPosts = posts[key] || {};
  const monthName  = MONTHS[currentMonth];

  panelDayLabel.textContent = `${monthName} ${day}`;

  if (monthPosts[day]) {
    postTopic.value   = monthPosts[day].topic || '';
    postCaption.value = monthPosts[day].caption || '';
    postTime.value    = monthPosts[day].time || '09:00';
  } else {
    postTopic.value   = '';
    postCaption.value = '';
    postTime.value    = '09:00';
  }

  buildCalendar();
}

// ── MONTH NAVIGATION ──
prevMonthBtn.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelForm.style.display  = 'none';

  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  buildCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelForm.style.display  = 'none';

  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  buildCalendar();
});

// ── CLOSE PANEL ──
closeBtn.addEventListener('click', () => {
  selectedDay = null;
  panelEmpty.style.display = 'flex';
  panelForm.style.display  = 'none';
  buildCalendar();
});

// ── SAVE POST ──
saveBtn.addEventListener('click', () => {
  if (!selectedDay) return;

  const topic   = postTopic.value.trim();
  const caption = postCaption.value.trim();
  const time    = postTime.value;

  if (!topic) {
    showToast('⚠️ Add a post topic first');
    return;
  }

  const key = storageKey(currentYear, currentMonth);
  if (!posts[key]) posts[key] = {};

  posts[key][selectedDay] = { topic, caption, time };
  localStorage.setItem('postcal-posts', JSON.stringify(posts));

  buildCalendar();
  showToast(`✅ ${MONTHS[currentMonth]} ${selectedDay} scheduled!`);
});

// ── CLEAR POST ──
clearBtn.addEventListener('click', () => {
  if (!selectedDay) return;

  const key = storageKey(currentYear, currentMonth);
  if (posts[key]) {
    delete posts[key][selectedDay];
    if (Object.keys(posts[key]).length === 0) delete posts[key];
    localStorage.setItem('postcal-posts', JSON.stringify(posts));
  }

  postTopic.value   = '';
  postCaption.value = '';
  postTime.value    = '09:00';

  buildCalendar();
  showToast(`🗑️ ${MONTHS[currentMonth]} ${selectedDay} cleared`);
});

// ── PROGRESS ──
function updateProgress() {
  const key        = storageKey(currentYear, currentMonth);
  const monthPosts = posts[key] || {};
  const count      = Object.keys(monthPosts).length;
  const total      = getDaysInMonth(currentYear, currentMonth);

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

// ── NOTIFICATIONS ──
notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    showToast('❌ Notifications not supported in this browser');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    notifyBtn.classList.add('active');
    notifyBtn.textContent = '🔔 Reminders On';
    localStorage.setItem('postcal-notify', 'true');
    showToast('🔔 Reminders enabled!');
    scheduleNotifications();
  } else {
    showToast('❌ Permission denied');
  }
});

// ── SCHEDULE NOTIFICATIONS ──
function scheduleNotifications() {
  const key        = storageKey(currentYear, currentMonth);
  const monthPosts = posts[key] || {};

  Object.entries(monthPosts).forEach(([day, post]) => {
    if (!post.time) return;

    const [hours, minutes] = post.time.split(':').map(Number);
    const notifyAt = new Date(currentYear, currentMonth, Number(day), hours, minutes);
    const now      = new Date();
    const delay    = notifyAt - now;

    if (delay > 0) {
      setTimeout(() => {
        new Notification('PostCal Reminder 📅', {
          body: `Day ${day}: ${post.topic}`,
          icon: '📅'
        });
      }, delay);
    }
  });
}

// ── INIT ──
if (localStorage.getItem('postcal-notify') === 'true') {
  notifyBtn.classList.add('active');
  notifyBtn.textContent = '🔔 Reminders On';
}

buildCalendar();