'use strict';

(function () {
  const CUSTOM_CFG_KEY = 'tt_custom_payroll_config';

  // ---------- Helpers ----------
  function getProfile() {
    return localStorage.getItem('tt_active_profile') || 'default';
  }
  function getSettingsKey() {
    const p = getProfile();
    return p === 'default' ? 'timesheet_settings' : `timesheet_${p}_settings`;
  }
  function getLogsKey() {
    const p = getProfile();
    return p === 'default' ? 'timesheet_worklogs' : `timesheet_${p}_worklogs`;
  }
  function readSettings() {
    try { return JSON.parse(localStorage.getItem(getSettingsKey()) || '{}'); }
    catch (e) { return {}; }
  }

  // ---------- Sync config từ settings → PAYROLL_CONFIG + localStorage ----------
  function syncConfig() {
    const s = readSettings();
    if (!s.baseSalary) return null;

    // a. PAYROLL_CONFIG in-memory (dùng bởi payroll-engine.js)
    if (typeof PAYROLL_CONFIG !== 'undefined' && Array.isArray(PAYROLL_CONFIG.fixedEarnings)) {
      const base = PAYROLL_CONFIG.fixedEarnings.find(e => e.id === 'base');
      if (base) base.amount = s.baseSalary;
      if (PAYROLL_CONFIG.rates) {
        PAYROLL_CONFIG.rates.otNormalDay         = s.otNormalDay    || 1.5;
        PAYROLL_CONFIG.rates.otNormalNight       = s.otNormalNight  || 1.7;
        PAYROLL_CONFIG.rates.otSundayDay         = s.otSundayDay    || 2.0;
        PAYROLL_CONFIG.rates.otSundayNightFirst  = s.otSundayNight  || 2.7;
        PAYROLL_CONFIG.rates.otSundayNightRest   = s.otSundayDay    || 2.0;
      }
    }

    // b. tt_custom_payroll_config localStorage (dùng bởi payroll-override.js)
    localStorage.setItem(CUSTOM_CFG_KEY, JSON.stringify({
      baseSalary:    s.baseSalary,
      otNormalDay:   s.otNormalDay   || 1.5,
      otNormalNight: s.otNormalNight || 1.7,
      otSundayDay:   s.otSundayDay   || 2.0,
      otSundayNight: s.otSundayNight || 2.7,
      otHoliday:     s.otHoliday     || 3.0
    }));

    // c. Nếu có phụ cấp tự chỉnh (custom-allowance.js) → apply lại
    if (window.CustomAllowance && typeof window.CustomAllowance.apply === 'function') {
      try { window.CustomAllowance.apply(); } catch (e) {}
    }
    return s.baseSalary;
  }

  // ---------- Lấy tham chiếu mảng workLogs (RAM ưu tiên) ----------
  function getLogsRef() {
    try {
      // app.js khai báo `let workLogs` ở top-level → truy cập qua indirect eval
      const ref = (0, eval)('typeof workLogs !== "undefined" ? workLogs : null');
      if (Array.isArray(ref)) return { logs: ref, inMemory: true };
    } catch (e) {}
    try {
      const arr = JSON.parse(localStorage.getItem(getLogsKey()) || '[]');
      return { logs: arr, inMemory: false };
    } catch (e) { return null; }
  }

  // ---------- Tính lại totalPay / regularHours / OT cho mọi log ----------
  function recalcLogs() {
    const res = getLogsRef();
    if (!res) return { ok: false, inMemory: false };
    const { logs, inMemory } = res;
    if (logs.length === 0) return { ok: true, inMemory };
    if (typeof window.calculateWorkLog !== 'function') return { ok: false, inMemory };

    let changed = false;
    logs.forEach(l => {
      const c = window.calculateWorkLog(l.date, l.shift, l.isSunday, l.start, l.end);
      if (
        l.totalPay !== c.totalPay ||
        l.regularHours !== c.regularHours ||
        l.overtimeHours !== c.overtimeHours ||
        l.isPaidHoliday !== c.isPaidHoliday
      ) {
        l.regularHours  = c.regularHours;
        l.overtimeHours = c.overtimeHours;
        l.totalPay      = c.totalPay;
        l.isPaidHoliday = c.isPaidHoliday;
        changed = true;
      }
    });

    if (changed) {
      try { localStorage.setItem(getLogsKey(), JSON.stringify(logs)); } catch (e) {}
    }
    return { ok: true, inMemory, changed };
  }

  // ---------- Refresh UI ----------
  function refreshUI() {
    try {
      if (typeof window.refreshCurrentPage === 'function') window.refreshCurrentPage();
      // Refresh phiếu lương nếu đang mở
      if (window.PayrollUI && typeof window.PayrollUI.updateData === 'function'
          && document.getElementById('payroll-content')) {
        window.PayrollUI.updateData();
      }
    } catch (e) {}
  }

  // ---------- Full pipeline ----------
  function fullSync(showToast) {
    syncConfig();
    const r = recalcLogs();

    if (r.ok && r.inMemory) {
      refreshUI();
      if (showToast && typeof window.toast === 'function') {
        window.toast('✅ Đã cập nhật lương mới!', 'success');
      }
      return;
    }
    // Không truy cập được mảng RAM → buộc reload để app.js nạp lại từ localStorage
    if (showToast && typeof window.toast === 'function') {
      window.toast('🔄 Đang áp dụng lương mới...', 'info');
    }
    setTimeout(() => location.reload(), 600);
  }

  // ---------- Bọc các hàm ----------
  function wrapFns() {
    // a. saveSalarySettings (đổi lương / hệ số / mục tiêu / tên)
    if (typeof window.saveSalarySettings === 'function' && !window.saveSalarySettings._recalcWrapped) {
      const orig = window.saveSalarySettings;
      window.saveSalarySettings = function () {
        const r = orig.apply(this, arguments);
        setTimeout(() => fullSync(true), 250);
        return r;
      };
      window.saveSalarySettings._recalcWrapped = true;
    }

    // b. saveOTSettings (đổi hệ số tăng ca)
    if (typeof window.saveOTSettings === 'function' && !window.saveOTSettings._recalcWrapped) {
      const orig = window.saveOTSettings;
      window.saveOTSettings = function () {
        const r = orig.apply(this, arguments);
        setTimeout(() => fullSync(true), 250);
        return r;
      };
      window.saveOTSettings._recalcWrapped = true;
    }

    // c. PayrollEngine.calculate → LUÔN sync config trước khi tính
    if (typeof PayrollEngine !== 'undefined' && typeof PayrollEngine.calculate === 'function'
        && !PayrollEngine.calculate._recalcWrapped) {
      const orig = PayrollEngine.calculate;
      PayrollEngine.calculate = function () {
        syncConfig();
        return orig.apply(this, arguments);
      };
      PayrollEngine.calculate._recalcWrapped = true;
    }

    // d. calculateWorkLog → LUÔN sync config trước khi tính
    if (typeof window.calculateWorkLog === 'function' && !window.calculateWorkLog._recalcWrapped) {
      const orig = window.calculateWorkLog;
      window.calculateWorkLog = function () {
        syncConfig();
        return orig.apply(this, arguments);
      };
      window.calculateWorkLog._recalcWrapped = true;
    }
  }

  // ---------- Boot: sync + phát hiện lệch khi reload ----------
  function bootCheck() {
    syncConfig();

    const res = getLogsRef();
    if (!res || res.logs.length === 0) return;
    if (typeof window.calculateWorkLog !== 'function') return;

    // Sample log cuối cùng → so sánh với tính lại
    const sample = res.logs[res.logs.length - 1];
    const c = window.calculateWorkLog(sample.date, sample.shift, sample.isSunday, sample.start, sample.end);

    if (Math.abs(c.totalPay - sample.totalPay) > 1) {
      console.log('[payroll-recalc] Phát hiện lương bị lệch, tự đồng bộ...');
      fullSync(false);
    }
  }

  // ---------- Khởi động với retry (đợi các script khác load xong) ----------
  let tries = 0;
  const MAX = 40;
  function tryBoot() {
    tries++;
    wrapFns();
    if (typeof window.calculateWorkLog === 'function'
        && typeof PayrollEngine !== 'undefined'
        && typeof PayrollEngine.calculate === 'function') {
      bootCheck();
      console.log('[payroll-recalc] Đã khởi động.');
      return;
    }
    if (tries < MAX) setTimeout(tryBoot, 200);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryBoot, 400);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(tryBoot, 400));
  }
  window.addEventListener('load', () => setTimeout(tryBoot, 800));

  // API cho Console
  window.PayrollRecalc = { sync: syncConfig, recalc: recalcLogs, fullSync };
})();