// ========================================================================
// TIMETRACKER v4.4 — Script chính
// Màu cell theo trạng thái + fix getCellHours
// ========================================================================

const APP_VERSION = "4.4.0";

const DEFAULT_SETTINGS = {
    baseSalary: 5900000, standardWorkDays: 26, standardShiftHours: 8, breakHours: 1,
    otNormalDay: 1.5, otNormalNight: 1.7, otSundayDay: 2.0, otSundayNight: 2.7, otHoliday: 3.0,
    morningStart: "07:30", morningEnd: "19:30", nightStart: "19:30", nightEnd: "07:30",
    monthlyGoal: 8000000,
    themeMode: "auto",
    haptic: true, sound: true, reminders: true,
    pinEnabled: false, pinValue: "", language: "vi"
};

// ═══ SVG ICON HELPERS ═══
const SVG = {
    check: '<svg width="16" height="16"><use href="#i-check"/></svg>',
    edit: '<svg width="14" height="14"><use href="#i-edit"/></svg>',
    x: '<svg width="14" height="14"><use href="#i-x"/></svg>',
    refresh: '<svg width="14" height="14"><use href="#i-refresh"/></svg>',
    sun: '<svg width="14" height="14"><use href="#i-sun"/></svg>',
    moon: '<svg width="14" height="14"><use href="#i-moon"/></svg>',
    trash: '<svg width="14" height="14"><use href="#i-trash"/></svg>',
    save: '<svg width="14" height="14"><use href="#i-save"/></svg>',
    calendar: '<svg width="14" height="14"><use href="#i-calendar"/></svg>',
    chevronDown: '<svg width="14" height="14"><use href="#i-chevron-down"/></svg>',
    wallet: '<svg width="14" height="14"><use href="#i-wallet"/></svg>',
    alertTri: '<svg width="16" height="16"><use href="#i-alert-triangle"/></svg>',
    alertCircle: '<svg width="16" height="16"><use href="#i-alert-circle"/></svg>',
    checkCircle: '<svg width="16" height="16"><use href="#i-check-circle-2"/></svg>',
    infoCircle: '<svg width="16" height="16"><use href="#i-info-2"/></svg>',
    flame: '<svg width="20" height="20"><use href="#i-flame"/></svg>',
    book: '<svg width="20" height="20"><use href="#i-book"/></svg>',
    trophy: '<svg width="20" height="20"><use href="#i-trophy"/></svg>',
    star: '<svg width="14" height="14"><use href="#i-star"/></svg>',
    medal: '<svg width="14" height="14"><use href="#i-medal"/></svg>',
    clock: '<svg width="14" height="14"><use href="#i-clock"/></svg>',
    trending: '<svg width="14" height="14"><use href="#i-trending"/></svg>',
    users: '<svg width="14" height="14"><use href="#i-users"/></svg>',
    lock: '<svg width="14" height="14"><use href="#i-lock"/></svg>',
    shield: '<svg width="14" height="14"><use href="#i-shield"/></svg>',
    database: '<svg width="14" height="14"><use href="#i-database"/></svg>',
    image: '<svg width="14" height="14"><use href="#i-image"/></svg>',
    download: '<svg width="14" height="14"><use href="#i-download"/></svg>',
    upload: '<svg width="14" height="14"><use href="#i-upload"/></svg>',
    plus: '<svg width="14" height="14"><use href="#i-plus"/></svg>',
    moonFill: '<svg width="12" height="12" fill="currentColor"><use href="#i-moon"/></svg>',
    sunFill: '<svg width="12" height="12" fill="currentColor"><use href="#i-sun"/></svg>'
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
        app_subtitle: "Chấm công & Lương",
        pin_title: "Nhập mã PIN", pin_hint: "Nhập 4 số để mở khóa",
        hero_loading: "Đang tải...", hero_not_checked: "Chưa chấm công",
        hero_checked: "Đã chấm công", hero_absent: "Đã nghỉ",
        reminder_title: "Chưa chấm công hôm nay!", reminder_sub: "Bạn quên chấm công à?",
        checkin: "Chấm", confirm_checkin: "Xác nhận", edit_btn: "Sửa", absent_btn: "Nghỉ", back_work: "Đi làm",
        achievements: "Thành tích", days_worked: "Ngày công", hours_worked: "Giờ làm",
        overtime: "Tăng ca", salary: "Lương", monthly_goal: "Mục tiêu tháng",
        projected: "Dự kiến cuối tháng", projected_short: "Dự kiến", month_short: "THÁNG",
        remaining: "Còn", days: "ngày làm việc",
        info: "Thông tin", base_salary: "Lương cơ bản", standard_days: "Ngày công chuẩn",
        shifts_done: "Số ca đã làm", view_other_month: "Xem tháng khác", view: "Xem",
        viewing: "Đang xem", calendar: "Lịch tháng",
        solar_cal: "Dương lịch", lunar_cal: "Âm lịch",
        legend_day_status: "Trạng thái ngày",
        legend_done: "Đã đi làm",
        legend_done_holiday: "Đi làm ngày lễ",
        legend_done_sunday: "Đi làm Chủ nhật",
        legend_absent: "Đã nghỉ",
        legend_sunday: "Chủ nhật",
        legend_today: "Hôm nay",
        legend_holiday_type: "Ngày lễ",
        legend_paid: "Lễ có lương", legend_social: "Kỷ niệm",
        legend_trad: "Truyền thống", legend_religion: "Tôn giáo", legend_recurring: "Mùng 1, Rằm",
        enter_worklog: "Nhập chấm công",
        work_date: "Ngày làm việc", today: "Hôm nay", shift: "Ca làm", day_type: "Loại ngày",
        shift_morning: "Ca sáng", shift_night: "Ca đêm",
        day_normal: "Ngày thường", day_sunday: "Chủ nhật",
        start: "Giờ bắt đầu", end: "Giờ kết thúc", note: "Ghi chú", preview: "Xem trước",
        regular_hours: "Giờ thường", ot_hours: "Tăng ca", pay: "Tiền công",
        save: "Lưu chấm công", save_settings: "Lưu cài đặt",
        col_date: "Ngày", col_shift: "Ca", col_type: "Loại", col_in: "Vào", col_out: "Ra",
        col_reg: "Thường", col_ot: "TC", col_pay: "Tiền", no_data: "Không có dữ liệu",
        statistics: "Thống kê tháng", daily_hours: "Giờ làm theo ngày",
        shift_ratio: "Tỉ lệ ca làm", trend: "Xu hướng 6 tháng",
        export_png: "Xuất ảnh PNG", clear: "Xóa",
        profiles: "Hồ sơ", add_profile: "Thêm hồ sơ", appearance: "Giao diện",
        theme_mode: "Chế độ", theme_auto: "Tự động", theme_light: "Sáng", theme_dark: "Tối",
        haptic: "Rung khi chấm công", sound: "Âm thanh", reminders: "Nhắc nhở",
        security: "Bảo mật", pin_lock: "Khóa PIN", pin_new: "PIN mới (4 số)",
        base_salary_full: "Lương cơ bản", base_salary_input: "Lương cơ bản (đ/tháng)",
        standard_days_input: "Ngày công chuẩn", standard_hours: "Giờ chuẩn/ca",
        break_hours: "Giờ nghỉ giữa ca", ot_coeff: "Hệ số tăng ca",
        ot_normal_day: "Thường - Sáng", ot_normal_night: "Thường - Đêm",
        ot_sunday_day: "Chủ nhật - Sáng", ot_sunday_night: "Chủ nhật - Đêm",
        ot_holiday: "Hệ số tăng ca ngày lễ bắt buộc",
        default_times: "Thời gian mặc định", morning_start: "Ca sáng bắt đầu",
        morning_end: "Ca sáng kết thúc", night_start: "Ca đêm bắt đầu",
        night_end: "Ca đêm kết thúc", backup: "Sao lưu & Khôi phục",
        backup_btn: "Sao lưu", restore_btn: "Khôi phục", confirm: "Xác nhận", cancel: "Hủy",
        delete_old: "Xóa dữ liệu cũ", delete_desc: "Xóa tất cả dữ liệu trước tháng chọn",
        month: "Tháng", year: "Năm", will_delete: "Xóa", records_before: "bản ghi trước",
        delete_btn: "Xóa dữ liệu cũ", reset: "Mặc định",
        ocr_title: "Đối chiếu công HR",
        ocr_desc: "Tải ảnh bảng chấm công HR để tự động so sánh với dữ liệu app.",
        ocr_choose: "Chọn ảnh bảng công",
        nav_home: "Home", nav_calendar: "Lịch", nav_worklog: "Chấm",
        nav_stats: "Thống kê", nav_settings: "Cài đặt"
    },
    en: {
        app_subtitle: "Time & Salary",
        pin_title: "Enter PIN", pin_hint: "Enter 4 digits to unlock",
        hero_loading: "Loading...", hero_not_checked: "Not checked in",
        hero_checked: "Checked in", hero_absent: "Absent",
        reminder_title: "Not checked in today!", reminder_sub: "Did you forget?",
        checkin: "Check", confirm_checkin: "Confirm", edit_btn: "Edit", absent_btn: "Absent", back_work: "Back to work",
        achievements: "Achievements", days_worked: "Days", hours_worked: "Hours",
        overtime: "Overtime", salary: "Salary", monthly_goal: "Monthly Goal",
        projected: "Projected Month End", projected_short: "Projected", month_short: "MONTH",
        remaining: "Remaining", days: "working days",
        info: "Info", base_salary: "Base Salary", standard_days: "Standard Days",
        shifts_done: "Shifts Done", view_other_month: "View Other Month", view: "View",
        viewing: "Viewing", calendar: "Calendar",
        solar_cal: "Solar", lunar_cal: "Lunar",
        legend_day_status: "Day Status",
        legend_done: "Worked",
        legend_done_holiday: "Worked holiday",
        legend_done_sunday: "Worked Sunday",
        legend_absent: "Absent",
        legend_sunday: "Sunday",
        legend_today: "Today",
        legend_holiday_type: "Holidays",
        legend_paid: "Paid holiday", legend_social: "Social",
        legend_trad: "Traditional", legend_religion: "Religious", legend_recurring: "1st & 15th",
        enter_worklog: "Enter Worklog",
        work_date: "Work Date", today: "Today", shift: "Shift", day_type: "Day Type",
        shift_morning: "Morning", shift_night: "Night",
        day_normal: "Normal day", day_sunday: "Sunday",
        start: "Start", end: "End", note: "Note", preview: "Preview",
        regular_hours: "Regular", ot_hours: "OT", pay: "Pay",
        save: "Save", save_settings: "Save settings",
        col_date: "Date", col_shift: "Shift", col_type: "Type", col_in: "In", col_out: "Out",
        col_reg: "Reg", col_ot: "OT", col_pay: "Pay", no_data: "No data",
        statistics: "Monthly Statistics", daily_hours: "Daily Hours",
        shift_ratio: "Shift Ratio", trend: "6-Month Trend",
        export_png: "Export PNG", clear: "Clear",
        profiles: "Profiles", add_profile: "Add Profile", appearance: "Appearance",
        theme_mode: "Mode", theme_auto: "Auto", theme_light: "Light", theme_dark: "Dark",
        haptic: "Haptic on check-in", sound: "Sound", reminders: "Reminders",
        security: "Security", pin_lock: "PIN Lock", pin_new: "New PIN (4 digits)",
        base_salary_full: "Base Salary", base_salary_input: "Base salary (VND/month)",
        standard_days_input: "Standard days", standard_hours: "Hours/shift",
        break_hours: "Break hours", ot_coeff: "OT Coefficients",
        ot_normal_day: "Normal - Day", ot_normal_night: "Normal - Night",
        ot_sunday_day: "Sunday - Day", ot_sunday_night: "Sunday - Night",
        ot_holiday: "Holiday OT coefficient",
        default_times: "Default Times", morning_start: "Morning start",
        morning_end: "Morning end", night_start: "Night start",
        night_end: "Night end", backup: "Backup & Restore",
        backup_btn: "Backup", restore_btn: "Restore", confirm: "Confirm", cancel: "Cancel",
        delete_old: "Delete Old Data", delete_desc: "Delete all data before the selected month",
        month: "Month", year: "Year", will_delete: "Delete", records_before: "records before",
        delete_btn: "Delete Old Data", reset: "Reset",
        ocr_title: "HR Worklog Compare",
        ocr_desc: "Upload HR worklog image to auto-compare with app data.",
        ocr_choose: "Choose worklog image",
        nav_home: "Home", nav_calendar: "Calendar", nav_worklog: "Log",
        nav_stats: "Stats", nav_settings: "Settings"
    }
});

