// ========================================================================
// TIMETRACKER v4.0 — Firebase Auth + Firestore Sync
// ========================================================================

const APP_VERSION = "4.0.0";
const DATA_KEY_PREFIX = 'firebase_data_';

const DEFAULT_SETTINGS = {
    baseSalary: 5900000, standardWorkDays: 26, standardShiftHours: 8, breakHours: 1,
    otNormalDay: 1.5, otNormalNight: 1.7, otSundayDay: 2.0, otSundayNight: 2.7, otHoliday: 3.0,
    morningStart: "07:30", morningEnd: "19:30", nightStart: "19:30", nightEnd: "07:30",
    monthlyGoal: 8000000, themeColor: "indigo", themeMode: "auto",
    haptic: true, sound: true, reminders: true,
    pinEnabled: false, pinValue: "", language: "vi"
};

// ═══ CACHE ═══
const Cache = (function () {
    const stores = { settings: null, workLogs: null, absentDays: null, notes: null };
    return {
        get(key, loader) { if (stores[key] === null) stores[key] = loader(); return stores[key]; },
        set(key, value) { stores[key] = value; },
        invalidate(key) { if (key) stores[key] = null; else Object.keys(stores).forEach(k => stores[k] = null); }
    };
})();

// ═══ I18N ═══
const I18N = Object.freeze({
    vi: {
        app_subtitle: "Chấm công & Lương", pin_title: "Nhập mã PIN", pin_hint: "Nhập 4 số để mở khóa",
        reminder_title: "Chưa chấm công hôm nay!", reminder_sub: "Bạn quên chấm công à?",
        achievements: "Thành tích", days_worked: "Ngày công", hours_worked: "Giờ làm",
        overtime: "Tăng ca", salary: "Lương", monthly_goal: "Mục tiêu tháng",
        projected: "Dự kiến cuối tháng", remaining: "Còn", days: "ngày làm việc",
        info: "Thông tin", base_salary: "Lương cơ bản", standard_days: "Ngày công chuẩn",
        shifts_done: "Số ca đã làm", view_other_month: "Xem tháng khác", view: "Xem",
        viewing: "Đang xem", calendar: "Lịch tháng", enter_worklog: "Nhập chấm công",
        work_date: "Ngày làm việc", today: "Hôm nay", shift: "Ca làm", day_type: "Loại ngày",
        shift_morning: "☀️ Ca sáng", shift_night: "🌙 Ca đêm",
        day_normal: "Ngày thường", day_sunday: "Chủ nhật",
        start: "Giờ bắt đầu", end: "Giờ kết thúc", note: "Ghi chú", preview: "Xem trước",
        regular_hours: "Giờ thường", ot_hours: "Tăng ca", pay: "Tiền công",
        save: "Lưu chấm công", save_settings: "Lưu cài đặt",
        col_date: "Ngày", col_shift: "Ca", col_type: "Loại", col_in: "Vào", col_out: "Ra",
        col_reg: "Thường", col_ot: "TC", col_pay: "Tiền", no_data: "Không có dữ liệu",
        statistics: "Thống kê tháng", daily_hours: "Giờ làm theo ngày",
        shift_ratio: "Tỉ lệ ca làm", trend: "Xu hướng 6 tháng",
        profiles: "Hồ sơ", add_profile: "Thêm hồ sơ", appearance: "Giao diện",
        theme_mode: "Chế độ", theme_auto: "🌓 Tự động", theme_light: "☀️ Sáng", theme_dark: "🌙 Tối",
        haptic: "📳 Rung khi chấm công", sound: "🔊 Âm thanh", reminders: "🔔 Nhắc nhở",
        security: "Bảo mật", pin_lock: "Khóa PIN", pin_new: "PIN mới (4 số)",
        base_salary_full: "Lương cơ bản", base_salary_input: "Lương cơ bản (đ/tháng)",
        standard_days_input: "Ngày công chuẩn", standard_hours: "Giờ chuẩn/ca",
        break_hours: "Giờ nghỉ giữa ca", ot_coeff: "Hệ số tăng ca",
        ot_normal_day: "Thường - Sáng", ot_normal_night: "Thường - Đêm",
        ot_sunday_day: "Chủ nhật - Sáng", ot_sunday_night: "Chủ nhật - Đêm",
        ot_holiday: "⚡ Hệ số tăng ca ngày lễ bắt buộc",
        default_times: "Thời gian mặc định", morning_start: "Ca sáng bắt đầu",
        morning_end: "Ca sáng kết thúc", night_start: "Ca đêm bắt đầu",
        night_end: "Ca đêm kết thúc", backup: "Sao lưu & Khôi phục",
        backup_btn: "Sao lưu", restore_btn: "Khôi phục", confirm: "Xác nhận", cancel: "Hủy",
        delete_old: "Xóa dữ liệu cũ", delete_desc: "Xóa tất cả dữ liệu trước tháng chọn",
        month: "Tháng", year: "Năm", will_delete: "Xóa", records_before: "bản ghi trước",
        delete_btn: "Xóa dữ liệu cũ", reset: "Mặc định",
        nav_home: "Home", nav_calendar: "Lịch", nav_worklog: "Chấm",
        nav_stats: "Thống kê", nav_settings: "Cài đặt"
    },
    en: {
        app_subtitle: "Time & Salary", pin_title: "Enter PIN", pin_hint: "Enter 4 digits to unlock",
        reminder_title: "Not checked in today!", reminder_sub: "Did you forget?",
        achievements: "Achievements", days_worked: "Days", hours_worked: "Hours",
        overtime: "Overtime", salary: "Salary", monthly_goal: "Monthly Goal",
        projected: "Projected Month End", remaining: "Remaining", days: "working days",
        info: "Info", base_salary: "Base Salary", standard_days: "Standard Days",
        shifts_done: "Shifts Done", view_other_month: "View Other Month", view: "View",
        viewing: "Viewing", calendar: "Calendar", enter_worklog: "Enter Worklog",
        work_date: "Work Date", today: "Today", shift: "Shift", day_type: "Day Type",
        shift_morning: "☀️ Morning", shift_night: "🌙 Night",
        day_normal: "Normal day", day_sunday: "Sunday",
        start: "Start", end: "End", note: "Note", preview: "Preview",
        regular_hours: "Regular", ot_hours: "OT", pay: "Pay",
        save: "Save", save_settings: "Save settings",
        col_date: "Date", col_shift: "Shift", col_type: "Type", col_in: "In", col_out: "Out",
        col_reg: "Reg", col_ot: "OT", col_pay: "Pay", no_data: "No data",
        statistics: "Monthly Statistics", daily_hours: "Daily Hours",
        shift_ratio: "Shift Ratio", trend: "6-Month Trend",
        profiles: "Profiles", add_profile: "Add Profile", appearance: "Appearance",
        theme_mode: "Mode", theme_auto: "🌓 Auto", theme_light: "☀️ Light", theme_dark: "🌙 Dark",
        haptic: "📳 Haptic on check-in", sound: "🔊 Sound", reminders: "🔔 Reminders",
        security: "Security", pin_lock: "PIN Lock", pin_new: "New PIN (4 digits)",
        base_salary_full: "Base Salary", base_salary_input: "Base salary (VND/month)",
        standard_days_input: "Standard days", standard_hours: "Hours/shift",
        break_hours: "Break hours", ot_coeff: "OT Coefficients",
        ot_normal_day: "Normal - Day", ot_normal_night: "Normal - Night",
        ot_sunday_day: "Sunday - Day", ot_sunday_night: "Sunday - Night",
        ot_holiday: "⚡ Holiday OT coefficient",
        default_times: "Default Times", morning_start: "Morning start",
        morning_end: "Morning end", night_start: "Night start",
        night_end: "Night end", backup: "Backup & Restore",
        backup_btn: "Backup", restore_btn: "Restore", confirm: "Confirm", cancel: "Cancel",
        delete_old: "Delete Old Data", delete_desc: "Delete all data before the selected month",
        month: "Month", year: "Year", will_delete: "Delete", records_before: "records before",
        delete_btn: "Delete Old Data", reset: "Reset",
        nav_home: "Home", nav_calendar: "Calendar", nav_worklog: "Log",
        nav_stats: "Stats", nav_settings: "Settings"
    }
});

// ═══ STATE ═══
let settings = null;
let workLogs = null;
let viewMonth = new Date().getMonth() + 1;
let viewYear = new Date().getFullYear();
let dashMonth = new Date().getMonth() + 1;
let dashYear = new Date().getFullYear();
let calMonth = new Date().getMonth() + 1;
let calYear = new Date().getFullYear();
let calTab = 'solar';
let calLunarMonth = null;
let calLunarYear = null;
let restoreData = null;
let pinBuffer = "";

const _calRenderCache = new Map();
const _statsRenderCache = new Map();

// ═══ UNIFIED DATA STORAGE ═══
function getAllDataObject() {
    return {
        settings: settings,
        workLogs: workLogs,
        absentDays: getAbsentDays(),
        notes: getNotes(),
        _version: Date.now()
    };
}

function saveAllDataToLocal() {
    const profile = window.Auth ? window.Auth.getCurrentProfile() : null;
    if (!profile) return;
    const key = DATA_KEY_PREFIX + profile.username;
    localStorage.setItem(key, JSON.stringify(getAllDataObject()));
}

function loadAllDataFromLocal() {
    const profile = window.Auth ? window.Auth.getCurrentProfile() : null;
    if (!profile) return null;
    const key = DATA_KEY_PREFIX + profile.username;
    const stored = localStorage.getItem(key);
    if (stored) { try { return JSON.parse(stored); } catch(e) { return null; } }
    return null;
}

// ═══ LOAD / SAVE ═══
function loadSettings() {
    if (!window.Auth || !window.Auth.isLoggedIn()) return { ...DEFAULT_SETTINGS };
    return Cache.get('settings', () => {
        const allData = loadAllDataFromLocal();
        if (allData && allData.settings) return { ...DEFAULT_SETTINGS, ...allData.settings };
        return { ...DEFAULT_SETTINGS };
    });
}
function saveSettingsToStorage() {
    Cache.set('settings', settings);
    saveAllDataToLocal();
    if (window.FirebaseSync && window.Auth && window.Auth.isLoggedIn()) window.FirebaseSync.queueSync();
}
function loadWorkLogs() {
    if (!window.Auth || !window.Auth.isLoggedIn()) return [];
    return Cache.get('workLogs', () => {
        const allData = loadAllDataFromLocal();
        if (allData && Array.isArray(allData.workLogs)) return allData.workLogs;
        return [];
    });
}
function saveWorkLogsToStorage() {
    Cache.set('workLogs', workLogs);
    _calRenderCache.clear();
    _statsRenderCache.clear();
    saveAllDataToLocal();
    if (window.FirebaseSync && window.Auth && window.Auth.isLoggedIn()) window.FirebaseSync.queueSync();
}

