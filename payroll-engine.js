'use strict';

const PayrollEngine = (function () {

  function getStandardWorkDays(month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let stdDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const mmdd = `${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSunday = date.getDay() === 0;
      const isHoliday = PAYROLL_CONFIG.paidHolidays && PAYROLL_CONFIG.paidHolidays.includes(mmdd);
      if (!isSunday && !isHoliday) stdDays++;
    }
    return stdDays;
  }

  function getLeaveTypes() {
    try { return JSON.parse(localStorage.getItem('tt_leave_types') || '{}'); } catch(e) { return {}; }
  }

  function calculate(month, year, logs, standardShiftHours) {
    const cfg = PAYROLL_CONFIG;
    const stdDaysDisplay = getStandardWorkDays(month, year);
    const leaves = getLeaveTypes();
    
    const validLogs = logs.filter(l => !leaves[l.date]);
    const actualDays = validLogs.filter(l => !l.isSunday && !l.isPaidHoliday).length;
    
    const now = new Date();
    const isCurrentMonth = (month === now.getMonth() + 1 && year === now.getFullYear());
    const daysInMonth = new Date(year, month, 0).getDate();
    const checkUpToDay = isCurrentMonth ? now.getDate() : daysInMonth;

    let stdDaysPassed = 0;
    for (let d = 1; d <= checkUpToDay; d++) {
      const date = new Date(year, month - 1, d);
      const mmdd = `${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSunday = date.getDay() === 0;
      const isHoliday = cfg.paidHolidays && cfg.paidHolidays.includes(mmdd);
      if (!isSunday && !isHoliday) stdDaysPassed++;
    }

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    
    // Đếm số ngày nghỉ do người dùng tự đánh dấu
    Object.keys(leaves).forEach(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      if (d.getMonth() + 1 === month && d.getFullYear() === year && d.getDate() <= checkUpToDay) {
        const isSunday = d.getDay() === 0;
        const mmdd = `${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const isHoliday = cfg.paidHolidays && cfg.paidHolidays.includes(mmdd);
        
        if (!isSunday && !isHoliday) {
          if (leaves[dateStr] === 'annual') paidLeaveDays++;
          if (leaves[dateStr] === 'unpaid') unpaidLeaveDays++;
        }
      }
    });

    // TỰ ĐỘNG GỘP NGÀY QUÊN CHẤM VÀO NGHỈ VIỆC RIÊNG
    let autoMissedDays = stdDaysPassed - (actualDays + paidLeaveDays + unpaidLeaveDays);
    if (autoMissedDays > 0) {
      unpaidLeaveDays += autoMissedDays; 
    }

    const totalPaidDays = actualDays + paidLeaveDays;
    const calcRatio = totalPaidDays / 26; 

    const normalNightShifts = validLogs.filter(l => 
      l.shift === 'Đêm' && !l.isSunday && !l.isPaidHoliday && 
      (l.regularHours > 0 || l.overtimeHours > 0)
    ).length;
    const totalNightHours = normalNightShifts * 7; 

    const baseSalaryCfg = Number(cfg.fixedEarnings.find(e => e.id === 'base')?.amount) || 5939400;
    const hourlyRate = baseSalaryCfg / 26 / (Number(standardShiftHours) || 8);

    let totalFixed = 0;
    const fixedRows = cfg.fixedEarnings.map(e => {
      const amt = e.proRate ? Math.round(e.amount * calcRatio) : e.amount;
      totalFixed += amt;
      return { name: e.name, qty: `${actualDays}/${stdDaysDisplay}`, amount: amt };
    });

    // Mất chuyên cần nếu có bất kỳ ngày nghỉ việc riêng nào (kể cả quên chấm)
    const isFullAttendance = (totalPaidDays >= stdDaysDisplay) && (unpaidLeaveDays === 0);
    const attendanceBonus = isFullAttendance ? 300000 : 0; 
    const appraisalBonus = 500000;

    let otNormalDayH = 0, otNormalNightH = 0;
    let otSundayDayH = 0, otSundayNightFirstH = 0, otSundayNightRestH = 0;

    validLogs.forEach(l => {
      const otH = Number(l.overtimeHours) || 0;
      const isNight = l.shift === 'Đêm';
      if (otH > 0) {
        if (l.isSunday) {
          if (!isNight) otSundayDayH += otH;
          else {
            const split = 9.3;
            if (otH <= split) otSundayNightFirstH += otH;
            else { otSundayNightFirstH += split; otSundayNightRestH += (otH - split); }
          }
        } else {
          if (!isNight) otNormalDayH += otH;
          else otNormalNightH += otH;
        }
      }
    });

    const otNormalDayPay = Math.round(hourlyRate * 1.5 * otNormalDayH);
    const otNormalNightPay = Math.round(hourlyRate * 1.7 * otNormalNightH);
    const otSundayDayPay = Math.round(hourlyRate * 2.0 * otSundayDayH);
    const otSundayNightFirstPay = Math.round(hourlyRate * 2.7 * otSundayNightFirstH);
    const otSundayNightRestPay = Math.round(hourlyRate * 2.0 * otSundayNightRestH);
    const totalOtSundayNightH = otSundayNightFirstH + otSundayNightRestH;
    const totalOtSundayNightPay = otSundayNightFirstPay + otSundayNightRestPay;

    const nightShiftPay = Math.round(hourlyRate * 0.3 * totalNightHours);

    const grossIncome = totalFixed + attendanceBonus + appraisalBonus +
      otNormalDayPay + otNormalNightPay + otSundayDayPay + totalOtSundayNightPay + nightShiftPay;

    const insurance = Math.round(6239400 * 0.105);
    const unionFee = 50000;
    const totalDeductions = insurance + unionFee;
    const netIncome = grossIncome - totalDeductions;

    return {
      stdDaysDisplay, actualDays, paidLeaveDays, unpaidLeaveDays, hourlyRate,
      fixedRows, totalFixed, attendanceBonus, appraisalBonus,
      ot: {
        normalDayH: otNormalDayH, normalDayPay: otNormalDayPay, normalDayCoeff: 1.5,
        normalNightH: otNormalNightH, normalNightPay: otNormalNightPay, normalNightCoeff: 1.7,
        sundayDayH: otSundayDayH, sundayDayPay: otSundayDayPay, sundayDayCoeff: 2.0,
        sundayNightH: totalOtSundayNightH, sundayNightPay: totalOtSundayNightPay, sundayNightCoeff: 2.7
      },
      nightHours: totalNightHours, nightShiftPay,
      grossIncome, insurance, unionFee, tax: 0,
      totalDeductions, netIncome
    };
  }

  return { calculate, getStandardWorkDays };
})();