// ═══ MULTI-PROFILE ═══
function getProfiles() {
    const s = localStorage.getItem('tt_profiles');
    if (s) { try { return JSON.parse(s); } catch(e) {} }
    return [{ id: 'default', name: 'Cá nhân' }];
}
function saveProfiles(p) { localStorage.setItem('tt_profiles', JSON.stringify(p)); }
function getActiveProfile() { return localStorage.getItem('tt_active_profile') || 'default'; }
function setActiveProfile(id) { localStorage.setItem('tt_active_profile', id); }
function storageKey(base) {
    const p = getActiveProfile();
    return p === 'default' ? `timesheet_${base}` : `timesheet_${p}_${base}`;
}

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

// ═══ LOAD / SAVE ═══
function loadSettings() {
    return Cache.get('settings', () => {
        const s = localStorage.getItem(storageKey('settings'));
        if (s) {
            try {
                const parsed = JSON.parse(s);
                delete parsed.themeColor;
                return { ...DEFAULT_SETTINGS, ...parsed };
            } catch(e) {}
        }
        return { ...DEFAULT_SETTINGS };
    });
}
function saveSettingsToStorage() {
    localStorage.setItem(storageKey('settings'), JSON.stringify(settings));
    Cache.set('settings', settings);
}
function loadWorkLogs() {
    return Cache.get('workLogs', () => {
        const s = localStorage.getItem(storageKey('worklogs'));
        try { return s ? JSON.parse(s) : []; } catch(e) { return []; }
    });
}
function saveWorkLogsToStorage() {
    localStorage.setItem(storageKey('worklogs'), JSON.stringify(workLogs));
    Cache.set('workLogs', workLogs);
    _calRenderCache.clear();
    _statsRenderCache.clear();
}

// ═══ ABSENT ═══
function getAbsentDays() {
    return Cache.get('absentDays', () => {
        const s = localStorage.getItem(storageKey('absent_days'));
        try { return s ? JSON.parse(s) : []; } catch(e) { return []; }
    });
}
function saveAbsentDays(days) {
    localStorage.setItem(storageKey('absent_days'), JSON.stringify(days));
    Cache.set('absentDays', days);
}
function isAbsentDay(d) { return getAbsentDays().indexOf(d) !== -1; }
function markAbsentDay(d) {
    const a = getAbsentDays();
    if (a.indexOf(d) === -1) { a.push(d); saveAbsentDays(a); }
}
function unmarkAbsentDay(d) { saveAbsentDays(getAbsentDays().filter(x => x !== d)); }