// ═══ ABSENT ═══
function getAbsentDays() {
    if (!window.Auth || !window.Auth.isLoggedIn()) return [];
    return Cache.get('absentDays', () => {
        const allData = loadAllDataFromLocal();
        if (allData && Array.isArray(allData.absentDays)) return allData.absentDays;
        return [];
    });
}
function saveAbsentDays(days) {
    Cache.set('absentDays', days);
    saveAllDataToLocal();
    if (window.FirebaseSync && window.Auth && window.Auth.isLoggedIn()) window.FirebaseSync.queueSync();
}
function isAbsentDay(d) { return getAbsentDays().indexOf(d) !== -1; }
function markAbsentDay(d) {
    const a = getAbsentDays();
    if (a.indexOf(d) === -1) { a.push(d); saveAbsentDays(a); }
}
function unmarkAbsentDay(d) { saveAbsentDays(getAbsentDays().filter(x => x !== d)); }

// ═══ NOTES ═══
function getNotes() {
    if (!window.Auth || !window.Auth.isLoggedIn()) return {};
    return Cache.get('notes', () => {
        const allData = loadAllDataFromLocal();
        if (allData && allData.notes) return allData.notes;
        return {};
    });
}
function saveNotes(n) {
    Cache.set('notes', n);
    _calRenderCache.clear();
    saveAllDataToLocal();
    if (window.FirebaseSync && window.Auth && window.Auth.isLoggedIn()) window.FirebaseSync.queueSync();
}
function getNote(d) { return getNotes()[d] || ''; }
function setNote(d, text) {
    const n = getNotes();
    if (text.trim()) n[d] = text.trim(); else delete n[d];
    saveNotes(n);
}

function initState() {
    settings = loadSettings();
    workLogs = loadWorkLogs();
    getAbsentDays();
    getNotes();
}
function reloadStateFromStorage() {
    Cache.invalidate();
    settings = loadSettings();
    workLogs = loadWorkLogs();
    initMonthSelects();
    applyTheme();
    applyLanguage();
    loadDashboard();
    applyWorklogMonthFilter();
}

// ═══ TOAST ═══
const _activeToasts = new Set();
function showToast(message, type = 'success') {
    if (_activeToasts.size >= 3) {
        const first = _activeToasts.values().next().value;
        if (first) { first.remove(); _activeToasts.delete(first); }
    }
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span><button class="toast-close" aria-label="Close">✕</button>`;
    container.appendChild(toast);
    _activeToasts.add(toast);
    const close = () => {
        if (!toast.parentElement) return;
        toast.classList.add('hide');
        setTimeout(() => { toast.remove(); _activeToasts.delete(toast); }, 300);
    };
    toast.querySelector('.toast-close').onclick = close;
    setTimeout(close, 3000);
}

// ═══ HAPTIC + SOUND ═══
let _audioCtx = null;
function haptic() {
    if (settings.haptic && navigator.vibrate) { try { navigator.vibrate(50); } catch(e) {} }
}
function playSound() {
    if (!settings.sound) return;
    try {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = _audioCtx.createOscillator();
        const gain = _audioCtx.createGain();
        osc.connect(gain); gain.connect(_audioCtx.destination);
        osc.frequency.value = 880; osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, _audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(_audioCtx.currentTime + 0.2);
    } catch (e) {}
}

// ═══ HELPERS ═══
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getLogsByMonth(m, y) {
    const result = [];
    for (let i = 0; i < workLogs.length; i++) {
        const d = new Date(workLogs[i].date);
        if (d.getMonth() + 1 === m && d.getFullYear() === y) result.push(workLogs[i]);
    }
    return result;
}
function getLogByDate(d) {
    for (let i = 0; i < workLogs.length; i++) if (workLogs[i].date === d) return workLogs[i];
    return undefined;
}
function monthOptions() {
    const prefix = settings.language === 'vi' ? 'Tháng ' : 'Month ';
    let html = '';
    for (let i = 1; i <= 12; i++) html += `<option value="${i}">${prefix}${i}</option>`;
    return html;
}
function initMonthSelects() {
    const html = monthOptions();
    ['dash-month-select','worklog-month-select','stat-month-select','delete-month'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
}
function updateMonthLabels() {
    const prefix = settings.language === 'vi' ? 'Tháng ' : 'Month ';
    ['dash-month-select','worklog-month-select','stat-month-select','delete-month'].forEach(id => {
        document.querySelectorAll(`#${id} option`).forEach(o => { o.textContent = prefix + o.value; });
    });
}

// ═══ I18N APPLY ═══
let _i18nNodes = null;
function applyLanguage() {
    const t = I18N[settings.language] || I18N.vi;
    if (!_i18nNodes) _i18nNodes = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < _i18nNodes.length; i++) {
        const el = _i18nNodes[i];
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    }
    updateMonthLabels();
}

// ═══ THEME ═══
const THEME_COLORS = Object.freeze({
    indigo:  { primary:'#4F46E5', light:'#818CF8', dark:'#3730A3', grad:'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', glow:'rgba(99,102,241,0.35)' },
    emerald: { primary:'#10B981', light:'#34D399', dark:'#047857', grad:'linear-gradient(135deg, #10B981 0%, #34D399 100%)', glow:'rgba(16,185,129,0.35)' },
    rose:    { primary:'#F43F5E', light:'#FB7185', dark:'#BE123C', grad:'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)', glow:'rgba(244,63,94,0.35)' },
    amber:   { primary:'#F59E0B', light:'#FBBF24', dark:'#B45309', grad:'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', glow:'rgba(245,158,11,0.35)' }
});

function _applyThemeRaw() {
    const c = THEME_COLORS[settings.themeColor] || THEME_COLORS.indigo;
    const root = document.documentElement;
    root.style.setProperty('--primary', c.primary);
    root.style.setProperty('--primary-light', c.light);
    root.style.setProperty('--primary-dark', c.dark);
    root.style.setProperty('--primary-gradient', c.grad);
    root.style.setProperty('--primary-glow', c.glow);
    let mode = settings.themeMode;
    if (mode === 'auto') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', c.primary);
    const statsPage = document.getElementById('page-statistics');
    if (statsPage && !statsPage.classList.contains('hidden')) {
        _statsRenderCache.clear();
        loadStatistics();
    }
}
function applyTheme() {
    if (window.Effects && window.Effects.smoothThemeChange) window.Effects.smoothThemeChange(_applyThemeRaw);
    else _applyThemeRaw();
}

// ═══ PAGE SWITCH ═══
const PAGE_TITLES = {
    dashboard: { vi:'Dashboard', en:'Dashboard' },
    calendar:  { vi:'Lịch',       en:'Calendar' },
    worklog:   { vi:'Chấm công',  en:'Worklog' },
    statistics:{ vi:'Thống kê',   en:'Statistics' },
    settings:  { vi:'Cài đặt',    en:'Settings' }
};
function switchPage(p) {
    const doSwitch = () => {
        document.querySelectorAll('.page-content').forEach(e => e.classList.add('hidden'));
        document.getElementById('page-' + p).classList.remove('hidden');
        const title = PAGE_TITLES[p] ? PAGE_TITLES[p][settings.language] : p;
        document.getElementById('pageTitle').innerText = title;
        document.querySelectorAll('.bottom-nav .nav-item').forEach(e => e.classList.remove('active'));
        const nav = document.querySelector(`.bottom-nav .nav-item[data-page="${p}"]`);
        if (nav) nav.classList.add('active');
        if (p === 'dashboard') loadDashboard();
        if (p === 'calendar') renderCalendar();
        if (p === 'worklog') applyWorklogMonthFilter();
        if (p === 'statistics') loadStatistics();
        if (p === 'settings') { loadSettingsForm(); updateDeletePreview(); renderProfileList(); AuthUI.updateRecoveryEmailStatus(); }
    };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.startViewTransition(doSwitch);
    } else doSwitch();
    if (window.Effects) setTimeout(() => window.Effects.attachRippleAll(), 100);
}

function goToCurrentMonth(page) {
    const now = new Date();
    const m = now.getMonth() + 1, y = now.getFullYear();
    if (page === 'dashboard') { document.getElementById('dash-month-select').value = m; document.getElementById('dash-year-input').value = y; loadDashboard(); }
    else if (page === 'worklog') { document.getElementById('worklog-month-select').value = m; document.getElementById('worklog-year-input').value = y; applyWorklogMonthFilter(); }
    else if (page === 'statistics') { document.getElementById('stat-month-select').value = m; document.getElementById('stat-year-input').value = y; loadStatistics(); }
}

// ═══ SHIFT MEMORY ═══
function getMonthKey() { const d = new Date(); return `monthly_shift_${d.getFullYear()}_${d.getMonth() + 1}`; }
function loadMonthlyShift() { return localStorage.getItem(getMonthKey()); }
function saveMonthlyShift(s) { localStorage.setItem(getMonthKey(), s); }

function getLastWorkShift() {
    if (workLogs.length === 0) return null;
    let latest = workLogs[0];
    for (let i = 1; i < workLogs.length; i++) if (new Date(workLogs[i].date) > new Date(latest.date)) latest = workLogs[i];
    return latest;
}
function getSuggestedShift() {
    const today = new Date();
    const last = getLastWorkShift();
    let shift = 'Sáng';
    let startTime = settings.morningStart || '07:30';
    let endTime = settings.morningEnd || '19:30';
    if (last) {
        const diff = Math.floor((today - new Date(last.date)) / 86400000);
        if (diff <= 7) { shift = last.shift; startTime = last.start; endTime = last.end; }
    }
    return { shift, startTime, endTime };
}

