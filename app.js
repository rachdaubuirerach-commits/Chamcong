/* ═══════════════════════════════════════════════════════════════
   TimeTracker v4.0.5 — MB Bank Style + i18n hoàn chỉnh
   Fix: Chart % height bug, html2canvas error handling
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const APP_VERSION = "4.0.5";
const SCHEMA_VERSION = 2;
const DRAFT_KEY = 'tt_worklog_draft';
const BALANCE_HIDDEN_KEY = 'tt_balance_hidden';

// ═══════════════════════════════════════════════════════════════
// i18n Dictionary
// ═══════════════════════════════════════════════════════════════
const I18N_EN = {
  // HOME
  'Xin chào 👋': 'Welcome 👋',
  'Lương dự kiến tháng này': 'Estimated salary this month',
  'Chấm công': 'Check in',
  'Nghỉ': 'Absent',
  'Ví lương': 'Wallet',
  'Tính OT': 'Calc OT',
  'Chia sẻ': 'Share',
  'Trợ giúp': 'Help',
  'Chưa chấm công hôm nay!': 'Not checked in today!',
  'Bạn quên chấm công à?': 'Did you forget?',
  'Chấm': 'Check',
  'Đã chấm công hôm nay!': 'Checked in today!',
  'Hôm nay đã nghỉ': 'Absent today',
  'Nhấn để đổi thành đi làm': 'Tap to change to work',
  'Nhấn vào đây để chấm công nhanh': 'Tap to check in quickly',
  'Tính lương OT': 'Calculate OT',
  'Xem cách tính lương tăng ca': 'View OT calculation',
  'Đang tải...': 'Loading...',
  'Chưa đặt mục tiêu': 'No goal set',
  'Nhấn để đặt mục tiêu tháng': 'Tap to set monthly goal',
  'Thành tích': 'Achievements',
  'Công cụ': 'Tools',
  'Khám phá thêm': 'Explore more',
  'Đối chiếu HR': 'HR Compare',
  'Sao lưu': 'Backup',
  'Hồ sơ': 'Profiles',
  'Quỹ DP': 'Reserve',
  'Đầu tư': 'Invest',
  'Ví ĐT': 'E-Wallet',
  'Bí mật': 'Secret',
  'Mục tiêu tháng': 'Monthly goal',
  'Dự kiến cuối tháng': 'Projected month end',
  'Thông tin': 'Info',
  'Lương CB': 'Base salary',
  'Ngày chuẩn': 'Standard days',
  'Số ca đã làm': 'Shifts done',
  'THÁNG': 'MONTH',
  'Dự kiến': 'Projected',
  'Còn': 'Remaining',
  'ngày làm việc': 'working days',
  'Xem tất cả ›': 'View all ›',
  'Chưa đặt mục tiêu. Nhấn nút sửa để đặt.': 'No goal set. Tap edit to set.',
  'Đạt mục tiêu!': 'Goal reached!',

  // CALENDAR
  'Quản lý': 'Manage',
  'Lịch công': 'Work Calendar',
  'Theo dõi ngày công của bạn': 'Track your work days',
  'Dương lịch': 'Solar',
  'Âm lịch': 'Lunar',
  'Đi làm': 'Worked',
  'CN đi làm': 'Sun worked',
  'Lễ đi làm': 'Holiday worked',
  'Chủ nhật': 'Sunday',
  'Lễ': 'Holiday',
  'Đã xác nhận nghỉ': 'Marked as absent',
  'Thêm chấm công': 'Add work log',
  'Chưa có dữ liệu': 'No data',
  'Lưu ghi chú': 'Save note',
  'Xóa': 'Delete',
  'Ghi chú': 'Note',
  'Thêm ghi chú...': 'Add note...',
  'ÂM LỊCH': 'LUNAR',
  'Ca': 'Shift',
  'Loại': 'Type',
  'Vào → Ra': 'In → Out',
  'Tiền': 'Pay',
  'Thường': 'Normal',
  'Lễ Dương lịch': 'Solar holiday',
  'Lễ Âm lịch': 'Lunar holiday',
  'Định kỳ': 'Recurring',
  'Lễ có lương': 'Paid holiday',
  'Dương': 'Solar',
  'Âm': 'Lunar',

  // WORKLOG
  'Ghi nhận': 'Log',
  'Thêm ca làm việc của bạn': 'Add your work shifts',
  'Nhập chấm công': 'Enter work log',
  'Ngày làm việc': 'Work date',
  'Hôm nay': 'Today',
  'Ca làm': 'Shift',
  'Ca sáng': 'Morning shift',
  'Ca đêm': 'Night shift',
  'Loại ngày': 'Day type',
  'Ngày thường': 'Normal day',
  'Giờ bắt đầu': 'Start time',
  'Giờ kết thúc': 'End time',
  'VD: Đi trễ 15 phút...': 'E.g. Late 15 mins...',
  'Giờ thường': 'Regular hours',
  'Tăng ca': 'Overtime',
  'Tiền công': 'Pay',
  'Lưu chấm công': 'Save work log',
  'Bản ghi tháng': 'Monthly records',
  'Bản nháp đã được lưu tự động': 'Draft auto-saved',
  'Chưa có bản ghi tháng này': 'No records this month',

  // STATS
  'Tổng kết': 'Summary',
  'Thống kê': 'Statistics',
  'Xem thu nhập và giờ làm': 'View income & hours',
  'Giờ làm theo ngày': 'Daily hours',
  'Tỉ lệ ca làm': 'Shift ratio',
  'Xu hướng 6 tháng': '6-month trend',
  'Xuất PNG': 'Export PNG',
  'In': 'Print',
  'Copy Markdown': 'Copy Markdown',
  'Không có dữ liệu tháng này': 'No data this month',

  // MONTHS
  'Tháng 1': 'Jan', 'Tháng 2': 'Feb', 'Tháng 3': 'Mar', 'Tháng 4': 'Apr',
  'Tháng 5': 'May', 'Tháng 6': 'Jun', 'Tháng 7': 'Jul', 'Tháng 8': 'Aug',
  'Tháng 9': 'Sep', 'Tháng 10': 'Oct', 'Tháng 11': 'Nov', 'Tháng 12': 'Dec',

  // DRAWER
  'Cấu hình lương': 'Salary config',
  'Hệ số tăng ca': 'OT coefficients',
  'Thời gian mặc định': 'Default times',
  'Khóa PIN': 'PIN lock',
  'Đối chiếu công HR': 'HR Compare',
  'Sáng / Tối': 'Light / Dark',
  'Ngôn ngữ': 'Language',
  'Rung': 'Haptic',
  'Âm thanh': 'Sound',
  'Khôi phục': 'Restore',
  'Xóa dữ liệu cũ': 'Clear old data',
  'Nhấn để đổi tên': 'Tap to rename',

  // NAV
  'Home': 'Home',
  'Lịch': 'Calendar',
  'Chấm': 'Log',

  // SHEETS
  'Lương cơ bản (đ/tháng)': 'Base salary (VND/month)',
  'Ngày công chuẩn': 'Standard work days',
  'Giờ chuẩn/ca': 'Hours/shift',
  'Giờ nghỉ giữa ca': 'Break hours',
  'Mục tiêu tháng (đ)': 'Monthly goal (VND)',
  'Tên hiển thị': 'Display name',
  'Lưu': 'Save',
  'Thường - Sáng': 'Normal - Day',
  'Thường - Đêm': 'Normal - Night',
  'CN - Sáng': 'Sun - Day',
  'CN - Đêm': 'Sun - Night',
  'Sáng bắt đầu': 'Morning start',
  'Sáng kết thúc': 'Morning end',
  'Đêm bắt đầu': 'Night start',
  'Đêm kết thúc': 'Night end',
  'Bật khóa PIN': 'Enable PIN',
  'PIN mới (4 số)': 'New PIN (4 digits)',
  'Thêm hồ sơ': 'Add profile',
  'Tải ảnh bảng chấm công HR để tự động so sánh.': 'Upload HR worklog image for auto compare.',
  'Chọn ảnh bảng công': 'Choose worklog image',
  'Xuất ảnh': 'Export image',
  'Ví lương tháng này': 'Wallet this month',
  'Biểu đồ giờ làm': 'Hours chart',
  'Chi tiết ngày': 'Day details',
  'Tổng lương tháng': 'Total salary in',
  'Ngày công': 'Work days',
  'Tổng giờ': 'Total hours',
  'Chi tiết theo ngày': 'Daily breakdown',
  'Xem thống kê đầy đủ': 'View full statistics',
  'Lương / giờ': 'Salary / hour',
  'Bảng quy đổi tăng ca': 'OT conversion table',
  'Công thức:': 'Formula:',
  'Lễ có lương: hệ số': 'Paid holiday: coefficient',
  'Streak hiện tại': 'Current streak',
  'Tổng chấm công': 'Total check-ins',
  'Tháng tốt nhất': 'Best month',
  'Đổi tên hiển thị': 'Edit display name',
  'Cập nhật tên của bạn': 'Update your name',
  'Tên này sẽ hiển thị trên trang chủ và menu': 'This name shows on home and menu',
  'Tên hiển thị của bạn': 'Your display name',
  'Lưu tên': 'Save name',
  'Bắt đầu sử dụng': 'Get started',
  'Chào mừng bạn!': 'Welcome!',
  'Đặt tên hiển thị để bắt đầu sử dụng ứng dụng': 'Enter your name to start using the app',
  'Bắt đầu ngay': 'Start now',
  'Vui lòng nhập tên': 'Please enter a name',
  'Tên phải có ít nhất 2 ký tự': 'Name must be at least 2 characters',
  'Tên tối đa 40 ký tự': 'Name max 40 characters',
  'Vui lòng đặt tên để tiếp tục': 'Please enter a name to continue',
  'Tên không được để trống': 'Name cannot be empty',
  'PIN phải gồm 4 số': 'PIN must be 4 digits',
  'Số không hợp lệ': 'Invalid number',
  'Đã lưu mục tiêu!': 'Goal saved!',
  'Đã lưu ghi chú!': 'Note saved!',
  'Đã lưu cấu hình lương': 'Salary config saved',
  'Đã lưu hệ số': 'Coefficients saved',
  'Đã lưu thời gian': 'Time settings saved',
  'Đã lưu PIN': 'PIN saved',
  'Đã xóa': 'Deleted',
  'Hoàn tác': 'Undo',
  'Đã hoàn tác': 'Undone',
  'Đã đánh dấu nghỉ': 'Marked as absent',
  'Bộ nhớ đầy': 'Storage full',
  'Bộ nhớ gần đầy': 'Storage almost full',
  'Đang chuyển...': 'Switching...',
  'Đã thêm hồ sơ': 'Profile added',
  'Đã xóa hồ sơ': 'Profile deleted',
  'Đã tải file sao lưu': 'Backup downloaded',
  'Đã khôi phục': 'Restored',
  'Đã đổi tên': 'Name updated',
  'Tiếng Việt': 'Vietnamese',
  'English': 'English',
  'Đã bật rung': 'Haptic on',
  'Đã tắt rung': 'Haptic off',
  'Đã bật âm thanh': 'Sound on',
  'Đã tắt âm thanh': 'Sound off',
  'Thao tác cơ bản': 'Basic actions',
  'Mẹo hay': 'Tips',
  'Nhấn': 'Tap',
  'hoặc FAB để chấm nhanh': 'or FAB to check in fast',
  'Xem lịch dương và âm ở tab': 'View solar & lunar in tab',
  'Xuất ảnh bảng công ở tab': 'Export worklog image in tab',
  'Cấu hình lương, PIN ở menu': 'Configure salary, PIN in menu',
  'góc phải': 'top right',
  'Nhấn vào': 'Tap',
  'tên ở menu': 'name in menu',
  'để đổi tên hiển thị': 'to change display name',
  'icon mắt': 'eye icon',
  'để ẩn/hiện số dư': 'to hide/show balance',
  'Vuốt ngang lịch': 'Swipe calendar',
  'để chuyển tháng': 'to change month',
  'Phím tắt:': 'Shortcuts:',
  'chuyển tab': 'switch tabs',
  'chấm nhanh': 'quick check-in',
  'đóng': 'close',
  'Dữ liệu của bạn': 'Your data',
  'Được lưu an toàn trên thiết bị': 'Safely stored on device',
  'Không gửi lên server · Hoạt động offline': 'No server · Works offline',
  'Ngôn ngữ:': 'Language:'
};

// ═══════════════════════════════════════════════════════════════
// i18n helper functions
// ═══════════════════════════════════════════════════════════════
function tr(vi, en) {
  return settings.language === 'en' ? en : vi;
}

function translateAll() {
  const isEn = settings.language === 'en';

  // 1. Translate text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'INPUT' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }
        if (p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    if (!node._originalVi) node._originalVi = node.nodeValue;
    const orig = node._originalVi;
    const trimmed = orig.trim();
    if (!trimmed) continue;

    if (isEn) {
      let en = I18N_EN[trimmed];
      if (!en) {
        if (/^Tháng \d+$/.test(trimmed)) en = trimmed.replace('Tháng', 'Month');
        else if (/^Thứ \d+$/.test(trimmed)) en = trimmed.replace('Thứ', 'Day');
      }
      if (en && en !== trimmed) {
        node.nodeValue = orig.replace(trimmed, en);
      }
    } else {
      if (node.nodeValue !== orig) {
        node.nodeValue = orig;
      }
    }
  }

  // 2. Translate placeholders
  document.querySelectorAll('[placeholder]').forEach(el => {
    if (!el._originalPlaceholder) el._originalPlaceholder = el.getAttribute('placeholder');
    const orig = el._originalPlaceholder;
    if (!orig) return;

    if (isEn) {
      const en = I18N_EN[orig];
      if (en) el.setAttribute('placeholder', en);
    } else {
      el.setAttribute('placeholder', orig);
    }
  });
}

function applyLanguage() {
  document.documentElement.lang = settings.language;
  const lbl = document.getElementById('lang-label');
  if (lbl) lbl.textContent = settings.language === 'vi' ? 'VI' : 'EN';
  translateAll();
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════
const DEFAULT_SETTINGS = {
  baseSalary: 5900000,
  standardWorkDays: 26,
  standardShiftHours: 8,
  breakHours: 1,
  otNormalDay: 1.5,
  otNormalNight: 1.7,
  otSundayDay: 2.0,
  otSundayNight: 2.7,
  otHoliday: 3.0,
  morningStart: "07:30",
  morningEnd: "19:30",
  nightStart: "19:30",
  nightEnd: "07:30",
  monthlyGoal: 8000000,
  themeMode: "auto",
  haptic: true,
  sound: true,
  reminders: true,
  pinEnabled: false,
  pinValue: "",
  language: "vi",
  profileName: "",
  onboarded: false
};

const TOAST_ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let settings = { ...DEFAULT_SETTINGS };
let workLogs = [];
let absentDays = [];
let notesMap = {};
let currentPage = 'home';
let calMonth = new Date().getMonth() + 1;
let calYear = new Date().getFullYear();
let calTab = 'solar';
let calLunarMonth = null;
let calLunarYear = null;
let viewMonth = new Date().getMonth() + 1;
let viewYear = new Date().getFullYear();
let statMonth = new Date().getMonth() + 1;
let statYear = new Date().getFullYear();
let pinBuffer = "";
let _audioCtx = null;
const _activeToasts = new Set();
let goalCelebrated = false;
let _lastAchievementStreak = 0;
let _draftTimer = null;
let _deletedSnapshot = null;
let _balanceHidden = false;
let _nameEditorForced = false;

// ═══════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════
function getProfiles() {
  try {
    const r = localStorage.getItem('tt_profiles');
    if (r) { const a = JSON.parse(r); if (Array.isArray(a) && a.length) return a; }
  } catch (e) {}
  return [{ id: 'default', name: 'Cá nhân' }];
}
function saveProfiles(p) { localStorage.setItem('tt_profiles', JSON.stringify(p)); }
function getActiveProfile() { return localStorage.getItem('tt_active_profile') || 'default'; }
function setActiveProfile(id) { localStorage.setItem('tt_active_profile', id); }
function storageKey(base) {
  const p = getActiveProfile();
  return p === 'default' ? `timesheet_${base}` : `timesheet_${p}_${base}`;
}
function loadSettings() {
  const raw = localStorage.getItem(storageKey('settings'));
  let p = {};
  try { p = raw ? JSON.parse(raw) : {}; } catch (e) { p = {}; }
  delete p.themeColor;
  settings = { ...DEFAULT_SETTINGS, ...p };
  if (!['auto', 'light', 'dark'].includes(settings.themeMode)) settings.themeMode = 'auto';
  if (!['vi', 'en'].includes(settings.language)) settings.language = 'vi';
  const n = String(settings.profileName || '').trim();
  const isGeneric = !n || n === 'Người dùng' || n === 'Dương Yến My' || n === 'Cá nhân';
  if (!isGeneric && settings.onboarded !== true) {
    settings.onboarded = true;
    saveSettingsToStorage();
  }
  if (isGeneric) {
    settings.profileName = '';
    settings.onboarded = false;
  }
}
function saveSettingsToStorage() {
  try { localStorage.setItem(storageKey('settings'), JSON.stringify(settings)); }
  catch (e) { toast(tr('Bộ nhớ đầy', 'Storage full'), 'danger'); }
}
function normalizeLog(l) {
  if (!l || typeof l !== 'object' || !l.date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(l.date)) return null;
  return {
    id: typeof l.id === 'number' ? l.id : Date.now() + Math.random(),
    date: l.date,
    shift: l.shift === 'Đêm' ? 'Đêm' : 'Sáng',
    isSunday: !!l.isSunday,
    start: typeof l.start === 'string' && /^\d{2}:\d{2}$/.test(l.start) ? l.start : '07:30',
    end: typeof l.end === 'string' && /^\d{2}:\d{2}$/.test(l.end) ? l.end : '19:30',
    regularHours: Math.max(0, parseFloat(l.regularHours) || 0),
    overtimeHours: Math.max(0, parseFloat(l.overtimeHours) || 0),
    totalPay: Math.max(0, parseInt(l.totalPay) || 0),
    isPaidHoliday: !!l.isPaidHoliday,
    note: String(l.note || '').slice(0, 200)
  };
}
function loadWorkLogs() {
  const raw = localStorage.getItem(storageKey('worklogs'));
  let arr = [];
  try { arr = raw ? JSON.parse(raw) : []; } catch (e) { arr = []; }
  if (!Array.isArray(arr)) arr = [];
  workLogs = arr.map(normalizeLog).filter(Boolean);
}
function saveWorkLogsData() {
  try { localStorage.setItem(storageKey('worklogs'), JSON.stringify(workLogs)); }
  catch (e) { toast(tr('Bộ nhớ đầy', 'Storage full'), 'danger'); }
}
function loadAbsentDays() {
  const raw = localStorage.getItem(storageKey('absent_days'));
  let arr = [];
  try { arr = raw ? JSON.parse(raw) : []; } catch (e) { arr = []; }
  if (!Array.isArray(arr)) arr = [];
  absentDays = arr.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
}
function saveAbsentDaysData() {
  try { localStorage.setItem(storageKey('absent_days'), JSON.stringify(absentDays)); } catch (e) {}
}
function isAbsentDay(d) { return absentDays.indexOf(d) !== -1; }
function markAbsentDay(d) { if (!isAbsentDay(d)) { absentDays.push(d); saveAbsentDaysData(); } }
function unmarkAbsentDay(d) { absentDays = absentDays.filter(x => x !== d); saveAbsentDaysData(); }
function loadNotes() {
  const raw = localStorage.getItem(storageKey('notes'));
  try { notesMap = raw ? JSON.parse(raw) : {}; } catch (e) { notesMap = {}; }
  if (typeof notesMap !== 'object' || notesMap === null) notesMap = {};
}
function saveNotesData() {
  try { localStorage.setItem(storageKey('notes'), JSON.stringify(notesMap)); } catch (e) {}
}
function getNote(d) { return notesMap[d] || ''; }
function setNote(d, t) {
  const v = (t || '').trim();
  if (v) notesMap[d] = v;
  else delete notesMap[d];
  saveNotesData();
}
function checkQuota() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        const pct = (est.usage || 0) / (est.quota || 1);
        if (pct > 0.85) toast(tr('⚠️ Bộ nhớ gần đầy', '⚠️ Storage almost full'), 'warning');
      }).catch(() => {});
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function pad(n) { return String(n).padStart(2, '0'); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dateToStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatMoney(n) {
  return Math.round(Number(n) || 0).toLocaleString('vi-VN') + ' đ';
}
function getLogByDate(ds) { return workLogs.find(l => l.date === ds); }
function getLogsByMonth(m, y) {
  return workLogs.filter(l => {
    const d = new Date(l.date + 'T00:00:00');
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  });
}

// ═══════════════════════════════════════════════════════════════
// TOAST / HAPTIC / SOUND
// ═══════════════════════════════════════════════════════════════
function toast(msg, type = 'info', action = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  if (_activeToasts.size >= 3) {
    const f = _activeToasts.values().next().value;
    if (f) { f.remove(); _activeToasts.delete(f); }
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span><span class="toast-message">${msg}</span>`;
  if (action && typeof action.onClick === 'function') {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label || tr('Hoàn tác', 'Undo');
    btn.onclick = () => {
      try { action.onClick(); } catch (e) {}
      el.remove(); _activeToasts.delete(el);
    };
    el.appendChild(btn);
  }
  container.appendChild(el);
  _activeToasts.add(el);
  const timeout = action ? 5000 : 2500;
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => { el.remove(); _activeToasts.delete(el); }, 320);
  }, timeout);
}
function haptic() {
  if (settings.haptic && navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
}
function playSound() {
  if (!settings.sound) return;
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = _audioCtx.createOscillator(), g = _audioCtx.createGain();
    o.connect(g); g.connect(_audioCtx.destination);
    o.frequency.value = 880; o.type = 'sine';
    g.gain.setValueAtTime(0.08, _audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.2);
    o.start(); o.stop(_audioCtx.currentTime + 0.2);
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// THEME / TOGGLES
// ═══════════════════════════════════════════════════════════════
function applyTheme() {
  let mode = settings.themeMode;
  if (mode === 'auto') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0A1425' : '#005BAA');
  const sw = document.getElementById('themeSwitch');
  if (sw) sw.classList.toggle('active', mode === 'dark');
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  settings.themeMode = cur === 'dark' ? 'light' : 'dark';
  saveSettingsToStorage();
  if (window.Effects && window.Effects.smoothThemeChange) window.Effects.smoothThemeChange(applyTheme);
  else applyTheme();
  setTimeout(() => {
    if (currentPage === 'stats') loadStats();
    if (currentPage === 'calendar') renderCalendar();
  }, 250);
}
function toggleLanguage() {
  settings.language = settings.language === 'vi' ? 'en' : 'vi';
  saveSettingsToStorage();
  applyLanguage();
  renderDrawerState();
  if (currentPage === 'home') renderHome();
  else if (currentPage === 'calendar') renderCalendar();
  else if (currentPage === 'worklog') { loadWorkLogTable(); previewWorkLog(); }
  else if (currentPage === 'stats') loadStats();
  applyLanguage();
  toast(settings.language === 'vi' ? 'Tiếng Việt' : 'English', 'info');
}
function toggleHaptic() {
  settings.haptic = !settings.haptic; saveSettingsToStorage();
  const sw = document.getElementById('hapticSwitch'); if (sw) sw.classList.toggle('active', settings.haptic);
  toast(settings.haptic ? tr('Đã bật rung','Haptic on') : tr('Đã tắt rung','Haptic off'), 'info');
  haptic();
}
function toggleSound() {
  settings.sound = !settings.sound; saveSettingsToStorage();
  const sw = document.getElementById('soundSwitch'); if (sw) sw.classList.toggle('active', settings.sound);
  if (settings.sound) playSound();
  toast(settings.sound ? tr('Đã bật âm thanh','Sound on') : tr('Đã tắt âm thanh','Sound off'), 'info');
}

// ═══════════════════════════════════════════════════════════════
// CALC PAY
// ═══════════════════════════════════════════════════════════════
function calculateWorkLog(workDate, shift, isSunday, startTimeStr, endTimeStr) {
  const dailyRate = settings.baseSalary / Math.max(1, settings.standardWorkDays);
  const hourlyRate = dailyRate / Math.max(0.1, settings.standardShiftHours);
  const [sh, sm] = startTimeStr.split(':').map(Number);
  const [eh, em] = endTimeStr.split(':').map(Number);
  const startDate = new Date(2000, 0, 1, sh, sm, 0);
  let endDate = new Date(2000, 0, 1, eh, em, 0);
  if (endDate <= startDate) endDate = new Date(endDate.getTime() + 86400000);
  const totalHours = (endDate - startDate) / 3600000;
  const startHours = sh + sm / 60;
  const endHours = startHours + totalHours;
  const paidHoliday = typeof HolidayResolver !== 'undefined'
    ? HolidayResolver.getPaidHoliday(workDate) : null;
  const isSpecialDay = isSunday || !!paidHoliday;
  let regularHours = 0, overtimeHours = 0;
  const standardStart = shift === 'Sáng' ? 7.5 : 19.5;
  const tcStartHours = shift === 'Sáng' ? 16.5 : 28.5;
  const bonusThreshold = shift === 'Sáng' ? 19.5 : 31.5;
  if (isSpecialDay) {
    let worked = totalHours;
    if (totalHours >= 8) worked -= 0.5;
    else if (totalHours >= 6) worked -= 0.25;
    if (shift === 'Sáng' && endHours > 16.5) worked -= 0.5;
    else if (shift === 'Đêm' && endHours > 28.5) worked -= 0.5;
    if (worked < 0) worked = 0;
    regularHours = 0;
    overtimeHours = worked;
    if (endHours >= bonusThreshold) overtimeHours += 0.5;
    if (shift === 'Đêm' && overtimeHours > 0) overtimeHours += 0.25;
  } else {
    let ot = 0;
    if (endHours > tcStartHours) {
      ot = endHours - tcStartHours;
      if (ot >= 3) ot += 0.5;
      if (shift === 'Đêm') ot += 0.25;
    }
    overtimeHours = ot;
    const late = Math.max(0, startHours - standardStart);
    regularHours = Math.max(0, 8 - late);
  }
  regularHours = Math.round(regularHours * 100) / 100;
  overtimeHours = Math.round(overtimeHours * 100) / 100;
  const regularPay = regularHours * hourlyRate;
  let overtimePay = 0;
  if (overtimeHours > 0) {
    let coeff;
    if (paidHoliday || isSunday) coeff = shift === 'Sáng' ? settings.otSundayDay : settings.otSundayNight;
    else coeff = shift === 'Sáng' ? settings.otNormalDay : settings.otNormalNight;
    overtimePay = overtimeHours * hourlyRate * coeff;
  }
  return {
    regularHours, overtimeHours,
    totalPay: Math.round(regularPay + overtimePay),
    isPaidHoliday: !!paidHoliday, holiday: paidHoliday
  };
}

// ═══════════════════════════════════════════════════════════════
// SWITCH PAGE
// ═══════════════════════════════════════════════════════════════
function switchPage(p) {
  const doSwitch = () => {
    document.querySelectorAll('.page').forEach(e => e.classList.remove('active'));
    const target = document.getElementById('page-' + p);
    if (target) target.classList.add('active');
    document.body.dataset.page = p;
    currentPage = p;
    document.querySelectorAll('.bottom-nav .nav-item').forEach(e => e.classList.toggle('active', e.dataset.page === p));
    if (p === 'home') renderHome();
    else if (p === 'calendar') renderCalendar();
    else if (p === 'worklog') applyWorklogMonthFilter();
    else if (p === 'stats') loadStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    applyLanguage();
  };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(doSwitch);
  } else doSwitch();
  if (window.Effects) setTimeout(() => window.Effects.attachRippleAll(), 120);
}
function goToCurrentMonth(page) {
  const now = new Date();
  const m = now.getMonth() + 1, y = now.getFullYear();
  if (page === 'worklog') {
    const ms = document.getElementById('worklog-month-select');
    const ys = document.getElementById('worklog-year-input');
    if (ms) ms.value = m;
    if (ys) ys.value = y;
    applyWorklogMonthFilter();
  } else if (page === 'stats') {
    const ms = document.getElementById('stat-month-select');
    const ys = document.getElementById('stat-year-input');
    if (ms) ms.value = m;
    if (ys) ys.value = y;
    loadStats();
  }
}

// ═══════════════════════════════════════════════════════════════
// DRAWER / SHEETS
// ═══════════════════════════════════════════════════════════════
function openDrawer() {
  const el = document.getElementById('drawer');
  if (el) { el.classList.add('open'); renderDrawerState(); }
  document.body.classList.add('drawer-open');
  applyLanguage();
}
function closeDrawer() {
  const el = document.getElementById('drawer');
  if (el) el.classList.remove('open');
  document.body.classList.remove('drawer-open');
}
function openSheet(id) {
  closeDrawer();
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); loadSheetData(id); applyLanguage(); }
  }, 140);
}
function closeSheet(id) {
  if (id === 'sheet-edit-name' && _nameEditorForced) return;
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function renderDrawerState() {
  const name = settings.profileName || 'Người dùng';
  const av = document.getElementById('drawer-avatar');
  if (av) av.textContent = name.charAt(0).toUpperCase();
  const elName = document.getElementById('drawer-name');
  if (elName) elName.textContent = name;
  const sw = document.getElementById('themeSwitch');
  if (sw) sw.classList.toggle('active', document.documentElement.getAttribute('data-theme') === 'dark');
  const hap = document.getElementById('hapticSwitch');
  if (hap) hap.classList.toggle('active', settings.haptic);
  const snd = document.getElementById('soundSwitch');
  if (snd) snd.classList.toggle('active', settings.sound);
  const lbl = document.getElementById('lang-label');
  if (lbl) lbl.textContent = settings.language === 'vi' ? 'VI' : 'EN';
}
function loadSheetData(id) {
  const g = x => document.getElementById(x);
  if (id === 'sheet-salary') {
    if (g('set-base-salary')) g('set-base-salary').value = settings.baseSalary;
    if (g('set-standard-days')) g('set-standard-days').value = settings.standardWorkDays;
    if (g('set-standard-hours')) g('set-standard-hours').value = settings.standardShiftHours;
    if (g('set-break-hours')) g('set-break-hours').value = settings.breakHours;
    if (g('set-monthly-goal')) g('set-monthly-goal').value = settings.monthlyGoal;
    if (g('set-profile-name')) g('set-profile-name').value = settings.profileName;
  } else if (id === 'sheet-ot') {
    if (g('set-ot-normal-day')) g('set-ot-normal-day').value = settings.otNormalDay;
    if (g('set-ot-normal-night')) g('set-ot-normal-night').value = settings.otNormalNight;
    if (g('set-ot-sunday-day')) g('set-ot-sunday-day').value = settings.otSundayDay;
    if (g('set-ot-sunday-night')) g('set-ot-sunday-night').value = settings.otSundayNight;
    if (g('set-ot-holiday')) g('set-ot-holiday').value = settings.otHoliday;
  } else if (id === 'sheet-times') {
    if (g('set-morning-start')) g('set-morning-start').value = settings.morningStart;
    if (g('set-morning-end')) g('set-morning-end').value = settings.morningEnd;
    if (g('set-night-start')) g('set-night-start').value = settings.nightStart;
    if (g('set-night-end')) g('set-night-end').value = settings.nightEnd;
  } else if (id === 'sheet-pin') {
    if (g('set-pin-enabled')) g('set-pin-enabled').checked = settings.pinEnabled;
    if (g('set-pin-value')) g('set-pin-value').value = settings.pinValue || '';
    const grp = document.getElementById('pin-input-group');
    if (grp) grp.style.display = settings.pinEnabled ? 'block' : 'none';
  } else if (id === 'sheet-profiles') renderProfileList();
  else if (id === 'sheet-wallet') renderWalletSheet();
  else if (id === 'sheet-chart') renderChartSheet();
  else if (id === 'sheet-achievements') renderAchievementsSheet();
  else if (id === 'sheet-ot-calc') renderOTCalcSheet();
  else if (id === 'sheet-help') renderHelpSheet();
}

// ═══════════════════════════════════════════════════════════════
// NAME EDITOR
// ═══════════════════════════════════════════════════════════════
function needsOnboarding() {
  if (settings.onboarded === true) {
    const n = (settings.profileName || '').trim();
    return !n;
  }
  return true;
}
function openNameEditor(force) {
  _nameEditorForced = !!force;
  const sheet = document.getElementById('sheet-edit-name');
  const closeBtn = document.getElementById('edit-name-close');
  const backdrop = document.getElementById('edit-name-backdrop');
  const title = document.getElementById('edit-name-title');
  const heroTitle = document.getElementById('edit-name-hero-title');
  const heroSub = document.getElementById('edit-name-hero-sub');
  const input = document.getElementById('edit-name-input');
  const err = document.getElementById('edit-name-error');
  const avatar = document.getElementById('edit-name-avatar');
  const saveBtn = document.getElementById('edit-name-save-btn');
  if (!sheet || !input) return;
  if (force) {
    if (closeBtn) closeBtn.style.display = 'none';
    if (backdrop) backdrop.style.pointerEvents = 'none';
    if (title) title.textContent = tr('Bắt đầu sử dụng', 'Get started');
    if (heroTitle) heroTitle.textContent = tr('Chào mừng bạn!', 'Welcome!');
    if (heroSub) heroSub.textContent = tr('Đặt tên hiển thị để bắt đầu sử dụng ứng dụng', 'Enter your name to start using the app');
    if (saveBtn) saveBtn.innerHTML = '<svg width="16" height="16"><use href="#i-check"/></svg> ' + tr('Bắt đầu ngay', 'Start now');
    if (input) input.value = '';
    if (avatar) avatar.textContent = '?';
  } else {
    if (closeBtn) closeBtn.style.display = 'flex';
    if (backdrop) backdrop.style.pointerEvents = '';
    if (title) title.textContent = tr('Đổi tên hiển thị', 'Edit display name');
    if (heroTitle) heroTitle.textContent = tr('Cập nhật tên của bạn', 'Update your name');
    if (heroSub) heroSub.textContent = tr('Tên này sẽ hiển thị trên trang chủ và menu', 'This name shows on home and menu');
    if (saveBtn) saveBtn.innerHTML = '<svg width="16" height="16"><use href="#i-check"/></svg> ' + tr('Lưu tên', 'Save name');
    if (input) input.value = settings.profileName || '';
    if (avatar) avatar.textContent = (settings.profileName || '?').charAt(0).toUpperCase() || '?';
  }
  if (err) err.textContent = '';
  closeDrawer();
  sheet.classList.add('open');
  document.body.classList.add('drawer-open');
  setTimeout(() => { input.focus(); }, 300);
  applyLanguage();
}
function handleNameEditorClose() {
  if (_nameEditorForced) {
    toast(tr('Vui lòng đặt tên để tiếp tục', 'Please enter a name to continue'), 'warning');
    return;
  }
  closeSheet('sheet-edit-name');
  document.body.classList.remove('drawer-open');
}
function onNameInput() {
  const input = document.getElementById('edit-name-input');
  const avatar = document.getElementById('edit-name-avatar');
  const err = document.getElementById('edit-name-error');
  if (!input || !avatar) return;
  const v = input.value.trim();
  if (v) {
    avatar.textContent = v.charAt(0).toUpperCase();
    avatar.classList.remove('bump');
    void avatar.offsetWidth;
    avatar.classList.add('bump');
  } else {
    avatar.textContent = '?';
  }
  if (err && v) err.textContent = '';
}
function saveProfileName() {
  const input = document.getElementById('edit-name-input');
  const err = document.getElementById('edit-name-error');
  if (!input) return;
  const v = input.value.trim();
  if (!v) {
    if (err) err.textContent = tr('Vui lòng nhập tên', 'Please enter a name');
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 500);
    input.focus();
    return;
  }
  if (v.length < 2) {
    if (err) err.textContent = tr('Tên phải có ít nhất 2 ký tự', 'Name must be at least 2 characters');
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 500);
    input.focus();
    return;
  }
  if (v.length > 40) {
    if (err) err.textContent = tr('Tên tối đa 40 ký tự', 'Name max 40 characters');
    return;
  }
  settings.profileName = v;
  settings.onboarded = true;
  saveSettingsToStorage();
  _nameEditorForced = false;
  closeSheet('sheet-edit-name');
  document.body.classList.remove('drawer-open');
  renderDrawerState();
  if (currentPage === 'home') renderHome();
  toast(tr('✅ Chào ' + v + '!', '✅ Welcome ' + v + '!'), 'success');
  haptic(); playSound();
}
function editProfileName() {
  openNameEditor(false);
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTED SHIFT
// ═══════════════════════════════════════════════════════════════
function getSuggestedShift() {
  const today = new Date();
  let latest = null;
  for (const l of workLogs) if (!latest || new Date(l.date) > new Date(latest.date)) latest = l;
  if (latest) {
    const diff = Math.floor((today - new Date(latest.date)) / 86400000);
    if (diff <= 7) return { shift: latest.shift, startTime: latest.start, endTime: latest.end };
  }
  return { shift: 'Sáng', startTime: settings.morningStart, endTime: settings.morningEnd };
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════
function quickCheckIn() {
  const now = new Date();
  const hour = now.getHours();
  let ts = null, forceShift = null;
  if (hour < 8) {
    if (workLogs.length > 0) {
      const sorted = [...workLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
      const last = sorted[0];
      const diff = Math.floor((now - new Date(last.date)) / 86400000);
      if (last.shift === 'Đêm' && diff <= 1) {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        ts = dateToStr(y); forceShift = 'Đêm';
      } else ts = todayStr();
    } else {
      const choice = confirm(tr(
        `Bây giờ là ${hour}h sáng.\n\n[OK] Ca đêm HÔM QUA\n[Cancel] Ca ngày HÔM NAY`,
        `It's ${hour}h in the morning.\n\n[OK] YESTERDAY night shift\n[Cancel] TODAY day shift`
      ));
      if (choice) { const y = new Date(now); y.setDate(y.getDate() - 1); ts = dateToStr(y); forceShift = 'Đêm'; }
      else ts = todayStr();
    }
  } else ts = todayStr();
  if (getLogByDate(ts)) { toast(tr('Đã chấm công ngày này!', 'Already checked in this day!'), 'warning'); return; }
  if (isAbsentDay(ts)) {
    if (!confirm(tr('Ngày này đã đánh dấu nghỉ. Đổi thành đi làm?', 'This day marked as absent. Change to work?'))) return;
    unmarkAbsentDay(ts);
  }
  let shift, start, end;
  if (forceShift === 'Đêm') { shift = 'Đêm'; start = settings.nightStart; end = settings.nightEnd; }
  else { const s = getSuggestedShift(); shift = s.shift; start = s.startTime; end = s.endTime; }
  const isSun = new Date(ts + 'T00:00:00').getDay() === 0;
  const calc = calculateWorkLog(ts, shift, isSun, start, end);
  workLogs.push({
    id: Date.now(), date: ts, shift, isSunday: isSun, start, end,
    regularHours: calc.regularHours, overtimeHours: calc.overtimeHours,
    totalPay: calc.totalPay, isPaidHoliday: calc.isPaidHoliday, note: ''
  });
  saveWorkLogsData();
  haptic(); playSound();
  if (window.Effects) {
    if (window.Effects.showCheckmark) window.Effects.showCheckmark();
    if (window.Effects.miniConfetti) {
      const r = document.querySelector('.balance-action-btn.primary')?.getBoundingClientRect();
      if (r) window.Effects.miniConfetti(r.left + r.width / 2, r.top + r.height / 2);
    }
  }
  if (calc.isPaidHoliday) toast(tr('Chấm công ngày lễ ' + calc.holiday.name, 'Holiday check-in: ' + calc.holiday.name), 'success');
  else toast(tr('✅ Đã chấm công ca ' + shift, '✅ Checked in shift ' + shift), 'success');
  refreshCurrentPage();
  checkQuota();
}
function markAbsent() {
  const ts = todayStr();
  if (getLogByDate(ts)) { toast(tr('Hôm nay đã chấm công', 'Already checked in today'), 'warning'); return; }
  if (isAbsentDay(ts)) { toast(tr('Đã đánh dấu nghỉ hôm nay', 'Marked absent today'), 'warning'); return; }
  if (!confirm(tr('Xác nhận hôm nay nghỉ làm?', 'Confirm absent today?'))) return;
  markAbsentDay(ts);
  toast(tr('Đã đánh dấu nghỉ', 'Marked as absent'), 'success');
  refreshCurrentPage();
}

// ═══════════════════════════════════════════════════════════════
// BALANCE
// ═══════════════════════════════════════════════════════════════
function toggleBalanceVisibility() {
  _balanceHidden = !_balanceHidden;
  try { localStorage.setItem(BALANCE_HIDDEN_KEY, _balanceHidden ? '1' : '0'); } catch (e) {}
  const el = document.getElementById('home-salary');
  const eye = document.getElementById('balance-eye');
  if (!el) return;
  if (_balanceHidden) {
    el.textContent = '••••••';
    if (eye) eye.innerHTML = '<svg width="18" height="18"><use href="#i-eye-off"/></svg>';
  } else {
    const now = new Date();
    const logs = getLogsByMonth(now.getMonth() + 1, now.getFullYear());
    const total = logs.reduce((s, l) => s + (l.totalPay || 0), 0);
    el.textContent = formatMoney(total);
    if (eye) eye.innerHTML = '<svg width="18" height="18"><use href="#i-eye"/></svg>';
  }
}
function updateMoneySub() {
  const sub = document.getElementById('home-money-sub');
  if (!sub) return;
  const now = new Date();
  const logs = getLogsByMonth(now.getMonth() + 1, now.getFullYear());
  const hours = logs.reduce((s, l) => s + (l.regularHours || 0) + (l.overtimeHours || 0), 0);
  sub.textContent = `${logs.length} ${tr('ngày','days')} · ${hours.toFixed(1)}h`;
}

// ═══════════════════════════════════════════════════════════════
// RENDER HOME
// ═══════════════════════════════════════════════════════════════
function renderHome() {
  const nm = document.getElementById('home-name');
  if (nm) nm.textContent = settings.profileName || tr('Người dùng', 'User');

  const now = new Date();
  const logs = getLogsByMonth(now.getMonth() + 1, now.getFullYear());
  const total = logs.reduce((s, l) => s + (l.totalPay || 0), 0);
  const salaryEl = document.getElementById('home-salary');
  const eye = document.getElementById('balance-eye');
  if (_balanceHidden) {
    if (salaryEl) salaryEl.textContent = '••••••';
    if (eye) eye.innerHTML = '<svg width="18" height="18"><use href="#i-eye-off"/></svg>';
  } else {
    countUp(salaryEl, total);
    if (eye) eye.innerHTML = '<svg width="18" height="18"><use href="#i-eye"/></svg>';
  }

  const ts = todayStr();
  const log = getLogByDate(ts);
  const t1 = document.getElementById('carousel-checkin-title');
  const d1 = document.getElementById('carousel-checkin-desc');
  if (t1 && d1) {
    if (log) {
      t1.textContent = tr('Đã chấm công hôm nay!', 'Checked in today!');
      d1.textContent = tr(`Ca ${log.shift} · ${log.start} → ${log.end}`, `Shift ${log.shift} · ${log.start} → ${log.end}`);
    } else if (isAbsentDay(ts)) {
      t1.textContent = tr('Hôm nay đã nghỉ', 'Absent today');
      d1.textContent = tr('Nhấn để đổi thành đi làm', 'Tap to change to work');
    } else {
      t1.textContent = tr('Chưa chấm công hôm nay!', 'Not checked in today!');
      d1.textContent = tr('Nhấn vào đây để chấm công nhanh', 'Tap to check in quickly');
    }
  }
  const goal = settings.monthlyGoal || 0;
  const t3 = document.getElementById('carousel-goal-title');
  const d3 = document.getElementById('carousel-goal-desc');
  if (t3 && d3) {
    if (goal > 0) {
      const pct = Math.min(100, Math.round(total / goal * 100));
      t3.textContent = tr(`Đã đạt ${pct}% mục tiêu`, `Reached ${pct}% of goal`);
      d3.textContent = tr(`Mục tiêu: ${formatMoney(goal)}`, `Goal: ${formatMoney(goal)}`);
    } else {
      t3.textContent = tr('Chưa đặt mục tiêu', 'No goal set');
      d3.textContent = tr('Nhấn để đặt mục tiêu tháng', 'Tap to set monthly goal');
    }
  }

  renderGoal(total);
  renderRing(total);
  renderAchievementsCard();
  checkReminder();

  const bs = document.getElementById('dash-base-salary'); if (bs) bs.textContent = formatMoney(settings.baseSalary);
  const sd = document.getElementById('dash-standard-days'); if (sd) sd.textContent = settings.standardWorkDays;
  const sc = document.getElementById('dash-shift-count'); if (sc) sc.textContent = logs.length;
  updateMoneySub();
}
function countUp(el, endValue) {
  if (!el) return;
  const start = 0;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / 800, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatMoney(start + (endValue - start) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  el.classList.remove('updated'); void el.offsetWidth; el.classList.add('updated');
  setTimeout(() => el.classList.remove('updated'), 500);
}
function renderGoal(currentSalary) {
  const body = document.getElementById('goal-body');
  if (!body) return;
  const goal = settings.monthlyGoal || 0;
  if (!goal) {
    body.innerHTML = `<p class="text-muted" style="font-size:13px;text-align:center;padding:8px 0;">${tr('Chưa đặt mục tiêu. Nhấn nút sửa để đặt.','No goal set. Tap edit to set.')}</p>`;
    return;
  }
  const pct = Math.min((currentSalary / goal) * 100, 100);
  const achieved = currentSalary >= goal;
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:700;">
      <span>${formatMoney(currentSalary)}</span><span>${Math.round(pct)}%</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--text-3);">
      <span>${tr('Mục tiêu:','Goal:')} <strong style="color:var(--text-2);">${formatMoney(goal)}</strong></span>
      ${achieved
        ? `<span style="color:#22C55E;font-weight:700;">✓ ${tr('Đạt mục tiêu!','Goal reached!')}</span>`
        : `<span>${tr('Còn:','Remaining:')} <strong style="color:var(--text-2);">${formatMoney(goal - currentSalary)}</strong></span>`}
    </div>`;
  if (achieved && !goalCelebrated) { goalCelebrated = true; launchConfetti(); }
  else if (!achieved) goalCelebrated = false;
}
function renderRing(total) {
  const ring = document.getElementById('dash-progress-ring');
  const pctEl = document.getElementById('dash-progress-percent');
  const projEl = document.getElementById('dash-projected-salary');
  const remEl = document.getElementById('dash-days-remaining');
  if (!ring) return;
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dom = now.getDate();
  const perc = Math.min((dom / dim) * 100, 100);
  const displayPerc = Math.max(perc, 2);
  if (pctEl) pctEl.textContent = Math.round(perc) + '%';
  ring.setAttribute('stroke-dashoffset', 289 - (displayPerc / 100) * 289);
  const logs = getLogsByMonth(now.getMonth() + 1, now.getFullYear());
  const current = logs.reduce((s, l) => s + (l.totalPay || 0), 0);
  const avg = logs.length > 0 ? current / logs.length : 0;
  const rem = dim - dom;
  const proj = current + avg * rem;
  if (projEl) projEl.textContent = formatMoney(proj);
  if (remEl) remEl.textContent = rem;
}
function renderAchievementsCard() {
  const card = document.getElementById('achievements-card');
  const list = document.getElementById('achievements-list');
  if (!card || !list) return;
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const c = new Date(today);
  for (let i = 0; i < 365; i++) {
    const ds = dateToStr(c);
    if (workLogs.some(l => l.date === ds)) { streak++; c.setDate(c.getDate() - 1); }
    else if (i === 0 && isAbsentDay(ds)) { c.setDate(c.getDate() - 1); }
    else break;
  }
  if (streak > _lastAchievementStreak && [3, 7, 14, 30, 60, 100].includes(streak)) {
    toast(tr(`🔥 Streak ${streak} ngày liên tiếp!`, `🔥 ${streak}-day streak!`), 'success');
    launchConfetti();
  }
  _lastAchievementStreak = streak;
  const totalAll = workLogs.length;
  const monthMap = {};
  workLogs.forEach(l => {
    const d = new Date(l.date);
    const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    monthMap[k] = (monthMap[k] || 0) + (l.totalPay || 0);
  });
  let bestKey = '', bestVal = 0;
  Object.entries(monthMap).forEach(([k, v]) => { if (v > bestVal) { bestVal = v; bestKey = k; } });
  const items = [];
  if (streak >= 3) items.push({ icon: 'i-flame', name: tr(`Chuỗi ${streak} ngày`, `${streak}-day streak`), sub: tr('Streak hiện tại','Current streak') });
  if (totalAll >= 10) items.push({ icon: 'i-book', name: tr(`${totalAll} ngày tổng`, `${totalAll} total days`), sub: tr('Tổng chấm công','Total check-ins') });
  if (bestVal > 0) items.push({ icon: 'i-trophy', name: formatMoney(bestVal), sub: tr(`Tháng tốt nhất: ${bestKey}`, `Best month: ${bestKey}`) });
  if (items.length === 0) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  list.innerHTML = items.map(i => `
    <div class="ach-item">
      <div class="ach-icon"><svg width="20" height="20"><use href="#${i.icon}"/></svg></div>
      <div class="ach-info"><div class="ach-name">${i.name}</div><div class="ach-sub">${i.sub}</div></div>
    </div>`).join('');
}
function checkReminder() {
  const b = document.getElementById('reminder-banner');
  if (!b) return;
  if (!settings.reminders) { b.classList.add('hidden'); return; }
  const ts = todayStr();
  const hour = new Date().getHours();
  if (!getLogByDate(ts) && !isAbsentDay(ts) && hour >= 20) b.classList.remove('hidden');
  else b.classList.add('hidden');
}
function launchConfetti() {
  if (window.Effects && window.Effects.miniConfetti) window.Effects.miniConfetti(innerWidth / 2, innerHeight / 2);
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  const colors = ['#005BAA', '#0073CC', '#FFC933', '#22C55E', '#8B5CF6'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 0.6 + 's';
    c.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    layer.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}
function editGoal() {
  const cur = settings.monthlyGoal || 0;
  const v = prompt(tr('Nhập mục tiêu tháng (đ):', 'Enter monthly goal (VND):'), cur);
  if (v === null) return;
  const parsed = parseInt(v);
  if (isNaN(parsed) || parsed < 0) { toast(tr('Số không hợp lệ','Invalid number'), 'warning'); return; }
  settings.monthlyGoal = parsed;
  saveSettingsToStorage();
  toast(tr('Đã lưu mục tiêu!','Goal saved!'), 'success');
  if (currentPage === 'home') renderHome();
}
function scrollToCard(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.transition = 'box-shadow .3s';
  el.style.boxShadow = '0 0 0 3px #005BAA';
  setTimeout(() => { el.style.boxShadow = ''; }, 1400);
}
function showHelp() { openSheet('sheet-help'); }
function initCarousel() {
  const c = document.getElementById('carousel');
  const dots = document.querySelectorAll('.carousel-dot');
  if (!c || !dots.length) return;
  c.addEventListener('scroll', () => {
    const idx = Math.round(c.scrollLeft / c.offsetWidth);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }, { passive: true });
  dots.forEach((d, i) => d.addEventListener('click', () => c.scrollTo({ left: i * c.offsetWidth, behavior: 'smooth' })));
}

// ═══════════════════════════════════════════════════════════════
// SHEETS
// ═══════════════════════════════════════════════════════════════
function renderWalletSheet() {
  const body = document.getElementById('wallet-body');
  if (!body) return;
  const now = new Date();
  const m = now.getMonth() + 1, y = now.getFullYear();
  const logs = getLogsByMonth(m, y);
  const total = logs.reduce((s, l) => s + (l.totalPay || 0), 0);
  const regTotal = logs.reduce((s, l) => s + (l.regularHours || 0), 0);
  const otTotal = logs.reduce((s, l) => s + (l.overtimeHours || 0), 0);
  body.innerHTML = `
    <div style="text-align:center;padding:16px 0 20px;">
      <div style="font-size:12px;color:var(--text-3);font-weight:700;">${tr('Tổng lương tháng','Total salary in')} ${pad(m)}/${y}</div>
      <div style="font-size:30px;font-weight:800;color:var(--text-1);margin-top:6px;letter-spacing:-1px;">${formatMoney(total)}</div>
    </div>
    <div class="stat-grid" style="margin-bottom:16px;">
      <div class="stat-card"><div class="stat-label">${tr('Ngày công','Work days')}</div><div class="stat-val">${logs.length}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Tổng giờ','Total hours')}</div><div class="stat-val">${(regTotal + otTotal).toFixed(1)}h</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Giờ thường','Regular')}</div><div class="stat-val">${regTotal.toFixed(1)}h</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Tăng ca','Overtime')}</div><div class="stat-val">${otTotal.toFixed(1)}h</div></div>
    </div>
    <div style="background:var(--surface-2);padding:14px;border-radius:16px;margin-bottom:12px;">
      <div style="font-size:13px;font-weight:800;color:var(--text-1);margin-bottom:8px;">${tr('Chi tiết theo ngày','Daily breakdown')}</div>
      ${logs.length === 0
        ? `<p style="text-align:center;color:var(--text-3);font-size:13px;padding:8px 0;">${tr('Chưa có dữ liệu','No data')}</p>`
        : logs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(l => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
            <span style="color:var(--text-2);font-weight:600;">${l.date} · ${tr(l.shift === 'Sáng' ? 'Ca sáng' : 'Ca đêm', l.shift === 'Sáng' ? 'Morning' : 'Night')}</span>
            <span style="font-weight:800;color:var(--text-1);">${formatMoney(l.totalPay)}</span>
          </div>`).join('')}
    </div>
    <button class="btn btn-primary w-full" onclick="closeSheet('sheet-wallet'); switchPage('stats');">${tr('Xem thống kê đầy đủ','View full statistics')}</button>`;
}
function renderChartSheet() {
  const body = document.getElementById('chart-body');
  if (!body) return;
  const now = new Date();
  const m = now.getMonth() + 1, y = now.getFullYear();
  const logs = getLogsByMonth(m, y);
  const dim = new Date(y, m, 0).getDate();
  const data = new Array(dim).fill(0);
  logs.forEach(l => {
    const d = parseInt(l.date.split('-')[2]);
    if (d >= 1 && d <= dim) data[d - 1] = (l.regularHours || 0) + (l.overtimeHours || 0);
  });
  const max = Math.max(...data, 1);
  const avg = logs.length > 0 ? data.reduce((s, v) => s + v, 0) / logs.length : 0;
  body.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:3px;height:160px;padding:16px 8px;background:var(--surface-2);border-radius:16px;margin-bottom:12px;">
      ${data.map((v, i) => {
        const h = v > 0 ? Math.max(6, (v / max) * 100) : 3;
        return `<div style="flex:1;height:${h}px;background:${v > 0 ? 'linear-gradient(180deg, #0073CC, #005BAA)' : 'var(--border)'};border-radius:4px 4px 0 0;" title="Day ${i + 1}: ${v.toFixed(1)}h"></div>`;
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);font-weight:600;margin-bottom:16px;">
      <span>1</span><span>${Math.floor(dim / 2)}</span><span>${dim}</span>
    </div>
    <div class="stat-grid" style="margin-bottom:16px;">
      <div class="stat-card"><div class="stat-label">${tr('Cao nhất','Max')}</div><div class="stat-val">${max.toFixed(1)}h</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Trung bình','Avg')}</div><div class="stat-val">${avg.toFixed(1)}h</div></div>
    </div>
    <button class="btn btn-primary w-full" onclick="closeSheet('sheet-chart'); switchPage('stats');">${tr('Xem thống kê đầy đủ','View full statistics')}</button>`;
}
function renderAchievementsSheet() {
  const body = document.getElementById('ach-body');
  if (!body) return;
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const c = new Date(today);
  for (let i = 0; i < 365; i++) {
    const ds = dateToStr(c);
    if (workLogs.some(l => l.date === ds)) { streak++; c.setDate(c.getDate() - 1); }
    else if (i === 0 && isAbsentDay(ds)) { c.setDate(c.getDate() - 1); }
    else break;
  }
  const totalAll = workLogs.length;
  const monthMap = {};
  workLogs.forEach(l => {
    const d = new Date(l.date);
    const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    monthMap[k] = (monthMap[k] || 0) + (l.totalPay || 0);
  });
  let bestKey = '', bestVal = 0;
  Object.entries(monthMap).forEach(([k, v]) => { if (v > bestVal) { bestVal = v; bestKey = k; } });
  body.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">${tr('Streak hiện tại','Current streak')}</div><div class="stat-val">${streak}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Tổng chấm công','Total check-ins')}</div><div class="stat-val">${totalAll}</div></div>
      <div class="stat-card highlight" style="grid-column:1/-1;">
        <div class="stat-label">${tr('Tháng tốt nhất','Best month')} (${bestKey || '—'})</div>
        <div class="stat-val" style="font-size:24px;">${formatMoney(bestVal)}</div>
      </div>
    </div>`;
}
function renderOTCalcSheet() {
  const body = document.getElementById('ot-calc-body');
  if (!body) return;
  const hourlyRate = (settings.baseSalary / settings.standardWorkDays) / settings.standardShiftHours;
  body.innerHTML = `
    <div style="background:var(--surface-2);padding:16px;border-radius:16px;margin-bottom:16px;text-align:center;">
      <div style="font-size:12px;color:var(--text-3);font-weight:700;">${tr('Lương / giờ','Salary / hour')}</div>
      <div style="font-size:26px;font-weight:800;color:var(--text-1);margin-top:6px;letter-spacing:-1px;">${formatMoney(hourlyRate)}</div>
    </div>
    <div style="font-size:13px;font-weight:800;color:var(--text-1);margin-bottom:12px;">${tr('Bảng quy đổi tăng ca','OT conversion table')}</div>
    <div class="stat-grid" style="margin-bottom:16px;">
      <div class="stat-card"><div class="stat-label">${tr('Thường - Sáng','Normal - Day')}</div><div class="stat-val">${formatMoney(hourlyRate * settings.otNormalDay)}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Thường - Đêm','Normal - Night')}</div><div class="stat-val">${formatMoney(hourlyRate * settings.otNormalNight)}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('CN - Sáng','Sun - Day')}</div><div class="stat-val">${formatMoney(hourlyRate * settings.otSundayDay)}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('CN - Đêm','Sun - Night')}</div><div class="stat-val">${formatMoney(hourlyRate * settings.otSundayNight)}</div></div>
    </div>
    <div style="background:var(--surface-2);padding:14px;border-radius:16px;font-size:12px;color:var(--text-2);line-height:1.7;">
      <strong style="color:var(--text-1);">${tr('Công thức:','Formula:')}</strong> ${tr('Lương/giờ × Hệ số × Số giờ OT','Hourly × Coeff × OT hours')}<br>
      ${tr('Lễ có lương: hệ số','Paid holiday: coeff')} ×${settings.otHoliday}
    </div>`;
}
function renderHelpSheet() {
  const body = document.getElementById('help-body');
  if (!body) return;
  body.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#005BAA,#003B71);display:inline-flex;align-items:center;justify-content:center;color:#FFC933;margin-bottom:12px;box-shadow:0 8px 24px rgba(0,91,170,.28);">
        <svg width="32" height="32"><use href="#i-help"/></svg>
      </div>
      <div style="font-size:16px;font-weight:800;color:var(--text-1);">TimeTracker v${APP_VERSION}</div>
      <div style="font-size:12px;color:var(--text-3);margin-top:4px;font-weight:600;">${tr('Chấm công & Lương','Time & Salary')}</div>
    </div>
    <div style="background:var(--surface-2);border-radius:16px;padding:16px;margin-bottom:12px;">
      <div style="font-size:13px;font-weight:800;color:var(--text-1);margin-bottom:12px;">📌 ${tr('Thao tác cơ bản','Basic actions')}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:var(--primary);font-weight:800;min-width:20px;">1.</span>
          <span>${tr('Nhấn <strong style="color:var(--text-1);">Chấm công</strong> trên trang chủ','Tap <strong style="color:var(--text-1);">Check in</strong> on home')}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:var(--primary);font-weight:800;min-width:20px;">2.</span>
          <span>${tr('Xem lịch dương và âm ở tab <strong style="color:var(--text-1);">Lịch</strong>','View solar & lunar in <strong style="color:var(--text-1);">Calendar</strong> tab')}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:var(--primary);font-weight:800;min-width:20px;">3.</span>
          <span>${tr('Xuất ảnh bảng công ở tab <strong style="color:var(--text-1);">Thống kê</strong>','Export worklog image in <strong style="color:var(--text-1);">Stats</strong> tab')}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:var(--primary);font-weight:800;min-width:20px;">4.</span>
          <span>${tr('Cấu hình lương, PIN ở menu <strong style="color:var(--text-1);">góc phải</strong>','Configure salary, PIN in <strong style="color:var(--text-1);">top right</strong> menu')}</span>
        </div>
      </div>
    </div>
    <div style="background:var(--surface-2);border-radius:16px;padding:16px;margin-bottom:12px;">
      <div style="font-size:13px;font-weight:800;color:var(--text-1);margin-bottom:12px;">💡 ${tr('Mẹo hay','Tips')}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:#FFB800;font-weight:800;min-width:20px;">•</span>
          <span>${tr('Nhấn vào <strong style="color:var(--text-1);">tên ở menu</strong> để đổi tên hiển thị','Tap <strong style="color:var(--text-1);">name in menu</strong> to change display name')}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:#FFB800;font-weight:800;min-width:20px;">•</span>
          <span>${tr('Nhấn <strong style="color:var(--text-1);">icon mắt</strong> để ẩn/hiện số dư','Tap <strong style="color:var(--text-1);">eye icon</strong> to hide/show balance')}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:#FFB800;font-weight:800;min-width:20px;">•</span>
          <span>${tr('<strong style="color:var(--text-1);">Vuốt ngang lịch</strong> để chuyển tháng','<strong style="color:var(--text-1);">Swipe calendar</strong> to change month')}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:13px;color:var(--text-2);line-height:1.5;">
          <span style="color:#FFB800;font-weight:800;min-width:20px;">•</span>
          <span>${tr('Phím tắt: <strong style="color:var(--text-1);">1-4</strong> chuyển tab · <strong style="color:var(--text-1);">N</strong> chấm nhanh · <strong style="color:var(--text-1);">ESC</strong> đóng','Shortcuts: <strong style="color:var(--text-1);">1-4</strong> switch tabs · <strong style="color:var(--text-1);">N</strong> quick check-in · <strong style="color:var(--text-1);">ESC</strong> close')}</span>
        </div>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,#005BAA,#003B71);border-radius:16px;padding:16px;text-align:center;color:#FFF;">
      <div style="font-size:12px;opacity:.8;font-weight:600;">${tr('Dữ liệu của bạn','Your data')}</div>
      <div style="font-size:14px;font-weight:800;margin-top:4px;">${tr('Được lưu an toàn trên thiết bị','Safely stored on device')}</div>
      <div style="font-size:11px;opacity:.7;margin-top:8px;">${tr('Không gửi lên server · Hoạt động offline','No server · Works offline')}</div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:11px;color:var(--text-3);font-weight:600;">TimeTracker v${APP_VERSION}</div>`;
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════
function switchCalTab(tab) {
  calTab = tab;
  document.querySelectorAll('.cal-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderCalendar();
}
function initLunarState() {
  if (calLunarMonth !== null) return;
  const now = new Date();
  const l = LunarEngine.toLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  calLunarMonth = l.month; calLunarYear = l.year;
}
function renderCalendar() {
  if (calTab === 'lunar') renderLunarTab();
  else renderSolarTab();
}
function getCellHours(log) {
  if (!log) return '';
  const ot = log.overtimeHours || 0;
  if (ot === 0) return '';
  return ot.toFixed(2).replace(/\.?0+$/, '') + 'h';
}
function renderSolarTab() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const title = document.getElementById('cal-title');
  if (title) title.textContent = tr(`Tháng ${calMonth}, ${calYear}`, `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calMonth-1]} ${calYear}`);
  const first = new Date(calYear, calMonth - 1, 1);
  const startDow = first.getDay();
  const dim = new Date(calYear, calMonth, 0).getDate();
  const prevDim = new Date(calYear, calMonth - 1, 0).getDate();
  const ts = todayStr();
  let html = '';
  ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(w => html += `<div class="cal-wd">${tr(w, ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][['CN','T2','T3','T4','T5','T6','T7'].indexOf(w)])}</div>`);
  for (let i = startDow - 1; i >= 0; i--) html += `<div class="cal-day other-month">${prevDim - i}</div>`;
  for (let d = 1; d <= dim; d++) {
    const ds = `${calYear}-${pad(calMonth)}-${pad(d)}`;
    const isSun = new Date(calYear, calMonth - 1, d).getDay() === 0;
    const isToday = ds === ts;
    const log = getLogByDate(ds);
    const absent = isAbsentDay(ds);
    const paid = HolidayResolver.getPaidHoliday(ds);
    const anyH = HolidayResolver.getSolarDayHolidays(ds)[0];
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (log) {
      if (paid) cls += ' done-holiday';
      else if (isSun) cls += ' done-sunday';
      else cls += ' done-normal';
    } else if (absent) cls += ' absent';
    else if (isSun) cls += ' sunday';
    else if (paid || anyH) cls += ' has-holiday';
    const hours = getCellHours(log);
    const dot = getNote(ds) ? '<div class="cal-note-dot"></div>' : '';
    html += `<div class="${cls}" onclick="showCalDetail('${ds}')" role="button" tabindex="0">${d}${hours ? `<div class="cal-hours">${hours}</div>` : ''}${dot}</div>`;
  }
  const total = startDow + dim;
  const fill = (7 - total % 7) % 7;
  for (let i = 1; i <= fill; i++) html += `<div class="cal-day other-month">${i}</div>`;
  grid.innerHTML = html;
  attachCalendarSwipe();
}
function renderLunarTab() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  initLunarState();
  const canChi = LunarEngine.getCanChi(calLunarYear);
  const title = document.getElementById('cal-title');
  if (title) title.textContent = tr(`Tháng ${calLunarMonth} — ${canChi}`, `Month ${calLunarMonth} — ${canChi}`);
  const days = LunarEngine.getLunarMonthDays(calLunarMonth, calLunarYear);
  if (days.length === 0) {
    grid.innerHTML = `<p class="empty" style="grid-column:1/-1;">${tr('Không có dữ liệu','No data')}</p>`;
    return;
  }
  let prevM = calLunarMonth - 1, prevY = calLunarYear;
  if (prevM < 1) { prevM = 12; prevY--; }
  const prevLen = LunarEngine.getLunarMonthDays(prevM, prevY).length;
  const firstSolar = days[0];
  const firstDow = new Date(firstSolar.solarYear, firstSolar.solarMonth - 1, firstSolar.solarDay).getDay();
  const ts = todayStr();
  let html = '';
  ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(w => html += `<div class="cal-wd">${tr(w, ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][['CN','T2','T3','T4','T5','T6','T7'].indexOf(w)])}</div>`);
  for (let i = firstDow - 1; i >= 0; i--) html += `<div class="cal-day other-month">${prevLen - i}</div>`;
  days.forEach(d => {
    const solarDs = `${d.solarYear}-${pad(d.solarMonth)}-${pad(d.solarDay)}`;
    const isSun = new Date(d.solarYear, d.solarMonth - 1, d.solarDay).getDay() === 0;
    const isToday = solarDs === ts;
    const log = getLogByDate(solarDs);
    const absent = isAbsentDay(solarDs);
    const lHols = HolidayResolver.getLunarDayHolidays(d.lunarDay, calLunarMonth, calLunarYear);
    const paid = lHols.find(h => h.paid);
    const main = paid || lHols[0];
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (log) {
      if (paid) cls += ' done-holiday';
      else if (isSun) cls += ' done-sunday';
      else cls += ' done-normal';
    } else if (absent) cls += ' absent';
    else if (isSun) cls += ' sunday';
    else if (main) cls += ' has-holiday';
    const hours = getCellHours(log);
    const dot = getNote(solarDs) ? '<div class="cal-note-dot"></div>' : '';
    html += `<div class="${cls}" onclick="showCalDetail('${solarDs}')" role="button" tabindex="0">${d.lunarDay}${hours ? `<div class="cal-hours">${hours}</div>` : ''}${dot}</div>`;
  });
  const total = firstDow + days.length;
  const fill = (7 - total % 7) % 7;
  for (let i = 1; i <= fill; i++) html += `<div class="cal-day other-month">${i}</div>`;
  grid.innerHTML = html;
  attachCalendarSwipe();
}
let _swipeStartX = 0;
function attachCalendarSwipe() {
  const grid = document.getElementById('cal-grid');
  if (!grid || grid.dataset.swipeAttached) return;
  grid.dataset.swipeAttached = '1';
  grid.addEventListener('touchstart', e => { _swipeStartX = e.touches[0].clientX; }, { passive: true });
  grid.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    if (Math.abs(dx) > 60) { if (dx > 0) calPrev(); else calNext(); }
  }, { passive: true });
}
function calPrev() {
  if (calTab === 'lunar') { initLunarState(); calLunarMonth--; if (calLunarMonth < 1) { calLunarMonth = 12; calLunarYear--; } }
  else { calMonth--; if (calMonth < 1) { calMonth = 12; calYear--; } }
  renderCalendar();
}
function calNext() {
  if (calTab === 'lunar') { initLunarState(); calLunarMonth++; if (calLunarMonth > 12) { calLunarMonth = 1; calLunarYear++; } }
  else { calMonth++; if (calMonth > 12) { calMonth = 1; calYear++; } }
  renderCalendar();
}
function calToday() {
  const now = new Date();
  calMonth = now.getMonth() + 1; calYear = now.getFullYear();
  const l = LunarEngine.toLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  calLunarMonth = l.month; calLunarYear = l.year;
  renderCalendar();
}

// ═══════════════════════════════════════════════════════════════
// DAY DETAIL
// ═══════════════════════════════════════════════════════════════
function showCalDetail(ds) {
  const detail = document.getElementById('cal-detail');
  const body = document.getElementById('cal-detail-body');
  const title = document.getElementById('cal-detail-title');
  if (!detail || !body) return;
  const log = getLogByDate(ds);
  const absent = isAbsentDay(ds);
  const note = getNote(ds);
  const [y, m, d] = ds.split('-').map(Number);
  const lunar = LunarEngine.toLunar(d, m, y);
  const holidays = HolidayResolver.getSolarDayHolidays(ds);
  if (title) title.textContent = `${pad(d)}/${pad(m)}/${y}`;
  let html = `<div style="background:var(--surface-2);padding:12px 14px;border-radius:16px;margin-bottom:12px;">
    <div style="font-size:11px;color:var(--text-3);font-weight:700;">${tr('ÂM LỊCH','LUNAR')}</div>
    <div style="font-size:14px;font-weight:800;margin-top:4px;color:var(--text-1);">${lunar.day}/${lunar.month}${lunar.leap ? ' (nhuận)' : ''} · ${lunar.canChi}</div>
  </div>`;
  holidays.forEach(h => {
    html += `<div style="background:var(--surface-2);padding:14px;border-radius:16px;margin-bottom:10px;${h.paid ? 'border-left:3px solid #005BAA;' : ''}">
      <div style="font-size:11px;color:var(--text-3);font-weight:700;">${tr('Lễ','Holiday')} ${h.system === 'solar' ? tr('Dương','Solar') : h.system === 'lunar' ? tr('Âm','Lunar') : tr('Định kỳ','Recurring')}</div>
      <div style="font-size:16px;font-weight:800;margin-top:4px;color:var(--text-1);">${h.icon || ''} ${h.name}</div>
      ${h.paid ? `<div style="font-size:12px;color:#005BAA;font-weight:700;margin-top:4px;">${tr('Lễ có lương','Paid holiday')} — x${settings.otHoliday}</div>` : ''}
    </div>`;
  });
  if (log) {
    html += `<div class="stat-grid" style="margin-bottom:12px;">
      <div class="stat-card"><div class="stat-label">${tr('Ca','Shift')}</div><div class="stat-val">${tr(log.shift === 'Sáng' ? 'Ca sáng' : 'Ca đêm', log.shift === 'Sáng' ? 'Morning' : 'Night')}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Loại','Type')}</div><div class="stat-val" style="font-size:16px;">${log.isSunday ? 'CN' : tr('Thường','Normal')}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Vào → Ra','In → Out')}</div><div class="stat-val" style="font-size:14px;">${log.start}→${log.end}</div></div>
      <div class="stat-card"><div class="stat-label">${tr('Tiền','Pay')}</div><div class="stat-val" style="font-size:14px;">${formatMoney(log.totalPay)}</div></div>
    </div>
    <div class="form-group"><label for="cal-note-input">${tr('Ghi chú','Note')}</label><input type="text" id="cal-note-input" class="form-control" value="${note.replace(/"/g, '&quot;')}" placeholder="${tr('Thêm ghi chú...','Add note...')}" maxlength="100"></div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-primary" style="flex:1;" onclick="saveCalNote('${ds}')">${tr('Lưu ghi chú','Save note')}</button>
      <button class="btn" style="flex:1;background:var(--danger-light);color:var(--danger);" onclick="deleteWorkLog(${log.id})">${tr('Xóa','Delete')}</button>
    </div>`;
  } else if (absent) {
    html += `<p style="padding:16px;background:repeating-linear-gradient(45deg,var(--surface-2),var(--surface-2) 8px,var(--surface-3) 8px,var(--surface-3) 16px);color:var(--text-3);border-radius:16px;font-weight:700;margin-bottom:12px;text-align:center;">${tr('Đã xác nhận nghỉ','Marked as absent')}</p>
    <button class="btn btn-primary w-full" onclick="quickAddDay('${ds}')">${tr('Thêm chấm công','Add work log')}</button>`;
  } else {
    html += `<p class="text-muted" style="margin-bottom:12px;text-align:center;">${tr('Chưa có dữ liệu','No data')}</p>
    <button class="btn btn-primary w-full" onclick="quickAddDay('${ds}')">${tr('Thêm chấm công','Add work log')}</button>`;
  }
  body.innerHTML = html;
  detail.classList.add('open');
}
function closeCalDetail() { const el = document.getElementById('cal-detail'); if (el) el.classList.remove('open'); }
function saveCalNote(ds) {
  const input = document.getElementById('cal-note-input');
  if (!input) return;
  setNote(ds, input.value);
  toast(tr('Đã lưu ghi chú!','Note saved!'), 'success');
  closeCalDetail();
  if (currentPage === 'calendar') renderCalendar();
}
function quickAddDay(ds) {
  closeCalDetail();
  switchPage('worklog');
  const wd = document.getElementById('worklog-date');
  if (wd) { wd.value = ds; autoDetectSunday(); }
}
function deleteWorkLog(id) {
  const log = workLogs.find(l => l.id === id);
  if (!log) return;
  _deletedSnapshot = { log: { ...log }, notes: getNote(log.date) };
  workLogs = workLogs.filter(l => l.id !== id);
  saveWorkLogsData();
  closeCalDetail();
  toast(tr('Đã xóa','Deleted'), 'success', {
    label: tr('Hoàn tác','Undo'),
    onClick: () => {
      if (_deletedSnapshot) {
        workLogs.push(_deletedSnapshot.log);
        if (_deletedSnapshot.notes) setNote(_deletedSnapshot.log.date, _deletedSnapshot.notes);
        saveWorkLogsData();
        toast(tr('Đã hoàn tác','Undone'), 'success');
        refreshCurrentPage();
        _deletedSnapshot = null;
      }
    }
  });
  refreshCurrentPage();
}

// ═══════════════════════════════════════════════════════════════
// WORKLOG
// ═══════════════════════════════════════════════════════════════
function setToday() {
  const wd = document.getElementById('worklog-date');
  if (wd) { wd.value = todayStr(); autoDetectSunday(); }
}
function autoDetectSunday() {
  const wd = document.getElementById('worklog-date');
  const wt = document.getElementById('worklog-type');
  if (!wd || !wt || !wd.value) return;
  const dow = new Date(wd.value + 'T00:00:00').getDay();
  wt.value = dow === 0 ? 'sunday' : 'normal';
  onShiftChange();
}
function onShiftChange() {
  const shiftEl = document.getElementById('worklog-shift');
  const startEl = document.getElementById('worklog-start');
  const endEl = document.getElementById('worklog-end');
  if (!shiftEl || !startEl || !endEl) return;
  const s = shiftEl.value;
  startEl.value = s === 'Sáng' ? settings.morningStart : settings.nightStart;
  endEl.value = s === 'Sáng' ? settings.morningEnd : settings.nightEnd;
  previewWorkLog();
}
function previewWorkLog() {
  const wd = document.getElementById('worklog-date');
  const ws = document.getElementById('worklog-shift');
  const wt = document.getElementById('worklog-type');
  const wst = document.getElementById('worklog-start');
  const wen = document.getElementById('worklog-end');
  if (!wd || !ws || !wt || !wst || !wen) return;
  if (!wd.value || !wst.value || !wen.value) return;
  const c = calculateWorkLog(wd.value, ws.value, wt.value === 'sunday', wst.value, wen.value);
  const pr = document.getElementById('preview-regular'); if (pr) pr.textContent = c.regularHours.toFixed(2) + 'h';
  const po = document.getElementById('preview-ot'); if (po) po.textContent = c.overtimeHours.toFixed(2) + 'h';
  const pp = document.getElementById('preview-pay'); if (pp) pp.textContent = formatMoney(c.totalPay);
  saveDraft();
}
function saveDraft() {
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(() => {
    try {
      const draft = {
        date: document.getElementById('worklog-date')?.value,
        shift: document.getElementById('worklog-shift')?.value,
        type: document.getElementById('worklog-type')?.value,
        start: document.getElementById('worklog-start')?.value,
        end: document.getElementById('worklog-end')?.value,
        note: document.getElementById('worklog-note')?.value
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      const hint = document.getElementById('draft-hint');
      if (hint) { hint.style.display = 'block'; setTimeout(() => { hint.style.display = 'none'; }, 2000); }
    } catch (e) {}
  }, 800);
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || !d.date) return;
    if (d.date === todayStr()) return;
    if (confirm(tr('Khôi phục bản nháp đã lưu?','Restore saved draft?'))) {
      const g = id => document.getElementById(id);
      if (g('worklog-date')) g('worklog-date').value = d.date;
      if (g('worklog-shift')) g('worklog-shift').value = d.shift || 'Sáng';
      if (g('worklog-type')) g('worklog-type').value = d.type || 'normal';
      if (g('worklog-start')) g('worklog-start').value = d.start || settings.morningStart;
      if (g('worklog-end')) g('worklog-end').value = d.end || settings.morningEnd;
      if (g('worklog-note')) g('worklog-note').value = d.note || '';
      previewWorkLog();
    }
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {}
}
function addWorkLog() {
  const wd = document.getElementById('worklog-date');
  const ws = document.getElementById('worklog-shift');
  const wt = document.getElementById('worklog-type');
  const wst = document.getElementById('worklog-start');
  const wen = document.getElementById('worklog-end');
  const wn = document.getElementById('worklog-note');
  if (!wd || !ws || !wt || !wst || !wen) return;
  const ds = wd.value;
  if (!ds) { toast(tr('Chọn ngày','Choose date'), 'warning'); return; }
  if (!wst.value || !wen.value) { toast(tr('Chọn giờ vào/ra','Choose in/out time'), 'warning'); return; }
  const shift = ws.value;
  const isSun = wt.value === 'sunday';
  const start = wst.value, end = wen.value;
  const note = wn ? wn.value : '';
  const existing = getLogByDate(ds);
  if (existing && !confirm(tr('Ngày này đã có bản ghi. Ghi đè?','This day already has a record. Overwrite?'))) return;
  if (existing) workLogs = workLogs.filter(l => l.id !== existing.id);
  unmarkAbsentDay(ds);
  const c = calculateWorkLog(ds, shift, isSun, start, end);
  workLogs.push({
    id: Date.now(), date: ds, shift, isSunday: isSun, start, end,
    regularHours: c.regularHours, overtimeHours: c.overtimeHours,
    totalPay: c.totalPay, isPaidHoliday: c.isPaidHoliday, note: note || ''
  });
  saveWorkLogsData();
  setNote(ds, note);
  if (c.isPaidHoliday) toast(tr('✅ Chấm công ngày lễ ' + c.holiday.name, '✅ Holiday check-in: ' + c.holiday.name), 'success');
  else toast(tr('✅ Đã lưu chấm công!','✅ Work log saved!'), 'success');
  haptic(); playSound();
  if (wn) wn.value = '';
  localStorage.removeItem(DRAFT_KEY);
  loadWorkLogTable();
  checkQuota();
}
function applyWorklogMonthFilter() {
  const mSel = document.getElementById('worklog-month-select');
  const yInp = document.getElementById('worklog-year-input');
  if (!mSel || !yInp) return;
  if (!mSel.options.length) {
    let opts = '';
    for (let i = 1; i <= 12; i++) opts += `<option value="${i}">${tr('Tháng','Month')} ${i}</option>`;
    mSel.innerHTML = opts;
    const now = new Date();
    mSel.value = now.getMonth() + 1;
    yInp.value = now.getFullYear();
  }
  const wd = document.getElementById('worklog-date');
  if (wd && !wd.value) { wd.value = todayStr(); autoDetectSunday(); }
  viewMonth = parseInt(mSel.value) || new Date().getMonth() + 1;
  viewYear = parseInt(yInp.value) || new Date().getFullYear();
  loadWorkLogTable();
  const t = document.getElementById('worklog-month-title');
  if (t) t.textContent = tr(`Bản ghi tháng ${pad(viewMonth)}/${viewYear}`, `Records ${pad(viewMonth)}/${viewYear}`);
}
function loadWorkLogTable() {
  const c = document.getElementById('worklog-list-container');
  if (!c) return;
  const logs = getLogsByMonth(viewMonth, viewYear).sort((a, b) => b.date.localeCompare(a.date));
  if (logs.length === 0) {
    c.innerHTML = `<p class="empty"><svg><use href="#i-file"/></svg>${tr('Chưa có bản ghi tháng này','No records this month')}</p>`;
    return;
  }
  c.innerHTML = logs.map(l => {
    const ot = (l.overtimeHours || 0) > 0 ? ` + ${l.overtimeHours}h OT` : '';
    const shiftName = tr(l.shift === 'Sáng' ? 'Ca sáng' : 'Ca đêm', l.shift === 'Sáng' ? 'Morning' : 'Night');
    return `<div class="log-row">
      <div class="log-main">
        <div class="log-date">${l.date}${l.isSunday ? ' · CN' : ''}${l.isPaidHoliday ? ' · ' + tr('Lễ','Holiday') : ''}</div>
        <div class="log-meta">${shiftName} · ${l.start}→${l.end} · ${l.regularHours}h${ot}</div>
      </div>
      <div class="log-pay">${formatMoney(l.totalPay)}</div>
      <button class="log-del" onclick="deleteWorkLog(${l.id})" aria-label="${tr('Xóa','Delete')}">×</button>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// STATS (Fixed Chart Height)
// ═══════════════════════════════════════════════════════════════
function loadStats() {
  const mSel = document.getElementById('stat-month-select');
  const yInp = document.getElementById('stat-year-input');
  const c = document.getElementById('statistics-content');
  const skel = document.getElementById('stats-skeleton');
  if (!mSel || !yInp || !c) return;
  if (!mSel.options.length) {
    let opts = '';
    for (let i = 1; i <= 12; i++) opts += `<option value="${i}">${tr('Tháng','Month')} ${i}</option>`;
    mSel.innerHTML = opts;
    const now = new Date();
    mSel.value = now.getMonth() + 1;
    yInp.value = now.getFullYear();
  }
  statMonth = parseInt(mSel.value) || new Date().getMonth() + 1;
  statYear = parseInt(yInp.value) || new Date().getFullYear();
  if (skel) skel.style.display = 'block';
  setTimeout(() => {
    const logs = getLogsByMonth(statMonth, statYear);
    if (skel) skel.style.display = 'none';
    if (logs.length === 0) {
      c.innerHTML = `<p class="empty"><svg><use href="#i-chart"/></svg>${tr('Không có dữ liệu tháng này','No data this month')}</p>`;
      renderDailyChart([], statMonth, statYear);
      renderShiftChart(0, 0);
      renderTrendChart();
      return;
    }
    const totalDays = logs.length;
    const morning = logs.filter(l => l.shift === 'Sáng').length;
    const night = logs.filter(l => l.shift === 'Đêm').length;
    let regH = 0, otH = 0, sunOT = 0, totalSal = 0;
    logs.forEach(l => {
      regH += l.regularHours || 0;
      otH += l.overtimeHours || 0;
      totalSal += l.totalPay || 0;
      if (l.isSunday) sunOT += l.overtimeHours || 0;
    });
    c.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card highlight" style="grid-column:1/-1;padding:20px;">
          <div class="stat-label">${tr('Tổng thu nhập','Total income')}</div>
          <div class="stat-val" style="font-size:26px;">${formatMoney(totalSal)}</div>
        </div>
        <div class="stat-card"><div class="stat-label">${tr('Ngày công','Work days')}</div><div class="stat-val">${totalDays}</div></div>
        <div class="stat-card"><div class="stat-label">${tr('Giờ thường','Regular')}</div><div class="stat-val">${regH.toFixed(1)}h</div></div>
        <div class="stat-card"><div class="stat-label">${tr('Tổng tăng ca','Total OT')}</div><div class="stat-val">${otH.toFixed(1)}h</div></div>
        <div class="stat-card"><div class="stat-label">${tr('TC Chủ nhật','Sun OT')}</div><div class="stat-val">${sunOT.toFixed(1)}h</div></div>
        <div class="stat-card"><div class="stat-label">${tr('Ca sáng','Day shifts')}</div><div class="stat-val">${morning}</div></div>
        <div class="stat-card"><div class="stat-label">${tr('Ca đêm','Night shifts')}</div><div class="stat-val">${night}</div></div>
      </div>`;
    renderDailyChart(logs, statMonth, statYear);
    renderShiftChart(morning, night);
    renderTrendChart();
  }, 50);
}

function renderDailyChart(logs, m, y) {
  const el = document.getElementById('chart-daily');
  if (!el) return;
  if (logs.length === 0) {
    el.innerHTML = `<p class="empty"><svg><use href="#i-chart"/></svg>${tr('Không có dữ liệu','No data')}</p>`;
    return;
  }
  const days = new Date(y || calYear, m || calMonth, 0).getDate();
  const data = new Array(days).fill(0);
  logs.forEach(l => {
    const d = new Date(l.date).getDate();
    if (d >= 1 && d <= days) data[d - 1] = (l.regularHours || 0) + (l.overtimeHours || 0);
  });
  const max = Math.max(...data, 1);
  
  // Dùng px thay vì % để đảm bảo hiển thị đúng
  el.innerHTML = `<div style="display:flex;align-items:flex-end;gap:3px;height:140px;padding-top:20px;">
    ${data.map((v, i) => {
      const h = v > 0 ? Math.max(8, (v / max) * 100) : 4;
      return `<div class="chart-bar" style="height:${h}px;background:${v > 0 ? 'linear-gradient(180deg, #0073CC, #005BAA)' : 'var(--border)'};" title="${tr('Ngày','Day')} ${i + 1}: ${v.toFixed(1)}h"></div>`;
    }).join('')}
  </div>`;
}

function renderShiftChart(morning, night) {
  const el = document.getElementById('chart-shifts');
  if (!el) return;
  const total = morning + night;
  if (total === 0) {
    el.innerHTML = `<p class="empty"><svg><use href="#i-pie"/></svg>${tr('Không có dữ liệu','No data')}</p>`;
    return;
  }
  const mPct = morning / total;
  el.innerHTML = `<div style="display:flex;align-items:center;gap:20px;justify-content:center;padding:10px 0;">
    <div style="position:relative;width:140px;height:140px;">
      <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);">
        <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border)" stroke-width="22"/>
        <circle cx="70" cy="70" r="58" fill="none" stroke="#005BAA" stroke-width="22"
                stroke-dasharray="${(2 * Math.PI * 58 * mPct)} ${2 * Math.PI * 58}" stroke-linecap="round"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:var(--text-1);">${total}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border-radius:4px;background:#005BAA;"></span><span style="font-size:13px;color:var(--text-2);font-weight:600;">${tr('Sáng','Day')}: <strong style="color:var(--text-1);">${morning}</strong> (${Math.round(mPct * 100)}%)</span></div>
      <div style="display:flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border-radius:4px;background:var(--border);"></span><span style="font-size:13px;color:var(--text-2);font-weight:600;">${tr('Đêm','Night')}: <strong style="color:var(--text-1);">${night}</strong> (${Math.round((1 - mPct) * 100)}%)</span></div>
    </div>
  </div>`;
}

function renderTrendChart() {
  const el = document.getElementById('chart-trend');
  if (!el) return;
  const now = new Date();
  const pts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1, y = d.getFullYear();
    const total = getLogsByMonth(m, y).reduce((s, l) => s + (l.totalPay || 0), 0);
    pts.push({ label: `${m}/${String(y).slice(-2)}`, value: total });
  }
  const max = Math.max(...pts.map(p => p.value), 1);
  
  // Dùng px thay vì % để đảm bảo hiển thị đúng
  el.innerHTML = `<div style="display:flex;align-items:flex-end;gap:6px;height:140px;padding-top:20px;">
    ${pts.map(p => {
      const h = p.value > 0 ? Math.max(8, (p.value / max) * 100) : 4;
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%;">
        <div class="chart-bar" style="width:100%;height:${h}px;background:${p.value > 0 ? 'linear-gradient(180deg, #0073CC, #005BAA)' : 'var(--border)'};" title="${formatMoney(p.value)}"></div>
        <span style="font-size:10px;color:var(--text-3);font-weight:600;margin-top:auto;">${p.label}</span>
      </div>`;
    }).join('')}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT / PRINT / COPY / SHARE
// ═══════════════════════════════════════════════════════════════
function buildExportRows() {
  const mSel = document.getElementById('stat-month-select');
  const yInp = document.getElementById('stat-year-input');
  const m = mSel ? parseInt(mSel.value) : new Date().getMonth() + 1;
  const y = yInp ? parseInt(yInp.value) : new Date().getFullYear();
  const logs = getLogsByMonth(m, y).sort((a, b) => a.date.localeCompare(b.date));
  const rows = logs.map(l => ({
    date: l.date, shift: l.shift,
    type: l.isSunday ? tr('Chủ nhật','Sunday') : tr('Thường','Normal'),
    start: l.start, end: l.end,
    reg: (l.regularHours || 0).toFixed(2), ot: (l.overtimeHours || 0).toFixed(2),
    note: getNote(l.date) || ''
  }));
  return { rows, m, y };
}
async function exportImage() {
  if (typeof html2canvas === 'undefined' || typeof ImageExporter === 'undefined') {
    toast(tr('Thư viện xuất ảnh chưa tải, vui lòng thử lại', 'Export library not loaded, please try again'), 'danger');
    return;
  }
  const { rows, m, y } = buildExportRows();
  if (rows.length === 0) { toast(tr('Không có dữ liệu tháng này','No data this month'), 'warning'); return; }
  const btn = document.getElementById('image-export-btn');
  const orig = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ ' + tr('Đang xuất...', 'Exporting...'); }
  try {
    const filename = await ImageExporter.exportImage({ rows, month: m, year: y, settings, appVersion: APP_VERSION });
    toast(tr('✅ Đã xuất ','✅ Exported ') + filename, 'success');
    haptic(); playSound();
  } catch (err) {
    console.error(err);
    toast(tr('Lỗi: ','Error: ') + (err.message || err), 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = orig; }
  }
}
function printTable() { window.print(); }
function copyMarkdown() {
  const { rows, m, y } = buildExportRows();
  if (rows.length === 0) { toast(tr('Không có dữ liệu','No data'), 'warning'); return; }
  let md = `# ${tr('Bảng chấm công tháng','Work log')} ${pad(m)}/${y}\n\n`;
  md += `| ${tr('Ngày','Date')} | ${tr('Ca','Shift')} | ${tr('Vào','In')} | ${tr('Ra','Out')} | ${tr('Giờ BT','Regular')} | ${tr('Tăng ca','OT')} | ${tr('Ghi chú','Note')} |\n|---|---|---|---|---|---|---|\n`;
  rows.forEach(r => { md += `| ${r.date} | ${r.shift} | ${r.start} | ${r.end} | ${r.reg} | ${r.ot} | ${r.note || ''} |\n`; });
  const total = rows.reduce((s, r) => s + parseFloat(r.reg), 0);
  const totalOT = rows.reduce((s, r) => s + parseFloat(r.ot), 0);
  md += `\n**${tr('Tổng','Total')}: ${rows.length} ${tr('ngày','days')} · ${total.toFixed(2)}h · ${totalOT.toFixed(2)}h OT**\n`;
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(md).then(() => toast(tr('✅ Đã copy Markdown','✅ Markdown copied'), 'success')).catch(() => fallbackCopy(md));
    } else fallbackCopy(md);
  } catch (e) { fallbackCopy(md); }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast(tr('✅ Đã copy','✅ Copied'), 'success'); }
  catch (e) { toast(tr('Lỗi copy','Copy failed'), 'danger'); }
  document.body.removeChild(ta);
}
async function shareTable() {
  if (!navigator.share) { toast(tr('Trình duyệt không hỗ trợ chia sẻ','Browser does not support sharing'), 'warning'); return; }
  const { rows, m, y } = buildExportRows();
  if (rows.length === 0) { toast(tr('Không có dữ liệu','No data'), 'warning'); return; }
  let text = tr('Bảng chấm công tháng','Work log') + ` ${pad(m)}/${y}\n\n`;
  rows.forEach(r => { text += `${r.date} · ${r.shift} · ${r.reg}h${parseFloat(r.ot) > 0 ? ` +${r.ot}h OT` : ''}\n`; });
  try { await navigator.share({ title: `${tr('Bảng công','Work log')} ${pad(m)}/${y}`, text }); }
  catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS SHEETS
// ═══════════════════════════════════════════════════════════════
function saveSalarySettings() {
  const g = id => document.getElementById(id);
  const num = (id, def) => { const v = parseFloat(g(id)?.value); return (isFinite(v) && v >= 0) ? v : def; };
  settings.baseSalary = num('set-base-salary', settings.baseSalary);
  settings.standardWorkDays = Math.max(1, parseInt(g('set-standard-days')?.value) || settings.standardWorkDays);
  settings.standardShiftHours = Math.max(0.5, parseFloat(g('set-standard-hours')?.value) || settings.standardShiftHours);
  settings.breakHours = num('set-break-hours', settings.breakHours);
  settings.monthlyGoal = num('set-monthly-goal', settings.monthlyGoal);
  const name = (g('set-profile-name')?.value || '').trim();
  if (name) { settings.profileName = name.slice(0, 40); settings.onboarded = true; }
  saveSettingsToStorage();
  closeSheet('sheet-salary');
  toast(tr('✅ Đã lưu cấu hình lương','✅ Salary config saved'), 'success');
  renderDrawerState();
  if (currentPage === 'home') renderHome();
}
function saveOTSettings() {
  const g = id => document.getElementById(id);
  const num = (id, def) => { const v = parseFloat(g(id)?.value); return (isFinite(v) && v >= 0) ? v : def; };
  settings.otNormalDay = num('set-ot-normal-day', settings.otNormalDay);
  settings.otNormalNight = num('set-ot-normal-night', settings.otNormalNight);
  settings.otSundayDay = num('set-ot-sunday-day', settings.otSundayDay);
  settings.otSundayNight = num('set-ot-sunday-night', settings.otSundayNight);
  settings.otHoliday = num('set-ot-holiday', settings.otHoliday);
  saveSettingsToStorage();
  closeSheet('sheet-ot');
  toast(tr('✅ Đã lưu hệ số','✅ Coefficients saved'), 'success');
}
function saveTimeSettings() {
  const g = id => document.getElementById(id);
  settings.morningStart = g('set-morning-start')?.value || settings.morningStart;
  settings.morningEnd = g('set-morning-end')?.value || settings.morningEnd;
  settings.nightStart = g('set-night-start')?.value || settings.nightStart;
  settings.nightEnd = g('set-night-end')?.value || settings.nightEnd;
  saveSettingsToStorage();
  closeSheet('sheet-times');
  toast(tr('✅ Đã lưu thời gian','✅ Time settings saved'), 'success');
}
function savePinSettings() {
  const enabled = document.getElementById('set-pin-enabled')?.checked;
  const val = (document.getElementById('set-pin-value')?.value || '').trim();
  if (enabled) {
    if (!/^\d{4}$/.test(val)) { toast(tr('PIN phải gồm 4 số','PIN must be 4 digits'), 'warning'); return; }
    settings.pinEnabled = true; settings.pinValue = val;
    sessionStorage.removeItem('tt_unlocked');
  } else { settings.pinEnabled = false; settings.pinValue = ''; }
  saveSettingsToStorage();
  closeSheet('sheet-pin');
  toast(tr('✅ Đã lưu PIN','✅ PIN saved'), 'success');
}

// ═══════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════
function renderProfileList() {
  const list = document.getElementById('profile-list');
  if (!list) return;
  const profiles = getProfiles();
  const active = getActiveProfile();
  list.innerHTML = profiles.map(p => `
    <div class="profile-item ${p.id === active ? 'active' : ''}" onclick="switchProfile('${p.id}')" role="button" tabindex="0">
      <div class="avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div class="name">${p.name}</div>
      ${p.id === active ? '<span style="color:var(--primary);font-weight:800;">✓</span>' : ''}
      ${p.id !== 'default' ? `<button class="del-btn" onclick="event.stopPropagation();deleteProfile('${p.id}')" aria-label="${tr('Xóa','Delete')}">×</button>` : ''}
    </div>`).join('');
}
function switchProfile(id) {
  if (id === getActiveProfile()) return;
  if (!confirm(tr('Chuyển hồ sơ? Dữ liệu sẽ đổi theo hồ sơ.','Switch profile? Data will change.'))) return;
  setActiveProfile(id);
  closeSheet('sheet-profiles');
  sessionStorage.removeItem('tt_unlocked');
  toast(tr('Đang chuyển...','Switching...'), 'info');
  setTimeout(() => location.reload(), 300);
}
function addNewProfile() {
  const name = prompt(tr('Tên hồ sơ mới:','New profile name:'));
  if (!name || !name.trim()) return;
  const profiles = getProfiles();
  profiles.push({ id: 'p_' + Date.now(), name: name.trim().slice(0, 30) });
  saveProfiles(profiles);
  renderProfileList();
  toast(tr('Đã thêm hồ sơ','Profile added'), 'success');
}
function deleteProfile(id) {
  if (!confirm(tr('Xóa hồ sơ và toàn bộ dữ liệu?','Delete profile and all data?'))) return;
  saveProfiles(getProfiles().filter(p => p.id !== id));
  Object.keys(localStorage).forEach(k => {
    if (k.includes('_' + id + '_') || k.endsWith('_' + id)) localStorage.removeItem(k);
  });
  if (getActiveProfile() === id) setActiveProfile('default');
  sessionStorage.removeItem('tt_unlocked');
  toast(tr('Đã xóa hồ sơ','Profile deleted'), 'success');
  setTimeout(() => location.reload(), 300);
}

// ═══════════════════════════════════════════════════════════════
// BACKUP / RESTORE
// ═══════════════════════════════════════════════════════════════
function backupData() {
  closeDrawer();
  const data = {
    version: APP_VERSION, schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings, workLogs, absentDays, notes: notesMap
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `timetracker_backup_${todayStr()}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(tr('✅ Đã tải file sao lưu','✅ Backup downloaded'), 'success');
}
function handleRestoreFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data || !data.workLogs || !data.settings) throw new Error(tr('File không đúng định dạng','Invalid file'));
      try {
        const bk = 'tt_auto_backup_' + Date.now();
        localStorage.setItem(bk, JSON.stringify({ settings, workLogs, absentDays, notes: notesMap, exportedAt: new Date().toISOString() }));
        const bks = Object.keys(localStorage).filter(k => k.startsWith('tt_auto_backup_')).sort();
        while (bks.length > 3) localStorage.removeItem(bks.shift());
      } catch (e) {}
      if (!confirm(tr(`Khôi phục ${data.workLogs.length} bản ghi? Dữ liệu hiện tại sẽ được sao lưu tự động.`, `Restore ${data.workLogs.length} records? Current data will be auto-backed up.`))) return;
      settings = { ...DEFAULT_SETTINGS, ...data.settings };
      delete settings.themeColor;
      workLogs = (Array.isArray(data.workLogs) ? data.workLogs : []).map(normalizeLog).filter(Boolean);
      absentDays = Array.isArray(data.absentDays) ? data.absentDays : [];
      notesMap = (data.notes && typeof data.notes === 'object') ? data.notes : {};
      saveSettingsToStorage(); saveWorkLogsData(); saveAbsentDaysData(); saveNotesData();
      closeDrawer();
      toast(tr('✅ Đã khôi phục','✅ Restored'), 'success');
      setTimeout(() => location.reload(), 600);
    } catch (err) { toast(tr('Lỗi: ','Error: ') + (err.message || err), 'danger'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}
function clearOldData() {
  closeDrawer();
  const cutoff = prompt(tr('Xóa dữ liệu TRƯỚC ngày (YYYY-MM-DD):','Delete data BEFORE (YYYY-MM-DD):'), `${new Date().getFullYear()}-01-01`);
  if (!cutoff) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) { toast(tr('Định dạng không đúng','Invalid format'), 'warning'); return; }
  const before = workLogs.length;
  workLogs = workLogs.filter(l => l.date >= cutoff);
  saveWorkLogsData();
  toast(tr(`Đã xóa ${before - workLogs.length} bản ghi`, `Deleted ${before - workLogs.length} records`), 'success');
  refreshCurrentPage();
}

// ═══════════════════════════════════════════════════════════════
// PIN
// ═══════════════════════════════════════════════════════════════
function initPinLock() {
  if (!settings.pinEnabled || !settings.pinValue) return;
  if (sessionStorage.getItem('tt_unlocked') === '1') return;
  const el = document.getElementById('pin-lock');
  if (el) el.classList.remove('hidden');
  pinBuffer = '';
  updatePinDots();
}
function updatePinDots() {
  document.querySelectorAll('#pin-dots span').forEach((s, i) => s.classList.toggle('filled', i < pinBuffer.length));
}
function handlePinInput(num) {
  if (num === 'clear') { pinBuffer = ''; updatePinDots(); return; }
  if (num === 'back') { pinBuffer = pinBuffer.slice(0, -1); updatePinDots(); return; }
  if (pinBuffer.length >= 4) return;
  pinBuffer += num;
  updatePinDots();
  if (pinBuffer.length === 4) {
    if (pinBuffer === settings.pinValue) {
      document.getElementById('pin-lock').classList.add('hidden');
      document.getElementById('pin-error').textContent = '';
      sessionStorage.setItem('tt_unlocked', '1');
    } else {
      document.getElementById('pin-error').textContent = tr('Sai PIN!','Wrong PIN!');
      if (navigator.vibrate) try { navigator.vibrate([30, 50, 30]); } catch (e) {}
      setTimeout(() => {
        pinBuffer = ''; updatePinDots();
        const e2 = document.getElementById('pin-error');
        if (e2) e2.textContent = '';
      }, 800);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SPLASH / REFRESH / KEYBOARD
// ═══════════════════════════════════════════════════════════════
function hideSplash() {
  const s = document.getElementById('splash-screen');
  if (!s) return;
  setTimeout(() => {
    s.classList.add('hide');
    setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 600);
  }, 1400);
}
function refreshCurrentPage() {
  const page = document.body.dataset.page || 'home';
  if (page === 'home') renderHome();
  else if (page === 'calendar') renderCalendar();
  else if (page === 'worklog') { loadWorkLogTable(); previewWorkLog(); }
  else if (page === 'stats') loadStats();
  applyLanguage();
}
function initKeyboard() {
  document.addEventListener('keydown', e => {
    const tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (_nameEditorForced) {
      if (e.key === 'Escape') e.preventDefault();
      return;
    }
    const key = e.key.toLowerCase();
    if (key === '1') switchPage('home');
    else if (key === '2') switchPage('calendar');
    else if (key === '3') switchPage('worklog');
    else if (key === '4') switchPage('stats');
    else if (key === 'n') quickCheckIn();
    else if (key === 'escape') {
      closeDrawer();
      document.querySelectorAll('.drawer.open').forEach(el => el.classList.remove('open'));
      closeCalDetail();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
window.onload = function () {
  try {
    _balanceHidden = localStorage.getItem(BALANCE_HIDDEN_KEY) === '1';
    loadSettings();
    loadWorkLogs();
    loadAbsentDays();
    loadNotes();
    applyTheme();

    const now = new Date();
    const m = now.getMonth() + 1, y = now.getFullYear();
    ['worklog', 'stat'].forEach(prefix => {
      const ms = document.getElementById(prefix + '-month-select');
      const ys = document.getElementById(prefix + '-year-input');
      if (ms) {
        let o = '';
        for (let i = 1; i <= 12; i++) o += `<option value="${i}">${tr('Tháng','Month')} ${i}</option>`;
        ms.innerHTML = o;
        ms.value = m;
      }
      if (ys) ys.value = y;
    });
    const wd = document.getElementById('worklog-date');
    if (wd) wd.value = todayStr();

    initPinLock();
    hideSplash();
    renderDrawerState();
    initCarousel();
    renderHome();
    initKeyboard();

    applyLanguage();

    if (localStorage.getItem(DRAFT_KEY) && currentPage === 'worklog') setTimeout(loadDraft, 500);

    const pinPad = document.getElementById('pin-pad');
    if (pinPad) {
      pinPad.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (btn) handlePinInput(btn.dataset.num);
      });
    }

    const hrInput = document.getElementById('hr-image-input');
    if (hrInput && typeof OCRCompare !== 'undefined') {
      hrInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        await OCRCompare.processImage(file);
        e.target.value = '';
      });
    }

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!_nameEditorForced) switchPage(item.dataset.page);
        }
      });
    });

    if (window.matchMedia) {
      try {
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (settings.themeMode === 'auto') applyTheme();
        });
      } catch (e) {}
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW:', e));
    }

    if (window.Effects && window.Effects.autoAttach) setTimeout(() => window.Effects.autoAttach(), 300);

    if (needsOnboarding()) {
      document.body.classList.add('onboarding-mode');
      setTimeout(() => openNameEditor(true), 1600);
    }

    setInterval(checkReminder, 30 * 60 * 1000);
    setTimeout(checkQuota, 5000);
  } catch (err) {
    console.error('[init]', err);
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPOSE
// ═══════════════════════════════════════════════════════════════
Object.assign(window, {
  toast, tr, applyLanguage, translateAll,
  openDrawer, closeDrawer, openSheet, closeSheet,
  toggleTheme, toggleLanguage, toggleHaptic, toggleSound,
  renderDrawerState, loadSheetData,
  quickCheckIn, markAbsent, editGoal, showHelp, scrollToCard,
  switchPage, goToCurrentMonth,
  switchCalTab, calPrev, calNext, calToday,
  showCalDetail, closeCalDetail, saveCalNote, quickAddDay, deleteWorkLog,
  setToday, autoDetectSunday, onShiftChange, previewWorkLog, addWorkLog,
  applyWorklogMonthFilter, loadWorkLogTable,
  loadStats, exportImage, printTable, copyMarkdown, shareTable,
  saveSalarySettings, saveOTSettings, saveTimeSettings, savePinSettings,
  switchProfile, addNewProfile, deleteProfile,
  backupData, handleRestoreFile, clearOldData,
  handlePinInput,
  renderWalletSheet, renderChartSheet, renderAchievementsSheet, renderOTCalcSheet, renderHelpSheet,
  toggleBalanceVisibility, updateMoneySub,
  editProfileName, openNameEditor, handleNameEditorClose, saveProfileName, onNameInput
});