// ═══ NOTES ═══
function getNotes() {
    return Cache.get('notes', () => {
        const s = localStorage.getItem(storageKey('notes'));
        try { return s ? JSON.parse(s) : {}; } catch(e) { return {}; }
    });
}
function saveNotes(n) {
    localStorage.setItem(storageKey('notes'), JSON.stringify(n));
    Cache.set('notes', n);
    _calRenderCache.clear();
}
function getNote(d) { return getNotes()[d] || ''; }
function setNote(d, text) {
    const n = getNotes();
    if (text.trim()) n[d] = text.trim();
    else delete n[d];
    saveNotes(n);
}
function initState() {
    settings = loadSettings();
    workLogs = loadWorkLogs();
    getAbsentDays();
    getNotes();
}
function invalidateAllCache() {
    Cache.invalidate();
    _calRenderCache.clear();
    _statsRenderCache.clear();
}

// ═══ TOAST ═══
const _activeToasts = new Set();
function showToast(message, type = 'success') {
    if (_activeToasts.size >= 3) {
        const first = _activeToasts.values().next().value;
        if (first) { first.remove(); _activeToasts.delete(first); }
    }
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: SVG.checkCircle,
        warning: SVG.alertTri,
        danger: SVG.alertCircle,
        info: SVG.infoCircle
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || SVG.infoCircle}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">
            <svg width="14" height="14"><use href="#i-x"/></svg>
        </button>`;
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
function dateToStr(d) {
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
    for (let i = 0; i < workLogs.length; i++) {
        if (workLogs[i].date === d) return workLogs[i];
    }
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
        if (el) {
            const currentVal = el.value;
            el.innerHTML = html;
            if (currentVal) el.value = currentVal;
        }
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
function _applyThemeRaw() {
    let mode = settings.themeMode;
    if (mode === 'auto') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0A0A0A' : '#000000');

    const statsPage = document.getElementById('page-statistics');
    if (statsPage && !statsPage.classList.contains('hidden')) {
        _statsRenderCache.clear();
        loadStatistics();
    }

    const dashPage = document.getElementById('page-dashboard');
    if (dashPage && !dashPage.classList.contains('hidden')) {
        loadDashboard();
    }
}
function applyTheme() {
    if (window.Effects && window.Effects.smoothThemeChange) {
        window.Effects.smoothThemeChange(_applyThemeRaw);
    } else {
        _applyThemeRaw();
    }
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
        if (p === 'settings') { loadSettingsForm(); updateDeletePreview(); renderProfileList(); }
    };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.startViewTransition(doSwitch);
    } else doSwitch();
    if (window.Effects) setTimeout(() => window.Effects.attachRippleAll(), 100);
}
function goToCurrentMonth(page) {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    if (page === 'dashboard') {
        document.getElementById('dash-month-select').value = m;
        document.getElementById('dash-year-input').value = y;
        loadDashboard();
    } else if (page === 'worklog') {
        document.getElementById('worklog-month-select').value = m;
        document.getElementById('worklog-year-input').value = y;
        applyWorklogMonthFilter();
    } else if (page === 'statistics') {
        document.getElementById('stat-month-select').value = m;
        document.getElementById('stat-year-input').value = y;
        loadStatistics();
    }
}

// ═══ MONTHLY SHIFT ═══
function getMonthKey() {
    const d = new Date();
    return `monthly_shift_${d.getFullYear()}_${d.getMonth() + 1}`;
}
function loadMonthlyShift() { return localStorage.getItem(getMonthKey()); }
function saveMonthlyShift(s) { localStorage.setItem(getMonthKey(), s); }

// ═══ SUGGESTED SHIFT ═══
function getLastWorkShift() {
    if (workLogs.length === 0) return null;
    let latest = workLogs[0];
    for (let i = 1; i < workLogs.length; i++) {
        if (new Date(workLogs[i].date) > new Date(latest.date)) latest = workLogs[i];
    }
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
    const now = new Date();
    const hour = now.getHours();
    const hasHistory = workLogs.length > 0;

    let ts = null;
    let forceShift = null;

    if (hour < 8) {
        if (hasHistory) {
            const suggested = getSuggestedShift();
            if (suggested.shift === 'Đêm') {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                ts = dateToStr(yesterday);
                forceShift = 'Đêm';
                showToast(`Chấm cho ca đêm ngày ${ts}`, 'info');
            } else {
                ts = todayStr();
            }
        } else {
            const today = todayStr();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = dateToStr(yesterday);

            const choice = confirm(
                `Bây giờ là ${hour}h sáng.\n\n` +
                `Bạn đang chấm công cho:\n\n` +
                `[OK]     Ca đêm HÔM QUA (${yesterdayStr})\n` +
                `[Cancel] Ca ngày HÔM NAY (${today})`
            );

            if (choice) {
                ts = yesterdayStr;
                forceShift = 'Đêm';
            } else {
                ts = today;
            }
        }
    } else {
        ts = todayStr();
    }

    if (getLogByDate(ts)) {
        showToast('Bạn đã chấm công ngày này!', 'warning');
        return;
    }
    if (isAbsentDay(ts)) {
        if (!confirm('Ngày này đã xác nhận nghỉ. Đổi thành đi làm?')) return;
        unmarkAbsentDay(ts);
    }

    const suggested = getSuggestedShift();
    let shift, startTime, endTime;

    if (forceShift === 'Đêm') {
        shift = 'Đêm';
        startTime = settings.nightStart || '19:30';
        endTime = settings.nightEnd || '07:30';
    } else {
        shift = suggested.shift;
        startTime = suggested.startTime;
        endTime = suggested.endTime;
    }

    const isSunday = new Date(ts + 'T00:00:00').getDay() === 0;
    const r = calculateWorkLog(ts, shift, isSunday, startTime, endTime);

    workLogs.push({
        id: Date.now(), date: ts, shift: shift, isSunday,
        start: startTime, end: endTime,
        regularHours: r.regularHours,
        overtimeHours: r.overtimeHours,
        totalPay: r.totalPay
    });

    saveWorkLogsToStorage();
    haptic();
    playSound();

    if (window.Effects) {
        const btn = document.querySelector('.hero-actions .btn-confirm');
        if (btn) {
            const rect = btn.getBoundingClientRect();
            window.Effects.miniConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
        if (window.Effects.showCheckmark) window.Effects.showCheckmark();
    }

    if (r.isPaidHoliday) showToast('Chấm công ngày lễ ' + r.holiday.name, 'success');
    else showToast(`Đã chấm ca ${shift} ngày ${ts}`, 'success');

    loadDashboard();
    if (!document.getElementById('page-worklog').classList.contains('hidden')) applyWorklogMonthFilter();
    if (!document.getElementById('page-calendar').classList.contains('hidden')) renderCalendar();
}

function confirmAbsent() {
    const ts = todayStr();
    if (getLogByDate(ts)) { showToast('Bạn đã chấm công hôm nay.', 'warning'); return; }
    if (isAbsentDay(ts)) { showToast('Đã xác nhận nghỉ hôm nay.', 'warning'); return; }
    if (confirm(`Xác nhận hôm nay (${ts}) bạn KHÔNG đi làm?`)) {
        markAbsentDay(ts);
        loadDashboard();
        showToast('Đã xác nhận nghỉ.', 'success');
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

// ═══ HERO STATE ═══
function getHeroState(ds, log, absent) {
    if (log) return 'done';
    if (absent) return 'absent';
    const holidays = HolidayResolver.getSolarDayHolidays(ds);
    const paidHoliday = holidays.find(h => h.paid);
    if (paidHoliday) return 'holiday';
    return 'default';
}

// ═══ QUICK CHECK-IN UI ═══
function renderQuickCheckin() {
    const content = document.getElementById('quick-checkin-content');
    const heroCard = document.getElementById('quick-checkin-card');
    const ts = todayStr();
    const today = new Date();
    const dow = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][today.getDay()];
    const log = getLogByDate(ts);
    const absent = isAbsentDay(ts);

    document.getElementById('hero-date').textContent = ts;
    const dot = document.querySelector('.hero-status-dot');
    const txt = document.querySelector('.hero-status-text');
    const t = I18N[settings.language] || I18N.vi;

    const holidays = HolidayResolver.getSolarDayHolidays(ts);
    const paidHoliday = holidays.find(h => h.paid);
    const anyHoliday = paidHoliday || holidays[0];

    const state = getHeroState(ts, log, absent);
    if (heroCard) heroCard.setAttribute('data-state', state);

    if (log) { dot.className = 'hero-status-dot'; txt.textContent = t.hero_checked; }
    else if (absent) { dot.className = 'hero-status-dot off'; txt.textContent = t.hero_absent; }
    else { dot.className = 'hero-status-dot inactive'; txt.textContent = t.hero_not_checked; }

    let holidayBanner = '';
    if (anyHoliday) {
        const label = paidHoliday ? `Lễ có lương — đi làm x${settings.otHoliday}` : 'Ngày lễ';
        holidayBanner = `
            <div style="background:rgba(255,255,255,0.10);border-radius:12px;padding:8px 12px;margin-bottom:10px;display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.08);">
                <span style="display:inline-flex;width:20px;height:20px;color:var(--hero-fg);">
                    <svg width="20" height="20"><use href="#i-star"/></svg>
                </span>
                <div style="flex:1;">
                    <div style="font-weight:800;font-size:13px;">${anyHoliday.name}</div>
                    <div style="font-size:11px;opacity:0.85;">${label}</div>
                </div>
            </div>`;
    }

    if (log) {
        content.innerHTML = holidayBanner + `
            <div class="checked-in">
                <div class="info">
                    <span style="font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:6px;">
                        ${log.shift === 'Sáng' ? SVG.sun : SVG.moon}
                        ${log.shift}
                    </span>
                    <span class="badge">
                        ${SVG.clock}
                        ${log.start} → ${log.end}
                    </span>
                    <span class="badge">${log.regularHours.toFixed(2)}h</span>
                </div>
                <span class="pay">${log.totalPay.toLocaleString('vi-VN')} đ</span>
            </div>`;
        return;
    }
    if (absent) {
        content.innerHTML = holidayBanner + `
            <div class="absent-status">
                <span class="label">
                    ${SVG.x}
                    ${t.hero_absent}
                </span>
                <button class="btn btn-confirm" onclick="quickCheckIn()" style="padding:8px 16px;font-size:12px;background:#FAFAFA;color:#0A0A0A;border-radius:12px;font-weight:700;border:none;cursor:pointer;min-height:36px;display:inline-flex;align-items:center;gap:6px;">
                    ${SVG.refresh}
                    ${t.back_work}
                </button>
            </div>`;
        return;
    }
    const s = getSuggestedShift();
    const isSunday = today.getDay() === 0;
    const dayType = isSunday ? t.day_sunday : t.day_normal;
    const r = calculateWorkLog(ts, s.shift, isSunday, s.startTime, s.endTime);
    const pv = r.totalPay.toLocaleString('vi-VN') + ' đ';
    content.innerHTML = holidayBanner + `
        <div class="hero-info"><span class="day-label">${settings.language === 'vi' ? 'Hôm nay' : 'Today'} <strong>${dow}</strong> · ${dayType}</span></div>
        <div class="hero-preview">
            <div class="preview-left">
                <span style="font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:6px;">
                    ${s.shift === 'Sáng' ? SVG.sun : SVG.moon}
                    ${s.shift}
                </span>
                <span class="preview-tag">${SVG.clock} ${s.startTime} → ${s.endTime}</span>
                <span class="preview-tag">${SVG.wallet} ${pv}</span>
            </div>
        </div>
        <div class="hero-actions">
            <button class="btn btn-confirm" onclick="quickCheckIn()">
                ${SVG.check}
                ${t.confirm_checkin}
            </button>
            <button class="btn btn-edit" onclick="editQuickCheckin()">
                ${SVG.edit}
                ${t.edit_btn}
            </button>
            <button class="btn btn-absent" onclick="confirmAbsent()">
                ${SVG.x}
                ${t.absent_btn}
            </button>
        </div>`;
}

// ═══ FAB ═══
function fabAction() {
    const ts = todayStr();
    if (getLogByDate(ts)) { showToast('Bạn đã chấm công hôm nay!', 'warning'); return; }
    if (confirm('Chấm công nhanh hôm nay?')) quickCheckIn();
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

    if (window.Effects) {
        window.Effects.pulse(el1);
        window.Effects.pulse(el4);
    }

    const now = new Date();
    const isCur = dashMonth === now.getMonth() + 1 && dashYear === now.getFullYear();
    if (isCur) {
        const dim = new Date(dashYear, dashMonth, 0).getDate();
        const dom = now.getDate();
        const rem = dim - dom;
        const avg = totalDays > 0 ? currentSalary / totalDays : 0;
        const proj = currentSalary + avg * rem;
        const perc = Math.min((dom / dim) * 100, 100);
        const displayPerc = perc < 2 ? 2 : perc;

        document.getElementById('dash-projected-salary').innerText = proj.toLocaleString('vi-VN') + ' đ';
        document.getElementById('dash-days-remaining').innerText = rem;
        document.getElementById('dash-progress-percent').innerText = Math.round(perc) + '%';

        const ring = document.getElementById('dash-progress-ring');
        if (ring) {
            const circumference = 289;
            const offset = circumference - (displayPerc / 100) * circumference;
            ring.setAttribute('stroke-dashoffset', offset);
        }
    } else {
        document.getElementById('dash-projected-salary').innerText = '---';
        document.getElementById('dash-days-remaining').innerText = '0';
        document.getElementById('dash-progress-percent').innerText = '0%';
        const ring = document.getElementById('dash-progress-ring');
        if (ring) ring.setAttribute('stroke-dashoffset', 289);
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
    if (!goal) {
        body.innerHTML = `<p class="text-muted" style="font-size:13px;">${settings.language === 'vi' ? 'Chưa đặt mục tiêu. Nhấn nút sửa để đặt.' : 'No goal set. Click edit to set.'}</p>`;
        return;
    }
    const pct = Math.min((currentSalary / goal) * 100, 100);
    const achieved = currentSalary >= goal;
    body.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
            <span>${currentSalary.toLocaleString('vi-VN')} đ</span>
            <span style="font-weight:800;color:var(--gray-900);">${Math.round(pct)}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--gray-500);">
            <span>${settings.language === 'vi' ? 'Mục tiêu' : 'Goal'}: <strong style="color:var(--gray-800);">${goal.toLocaleString('vi-VN')} đ</strong></span>
            ${achieved ? `<span style="color:var(--gray-900);font-weight:700;display:inline-flex;align-items:center;gap:4px;">${SVG.checkCircle} ${settings.language === 'vi' ? 'Đạt mục tiêu!' : 'Goal reached!'}</span>` : `<span>${settings.language === 'vi' ? 'Còn thiếu' : 'Missing'}: <strong style="color:var(--gray-800);">${(goal-currentSalary).toLocaleString('vi-VN')} đ</strong></span>`}
        </div>`;
    if (achieved && !goalCelebrated) { goalCelebrated = true; launchConfetti(); }
    else if (!achieved) goalCelebrated = false;
}
function editGoal() {
    const cur = settings.monthlyGoal || 0;
    const v = prompt(settings.language === 'vi' ? 'Nhập mục tiêu tháng (đ):' : 'Enter monthly goal (VND):', cur);
    if (v === null) return;
    settings.monthlyGoal = parseInt(v) || 0;
    saveSettingsToStorage();
    showToast(settings.language === 'vi' ? 'Đã lưu mục tiêu!' : 'Goal saved!', 'success');
    loadDashboard();
}

