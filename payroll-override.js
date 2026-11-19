'use strict';

(function () {
  function getCustomConfig() {
    let cfg = localStorage.getItem('tt_custom_payroll_config');
    if (cfg) return JSON.parse(cfg);
    return { baseSalary: 5939400, otNormalDay: 1.5, otNormalNight: 1.7, otSundayDay: 2.0, otSundayNight: 2.7, otHoliday: 3.0 };
  }

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getProfileKey(base) {
    const active = localStorage.getItem('tt_active_profile') || 'default';
    return active === 'default' ? `timesheet_${base}` : `timesheet_${active}_${base}`;
  }

  function getLeaves() {
    try { return JSON.parse(localStorage.getItem('tt_leave_types') || '{}'); } catch(e) { return {}; }
  }

  // ✅ Đọc settings do user cấu hình (Lương CB, Ngày công, Giờ chuẩn, Break)
  function getActiveSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(getProfileKey('settings')) || '{}'); } catch(e) {}
    return {
      baseSalary: Number(s.baseSalary) || 5939400,
      standardWorkDays: Math.max(1, Number(s.standardWorkDays) || 26),
      standardShiftHours: Math.max(0.5, Number(s.standardShiftHours) || 8),
      breakHours: Math.max(0, Number(s.breakHours) || 0)
    };
  }

  // ==========================================
  // 1. GHI ĐÈ HÀM TÍNH LƯƠNG (LINH HOẠT THEO SETTINGS)
  // ==========================================
  window.calculateWorkLog = function(workDate, shift, isSunday, startTimeStr, endTimeStr) {
    try {
      const cfg = getCustomConfig();
      const st = getActiveSettings();
      
      const stdDays = st.standardWorkDays;      // 👈 User nhập (vd: 20)
      const stdHours = st.standardShiftHours;   // 👈 User nhập (vd: 6)
      const brkHours = st.breakHours;           // 👈 User nhập (vd: 1)
      
      const hourlyRate = st.baseSalary / stdDays / stdHours;
      
      const [sh, sm] = (startTimeStr || '07:30').split(':').map(Number);
      const [eh, em] = (endTimeStr || '19:30').split(':').map(Number);
      const startDate = new Date(2000, 0, 1, sh, sm, 0);
      let endDate = new Date(2000, 0, 1, eh, em, 0);
      if (endDate <= startDate) endDate = new Date(endDate.getTime() + 86400000);
      
      const totalHours = (endDate - startDate) / 3600000;
      const startHours = sh + sm / 60;
      const endHours = startHours + totalHours;
      const paidHoliday = typeof HolidayResolver !== 'undefined' ? HolidayResolver.getPaidHoliday(workDate) : null;
      const isSpecialDay = isSunday || !!paidHoliday;
      
      // Điểm bắt đầu ca & điểm kết thúc ca chuẩn (động theo user)
      const standardStart = shift === 'Sáng' ? 7.5 : 19.5;
      const standardEnd = standardStart + stdHours;
      const tcStartHours = standardEnd + brkHours;   // OT bắt đầu sau break
      const bonusThreshold = tcStartHours + 3;       // Bonus +0.5h khi OT >= 3h
      
      let regularHours = 0, overtimeHours = 0;
      
      if (isSpecialDay) {
        // CN/Lễ: toàn bộ giờ làm → OT
        let worked = totalHours;
        if (totalHours >= stdHours + brkHours) worked -= brkHours;
        else if (totalHours >= stdHours) worked -= brkHours / 2;
        if (worked < 0) worked = 0;
        
        regularHours = 0;
        overtimeHours = worked;
        if (endHours >= bonusThreshold) overtimeHours += 0.5;
        if (shift === 'Đêm' && overtimeHours > 0) overtimeHours += 0.25;
      } else {
        // Ngày thường
        // Regular = phần giao giữa [startHours, endHours] và [standardStart, standardEnd]
        const regStart = Math.max(startHours, standardStart);
        const regEnd = Math.min(endHours, standardEnd);
        regularHours = Math.max(0, regEnd - regStart);
        
        // OT = phần vượt tcStartHours
        let ot = 0;
        if (endHours > tcStartHours) {
          ot = endHours - Math.max(tcStartHours, startHours);
          if (ot >= 3) ot += 0.5;
          if (shift === 'Đêm') ot += 0.25;
        }
        overtimeHours = ot;
      }
      
      regularHours = Math.round(regularHours * 100) / 100;
      overtimeHours = Math.round(overtimeHours * 100) / 100;
      
      const regularPay = regularHours * hourlyRate;
      let overtimePay = 0;
      
      if (overtimeHours > 0) {
        let coeff;
        if (paidHoliday) coeff = cfg.otHoliday;
        else if (isSunday) coeff = shift === 'Sáng' ? cfg.otSundayDay : cfg.otSundayNight;
        else coeff = shift === 'Sáng' ? cfg.otNormalDay : cfg.otNormalNight;
        overtimePay = overtimeHours * hourlyRate * coeff;
      }
      
      return {
        regularHours, overtimeHours,
        totalPay: Math.round(regularPay + overtimePay),
        isPaidHoliday: !!paidHoliday, holiday: paidHoliday
      };
    } catch (e) {
      return { regularHours: 0, overtimeHours: 0, totalPay: 0, isPaidHoliday: false };
    }
  };

  // ==========================================
  // 2. TỰ ĐỘNG RECALC LẠI TOÀN BỘ LOGS
  // ==========================================
  function recalcAllLogs(showToast) {
    const logKey = getProfileKey('worklogs');
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem(logKey) || '[]'); } catch(e) {}
    if (logs.length === 0) return;
    
    let changed = false;
    logs.forEach(l => {
      const d = new Date(l.date + 'T00:00:00');
      const actualIsSunday = d.getDay() === 0;
      if (l.isSunday !== actualIsSunday) { l.isSunday = actualIsSunday; changed = true; }
      
      const c = window.calculateWorkLog(l.date, l.shift, l.isSunday, l.start, l.end);
      if (l.totalPay !== c.totalPay || l.regularHours !== c.regularHours || l.overtimeHours !== c.overtimeHours) {
        l.totalPay = c.totalPay;
        l.regularHours = c.regularHours;
        l.overtimeHours = c.overtimeHours;
        l.isPaidHoliday = c.isPaidHoliday;
        changed = true;
      }
    });
    
    if (changed) {
      localStorage.setItem(logKey, JSON.stringify(logs));
      if (typeof window.refreshCurrentPage === 'function') window.refreshCurrentPage();
      if (showToast && typeof window.toast === 'function') {
        window.toast('✅ Đã áp dụng lương mới cho toàn bộ dữ liệu!', 'success');
      }
    }
  }
  
  // Boot: recalc 1 lần để đồng bộ
  setTimeout(() => {
    try { recalcAllLogs(false); } catch(e) {}
  }, 1500);
  
  // Expose để file khác gọi
  window.PayrollOverride = { recalcAll: recalcAllLogs };

  // ==========================================
  // 3. GHI ĐÈ HÀM CHẤM CÔNG NHANH
  // ==========================================
  window.quickCheckIn = function() {
    try {
      const now = new Date();
      const hour = now.getHours();
      let settings = { morningStart: '07:30', morningEnd: '19:30', nightStart: '19:30', nightEnd: '07:30' };
      try { const s = localStorage.getItem(getProfileKey('settings')); if (s) settings = { ...settings, ...JSON.parse(s) }; } catch (e) {}
      
      const logKey = getProfileKey('worklogs');
      let logs = [];
      try { logs = JSON.parse(localStorage.getItem(logKey) || '[]'); } catch(e) {}
      
      let ts = getTodayStr();
      let shift = 'Sáng';
      
      if (logs.length > 0) {
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        shift = logs[0].shift;
      }

      if (shift === 'Đêm' && hour < 10) {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        const yesterdayStr = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
        if (!logs.some(l => l.date === yesterdayStr)) ts = yesterdayStr;
      }
      
      if (getLeaves()[ts]) {
        if (typeof window.toast === 'function') window.toast(`Ngày ${ts} đã đăng ký nghỉ. Không thể chấm công!`, 'warning');
        return;
      }
      
      if (logs.some(l => l.date === ts)) {
        if (typeof window.toast === 'function') window.toast(`Đã chấm công ngày ${ts}!`, 'warning');
        return;
      }
      
      const wd = document.getElementById('worklog-date');
      const ws = document.getElementById('worklog-shift');
      const wst = document.getElementById('worklog-start');
      const wen = document.getElementById('worklog-end');
      const wt = document.getElementById('worklog-type');
      
      if (wd && ws && wst && wen && wt) {
        wd.value = ts;
        ws.value = shift;
        wst.value = shift === 'Sáng' ? (settings.morningStart || '07:30') : (settings.nightStart || '19:30');
        wen.value = shift === 'Sáng' ? (settings.morningEnd || '19:30') : (settings.nightEnd || '07:30');
        wt.value = new Date(ts + 'T00:00:00').getDay() === 0 ? 'sunday' : 'normal';
        
        const originalConfirm = window.confirm;
        window.confirm = () => true;
        if (typeof window.addWorkLog === 'function') window.addWorkLog();
        window.confirm = originalConfirm;
        
        const page = document.body.dataset.page || 'home';
        if (typeof window.switchPage === 'function') window.switchPage(page);
      }
    } catch (e) {}
  };

  // ==========================================
  // 4. LỚP BẢO VỆ REALTIME
  // ==========================================
  const originalGetLogsByMonth = window.getLogsByMonth;
  window.getLogsByMonth = function(m, y) {
    if (typeof originalGetLogsByMonth !== 'function') return [];
    const leaves = getLeaves();
    return originalGetLogsByMonth(m, y).filter(l => !leaves[l.date]);
  };

  const originalGetLogByDate = window.getLogByDate;
  window.getLogByDate = function(ds) {
    if (typeof originalGetLogByDate !== 'function') return undefined;
    if (getLeaves()[ds]) return undefined;
    return originalGetLogByDate(ds);
  };

  const originalQuickAddDay = window.quickAddDay;
  window.quickAddDay = function(dateStr) {
    if (getLeaves()[dateStr]) {
      if (typeof window.toast === 'function') window.toast('Ngày này đã đăng ký nghỉ. Không thể chấm công!', 'warning');
      return;
    }
    if (typeof originalQuickAddDay === 'function') originalQuickAddDay(dateStr);
  };

  const originalAddWorkLog = window.addWorkLog;
  window.addWorkLog = function() {
    const dateEl = document.getElementById('worklog-date');
    if (dateEl && dateEl.value && getLeaves()[dateEl.value]) {
      if (typeof window.toast === 'function') window.toast('Ngày này đã đăng ký nghỉ. Không thể lưu chấm công!', 'warning');
      return;
    }
    if (typeof originalAddWorkLog === 'function') originalAddWorkLog();
  };

  const originalShowCalDetail = window.showCalDetail;
  window.showCalDetail = function(dateStr) {
    if (typeof originalShowCalDetail === 'function') originalShowCalDetail(dateStr);
    setTimeout(() => {
      const leaves = getLeaves();
      if (leaves[dateStr]) {
        const body = document.getElementById('cal-detail-body');
        if (body) {
          body.querySelectorAll('button').forEach(btn => {
            if (btn.innerText.includes('Thêm chấm công')) btn.style.display = 'none';
          });
          const notice = document.createElement('div');
          notice.style.cssText = 'background:#dbeafe;color:#1e3a8a;padding:12px;border-radius:12px;font-weight:bold;text-align:center;margin-bottom:12px;border:1px solid #3b82f6;';
          notice.innerHTML = 'Đã đăng ký nghỉ: ' + (leaves[dateStr] === 'annual' ? 'Phép năm (P)' : 'Việc riêng (R)');
          body.insertBefore(notice, body.firstChild);
        }
      }
    }, 50);
  };

  const originalAutoDetectSunday = window.autoDetectSunday;
  window.autoDetectSunday = function() {
    if (typeof originalAutoDetectSunday === 'function') originalAutoDetectSunday();
    const dateEl = document.getElementById('worklog-date');
    if (dateEl && dateEl.value) {
      const leaves = getLeaves();
      let warning = document.getElementById('worklog-leave-warning');
      if (leaves[dateEl.value]) {
        if (!warning) {
          warning = document.createElement('div');
          warning.id = 'worklog-leave-warning';
          warning.style.cssText = 'background:#fee2e2;color:#dc2626;padding:10px;border-radius:8px;font-size:12px;font-weight:bold;margin-top:8px;text-align:center;';
          dateEl.parentElement.parentElement.appendChild(warning);
        }
        warning.innerHTML = `⚠️ Ngày này đã đăng ký nghỉ (${leaves[dateEl.value] === 'annual' ? 'Phép năm' : 'Việc riêng'}). Không thể chấm công!`;
      } else if (warning) {
        warning.remove();
      }
    }
  };
})();