// ═══ QUICK CHECK-IN ═══
function quickCheckIn() {
    const ts = todayStr();
    if (getLogByDate(ts)) { showToast('Bạn đã chấm công hôm nay!', 'warning'); return; }
    if (isAbsentDay(ts)) { if (!confirm('Hôm nay bạn đã xác nhận nghỉ. Đổi thành đi làm?')) return; unmarkAbsentDay(ts); }
    const s = getSuggestedShift();
    const isSunday = new Date().getDay() === 0;
    const r = calculateWorkLog(ts, s.shift, isSunday, s.startTime, s.endTime);
    workLogs.push({ id: Date.now(), date: ts, shift: s.shift, isSunday, start: s.startTime, end: s.endTime, regularHours: r.regularHours, overtimeHours: r.overtimeHours, totalPay: r.totalPay });
    saveWorkLogsToStorage();
    haptic(); playSound();
    if (window.Effects) {
        const btn = document.querySelector('.hero-actions .btn-confirm');
        if (btn) { const rect = btn.getBoundingClientRect(); window.Effects.miniConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2); }
        if (window.Effects.showCheckmark) window.Effects.showCheckmark();
    }
    if (r.isPaidHoliday) showToast('🎉 Chấm công ngày lễ ' + r.holiday.name, 'success');
    else showToast('✅ Chấm công thành công!', 'success');
    loadDashboard();
    if (!document.getElementById('page-worklog').classList.contains('hidden')) applyWorklogMonthFilter();
    if (!document.getElementById('page-calendar').classList.contains('hidden')) renderCalendar();
}
function confirmAbsent() {
    const ts = todayStr();
    if (getLogByDate(ts)) { showToast('Bạn đã chấm công hôm nay.', 'warning'); return; }
    if (isAbsentDay(ts)) { showToast('Đã xác nhận nghỉ hôm nay.', 'warning'); return; }
    if (confirm(`Xác nhận hôm nay (${ts}) bạn KHÔNG đi làm?`)) {
        markAbsentDay(ts); loadDashboard(); showToast('✅ Đã xác nhận nghỉ.', 'success');
    }
}
function editQuickCheckin() {
    const ts = todayStr();
    const log = getLogByDate(ts);
    switchPage('worklog');
    if (log) {
        document.getElementById('worklog-date').value = ts;
        document.getElementById('worklog-shift').value = log.shift;
        document.getElementById('worklog-type').value = log.isSunday ? 'sunday' : 'normal';
        document.getElementById('worklog-start').value = log.start;
        document.getElementById('worklog-end').value = log.end;
        document.getElementById('worklog-note').value = getNote(ts);
        previewWorkLog();
    } else {
        const s = getSuggestedShift();
        document.getElementById('worklog-date').value = ts;
        document.getElementById('worklog-shift').value = s.shift;
        document.getElementById('worklog-start').value = s.startTime;
        document.getElementById('worklog-end').value = s.endTime;
        autoDetectSunday();
        previewWorkLog();
    }
}

// ═══ QUICK CHECK-IN UI ═══
function renderQuickCheckin() {
    const content = document.getElementById('quick-checkin-content');
    const ts = todayStr();
    const today = new Date();
    const dow = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][today.getDay()];
    const log = getLogByDate(ts);
    const absent = isAbsentDay(ts);
    document.getElementById('hero-date').textContent = ts;
    const dot = document.querySelector('.hero-status-dot');
    const txt = document.querySelector('.hero-status-text');
    const holidays = HolidayResolver.getSolarDayHolidays(ts);
    const paidHoliday = holidays.find(h => h.paid);
    const anyHoliday = paidHoliday || holidays[0];
    if (log) { dot.className = 'hero-status-dot'; txt.textContent = '✅ Đã chấm công'; }
    else if (absent) { dot.className = 'hero-status-dot off'; txt.textContent = '⚪ Đã nghỉ'; }
    else { dot.className = 'hero-status-dot inactive'; txt.textContent = '⏳ Chưa chấm công'; }
    let holidayBanner = '';
    if (anyHoliday) {
        const label = paidHoliday ? `⚡ Lễ có lương — đi làm x${settings.otHoliday}` : 'Ngày lễ';
        holidayBanner = `
            <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 12px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">${anyHoliday.icon}</span>
                <div style="flex:1;">
                    <div style="font-weight:800;font-size:13px;">${anyHoliday.name}</div>
                    <div style="font-size:11px;opacity:0.9;">${label}</div>
                </div>
            </div>`;
    }
    if (log) {
        content.innerHTML = holidayBanner + `
            <div class="checked-in">
                <div class="info">
                    <span style="color:white;font-weight:600;font-size:14px;">☀️ ${log.shift}</span>
                    <span class="badge">${log.start} → ${log.end}</span>
                    <span class="badge">${log.regularHours.toFixed(2)}h</span>
                </div>
                <span class="pay">${log.totalPay.toLocaleString('vi-VN')} đ</span>
            </div>`;
        return;
    }
    if (absent) {
        content.innerHTML = holidayBanner + `
            <div class="absent-status">
                <span class="label">⚪ Đã xác nhận nghỉ</span>
                <button class="btn btn-confirm" onclick="quickCheckIn()" style="padding:8px 16px;font-size:12px;background:#34D399;color:#065F46;border-radius:12px;font-weight:700;border:none;cursor:pointer;min-height:36px;">🔄 Đi làm</button>
            </div>`;
        return;
    }
    const s = getSuggestedShift();
    const isSunday = today.getDay() === 0;
    const dayType = isSunday ? 'Chủ nhật' : 'Ngày thường';
    const r = calculateWorkLog(ts, s.shift, isSunday, s.startTime, s.endTime);
    const pv = r.totalPay.toLocaleString('vi-VN') + ' đ';
    content.innerHTML = holidayBanner + `
        <div class="hero-info"><span class="day-label">Hôm nay <strong>${dow}</strong> · ${dayType}</span></div>
        <div class="hero-preview">
            <div class="preview-left">
                <span style="color:white;font-weight:600;font-size:14px;">☀️ ${s.shift}</span>
                <span class="preview-tag">${s.startTime} → ${s.endTime}</span>
                <span class="preview-tag">💰 ${pv}</span>
            </div>
        </div>
        <div class="hero-actions">
            <button class="btn btn-confirm" onclick="quickCheckIn()">✅ Xác nhận</button>
            <button class="btn btn-edit" onclick="editQuickCheckin()">✏️ Sửa</button>
            <button class="btn btn-absent" onclick="confirmAbsent()">⚪ Nghỉ</button>
        </div>`;
}

// ═══ FAB ═══
function fabAction() {
    const ts = todayStr();
    if (getLogByDate(ts)) { showToast('Bạn đã chấm công hôm nay!', 'warning'); return; }
    if (confirm('⚡ Chấm công nhanh hôm nay?')) quickCheckIn();
}

// ═══ DASHBOARD ═══
function loadDashboard() {
    const ms = document.getElementById('dash-month-select');
    const ys = document.getElementById('dash-year-input');
    if (ms && ys) { dashMonth = parseInt(ms.value); dashYear = parseInt(ys.value); }
    const logs = getLogsByMonth(dashMonth, dashYear);
    const totalDays = logs.length;
    let totalHours = 0, totalOT = 0, currentSalary = 0;
    for (let i = 0; i < logs.length; i++) {
        totalHours += logs[i].regularHours;
        totalOT += logs[i].overtimeHours;
        currentSalary += logs[i].totalPay;
    }
    const el1 = document.getElementById('dash-total-days');
    const el2 = document.getElementById('dash-total-hours');
    const el3 = document.getElementById('dash-total-ot');
    const el4 = document.getElementById('dash-current-salary');
    el1.innerText = totalDays;
    el2.innerText = totalHours.toFixed(2);
    el3.innerText = totalOT.toFixed(2);
    el4.innerText = currentSalary.toLocaleString('vi-VN') + ' đ';
    if (window.Effects) { window.Effects.pulse(el1); window.Effects.pulse(el4); }
    const now = new Date();
    const isCur = dashMonth === now.getMonth() + 1 && dashYear === now.getFullYear();
    if (isCur) {
        const dim = new Date(dashYear, dashMonth, 0).getDate();
        const dom = now.getDate();
        const rem = dim - dom;
        const avg = totalDays > 0 ? currentSalary / totalDays : 0;
        const proj = currentSalary + avg * rem;
        const perc = Math.min((dom / dim) * 100, 100);
        document.getElementById('dash-projected-salary').innerText = proj.toLocaleString('vi-VN') + ' đ';
        document.getElementById('dash-days-remaining').innerText = rem;
        document.getElementById('dash-progress-fill').style.width = perc + '%';
        document.getElementById('dash-progress-percent').innerText = Math.round(perc) + '%';
    } else {
        document.getElementById('dash-projected-salary').innerText = '---';
        document.getElementById('dash-days-remaining').innerText = '0';
        document.getElementById('dash-progress-fill').style.width = '0%';
        document.getElementById('dash-progress-percent').innerText = '0%';
    }
    document.getElementById('dash-base-salary').innerText = settings.baseSalary.toLocaleString('vi-VN') + ' đ';
    document.getElementById('dash-standard-days').innerText = settings.standardWorkDays;
    document.getElementById('dash-shift-count').innerText = totalDays;
    document.getElementById('dash-current-view').innerHTML = `${String(dashMonth).padStart(2,'0')}/${dashYear}`;
    renderQuickCheckin();
    renderGoal(currentSalary);
    renderAchievements();
    checkReminder();
}