// ═══ CONFETTI ═══
function launchConfetti() {
    const layer = document.getElementById('confetti-layer');
    if (!layer) return;
    const colors = ['#000000', '#404040', '#737373', '#A3A3A3', '#D4D4D4'];
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
        const ds = dateToStr(check);
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
    if (streak >= 3) items.push({
        svg: SVG.flame,
        name: settings.language === 'vi' ? `Chuỗi ${streak} ngày` : `${streak}-day streak`,
        val: settings.language === 'vi' ? 'Streak hiện tại' : 'Current streak'
    });
    if (totalAll >= 10) items.push({
        svg: SVG.book,
        name: settings.language === 'vi' ? `${totalAll} ngày tổng` : `${totalAll} total days`,
        val: settings.language === 'vi' ? 'Tổng chấm công' : 'Total worklogs'
    });
    if (bestVal > 0) items.push({
        svg: SVG.trophy,
        name: bestVal.toLocaleString('vi-VN')+' đ',
        val: (settings.language === 'vi' ? 'Tháng tốt nhất' : 'Best month') + `: ${bestKey}`
    });

    if (items.length === 0) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    list.innerHTML = items.map(i => `
        <div class="ach-item">
            <div class="ach-icon">${i.svg}</div>
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
    document.querySelectorAll('.cal-mode-tabs button').forEach(b => {
        b.classList.toggle('active', b.dataset.calTab === tab);
    });
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

// ═══ FIX: getCellHours — chỉ hiện OT, bỏ số 0 cuối ═══
function getCellHours(log) {
    if (!log) return '';
    const ot = log.overtimeHours || 0;
    if (ot === 0) return '';
    const formatted = ot.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}h`;
}

function renderSolarTab() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-title');
    const weekdays = document.getElementById('calendar-weekdays');
    title.textContent = `${settings.language === 'vi' ? 'Tháng' : 'Month'} ${calMonth}/${calYear}`;
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
        const paidHoliday = holidays.find(h => h.paid) || null;

        let cls = 'cal-cell';
        if (isToday) cls += ' today';
        if (log) {
            cls += ' done';
            if (paidHoliday) cls += ' done-holiday';
            else if (isSun) cls += ' done-sunday';
            else cls += ' done-normal';
        }
        else if (absent) cls += ' absent';
        else if (isSun) cls += ' sunday-cell';
        else if (paidHoliday) cls += ' has-paid-holiday';
        else if (mainHoliday) cls += ` has-holiday category-${mainHoliday.category}`;

        const badge = mainHoliday ? `<div class="holiday-badge"><svg width="12" height="12"><use href="#i-star"/></svg></div>` : '';
        const hoursText = log ? `<div class="cal-hours-small">${getCellHours(log)}</div>` : '';
        let payDot = '';
        if (log) {
            const level = log.totalPay > 800000 ? 'high' : log.totalPay > 400000 ? 'mid' : 'low';
            payDot = `<div class="cal-pay-dot ${level}"></div>`;
        }
        const note = getNote(ds) ? '<div class="cal-note-dot"></div>' : '';
        html += `<div class="${cls}" onclick="showCalDetail('${ds}')">${badge}<div class="cal-day">${d}</div>${hoursText}${payDot}${note}</div>`;
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
    title.textContent = `${settings.language === 'vi' ? 'Tháng' : 'Month'} ${calLunarMonth} — ${canChi}`;
    weekdays.innerHTML = '<div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>';

    const days = LunarEngine.getLunarMonthDays(calLunarMonth, calLunarYear);
    if (days.length === 0) {
        grid.className = 'calendar-grid lunar-grid';
        grid.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;grid-column:1/-1;">Không có dữ liệu</p>';
        return;
    }
    const ts = todayStr();
    const firstDay = days[0];
    const firstDate = new Date(firstDay.solarYear, firstDay.solarMonth - 1, firstDay.solarDay);
    const firstDow = firstDate.getDay();

    let prevMonth = calLunarMonth - 1, prevYear = calLunarYear;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prevDays = LunarEngine.getLunarMonthDays(prevMonth, prevYear);
    const prevLen = prevDays.length;
    let html = '';
    for (let i = firstDow - 1; i >= 0; i--) {
        html += `<div class="lunar-cell-view other"><div class="lunar-day-number">${prevLen - i}</div></div>`;
    }
    days.forEach(d => {
        const holidays = HolidayResolver.getLunarDayHolidays(d.lunarDay, calLunarMonth, calLunarYear);
        const mainHoliday = holidays.find(h => h.paid) || holidays[0];
        const paidHoliday = holidays.find(h => h.paid) || null;
        const solarDs = `${d.solarYear}-${String(d.solarMonth).padStart(2,'0')}-${String(d.solarDay).padStart(2,'0')}`;
        const isToday = solarDs === ts;
        const log = getLogByDate(solarDs);
        const absent = isAbsentDay(solarDs);
        const dObj = new Date(d.solarYear, d.solarMonth - 1, d.solarDay);
        const isSun = dObj.getDay() === 0;

        let cls = 'lunar-cell-view';
        if (isToday) cls += ' today';
        if (log) {
            cls += ' done';
            if (paidHoliday) cls += ' done-holiday';
            else if (isSun) cls += ' done-sunday';
            else cls += ' done-normal';
        }
        else if (absent) cls += ' absent';
        else if (isSun) cls += ' sunday-cell';
        else if (paidHoliday) cls += ' has-paid-holiday';
        else if (mainHoliday) cls += ` has-holiday category-${mainHoliday.category}`;

        const badge = mainHoliday ? `<div class="holiday-badge"><svg width="12" height="12"><use href="#i-star"/></svg></div>` : '';
        const hoursText = log ? `<div class="cal-hours-small">${getCellHours(log)}</div>` : '';
        let payDot = '';
        if (log) {
            const level = log.totalPay > 800000 ? 'high' : log.totalPay > 400000 ? 'mid' : 'low';
            payDot = `<div class="cal-pay-dot ${level}"></div>`;
        }
        const note = getNote(solarDs) ? '<div class="cal-note-dot"></div>' : '';
        html += `<div class="${cls}" onclick="showLunarDetail(${d.lunarDay}, ${calLunarMonth}, ${calLunarYear})">${badge}<div class="lunar-day-number">${d.lunarDay}</div>${hoursText}${payDot}${note}</div>`;
    });
    const totalCells = firstDow + days.length;
    const fill = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= fill; i++) html += `<div class="lunar-cell-view other"><div class="lunar-day-number">${i}</div></div>`;

    grid.className = 'calendar-grid lunar-grid';
    grid.innerHTML = html;
}

function calPrev() {
    if (calTab === 'lunar') {
        initLunarState();
        calLunarMonth--;
        if (calLunarMonth < 1) { calLunarMonth = 12; calLunarYear--; }
    } else {
        calMonth--;
        if (calMonth < 1) { calMonth = 12; calYear--; }
    }
    renderCalendar();
}
function calNext() {
    if (calTab === 'lunar') {
        initLunarState();
        calLunarMonth++;
        if (calLunarMonth > 12) { calLunarMonth = 1; calLunarYear++; }
    } else {
        calMonth++;
        if (calMonth > 12) { calMonth = 1; calYear++; }
    }
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

// ═══ BOTTOM SHEET ═══
function showCalDetail(ds) {
    const detail = document.getElementById('cal-day-detail');
    const title = document.getElementById('cal-detail-title');
    const body = document.getElementById('cal-detail-body');
    const log = getLogByDate(ds);
    const absent = isAbsentDay(ds);
    const note = getNote(ds);
    title.innerHTML = `<svg width="16" height="16"><use href="#i-calendar"/></svg> ${ds}`;
    const [y, m, d] = ds.split('-').map(Number);
    const lunarInfo = LunarEngine.toLunar(d, m, y);
    const holidays = HolidayResolver.getSolarDayHolidays(ds);

    const lunarBlock = `
        <div style="background:var(--surface-2);padding:10px 12px;border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);">
            <div>
                <div style="font-size:11px;color:var(--gray-500);font-weight:700;display:inline-flex;align-items:center;gap:4px;">${SVG.moon} ÂM LỊCH</div>
                <div style="font-size:14px;font-weight:700;color:var(--gray-800);">${lunarInfo.day}/${lunarInfo.month}${lunarInfo.leap?' (nhuận)':''}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:11px;color:var(--gray-500);font-weight:700;">NĂM</div>
                <div style="font-size:13px;font-weight:700;color:var(--gray-700);">${lunarInfo.canChi}</div>
            </div>
        </div>`;

    let holidayBlock = '';
    holidays.forEach(h => {
        holidayBlock += `
            <div style="background:var(--surface-2);padding:12px;border-radius:12px;margin-bottom:10px;border:1px solid var(--border);${h.paid ? 'border-left:4px solid var(--gray-900);' : ''}">
                <div style="font-size:11px;color:var(--gray-600);font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                    ${SVG.star}
                    ${h.system === 'solar' ? 'Lễ Dương lịch' : h.system === 'lunar' ? 'Lễ Âm lịch' : 'Định kỳ'}
                </div>
                <div style="font-size:16px;font-weight:800;margin-top:4px;display:flex;align-items:center;gap:6px;">
                    <svg width="16" height="16"><use href="#i-star"/></svg>
                    ${h.name}
                </div>
                ${h.paid ? `<div style="font-size:12px;color:var(--gray-900);font-weight:700;margin-top:4px;">Lễ có lương — đi làm hưởng x${settings.otHoliday}</div>` : ''}
            </div>`;
    });

    if (log) {
        const dayType = log.isSunday ? 'Chủ nhật' : 'Ngày thường';
        const holidayTag = log.isPaidHoliday ? ` <span style="color:var(--gray-900);font-weight:700;">Lễ</span>` : '';
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
                <button class="btn btn-primary" style="flex:1;" onclick="saveCalNote('${ds}')">
                    ${SVG.save} Lưu ghi chú
                </button>
                <button class="btn btn-danger" style="flex:1;" onclick="deleteWorkLog(${log.id})">
                    ${SVG.trash} Xóa
                </button>
            </div>`;
    } else if (absent) {
        body.innerHTML = lunarBlock + holidayBlock + `
            <p style="padding:14px;background:repeating-linear-gradient(45deg,var(--gray-100),var(--gray-100) 8px,var(--gray-200) 8px,var(--gray-200) 16px);color:var(--gray-500);border:1.5px dashed var(--gray-400);border-radius:12px;font-weight:700;margin-bottom:12px;text-align:center;letter-spacing:0.3px;">Đã xác nhận nghỉ</p>
            <button class="btn btn-primary w-full" onclick="quickAddDay('${ds}')">
                ${SVG.plus} Thêm chấm công
            </button>`;
    } else {
        body.innerHTML = lunarBlock + holidayBlock + `
            <p class="text-muted" style="margin-bottom:12px;">Chưa có dữ liệu cho ngày này.</p>
            <button class="btn btn-primary w-full" onclick="quickAddDay('${ds}')">
                ${SVG.plus} Thêm chấm công
            </button>`;
    }
    detail.classList.add('open');
    if (window.Effects) setTimeout(() => window.Effects.attachRippleAll(), 50);
}
function showLunarDetail(lunarDay, lunarMonth, lunarYear) {
    const solar = LunarEngine.toSolar(lunarDay, lunarMonth, lunarYear, false);
    if (!solar) return;
    const ds = `${solar.year}-${String(solar.month).padStart(2,'0')}-${String(solar.day).padStart(2,'0')}`;
    showCalDetail(ds);
}
function closeCalDetail() {
    document.getElementById('cal-day-detail').classList.remove('open');
}
function saveCalNote(ds) {
    const v = document.getElementById('cal-note-input').value;
    setNote(ds, v);
    showToast('Đã lưu ghi chú!', 'success');
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
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">Số ngày công</div><div class="stat-mini-val">${totalDays}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">Ngày Chủ nhật</div><div class="stat-mini-val">${sunDays}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">Ca sáng</div><div class="stat-mini-val">${morning}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">Ca đêm</div><div class="stat-mini-val">${night}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">Tổng giờ thường</div><div class="stat-mini-val">${regH.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">Tổng giờ TC</div><div class="stat-mini-val">${otH.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">TC thường</div><div class="stat-mini-val">${normOT.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:var(--surface-2);"><div class="stat-mini-label">TC Chủ nhật</div><div class="stat-mini-val">${sunOT.toFixed(2)}</div></div>
            <div class="stat-mini" style="background:var(--gray-900);color:var(--gray-100);grid-column:span 2;text-align:center;border-color:var(--gray-900);">
                <div class="stat-mini-label" style="color:var(--gray-300);display:inline-flex;align-items:center;gap:4px;justify-content:center;">
                    ${SVG.wallet} Tổng tiền lương
                </div>
                <div class="stat-mini-val" style="color:var(--gray-100);font-size:22px;">${totalSal.toLocaleString('vi-VN')} đ</div>
            </div>
        </div>`;
    renderDailyChart(logs, m, y);
    renderShiftChart(morning, night);
    renderTrendChart();
}
function getThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        primary: isDark ? '#FAFAFA' : '#000000',
        primaryLight: isDark ? '#A3A3A3' : '#404040',
        gray300: cs.getPropertyValue('--gray-300').trim() || '#D4D4D4',
        gray400: cs.getPropertyValue('--gray-400').trim() || '#A3A3A3',
        gray500: cs.getPropertyValue('--gray-500').trim() || '#737373'
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
        if (v > 0) {
            const h = (v / max) * (H - pad*2);
            bars += `<rect x="${pad + i * bw + 1}" y="${H - pad - h}" width="${bw-2}" height="${h}" rx="2" fill="${tc.primary}"/>`;
        }
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;">
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
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tc.gray400}" stroke-width="22"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tc.primary}" stroke-width="22"
                stroke-dasharray="${mDash} ${circ}" stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})"/>
            <text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="16" font-weight="800" fill="${tc.gray500}">${total}</text>
        </svg>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border-radius:4px;background:${tc.primary};"></span><span style="font-size:13px;display:inline-flex;align-items:center;gap:4px;">${SVG.sun} Sáng: <strong>${morning}</strong> (${Math.round(mPct*100)}%)</span></div>
            <div style="display:flex;align-items:center;gap:8px;"><span style="width:14px;height:14px;border-radius:4px;background:${tc.gray400};"></span><span style="font-size:13px;display:inline-flex;align-items:center;gap:4px;">${SVG.moon} Đêm: <strong>${night}</strong> (${Math.round((1-mPct)*100)}%)</span></div>
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
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;">
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${tc.primary}" stop-opacity="${isDark ? 0.25 : 0.15}"/>
            <stop offset="100%" stop-color="${tc.primary}" stop-opacity="0"/>
        </linearGradient></defs>
        <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="${tc.gray300}" stroke-width="1"/>
        <path d="${areaPath}" fill="url(#areaGrad)"/>
        <path d="${path}" fill="none" stroke="${tc.primary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${coords.map((c,i) => `<circle cx="${c.x}" cy="${c.y}" r="4" fill="var(--surface)" stroke="${tc.primary}" stroke-width="2.5"/><text x="${c.x}" y="${H-8}" font-size="9" fill="${tc.gray400}" text-anchor="middle">${points[i].label}</text>`).join('')}
        <text x="${pad}" y="14" font-size="10" fill="${tc.gray500}">Max: ${(max/1000000).toFixed(1)}M</text>
    </svg>`;
}

// ═══ EXPORT ═══
function getExportRows() {
    const m = parseInt(document.getElementById('stat-month-select').value);
    const y = parseInt(document.getElementById('stat-year-input').value);
    const logs = getLogsByMonth(m, y).sort((a,b) => new Date(a.date) - new Date(b.date));
    return logs.map(l => ({
        date: l.date, shift: l.shift,
        type: l.isSunday ? 'Chủ nhật' : 'Thường',
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
        showToast(`Đã xuất ${filename}`, 'success');
        haptic(); playSound();
    } catch (err) {
        console.error('Lỗi xuất PNG:', err);
        showToast('Lỗi: ' + err.message, 'danger');
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
    if (idx !== -1) {
        if (!confirm('Đã có bản ghi cho ngày này. Ghi đè?')) return;
        workLogs.splice(idx, 1);
    }
    const c = calculateWorkLog(date, shift, isSun, start, end);
    workLogs.push({ id: Date.now(), date, shift, isSunday: isSun, start, end, regularHours: c.regularHours, overtimeHours: c.overtimeHours, totalPay: c.totalPay });
    setNote(date, note);
    saveWorkLogsToStorage();
    applyWorklogMonthFilter();
    applyMonthlyShift();
    autoDetectSunday();
    haptic(); playSound();
    if (c.isPaidHoliday) showToast('Chấm công ngày lễ ' + c.holiday.name, 'success');
    else showToast('Đã lưu chấm công!', 'success');
    if (!document.getElementById('page-dashboard').classList.contains('hidden')) loadDashboard();
    if (isAbsentDay(date)) unmarkAbsentDay(date);
}
function deleteWorkLog(id) {
    if (!confirm('Xóa bản ghi này?')) return;
    workLogs = workLogs.filter(l => l.id !== id);
    saveWorkLogsToStorage();
    applyWorklogMonthFilter();
    showToast('Đã xóa.', 'warning');
    closeCalDetail();
    renderCalendar();
    if (!document.getElementById('page-dashboard').classList.contains('hidden')) loadDashboard();
}
function applyWorklogMonthFilter() {
    const m = parseInt(document.getElementById('worklog-month-select').value);
    const y = parseInt(document.getElementById('worklog-year-input').value);
    viewMonth = m; viewYear = y;
    loadWorkLogTable();
    document.getElementById('worklog-month-title').innerHTML = `${settings.language === 'vi' ? 'THÁNG' : 'MONTH'} ${String(m).padStart(2,'0')}/${y}`;
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
        const holidayIcon = paidHoliday ? ' ★' : '';
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
    showToast(`Đã xóa ${del.length} bản ghi.`, 'success');
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
    document.getElementById('settings-message').innerText = 'Đã lưu cài đặt!';
    showToast('Đã lưu cài đặt!', 'success');
    loadDashboard();
}
function resetSettings() {
    if (!confirm('Khôi phục cài đặt mặc định?')) return;
    settings = { ...DEFAULT_SETTINGS };
    saveSettingsToStorage();
    applyTheme(); applyLanguage(); loadSettingsForm();
    showToast('Đã khôi phục mặc định.', 'warning');
}

// ═══ PROFILES ═══
function renderProfileList() {
    const list = document.getElementById('profile-list');
    const profiles = getProfiles();
    const active = getActiveProfile();
    list.innerHTML = profiles.map(p => `
        <div class="profile-item ${p.id === active ? 'active' : ''}" onclick="switchProfile('${p.id}')">
            <div class="profile-avatar">${p.name.charAt(0).toUpperCase()}</div>
            <div class="profile-name">${p.name}</div>
            ${p.id !== 'default' ? `<button class="btn-icon-sm" onclick="event.stopPropagation();deleteProfile('${p.id}')"><svg width="14" height="14"><use href="#i-trash"/></svg></button>` : ''}
            ${p.id === active ? `<span class="profile-check">${SVG.check}</span>` : ''}
        </div>`).join('');
}
function switchProfile(id) {
    if (id === getActiveProfile()) return;
    if (!confirm('Chuyển hồ sơ? Dữ liệu sẽ thay đổi theo hồ sơ.')) return;
    setActiveProfile(id);
    invalidateAllCache();
    settings = loadSettings();
    workLogs = loadWorkLogs();
    applyTheme();
    applyLanguage();
    renderProfileList();
    const p = getProfiles().find(x => x.id === id);
    document.getElementById('profile-name').textContent = p ? p.name : 'TimeTracker';
    switchPage('dashboard');
    showToast('Đã chuyển hồ sơ.', 'success');
}
function addNewProfile() {
    const name = prompt('Tên hồ sơ mới:');
    if (!name || !name.trim()) return;
    const profiles = getProfiles();
    const id = 'p_' + Date.now();
    profiles.push({ id, name: name.trim() });
    saveProfiles(profiles);
    renderProfileList();
    showToast('Đã thêm hồ sơ.', 'success');
}
function deleteProfile(id) {
    if (!confirm('Xóa hồ sơ này và toàn bộ dữ liệu?')) return;
    saveProfiles(getProfiles().filter(p => p.id !== id));
    Object.keys(localStorage).forEach(k => {
        if (k.includes('_' + id + '_') || k.endsWith('_' + id)) localStorage.removeItem(k);
    });
    invalidateAllCache();
    if (getActiveProfile() === id) {
        setActiveProfile('default');
        settings = loadSettings();
        workLogs = loadWorkLogs();
        renderProfileList();
        loadDashboard();
    }
    renderProfileList();
    showToast('Đã xóa hồ sơ.', 'warning');
}

// ═══ BACKUP ═══
function getAllData() {
    const shiftKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('monthly_shift_')) shiftKeys.push({ key: k, value: localStorage.getItem(k) });
    }
    return { version: APP_VERSION, exportedAt: new Date().toISOString(), settings, workLogs, monthlyShifts: shiftKeys, absentDays: getAbsentDays(), notes: getNotes() };
}
function exportBackup() {
    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `backup_cham_cong_${todayStr()}.json`, 'application/json');
    showToast('Đã tải file sao lưu!', 'success');
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
                <p>Phiên bản: <strong>${data.version}</strong></p>
                <p>Tạo lúc: <strong>${new Date(data.exportedAt).toLocaleString('vi-VN')}</strong></p>
                <p>Số bản ghi: <strong>${logCount}</strong></p>
                <p>Khoảng: <strong>${range}</strong></p>
                <p>Lương: <strong>${data.settings.baseSalary.toLocaleString('vi-VN')} đ</strong></p>
                <p style="font-weight:bold;margin-top:8px;">Sẽ thay thế toàn bộ dữ liệu hiện tại!</p>`;
            document.getElementById('restore-info').style.display = 'block';
            document.getElementById('backup-message').innerHTML = '';
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
        const bk = 'timesheet_auto_backup_' + new Date().toISOString().replace(/[:.]/g,'-');
        localStorage.setItem(bk, JSON.stringify(getAllData()));
        settings = { ...DEFAULT_SETTINGS, ...restoreData.settings };
        delete settings.themeColor;
        saveSettingsToStorage();
        workLogs = restoreData.workLogs.map(l => ({ ...l, regularHours: parseFloat(l.regularHours) || 0, overtimeHours: parseFloat(l.overtimeHours) || 0, totalPay: parseInt(l.totalPay) || 0 }));
        saveWorkLogsToStorage();
        if (restoreData.monthlyShifts) restoreData.monthlyShifts.forEach(i => localStorage.setItem(i.key, i.value));
        if (restoreData.absentDays) saveAbsentDays(restoreData.absentDays);
        if (restoreData.notes) saveNotes(restoreData.notes);
        invalidateAllCache();
        applyTheme(); applyLanguage();
        showToast(`Đã khôi phục ${workLogs.length} bản ghi!`, 'success');
        document.getElementById('restore-info').style.display = 'none';
        restoreData = null;
        loadDashboard();
        applyWorklogMonthFilter();
        loadSettingsForm();
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'danger');
    }
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
            document.getElementById('pin-error').textContent = 'Sai PIN!';
            document.querySelector('.pin-box').classList.add('shake');
            if (window.Effects) window.Effects.shake(document.querySelector('.pin-box'));
            setTimeout(() => {
                document.querySelector('.pin-box').classList.remove('shake');
                pinBuffer = '';
                updatePinDots();
            }, 400);
        }
    }
}