// ═══ GOAL ═══
let goalCelebrated = false;
function renderGoal(currentSalary) {
    const goal = settings.monthlyGoal || 0;
    const body = document.getElementById('goal-body');
    if (!goal) { body.innerHTML = `<p class="text-muted" style="font-size:13px;">Chưa đặt mục tiêu. Nhấn nút sửa để đặt.</p>`; return; }
    const pct = Math.min((currentSalary / goal) * 100, 100);
    const achieved = currentSalary >= goal;
    body.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
            <span>${currentSalary.toLocaleString('vi-VN')} đ</span>
            <span style="font-weight:800;color:${achieved?'var(--success)':'var(--primary)'};">${Math.round(pct)}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--gray-500);">
            <span>Mục tiêu: <strong>${goal.toLocaleString('vi-VN')} đ</strong></span>
            ${achieved ? '<span style="color:var(--success);font-weight:700;">🎉 Đạt mục tiêu!</span>' : `<span>Còn thiếu: <strong>${(goal-currentSalary).toLocaleString('vi-VN')} đ</strong></span>`}
        </div>`;
    if (achieved && !goalCelebrated) { goalCelebrated = true; launchConfetti(); }
    else if (!achieved) goalCelebrated = false;
}
function editGoal() {
    const cur = settings.monthlyGoal || 0;
    const v = prompt('🎯 Nhập mục tiêu tháng (đ):', cur);
    if (v === null) return;
    settings.monthlyGoal = parseInt(v) || 0;
    saveSettingsToStorage();
    showToast('✅ Đã lưu mục tiêu!', 'success');
    loadDashboard();
}

// ═══ CONFETTI ═══
function launchConfetti() {
    const layer = document.getElementById('confetti-layer');
    if (!layer) return;
    const colors = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#FBBF24'];
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = Math.random() * 0.6 + 's';
        c.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        c.style.transform = `rotate(${Math.random() * 360}deg)`;
        layer.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

// ═══ ACHIEVEMENTS ═══
function renderAchievements() {
    const card = document.getElementById('achievements-card');
    const list = document.getElementById('achievements-list');
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let check = new Date(today);
    for (let i = 0; i < 365; i++) {
        const ds = `${check.getFullYear()}-${String(check.getMonth()+1).padStart(2,'0')}-${String(check.getDate()).padStart(2,'0')}`;
        if (workLogs.some(l => l.date === ds)) { streak++; check.setDate(check.getDate() - 1); }
        else if (i === 0 && isAbsentDay(ds)) { check.setDate(check.getDate() - 1); }
        else break;
    }
    const totalAll = workLogs.length;
    const monthMap = {};
    workLogs.forEach(l => {
        const d = new Date(l.date);
        const k = `${d.getFullYear()}-${d.getMonth()+1}`;
        monthMap[k] = (monthMap[k] || 0) + l.totalPay;
    });
    let bestKey = '', bestVal = 0;
    Object.entries(monthMap).forEach(([k,v]) => { if (v > bestVal) { bestVal = v; bestKey = k; } });
    const items = [];
    if (streak >= 3) items.push({ icon:'🔥', name:`Chuỗi ${streak} ngày`, val:`Streak hiện tại`, color:'#F59E0B' });
    if (totalAll >= 10) items.push({ icon:'📚', name:`${totalAll} ngày tổng`, val:'Tổng chấm công', color:'#6366F1' });
    if (bestVal > 0) items.push({ icon:'🏆', name:bestVal.toLocaleString('vi-VN')+' đ', val:`Tháng tốt nhất: ${bestKey}`, color:'#10B981' });
    if (items.length === 0) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    list.innerHTML = items.map(i => `
        <div class="ach-item">
            <div class="ach-icon" style="background:${i.color}20;color:${i.color};">${i.icon}</div>
            <div class="ach-info">
                <div class="ach-name">${i.name}</div>
                <div class="ach-sub">${i.val}</div>
            </div>
        </div>`).join('');
}

// ═══ REMINDER ═══
function checkReminder() {
    const banner = document.getElementById('reminder-banner');
    if (!settings.reminders) { banner.classList.add('hidden'); return; }
    const ts = todayStr();
    const log = getLogByDate(ts);
    const absent = isAbsentDay(ts);
    const hour = new Date().getHours();
    if (!log && !absent && hour >= 20) banner.classList.remove('hidden');
    else banner.classList.add('hidden');
}

// ═══ CALENDAR ═══
function switchCalTab(tab) {
    calTab = tab;
    document.querySelectorAll('.cal-mode-tabs button').forEach(b => { b.classList.toggle('active', b.dataset.calTab === tab); });
    renderCalendar();
}
function initLunarState() {
    if (calLunarMonth !== null) return;
    const now = new Date();
    const l = LunarEngine.toLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
    calLunarMonth = l.month;
    calLunarYear = l.year;
}
function renderCalendar() {
    if (calTab === 'lunar') renderLunarTab();
    else renderSolarTab();
}
function renderSolarTab() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-title');
    const weekdays = document.getElementById('calendar-weekdays');
    title.textContent = `📅 Tháng ${calMonth}/${calYear}`;
    weekdays.innerHTML = '<div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>';
    const first = new Date(calYear, calMonth - 1, 1);
    const firstDow = first.getDay();
    const dim = new Date(calYear, calMonth, 0).getDate();
    const ts = todayStr();
    let html = '';
    const prevDim = new Date(calYear, calMonth - 1, 0).getDate();
    for (let i = firstDow - 1; i >= 0; i--) html += `<div class="cal-cell other">${prevDim - i}</div>`;
    for (let d = 1; d <= dim; d++) {
        const ds = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dObj = new Date(calYear, calMonth - 1, d);
        const isSun = dObj.getDay() === 0;
        const isToday = ds === ts;
        const log = getLogByDate(ds);
        const absent = isAbsentDay(ds);
        const holidays = HolidayResolver.getSolarDayHolidays(ds);
        const mainHoliday = holidays.find(h => h.paid) || holidays[0];
        let cls = 'cal-cell';
        if (isToday) cls += ' today';
        if (log) cls += ' done';
        else if (absent) cls += ' absent';
        else if (isSun) cls += ' sunday-cell';
        if (mainHoliday) {
            if (mainHoliday.paid) cls += ' has-paid-holiday';
            else cls += ` has-holiday category-${mainHoliday.category}`;
        }
        const badge = mainHoliday ? `<div class="holiday-badge" title="${mainHoliday.name}">${mainHoliday.icon}</div>` : '';
        let payDot = '';
        if (log) {
            const level = log.totalPay > 800000 ? 'high' : log.totalPay > 400000 ? 'mid' : 'low';
            payDot = `<div class="cal-pay-dot ${level}"></div>`;
        }
        const note = getNote(ds) ? '<div class="cal-note-dot"></div>' : '';
        html += `<div class="${cls}" onclick="showCalDetail('${ds}')">${badge}<div class="cal-day">${d}</div>${payDot}${note}</div>`;
    }
    const total = firstDow + dim;
    const fill = (7 - (total % 7)) % 7;
    for (let i = 1; i <= fill; i++) html += `<div class="cal-cell other">${i}</div>`;
    grid.className = 'calendar-grid solar-grid';
    grid.innerHTML = html;
}
function renderLunarTab() {
    initLunarState();
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-title');
    const weekdays = document.getElementById('calendar-weekdays');
    const canChi = LunarEngine.getCanChi(calLunarYear);
    title.textContent = `🌙 Tháng ${calLunarMonth} — ${canChi}`;
    weekdays.innerHTML = '<div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>';
    const days = LunarEngine.getLunarMonthDays(calLunarMonth, calLunarYear);
    if (days.length === 0) { grid.className = 'calendar-grid lunar-grid'; grid.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;grid-column:1/-1;">Không có dữ liệu</p>'; return; }
    const ts = todayStr();
    const firstDay = days[0];
    const firstDate = new Date(firstDay.solarYear, firstDay.solarMonth - 1, firstDay.solarDay);
    const firstDow = firstDate.getDay();
    let prevMonth = calLunarMonth - 1, prevYear = calLunarYear;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prevDays = LunarEngine.getLunarMonthDays(prevMonth, prevYear);
    const prevLen = prevDays.length;
    let html = '';
    for (let i = firstDow - 1; i >= 0; i--) html += `<div class="lunar-cell-view other"><div class="lunar-day-number">${prevLen - i}</div></div>`;
    days.forEach(d => {
        const holidays = HolidayResolver.getLunarDayHolidays(d.lunarDay, calLunarMonth, calLunarYear);
        const mainHoliday = holidays.find(h => h.paid) || holidays[0];
        const solarDs = `${d.solarYear}-${String(d.solarMonth).padStart(2,'0')}-${String(d.solarDay).padStart(2,'0')}`;
        const isToday = solarDs === ts;
        const log = getLogByDate(solarDs);
        const absent = isAbsentDay(solarDs);
        const dObj = new Date(d.solarYear, d.solarMonth - 1, d.solarDay);
        const isSun = dObj.getDay() === 0;
        let cls = 'lunar-cell-view';
        if (isToday) cls += ' today';
        if (log) cls += ' done';
        else if (absent) cls += ' absent';
        else if (isSun) cls += ' sunday-cell';
        if (mainHoliday) {
            if (mainHoliday.paid) cls += ' has-paid-holiday';
            else cls += ` has-holiday category-${mainHoliday.category}`;
        }
        const badge = mainHoliday ? `<div class="holiday-badge" title="${mainHoliday.name}">${mainHoliday.icon}</div>` : '';
        let payDot = '';
        if (log) { const level = log.totalPay > 800000 ? 'high' : log.totalPay > 400000 ? 'mid' : 'low'; payDot = `<div class="cal-pay-dot ${level}"></div>`; }
        const note = getNote(solarDs) ? '<div class="cal-note-dot"></div>' : '';
        html += `<div class="${cls}" onclick="showLunarDetail(${d.lunarDay}, ${calLunarMonth}, ${calLunarYear})">${badge}<div class="lunar-day-number">${d.lunarDay}</div>${payDot}${note}</div>`;
    });
    const totalCells = firstDow + days.length;
    const fill = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= fill; i++) html += `<div class="lunar-cell-view other"><div class="lunar-day-number">${i}</div></div>`;
    grid.className = 'calendar-grid lunar-grid';
    grid.innerHTML = html;
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
    calMonth = now.getMonth() + 1;
    calYear = now.getFullYear();
    const l = LunarEngine.toLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
    calLunarMonth = l.month;
    calLunarYear = l.year;
    renderCalendar();
}
function showCalDetail(ds) {
    const detail = document.getElementById('cal-day-detail');
    const title = document.getElementById('cal-detail-title');
    const body = document.getElementById('cal-detail-body');
    const log = getLogByDate(ds);
    const absent = isAbsentDay(ds);
    const note = getNote(ds);
    title.textContent = `📅 ${ds}`;
    const [y, m, d] = ds.split('-').map(Number);
    const lunarInfo = LunarEngine.toLunar(d, m, y);
    const holidays = HolidayResolver.getSolarDayHolidays(ds);
    const lunarBlock = `
        <div style="background:var(--surface-2);padding:10px 12px;border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="font-size:11px;color:var(--gray-500);font-weight:700;">🌙 ÂM LỊCH</div>
                <div style="font-size:14px;font-weight:700;color:var(--gray-800);">${lunarInfo.day}/${lunarInfo.month}${lunarInfo.leap?' (nhuận)':''}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:11px;color:var(--gray-500);font-weight:700;">NĂM</div>
                <div style="font-size:13px;font-weight:700;color:var(--gray-700);">${lunarInfo.canChi}</div>
            </div>
        </div>`;
    let holidayBlock = '';
    holidays.forEach(h => {
        const bg = h.paid ? 'linear-gradient(135deg,#FEE2E2,#FECACA)' : h.category === 'social' ? 'linear-gradient(135deg,#FEF3C7,#FDE68A)' : h.category === 'trad' ? 'linear-gradient(135deg,#FFEDD5,#FED7AA)' : h.category === 'religion' ? 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' : 'var(--surface-2)';
        const border = h.paid ? 'border-left:4px solid #DC2626;' : '';
        const sysLabel = h.system === 'solar' ? '📅 Lễ Dương lịch' : h.system === 'lunar' ? '🌙 Lễ Âm lịch' : '📿 Định kỳ';
        holidayBlock += `
            <div style="background:${bg};padding:12px;border-radius:12px;margin-bottom:10px;${border}">
                <div style="font-size:11px;color:var(--gray-600);font-weight:700;">${sysLabel}</div>
                <div style="font-size:16px;font-weight:800;margin-top:4px;">${h.icon} ${h.name}</div>
                ${h.paid ? `<div style="font-size:12px;color:#DC2626;font-weight:700;margin-top:4px;">⚡ Lễ có lương — đi làm hưởng x${settings.otHoliday}</div>` : ''}
            </div>`;
    });
    if (log) {
        const dayType = log.isSunday ? 'Chủ nhật' : 'Ngày thường';
        const holidayTag = log.isPaidHoliday ? ' <span style="color:#DC2626;font-weight:700;">⚡ Ngày lễ</span>' : '';
        body.innerHTML = lunarBlock + holidayBlock + `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div class="info-item"><span class="info-label">Ca</span><span class="info-value">${log.shift}</span></div>
                <div class="info-item"><span class="info-label">Loại</span><span class="info-value">${dayType}${holidayTag}</span></div>
                <div class="info-item"><span class="info-label">Vào - Ra</span><span class="info-value">${log.start} → ${log.end}</span></div>
                <div class="info-item"><span class="info-label">Giờ thường</span><span class="info-value">${log.regularHours.toFixed(2)} h</span></div>
                <div class="info-item"><span class="info-label">Tăng ca</span><span class="info-value">${log.overtimeHours.toFixed(2)} h</span></div>
                <div class="info-item"><span class="info-label">Tiền công</span><span class="info-value">${log.totalPay.toLocaleString('vi-VN')} đ</span></div>
            </div>
            <div class="form-group"><label>Ghi chú</label><input type="text" id="cal-note-input" class="form-control" value="${note.replace(/"/g,'&quot;')}" placeholder="Thêm ghi chú..."></div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-primary" style="flex:1;" onclick="saveCalNote('${ds}')">💾 Lưu ghi chú</button>
                <button class="btn btn-danger" style="flex:1;" onclick="deleteWorkLog(${log.id})">🗑️ Xóa</button>
            </div>`;
    } else if (absent) {
        body.innerHTML = lunarBlock + holidayBlock + `
            <p style="padding:14px;background:repeating-linear-gradient(45deg,var(--gray-100),var(--gray-100) 8px,var(--gray-200) 8px,var(--gray-200) 16px);color:var(--gray-500);border:1.5px dashed var(--gray-400);border-radius:12px;font-weight:700;margin-bottom:12px;text-align:center;letter-spacing:0.3px;">⚪ Đã xác nhận nghỉ</p>
            <button class="btn btn-success w-full" onclick="quickAddDay('${ds}')">➕ Thêm chấm công</button>`;
    } else {
        body.innerHTML = lunarBlock + holidayBlock + `
            <p class="text-muted" style="margin-bottom:12px;">Chưa có dữ liệu cho ngày này.</p>
            <button class="btn btn-primary w-full" onclick="quickAddDay('${ds}')">➕ Thêm chấm công</button>`;
    }
    detail.style.display = 'block';
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.Effects) setTimeout(() => window.Effects.attachRippleAll(), 50);
}
function showLunarDetail(lunarDay, lunarMonth, lunarYear) {
    const solar = LunarEngine.toSolar(lunarDay, lunarMonth, lunarYear, false);
    if (!solar) return;
    const ds = `${solar.year}-${String(solar.month).padStart(2,'0')}-${String(solar.day).padStart(2,'0')}`;
    showCalDetail(ds);
}
function closeCalDetail() { document.getElementById('cal-day-detail').style.display = 'none'; }
function saveCalNote(ds) {
    const v = document.getElementById('cal-note-input').value;
    setNote(ds, v);
    showToast('✅ Đã lưu ghi chú!', 'success');
    renderCalendar();
}
function quickAddDay(ds) {
    closeCalDetail();
    switchPage('worklog');
    document.getElementById('worklog-date').value = ds;
    autoDetectSunday();
    applyMonthlyShift();
}

// ═══ STATISTICS ═══
function loadStatistics() {
    const m = parseInt(document.getElementById('stat-month-select').value);
    const y = parseInt(document.getElementById('stat-year-input').value);
    const logs = getLogsByMonth(m, y);
    const c = document.getElementById('statistics-content');
    if (logs.length === 0) {
        c.innerHTML = '<p class="text-muted">Không có dữ liệu.</p>';
        renderDailyChart([], m, y); renderShiftChart(0,0); renderTrendChart();
        return;
    }
    const totalDays = logs.length;
    const morning = logs.filter(l => l.shift === 'Sáng').length;
    const night = logs.filter(l => l.shift === 'Đêm').length;
    let regH = 0, otH = 0, normOT = 0, sunOT = 0, totalSal = 0, sunDays = 0;
    for (let i = 0; i < logs.length; i++) {
        const l = logs[i];
        regH += l.regularHours;
        otH += l.overtimeHours;
        if (l.isSunday) { sunOT += l.overtimeHours; sunDays++; }
        else normOT += l.overtimeHours;
        totalSal += l.totalPay;
    }
    c.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="stat-mini" style="background:linear-gradient(135deg,#DBEAFE,#BFDBFE);"><div class="stat-mini-label">Số ngày công</div><div class="stat-mini-val">${totalDays}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);"><div class="stat-mini-label">Ngày Chủ nhật</div><div class="stat-mini-val">${sunDays}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#D1FAE5,#A7F3D0);"><div class="stat-mini-label">Ca sáng</div><div class="stat-mini-val">${morning}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#FCE7F3,#FBCFE8);"><div class="stat-mini-label">Ca đêm</div><div class="stat-mini-val">${night}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#E0E7FF,#C7D2FE);"><div class="stat-mini-label">Tổng giờ thường</div><div class="stat-mini-val">${regH.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#F3E8FF,#E9D5FF);"><div class="stat-mini-label">Tổng giờ TC</div><div class="stat-mini-val">${otH.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#EDE9FE,#DDD6FE);"><div class="stat-mini-label">TC thường</div><div class="stat-mini-val">${normOT.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#CCFBF1,#99F6E4);"><div class="stat-mini-label">TC Chủ nhật</div><div class="stat-mini-val">${sunOT.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:linear-gradient(135deg,#FFF7ED,#FED7AA);grid-column:span 2;text-align:center;">
                <div class="stat-mini-label">💰 Tổng tiền lương</div>
                <div class="stat-mini-val" style="color:var(--primary);font-size:22px;">${totalSal.toLocaleString('vi-VN')} đ</div>
            </div>
        </div>`;
    renderDailyChart(logs, m, y);
    renderShiftChart(morning, night);
    renderTrendChart();
}
function getThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
        primary: cs.getPropertyValue('--primary').trim() || '#4F46E5',
        primaryLight: cs.getPropertyValue('--primary-light').trim() || '#818CF8',
        gray300: cs.getPropertyValue('--gray-300').trim() || '#CBD5E1',
        gray400: cs.getPropertyValue('--gray-400').trim() || '#94A3B8',
        gray500: cs.getPropertyValue('--gray-500').trim() || '#64748B'
    };
}
function renderDailyChart(logs, m, y) {
    const el = document.getElementById('chart-daily');
    if (logs.length === 0) { el.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;">Không có dữ liệu</p>'; return; }
    const days = new Date(y || calYear, m || calMonth, 0).getDate();
    const data = new Array(days).fill(0);
    logs.forEach(l => { data[new Date(l.date).getDate() - 1] = l.regularHours + l.overtimeHours; });
    const max = Math.max(...data, 1);
    const W = 340, H = 140, pad = 20;
    const bw = (W - pad*2) / days;
    const tc = getThemeColors();
    let bars = '';
    data.forEach((v,i) => {
        if (v > 0) { const h = (v / max) * (H - pad*2); bars += `<rect x="${pad + i * bw + 1}" y="${H - pad - h}" width="${bw-2}" height="${h}" rx="2" fill="url(#barGrad)"/>`; }
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;">
        <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${tc.primaryLight}"/><stop offset="100%" stop-color="${tc.primary}"/></linearGradient></defs>
        <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="${tc.gray300}" stroke-width="1"/>
        ${bars}
        <text x="${pad}" y="${H-4}" font-size="9" fill="${tc.gray400}">1</text>
        <text x="${W/2}" y="${H-4}" font-size="9" fill="${tc.gray400}" text-anchor="middle">${Math.floor(days/2)}</text>
        <text x="${W-pad}" y="${H-4}" font-size="9" fill="${tc.gray400}" text-anchor="end">${days}</text>
        <text x="${pad}" y="14" font-size="10" fill="${tc.gray500}">Max: ${max.toFixed(1)}h</text>
    </svg>`;
}
function renderShiftChart(morning, night) {
    const el = document.getElementById('chart-shifts');
    const total = morning + night;
    if (total === 0) { el.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;">Không có dữ liệu</p>'; return; }
    const r = 50, cx = 80, cy = 70;
    const circ = 2 * Math.PI * r;
    const mPct = morning / total;
    const mDash = circ * mPct;
    const tc = getThemeColors();
    el.innerHTML = `<div style="display:flex;align-items:center;gap:20px;justify-content:center;padding:10px 0;">
        <svg width="160" height="140" viewBox="0 0 160 140">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#FCD34D" stroke-width="22"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tc.primary}" stroke-width="22" stroke-dasharray="${mDash} ${circ}" stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})"/>
            <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="16" font-weight="800" fill="${tc.gray500}">${total}</text>
        </svg>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border-radius:4px;background:${tc.primary};"></span><span style="font-size:13px;">☀️ Sáng: <strong>${morning}</strong> (${Math.round(mPct*100)}%)</span></div>
            <div style="display:flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border-radius:4px;background:#FCD34D;"></span><span style="font-size:13px;">🌙 Đêm: <strong>${night}</strong> (${Math.round((1-mPct)*100)}%)</span></div>
        </div>
    </div>`;
}
function renderTrendChart() {
    const el = document.getElementById('chart-trend');
    const now = new Date();
    const points = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth() + 1, y = d.getFullYear();
        const total = getLogsByMonth(m, y).reduce((s,l) => s + l.totalPay, 0);
        points.push({ label: `${m}/${String(y).slice(-2)}`, value: total });
    }
    const max = Math.max(...points.map(p => p.value), 1);
    const W = 340, H = 150, pad = 30;
    const stepX = (W - pad*2) / (points.length - 1);
    const coords = points.map((p,i) => ({ x: pad + i * stepX, y: H - pad - (p.value / max) * (H - pad*2) }));
    const path = coords.map((c,i) => (i === 0 ? 'M' : 'L') + c.x + ',' + c.y).join(' ');
    const areaPath = path + ` L${coords[coords.length-1].x},${H-pad} L${coords[0].x},${H-pad} Z`;
    const tc = getThemeColors();
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;">
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${tc.primary}" stop-opacity="0.4"/><stop offset="100%" stop-color="${tc.primary}" stop-opacity="0"/></linearGradient></defs>
        <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="${tc.gray300}" stroke-width="1"/>
        <path d="${areaPath}" fill="url(#areaGrad)"/>
        <path d="${path}" fill="none" stroke="${tc.primary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${coords.map((c,i) => `<circle cx="${c.x}" cy="${c.y}" r="4" fill="white" stroke="${tc.primary}" stroke-width="2.5"/><text x="${c.x}" y="${H-8}" font-size="9" fill="${tc.gray400}" text-anchor="middle">${points[i].label}</text>`).join('')}
        <text x="${pad}" y="14" font-size="10" fill="${tc.gray500}">Max: ${(max/1000000).toFixed(1)}M</text>
    </svg>`;
}

// ═══ EXPORT ═══
function getExportRows() {
    const m = parseInt(document.getElementById('stat-month-select').value);
    const y = parseInt(document.getElementById('stat-year-input').value);
    const logs = getLogsByMonth(m, y).sort((a,b) => new Date(a.date) - new Date(b.date));
    return logs.map(l => ({
        date: l.date, shift: l.shift, type: l.isSunday ? 'Chủ nhật' : 'Thường',
        start: l.start, end: l.end,
        reg: l.regularHours.toFixed(2), ot: l.overtimeHours.toFixed(2),
        note: getNote(l.date) || ''
    }));
}
async function exportImage() {
    const rows = getExportRows();
    if (rows.length === 0) { showToast('Không có dữ liệu để xuất.', 'warning'); return; }
    const m = parseInt(document.getElementById('stat-month-select').value);
    const y = parseInt(document.getElementById('stat-year-input').value);
    const btn = document.getElementById('image-export-btn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Đang xuất...</span>`;
    try {
        const filename = await ImageExporter.exportImage({ rows, month: m, year: y, settings, appVersion: APP_VERSION });
        showToast(`✅ Đã xuất ${filename}`, 'success');
        haptic(); playSound();
    } catch (err) {
        console.error('Lỗi xuất PNG:', err);
        showToast('❌ Lỗi: ' + err.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}
function downloadFile(content, filename, type) {
    const blob = new Blob(['\ufeff' + content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ═══ WORKLOG ═══
function autoSetTimes() {
    const s = document.getElementById('worklog-shift').value;
    if (s === 'Sáng') {
        document.getElementById('worklog-start').value = settings.morningStart || '07:30';
        document.getElementById('worklog-end').value = settings.morningEnd || '19:30';
    } else {
        document.getElementById('worklog-start').value = settings.nightStart || '19:30';
        document.getElementById('worklog-end').value = settings.nightEnd || '07:30';
    }
    previewWorkLog();
}
function autoDetectSunday() {
    const ds = document.getElementById('worklog-date').value;
    if (!ds) return;
    const d = new Date(ds + 'T00:00:00');
    document.getElementById('worklog-type').value = d.getDay() === 0 ? 'sunday' : 'normal';
    previewWorkLog();
}
function applyMonthlyShift() {
    const s = loadMonthlyShift();
    document.getElementById('worklog-shift').value = s || 'Sáng';
    autoSetTimes();
}
function setToday() {
    document.getElementById('worklog-date').value = todayStr();
    autoDetectSunday();
    applyMonthlyShift();
}
function previewWorkLog() {
    const date = document.getElementById('worklog-date').value;
    if (!date) return;
    const shift = document.getElementById('worklog-shift').value;
    const isSun = document.getElementById('worklog-type').value === 'sunday';
    const start = document.getElementById('worklog-start').value;
    const end = document.getElementById('worklog-end').value;
    if (start && end) {
        const c = calculateWorkLog(date, shift, isSun, start, end);
        document.getElementById('preview-regular').innerText = c.regularHours.toFixed(2);
        document.getElementById('preview-ot').innerText = c.overtimeHours.toFixed(2);
        document.getElementById('preview-pay').innerText = c.totalPay.toLocaleString('vi-VN') + ' đ';
    }
}
function addWorkLog() {
    const date = document.getElementById('worklog-date').value;
    if (!date) { showToast('Vui lòng chọn ngày!', 'warning'); return; }
    const shift = document.getElementById('worklog-shift').value;
    const isSun = document.getElementById('worklog-type').value === 'sunday';
    const start = document.getElementById('worklog-start').value;
    const end = document.getElementById('worklog-end').value;
    const note = document.getElementById('worklog-note').value;
    const idx = workLogs.findIndex(l => l.date === date && l.shift === shift);
    if (idx !== -1) { if (!confirm('Đã có bản ghi cho ngày này. Ghi đè?')) return; workLogs.splice(idx, 1); }
    const c = calculateWorkLog(date, shift, isSun, start, end);
    workLogs.push({ id: Date.now(), date, shift, isSunday: isSun, start, end, regularHours: c.regularHours, overtimeHours: c.overtimeHours, totalPay: c.totalPay });
    setNote(date, note);
    saveWorkLogsToStorage();
    applyWorklogMonthFilter();
    applyMonthlyShift();
    autoDetectSunday();
    haptic(); playSound();
    if (c.isPaidHoliday) showToast('🎉 Chấm công ngày lễ ' + c.holiday.name, 'success');
    else showToast('✅ Đã lưu chấm công!', 'success');
    if (!document.getElementById('page-dashboard').classList.contains('hidden')) loadDashboard();
    if (isAbsentDay(date)) unmarkAbsentDay(date);
}
function deleteWorkLog(id) {
    if (!confirm('Xóa bản ghi này?')) return;
    workLogs = workLogs.filter(l => l.id !== id);
    saveWorkLogsToStorage();
    applyWorklogMonthFilter();
    showToast('🗑️ Đã xóa.', 'warning');
    closeCalDetail();
    renderCalendar();
    if (!document.getElementById('page-dashboard').classList.contains('hidden')) loadDashboard();
}
function applyWorklogMonthFilter() {
    const m = parseInt(document.getElementById('worklog-month-select').value);
    const y = parseInt(document.getElementById('worklog-year-input').value);
    viewMonth = m; viewYear = y;
    loadWorkLogTable();
    document.getElementById('worklog-month-title').innerHTML = `📅 ${settings.language === 'vi' ? 'THÁNG' : 'MONTH'} ${String(m).padStart(2,'0')}/${y}`;
}
function loadWorkLogTable() {
    const tbody = document.getElementById('worklog-table-body');
    tbody.innerHTML = '';
    const empty = document.getElementById('worklog-empty');
    const filtered = getLogsByMonth(viewMonth, viewYear);
    if (filtered.length === 0) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(l => {
        const tr = document.createElement('tr');
        if (l.isSunday) tr.className = 'sunday-highlight';
        const paidHoliday = HolidayResolver.getPaidHoliday(l.date);
        if (paidHoliday) tr.className = 'holiday-highlight';
        const holidayIcon = paidHoliday ? ` ${paidHoliday.icon}` : '';
        tr.innerHTML = `<td>${l.date}${holidayIcon}</td><td>${l.shift}</td><td>${l.isSunday ? 'CN' : 'T'}</td><td>${l.start}</td><td>${l.end}</td><td>${l.regularHours.toFixed(2)}</td><td>${l.overtimeHours.toFixed(2)}</td><td>${l.totalPay.toLocaleString('vi-VN')}</td><td><button class="btn btn-danger btn-sm" onclick="deleteWorkLog(${l.id})">Xóa</button></td>`;
        tbody.appendChild(tr);
    });
}

// ═══ DELETE OLD ═══
function updateDeletePreview() {
    const m = parseInt(document.getElementById('delete-month').value);
    const y = parseInt(document.getElementById('delete-year').value);
    const cutoff = new Date(y, m - 1, 1);
    const del = workLogs.filter(l => new Date(l.date) < cutoff);
    document.getElementById('delete-count').innerText = del.length;
    document.getElementById('delete-month-label').innerText = `${String(m).padStart(2,'0')}/${y}`;
}
function confirmDeleteOldData() {
    const m = parseInt(document.getElementById('delete-month').value);
    const y = parseInt(document.getElementById('delete-year').value);
    const cutoff = new Date(y, m - 1, 1);
    const del = workLogs.filter(l => new Date(l.date) < cutoff);
    if (del.length === 0) { showToast('Không có dữ liệu cũ để xóa.', 'success'); return; }
    if (!confirm(`Xóa ${del.length} bản ghi trước tháng ${String(m).padStart(2,'0')}/${y}?`)) return;
    workLogs = workLogs.filter(l => new Date(l.date) >= cutoff);
    saveWorkLogsToStorage();
    showToast(`🗑️ Đã xóa ${del.length} bản ghi.`, 'success');
    updateDeletePreview();
    loadDashboard();
    applyWorklogMonthFilter();
}

// ═══ SETTINGS ═══
function loadSettingsForm() {
    document.getElementById('set-base-salary').value = settings.baseSalary;
    document.getElementById('set-standard-days').value = settings.standardWorkDays;
    document.getElementById('set-standard-hours').value = settings.standardShiftHours;
    document.getElementById('set-break-hours').value = settings.breakHours;
    document.getElementById('set-ot-normal-day').value = settings.otNormalDay;
    document.getElementById('set-ot-normal-night').value = settings.otNormalNight;
    document.getElementById('set-ot-sunday-day').value = settings.otSundayDay;
    document.getElementById('set-ot-sunday-night').value = settings.otSundayNight;
    document.getElementById('set-ot-holiday').value = settings.otHoliday;
    document.getElementById('set-morning-start').value = settings.morningStart;
    document.getElementById('set-morning-end').value = settings.morningEnd;
    document.getElementById('set-night-start').value = settings.nightStart;
    document.getElementById('set-night-end').value = settings.nightEnd;
    document.getElementById('set-haptic').checked = settings.haptic;
    document.getElementById('set-sound').checked = settings.sound;
    document.getElementById('set-reminders').checked = settings.reminders;
    document.getElementById('set-pin-enabled').checked = settings.pinEnabled;
    document.getElementById('set-pin-value').value = settings.pinValue || '';
    document.getElementById('theme-mode-select').value = settings.themeMode;
    document.getElementById('pin-setup').style.display = settings.pinEnabled ? 'block' : 'none';
    document.getElementById('settings-message').innerText = '';
    document.getElementById('delete-message').innerHTML = '';
    document.getElementById('backup-message').innerHTML = '';
    document.getElementById('restore-info').style.display = 'none';
    restoreData = null;
    updateDeletePreview();
    highlightThemeSwatch();
}
function saveSettings() {
    settings.baseSalary = parseFloat(document.getElementById('set-base-salary').value) || 0;
    settings.standardWorkDays = parseInt(document.getElementById('set-standard-days').value) || 0;
    settings.standardShiftHours = parseFloat(document.getElementById('set-standard-hours').value) || 0;
    settings.breakHours = parseFloat(document.getElementById('set-break-hours').value) || 0;
    settings.otNormalDay = parseFloat(document.getElementById('set-ot-normal-day').value) || 0;
    settings.otNormalNight = parseFloat(document.getElementById('set-ot-normal-night').value) || 0;
    settings.otSundayDay = parseFloat(document.getElementById('set-ot-sunday-day').value) || 0;
    settings.otSundayNight = parseFloat(document.getElementById('set-ot-sunday-night').value) || 0;
    settings.otHoliday = parseFloat(document.getElementById('set-ot-holiday').value) || 3.0;
    settings.morningStart = document.getElementById('set-morning-start').value;
    settings.morningEnd = document.getElementById('set-morning-end').value;
    settings.nightStart = document.getElementById('set-night-start').value;
    settings.nightEnd = document.getElementById('set-night-end').value;
    settings.haptic = document.getElementById('set-haptic').checked;
    settings.sound = document.getElementById('set-sound').checked;
    settings.reminders = document.getElementById('set-reminders').checked;
    settings.pinEnabled = document.getElementById('set-pin-enabled').checked;
    const pin = document.getElementById('set-pin-value').value.trim();
    if (settings.pinEnabled) {
        if (!/^\d{4}$/.test(pin)) { showToast('PIN phải gồm 4 số!', 'warning'); return; }
        settings.pinValue = pin;
    }
    saveSettingsToStorage();
    document.getElementById('settings-message').innerText = '✅ Đã lưu cài đặt!';
    showToast('✅ Đã lưu cài đặt!', 'success');
    loadDashboard();
}
function resetSettings() {
    if (!confirm('Khôi phục cài đặt mặc định?')) return;
    settings = { ...DEFAULT_SETTINGS };
    saveSettingsToStorage();
    applyTheme(); applyLanguage(); loadSettingsForm();
    showToast('↺ Đã khôi phục mặc định.', 'warning');
}
function highlightThemeSwatch() {
    document.querySelectorAll('.theme-swatch').forEach(s => { s.classList.toggle('active', s.dataset.themeColor === settings.themeColor); });
}

// ═══ PROFILES (Sub-profiles) ═══
function getProfiles() {
    const s = localStorage.getItem('tt_sub_profiles');
    if (s) { try { return JSON.parse(s); } catch(e) {} }
    return [{ id: 'default', name: 'Cá nhân' }];
}
function saveProfiles(p) { localStorage.setItem('tt_sub_profiles', JSON.stringify(p)); }
function getActiveProfile() { return localStorage.getItem('tt_active_sub_profile') || 'default'; }
function setActiveProfile(id) { localStorage.setItem('tt_active_sub_profile', id); }
function renderProfileList() {
    const list = document.getElementById('profile-list');
    const profiles = getProfiles();
    const active = getActiveProfile();
    list.innerHTML = profiles.map(p => `
        <div class="profile-item ${p.id === active ? 'active' : ''}" onclick="switchProfile('${p.id}')">
            <div class="profile-avatar">${p.name.charAt(0).toUpperCase()}</div>
            <div class="profile-name">${p.name}</div>
            ${p.id !== 'default' ? `<button class="btn-icon-sm" onclick="event.stopPropagation();deleteProfile('${p.id}')">🗑️</button>` : ''}
            ${p.id === active ? '<span class="profile-check">✓</span>' : ''}
        </div>`).join('');
}
function switchProfile(id) {
    if (id === getActiveProfile()) return;
    if (!confirm('Chuyển hồ sơ con? Dữ liệu sẽ thay đổi theo hồ sơ.')) return;
    setActiveProfile(id);
    Cache.invalidate();
    settings = loadSettings();
    workLogs = loadWorkLogs();
    applyTheme(); applyLanguage();
    renderProfileList();
    loadDashboard();
    showToast('✅ Đã chuyển hồ sơ.', 'success');
}
function addNewProfile() {
    const name = prompt('Tên hồ sơ mới:');
    if (!name || !name.trim()) return;
    const profiles = getProfiles();
    const id = 'p_' + Date.now();
    profiles.push({ id, name: name.trim() });
    saveProfiles(profiles);
    renderProfileList();
    showToast('✅ Đã thêm hồ sơ.', 'success');
}
function deleteProfile(id) {
    if (!confirm('Xóa hồ sơ này?')) return;
    saveProfiles(getProfiles().filter(p => p.id !== id));
    if (getActiveProfile() === id) {
        setActiveProfile('default');
        Cache.invalidate();
        settings = loadSettings();
        workLogs = loadWorkLogs();
        renderProfileList();
        loadDashboard();
    }
    renderProfileList();
    showToast('🗑️ Đã xóa hồ sơ.', 'warning');
}

// ═══ BACKUP ═══
function getAllData() {
    return { version: APP_VERSION, exportedAt: new Date().toISOString(), settings, workLogs, absentDays: getAbsentDays(), notes: getNotes() };
}
function exportBackup() {
    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `backup_cham_cong_${todayStr()}.json`, 'application/json');
    showToast('✅ Đã tải file sao lưu!', 'success');
}
function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.version || !data.settings || !data.workLogs) throw new Error('File không đúng định dạng.');
            restoreData = data;
            const logCount = data.workLogs.length;
            let range = 'Không có dữ liệu';
            if (logCount > 0) {
                const dates = data.workLogs.map(l => new Date(l.date));
                const min = new Date(Math.min(...dates)), max = new Date(Math.max(...dates));
                range = `${String(min.getMonth()+1).padStart(2,'0')}/${min.getFullYear()} - ${String(max.getMonth()+1).padStart(2,'0')}/${max.getFullYear()}`;
            }
            document.getElementById('restore-details').innerHTML = `
                <p>📦 Phiên bản: <strong>${data.version}</strong></p>
                <p>📅 Tạo lúc: <strong>${new Date(data.exportedAt).toLocaleString('vi-VN')}</strong></p>
                <p>📝 Số bản ghi: <strong>${logCount}</strong></p>
                <p>📊 Khoảng: <strong>${range}</strong></p>
                <p style="color:#d63384;font-weight:bold;margin-top:8px;">⚠️ Sẽ thay thế toàn bộ dữ liệu hiện tại!</p>`;
            document.getElementById('restore-info').style.display = 'block';
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'danger');
            document.getElementById('restore-info').style.display = 'none';
            restoreData = null;
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
function confirmRestore() {
    if (!restoreData) { showToast('Không có dữ liệu.', 'danger'); return; }
    if (!confirm(`Khôi phục ${restoreData.workLogs.length} bản ghi? Dữ liệu hiện tại sẽ bị thay thế.`)) return;
    try {
        settings = { ...DEFAULT_SETTINGS, ...restoreData.settings };
        workLogs = restoreData.workLogs.map(l => ({ ...l, regularHours: parseFloat(l.regularHours) || 0, overtimeHours: parseFloat(l.overtimeHours) || 0, totalPay: parseInt(l.totalPay) || 0 }));
        if (restoreData.absentDays) saveAbsentDays(restoreData.absentDays);
        if (restoreData.notes) saveNotes(restoreData.notes);
        saveSettingsToStorage();
        saveWorkLogsToStorage();
        Cache.invalidate();
        settings = loadSettings();
        workLogs = loadWorkLogs();
        applyTheme(); applyLanguage();
        showToast(`✅ Đã khôi phục ${workLogs.length} bản ghi!`, 'success');
        document.getElementById('restore-info').style.display = 'none';
        restoreData = null;
        loadDashboard();
        applyWorklogMonthFilter();
        loadSettingsForm();
    } catch (err) { showToast('Lỗi: ' + err.message, 'danger'); }
}
function cancelRestore() {
    restoreData = null;
    document.getElementById('restore-info').style.display = 'none';
    document.getElementById('backup-message').innerHTML = 'Đã hủy.';
}

// ═══ PIN ═══
function initPinLock() {
    if (!settings.pinEnabled || !settings.pinValue) return;
    document.getElementById('pin-lock').classList.remove('hidden');
    pinBuffer = '';
    updatePinDots();
}
function updatePinDots() {
    document.querySelectorAll('#pin-dots span').forEach((s,i) => { s.classList.toggle('filled', i < pinBuffer.length); });
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
        } else {
            document.getElementById('pin-error').textContent = '❌ Sai PIN!';
            if (window.Effects) window.Effects.shake(document.querySelector('.pin-box'));
            setTimeout(() => { pinBuffer = ''; updatePinDots(); }, 400);
        }
    }
}

// ═══ SPLASH ═══
function hideSplash() {
    const s = document.getElementById('splash-screen');
    if (!s) return;
    setTimeout(() => { s.classList.add('hide'); setTimeout(() => s.remove(), 600); }, 1600);
}

// ═══ TOP BAR SCROLL ═══
function setupTopBarScroll() {
    const topBar = document.getElementById('topBar');
    if (!topBar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => { topBar.classList.toggle('scrolled', window.scrollY > 8); ticking = false; });
            ticking = true;
        }
    }, { passive: true });
}

// ═══ INIT APP ═══
function initApp() {
    initState();
    applyTheme();
    initMonthSelects();

    const now = new Date();
    const m = now.getMonth() + 1, y = now.getFullYear();
    document.getElementById('dash-month-select').value = m;
    document.getElementById('dash-year-input').value = y;
    document.getElementById('worklog-month-select').value = m;
    document.getElementById('worklog-year-input').value = y;
    document.getElementById('stat-month-select').value = m;
    document.getElementById('stat-year-input').value = y;
    document.getElementById('delete-year').value = y - 1;
    document.getElementById('delete-month').value = m;

    applyLanguage();

    if (!initApp._bound) {
        initApp._bound = true;

        document.getElementById('worklog-date').addEventListener('change', () => { autoDetectSunday(); applyMonthlyShift(); });
        document.getElementById('worklog-shift').addEventListener('change', function() { autoSetTimes(); saveMonthlyShift(this.value); });
        document.getElementById('worklog-start').addEventListener('change', previewWorkLog);
        document.getElementById('worklog-end').addEventListener('change', previewWorkLog);
        document.getElementById('worklog-type').addEventListener('change', previewWorkLog);
        document.getElementById('delete-month').addEventListener('change', updateDeletePreview);
        document.getElementById('delete-year').addEventListener('input', updateDeletePreview);

        document.getElementById('theme-toggle').addEventListener('click', () => {
            const modes = ['auto','light','dark'];
            const i = modes.indexOf(settings.themeMode);
            settings.themeMode = modes[(i+1) % 3];
            saveSettingsToStorage();
            applyTheme();
            const names = { auto:'🌓 Tự động', light:'☀️ Sáng', dark:'🌙 Tối' };
            showToast('🎨 ' + names[settings.themeMode], 'info');
        });
        document.getElementById('lang-toggle').addEventListener('click', () => {
            settings.language = settings.language === 'vi' ? 'en' : 'vi';
            saveSettingsToStorage();
            applyLanguage();
            const activePage = document.querySelector('.bottom-nav .nav-item.active').dataset.page;
            switchPage(activePage);
            showToast(settings.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English', 'info');
        });

        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                if (window.FirebaseSync) {
                    window.FirebaseSync.smartSync().then(result => {
                        if (result && result.action === 'download') {
                            showToast('☁️ Đã tải data mới từ cloud', 'success');
                            reloadStateFromStorage();
                        } else if (result && result.action === 'upload') {
                            showToast('☁️ Đã upload data lên cloud', 'success');
                        } else {
                            showToast('✅ Data đã được đồng bộ', 'info');
                        }
                    });
                }
            });
        }

        document.querySelectorAll('.theme-swatch').forEach(s => {
            s.addEventListener('click', () => { settings.themeColor = s.dataset.themeColor; saveSettingsToStorage(); applyTheme(); highlightThemeSwatch(); });
        });
        document.getElementById('theme-mode-select').addEventListener('change', function() { settings.themeMode = this.value; saveSettingsToStorage(); applyTheme(); });
        document.getElementById('set-pin-enabled').addEventListener('change', function() { document.getElementById('pin-setup').style.display = this.checked ? 'block' : 'none'; });
        document.getElementById('pin-pad').addEventListener('click', e => { const btn = e.target.closest('button'); if (!btn) return; handlePinInput(btn.dataset.num); });
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (settings.themeMode === 'auto') applyTheme(); });

        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchPage(item.dataset.page); }
            });
        });

        if (window.FirebaseSync) {
            window.FirebaseSync.onSyncState((state, error) => {
                const btn = document.getElementById('sync-btn');
                if (!btn) return;
                btn.classList.remove('syncing', 'synced', 'error');
                if (state === 'uploading' || state === 'downloading' || state === 'checking') btn.classList.add('syncing');
                else if (state === 'success' || state === 'synced') { btn.classList.add('synced'); setTimeout(() => btn.classList.remove('synced'), 2000); }
                else if (state === 'error') btn.classList.add('error');
            });
        }
    }

    document.getElementById('worklog-date').value = todayStr();
    applyMonthlyShift();
    autoDetectSunday();

    switchPage('dashboard');
    applyWorklogMonthFilter();

    setupTopBarScroll();

    setTimeout(() => { if (window.Effects) window.Effects.autoAttach(); }, 100);

    setInterval(checkReminder, 30 * 60 * 1000);
}