// ═══ SPLASH ═══
function hideSplash() {
    const s = document.getElementById('splash-screen');
    setTimeout(() => { s.classList.add('hide'); setTimeout(() => s.remove(), 600); }, 1600);
}

// ═══ TOP BAR SCROLL ═══
function setupTopBarScroll() {
    const topBar = document.getElementById('topBar');
    if (!topBar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                topBar.classList.toggle('scrolled', window.scrollY > 8);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ═══ INIT ═══
window.onload = function () {
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
        const t = I18N[settings.language];
        const names = { auto: t.theme_auto, light: t.theme_light, dark: t.theme_dark };
        showToast(names[settings.themeMode], 'info');
    });
    document.getElementById('lang-toggle').addEventListener('click', () => {
        settings.language = settings.language === 'vi' ? 'en' : 'vi';
        saveSettingsToStorage();
        applyLanguage();
        const activePage = document.querySelector('.bottom-nav .nav-item.active').dataset.page;
        switchPage(activePage);
        showToast(settings.language === 'vi' ? 'Tiếng Việt' : 'English', 'info');
    });

    document.getElementById('theme-mode-select').addEventListener('change', function() {
        settings.themeMode = this.value;
        saveSettingsToStorage();
        applyTheme();
    });
    document.getElementById('set-pin-enabled').addEventListener('change', function() {
        document.getElementById('pin-setup').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('pin-pad').addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        handlePinInput(btn.dataset.num);
    });

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (settings.themeMode === 'auto') applyTheme();
    });

    document.getElementById('worklog-date').value = todayStr();
    applyMonthlyShift();
    autoDetectSunday();

    initPinLock();
    hideSplash();

    switchPage('dashboard');
    applyWorklogMonthFilter();

    setupTopBarScroll();

    setTimeout(() => {
        if (window.Effects) window.Effects.autoAttach();
    }, 100);

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchPage(item.dataset.page);
            }
        });
    });

    setInterval(checkReminder, 30 * 60 * 1000);
};

// ========================================================================
// HÀM TÍNH LƯƠNG
// ========================================================================
function calculateWorkLog(workDate, shift, isSunday, startTimeStr, endTimeStr) {
    const dailyRate = settings.baseSalary / settings.standardWorkDays;
    const hourlyRate = dailyRate / settings.standardShiftHours;

    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);

    const startDate = new Date(2000, 0, 1, sh, sm, 0);
    let endDate = new Date(2000, 0, 1, eh, em, 0);

    if (endDate <= startDate) {
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const totalHours = (endDate - startDate) / (1000 * 60 * 60);
    const startHours = sh + sm / 60;
    const endHours = startHours + totalHours;

    const paidHoliday = HolidayResolver.getPaidHoliday(workDate);
    const isSpecialDay = isSunday || !!paidHoliday;

    let regularHours = 0;
    let overtimeHours = 0;

    const standardStart = shift === 'Sáng' ? 7.5 : 19.5;
    const tcStartHours = shift === 'Sáng' ? 16.5 : 28.5;
    const bonusThreshold = shift === 'Sáng' ? 19.5 : 31.5;

    if (isSpecialDay) {
        let workedHours = totalHours;
        if (totalHours >= 8) workedHours -= 0.5;
        else if (totalHours >= 6) workedHours -= 0.25;

        if (shift === 'Sáng' && endHours > 16.5) workedHours -= 0.5;
        else if (shift === 'Đêm' && endHours > 28.5) workedHours -= 0.5;

        if (workedHours < 0) workedHours = 0;

        regularHours = 0;
        overtimeHours = workedHours;

        if (endHours >= bonusThreshold) overtimeHours += 0.5;
        if (shift === 'Đêm' && overtimeHours > 0) overtimeHours += 0.25;
    } else {
        let otHours = 0;
        if (endHours > tcStartHours) {
            otHours = endHours - tcStartHours;
            if (otHours >= 3) otHours += 0.5;
            if (shift === 'Đêm') otHours += 0.25;
        }
        overtimeHours = otHours;

        const lateHours = Math.max(0, startHours - standardStart);
        regularHours = Math.max(0, 8 - lateHours);
    }

    regularHours = Math.round(regularHours * 100) / 100;
    overtimeHours = Math.round(overtimeHours * 100) / 100;

    const regularPay = regularHours * hourlyRate;
    let overtimePay = 0;

    if (overtimeHours > 0) {
        let coeff;
        if (paidHoliday || isSunday) {
            coeff = shift === 'Sáng' ? settings.otSundayDay : settings.otSundayNight;
        } else {
            coeff = shift === 'Sáng' ? settings.otNormalDay : settings.otNormalNight;
        }
        overtimePay = overtimeHours * hourlyRate * coeff;
    }

    return {
        regularHours,
        overtimeHours,
        totalPay: Math.round(regularPay + overtimePay),
        isPaidHoliday: !!paidHoliday,
        holiday: paidHoliday
    };
}