// ═══ CALCULATE ═══
function calculateWorkLog(workDate, shift, isSunday, startTimeStr, endTimeStr) {
    const dailyRate = settings.baseSalary / settings.standardWorkDays;
    const hourlyRate = dailyRate / settings.standardShiftHours;
    let regularHours = 0, overtimeHours = 0;
    const start = startTimeStr, end = endTimeStr;

    if (isSunday) {
        regularHours = 0;
        if (shift === 'Sáng') {
            if (start === '07:30' && end === '16:00') overtimeHours = 8;
            else if (start === '07:30' && end === '19:30') overtimeHours = 11.5;
            else {
                const s = new Date(`2000-01-01T${start}:00`);
                let e = new Date(`2000-01-01T${end}:00`);
                if (e < s) e = new Date(e.getTime() + 86400000);
                let total = (e - s) / 3600000;
                total = total > settings.breakHours ? total - settings.breakHours : 0;
                overtimeHours = total;
            }
        } else {
            if (start === '19:30' && end === '04:00') overtimeHours = 8;
            else if (start === '19:30' && end === '07:30') overtimeHours = 11.75;
            else {
                const s = new Date(`2000-01-01T${start}:00`);
                let e = new Date(`2000-01-01T${end}:00`);
                if (e < s) e = new Date(e.getTime() + 86400000);
                let total = (e - s) / 3600000;
                total = total > settings.breakHours ? total - settings.breakHours : 0;
                overtimeHours = total;
            }
        }
    } else {
        regularHours = 8;
        if (shift === 'Sáng') {
            if (start === '07:30' && end === '16:00') overtimeHours = 0;
            else if (start === '07:30' && end === '19:30') overtimeHours = 3.5;
            else {
                const s = new Date(`2000-01-01T${start}:00`);
                let e = new Date(`2000-01-01T${end}:00`);
                if (e < s) e = new Date(e.getTime() + 86400000);
                let total = (e - s) / 3600000;
                total = total > settings.breakHours ? total - settings.breakHours : 0;
                overtimeHours = total > 8 ? total - 8 : 0;
                regularHours = Math.min(total, 8);
            }
        } else {
            if (start === '19:30' && end === '04:00') overtimeHours = 0;
            else if (start === '19:30' && end === '07:30') overtimeHours = 3.75;
            else {
                const s = new Date(`2000-01-01T${start}:00`);
                let e = new Date(`2000-01-01T${end}:00`);
                if (e < s) e = new Date(e.getTime() + 86400000);
                let total = (e - s) / 3600000;
                total = total > settings.breakHours ? total - settings.breakHours : 0;
                overtimeHours = total > 8 ? total - 8 : 0;
                regularHours = Math.min(total, 8);
            }
        }
    }
    regularHours = Math.round(regularHours * 100) / 100;
    overtimeHours = Math.round(overtimeHours * 100) / 100;

    const regularPay = regularHours * hourlyRate;
    let overtimePay = 0;
    const paidHoliday = HolidayResolver.getPaidHoliday(workDate);

    if (overtimeHours > 0) {
        let coeff;
        if (paidHoliday) coeff = settings.otHoliday;
        else if (isSunday) coeff = shift === 'Sáng' ? settings.otSundayDay : settings.otSundayNight;
        else coeff = shift === 'Sáng' ? settings.otNormalDay : settings.otNormalNight;
        overtimePay = overtimeHours * hourlyRate * coeff;
    }
    return { regularHours, overtimeHours, totalPay: Math.round(regularPay + overtimePay), isPaidHoliday: !!paidHoliday, holiday: paidHoliday };
}

// ═══ FIREBASE INTEGRATION ═══
window.updateUserInfo = function (profile) {
    if (!profile) return;
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = profile.displayName || profile.username;
    const avatarEl = document.getElementById('settings-avatar');
    if (avatarEl) avatarEl.textContent = (profile.username || 'U').charAt(0).toUpperCase();
    const usernameEl = document.getElementById('settings-username');
    if (usernameEl) usernameEl.textContent = profile.username;
    const emailEl = document.getElementById('settings-email');
    if (emailEl) {
        if (profile.hasRealEmail && profile.email) emailEl.textContent = profile.email;
        else emailEl.textContent = 'Chưa có email khôi phục';
    }
};

window.onDataSynced = function (data) {
    Cache.invalidate();
    settings = loadSettings();
    workLogs = loadWorkLogs();
    loadDashboard();
    applyWorklogMonthFilter();
    renderCalendar();
};

window.initApp = function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initApp());
    } else initApp();
};

// ═══ BOOTSTRAP ═══
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 TimeTracker v' + APP_VERSION + ' starting...');
    try {
        await window.Auth.init();
        window.AuthUI.init();
        window.FirebaseSync.init();
        console.log('✅ Firebase initialized');
    } catch (err) {
        console.error('❌ Firebase init failed:', err);
        if (window.showToast) window.showToast('Lỗi kết nối server. Kiểm tra mạng!', 'danger');
    }
});