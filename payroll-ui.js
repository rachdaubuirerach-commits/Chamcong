'use strict';

(function () {
  const COMPANY_KEY = 'tt_company_name';
  const LEAVE_KEY = 'tt_leave_types';
  
  function getCompanyName() { return localStorage.getItem(COMPANY_KEY) || 'KANGPING TECHNOLOGY VN'; }
  function setCompanyName(name) { localStorage.setItem(COMPANY_KEY, name.trim().toUpperCase()); }
  function getLeaves() { try { return JSON.parse(localStorage.getItem(LEAVE_KEY) || '{}'); } catch(e) { return {}; } }

  function getProfileKey(base) {
    const active = localStorage.getItem('tt_active_profile') || 'default';
    return active === 'default' ? `timesheet_${base}` : `timesheet_${active}_${base}`;
  }

  function getAppData() {
    let settings = { profileName: 'Nhân viên', standardShiftHours: 8 };
    try { const s = localStorage.getItem(getProfileKey('settings')); if (s) settings = { ...settings, ...JSON.parse(s) }; } catch (e) {}
    let logs = [];
    try { const w = localStorage.getItem(getProfileKey('worklogs')); if (w) logs = JSON.parse(w); } catch (e) {}
    return { settings, logs };
  }

  function filterLogsByMonth(logs, m, y) {
    const leaves = getLeaves();
    return logs.filter(l => { 
      if (leaves[l.date]) return false;
      const d = new Date(l.date + 'T00:00:00'); 
      return (d.getMonth() + 1) === m && d.getFullYear() === y; 
    });
  }

  function formatMoney(n) {
    if (typeof n !== 'number' || isNaN(n)) return '-';
    return Math.round(n).toLocaleString('vi-VN') + ' đ';
  }

  function renderPayslipHTML(m, y) {
    const data = getAppData();
    const monthLogs = filterLogsByMonth(data.logs, m, y);
    
    // ĐÃ XÓA CÂU LỆNH CHẶN: if (monthLogs.length === 0 ...) return "Không có dữ liệu";
    // Bây giờ dù chưa có ngày công, nó vẫn sẽ chạy xuống dưới để tính toán các khoản (0đ).

    const p = PayrollEngine.calculate(m, y, monthLogs, data.settings.standardShiftHours);
    const companyName = getCompanyName();
    
    const hRow = (label, baseAmount, qty, actualAmount, bold = false) => `
      <tr style="${bold ? 'background:#f8f9fa;font-weight:bold;' : ''}">
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:left;">${label}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;color:#64748b;">${baseAmount}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${qty}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatMoney(actualAmount)}</td>
      </tr>`;

    const fixedRowsHTML = p.fixedRows.map(r => {
      const configItem = PAYROLL_CONFIG.fixedEarnings.find(e => e.name === r.name);
      return hRow(r.name, configItem ? formatMoney(configItem.amount) : formatMoney(r.amount), r.qty, r.amount);
    }).join('');

    let otRows = '';
    if (p.ot.normalDayH > 0) otRows += hRow('Tăng ca ngày thường (Sáng)', `${p.ot.normalDayCoeff}x`, p.ot.normalDayH + 'h', p.ot.normalDayPay);
    if (p.ot.normalNightH > 0) otRows += hRow('Tăng ca ngày thường (Đêm)', `${p.ot.normalNightCoeff}x`, p.ot.normalNightH + 'h', p.ot.normalNightPay);
    if (p.ot.sundayDayH > 0) otRows += hRow('Tăng ca Chủ nhật (Sáng)', `${p.ot.sundayDayCoeff}x`, p.ot.sundayDayH + 'h', p.ot.sundayDayPay);
    if (p.ot.sundayNightH > 0) otRows += hRow('Tăng ca Chủ nhật (Đêm)', `${p.ot.sundayNightCoeff}x`, p.ot.sundayNightH + 'h', p.ot.sundayNightPay);
    if (p.nightHours > 0) otRows += hRow('Phụ cấp ca đêm', `30%`, p.nightHours + 'h', p.nightShiftPay);

    return `
      <div style="background:#fff;color:#000;padding:16px;font-family:'Segoe UI',Arial,sans-serif;max-width:100%;box-sizing:border-box;border-radius:12px;">
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="font-size:18px;font-weight:800;text-transform:uppercase;text-align:center;">${companyName}</div>
          <button onclick="window.PayrollUI.editCompany()" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;" title="Đổi tên công ty"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        </div>
        <div style="text-align:center;font-size:15px;font-weight:700;margin-bottom:16px;">PHIẾU LƯƠNG THÁNG ${String(m).padStart(2,'0')}/${y}</div>
        
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px;flex-wrap:wrap;gap:4px;">
          <div>Họ tên: <b>${data.settings.profileName || 'Nhân viên'}</b></div>
          <div style="text-align:right;">
            Ngày công: <b>${p.actualDays} / ${p.stdDaysDisplay}</b> 
            ${p.paidLeaveDays > 0 ? `<span style="color:#3b82f6;margin-left:4px">(+${p.paidLeaveDays}P)</span>` : ''} 
            ${p.unpaidLeaveDays > 0 ? `<span style="color:#f97316;margin-left:4px">(-${p.unpaidLeaveDays}R)</span>` : ''}
          </div>
        </div>
        
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
          <thead><tr style="background:#0f172a;color:#fff;"><th style="padding:6px;border:1px solid #ddd;text-align:left;">Mục lục</th><th style="padding:6px;border:1px solid #ddd;text-align:right;">Định mức</th><th style="padding:6px;border:1px solid #ddd;text-align:center;">Thực tế</th><th style="padding:6px;border:1px solid #ddd;text-align:right;">Thành tiền</th></tr></thead>
          <tbody>
            ${fixedRowsHTML}
            ${hRow('Thưởng chuyên cần', '300.000 đ', p.attendanceBonus > 0 ? '100%' : '0%', p.attendanceBonus)}
            ${hRow('Thưởng khảo hạch', '500.000 đ', '-', p.appraisalBonus)}
            <tr style="background:#f8f9fa;font-weight:bold;"><td colspan="3" style="padding:6px 8px;border:1px solid #ddd;text-align:left;">TỔNG LƯƠNG</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatMoney(p.totalFixed + p.attendanceBonus + p.appraisalBonus)}</td></tr>
          </tbody>
        </table>
        ${otRows ? `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;"><thead><tr style="background:#0f172a;color:#fff;"><th style="padding:6px;border:1px solid #ddd;text-align:left;">Khoản khác</th><th style="padding:6px;border:1px solid #ddd;text-align:right;">Định mức</th><th style="padding:6px;border:1px solid #ddd;text-align:center;">Số giờ</th><th style="padding:6px;border:1px solid #ddd;text-align:right;">Thành tiền</th></tr></thead><tbody>${otRows}</tbody></table>` : ''}
        <div style="background:#f8f9fa;padding:12px;border-radius:8px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:14px;margin-bottom:8px;"><span>TỔNG THU NHẬP</span><span>${formatMoney(p.grossIncome)}</span></div>
          <div style="display:flex;justify-content:space-between;color:#dc2626;margin-bottom:4px;"><span>Truy thuế TN (10.5%)</span><span>-${formatMoney(p.insurance)}</span></div>
          <div style="display:flex;justify-content:space-between;color:#dc2626;margin-bottom:4px;"><span>Công đoàn</span><span>-${formatMoney(p.unionFee)}</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:15px;color:#16a34a;margin-top:8px;padding-top:8px;border-top:1px solid #ddd;">
            <span>THỰC LĨNH</span>
            <span style="color: ${p.netIncome < 0 ? '#dc2626' : '#16a34a'}">${formatMoney(p.netIncome)}</span>
          </div>
          ${p.netIncome < 0 ? `<div style="text-align:center;font-size:10px;color:#dc2626;margin-top:4px;">(Bạn chưa làm đủ ngày để bù trừ các khoản phí)</div>` : ''}
        </div>
        <div style="margin-top:16px;text-align:center;">
          <button onclick="window.PayrollUI.exportPNG(this)" style="padding:10px 20px;background:#0f172a;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;margin-right:8px;">📥 Tải ảnh</button>
          <button onclick="window.print()" style="padding:10px 20px;background:#e2e8f0;color:#000;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">🖨️ In</button>
        </div>
      </div>`;
  }

  function updatePayslipData() {
    const mSel = document.getElementById('payroll-month-select');
    const yInp = document.getElementById('payroll-year-input');
    if (!mSel || !yInp) return;
    document.getElementById('payroll-content').innerHTML = renderPayslipHTML(parseInt(mSel.value), parseInt(yInp.value));
  }

  function changeMonth(delta) {
    const mSel = document.getElementById('payroll-month-select');
    const yInp = document.getElementById('payroll-year-input');
    let m = parseInt(mSel.value) + delta, y = parseInt(yInp.value);
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    mSel.value = m; yInp.value = y; updatePayslipData();
  }

  function editCompany() {
    let modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';
    modal.innerHTML = `<div style="background:#fff;width:90%;max-width:360px;border-radius:20px;padding:24px;transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);box-shadow:0 20px 40px rgba(0,0,0,0.2);">
        <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:8px;text-align:center;">Đổi tên Công ty</div>
        <input type="text" id="input-company-name" value="${getCompanyName()}" style="width:100%;box-sizing:border-box;padding:14px;border:2px solid #e2e8f0;border-radius:12px;font-size:15px;font-weight:bold;outline:none;transition:border-color 0.2s;text-transform:uppercase;" placeholder="VD: KANGPING TECHNOLOGY VN" onfocus="this.style.borderColor='#0f172a'" onblur="this.style.borderColor='#e2e8f0'">
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button onclick="this.closest('.modal-bg').remove()" class="close-btn" style="flex:1;padding:12px;border-radius:12px;border:none;background:#f1f5f9;color:#475569;font-weight:700;font-size:14px;cursor:pointer;">Hủy</button>
          <button onclick="window.PayrollUI.saveCompany(this)" style="flex:1;padding:12px;border-radius:12px;border:none;background:#0f172a;color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(15,23,42,0.2);">Lưu tên</button>
        </div></div>`;
    modal.className = 'modal-bg';
    document.body.appendChild(modal);
    setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('div').style.transform = 'scale(1)'; document.getElementById('input-company-name').focus(); }, 10);
    document.getElementById('input-company-name').addEventListener('keypress', function(e) { if (e.key === 'Enter') window.PayrollUI.saveCompany(e.target); });
  }

  function saveCompany(btn) {
    const input = btn.closest('.modal-bg').querySelector('#input-company-name');
    if (input && input.value.trim() !== '') {
      setCompanyName(input.value);
      btn.closest('.modal-bg').remove();
      updatePayslipData();
    } else { input.style.borderColor = '#ef4444'; }
  }

  function openPayslip() {
    let modal = document.getElementById('payroll-modal');
    const now = new Date();
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'payroll-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity 0.3s;';
      modal.innerHTML = `<div style="background:#f0f4f8;width:100%;max-width:480px;max-height:90vh;border-radius:20px 20px 0 0;overflow-y:auto;padding:16px;transform:translateY(100%);transition:transform 0.3s;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div style="font-weight:bold;font-size:16px;">Phiếu lương</div><button onclick="document.getElementById('payroll-modal').style.opacity='0';setTimeout(()=>document.getElementById('payroll-modal').remove(),300)" style="background:#e2e8f0;border:none;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;">&times;</button></div>
        <div style="display:flex; gap:8px; margin-bottom:16px; align-items:center;">
          <button onclick="window.PayrollUI.changeMonth(-1)" style="width:36px;height:36px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;font-weight:bold;">&lt;</button>
          <select id="payroll-month-select" class="form-control" style="flex:1; margin:0; padding:8px; font-weight:bold;" onchange="window.PayrollUI.updateData()"><option value="1">Tháng 1</option><option value="2">Tháng 2</option><option value="3">Tháng 3</option><option value="4">Tháng 4</option><option value="5">Tháng 5</option><option value="6">Tháng 6</option><option value="7">Tháng 7</option><option value="8">Tháng 8</option><option value="9">Tháng 9</option><option value="10">Tháng 10</option><option value="11">Tháng 11</option><option value="12">Tháng 12</option></select>
          <input type="number" id="payroll-year-input" class="form-control" style="width:80px; margin:0; padding:8px; font-weight:bold;" min="2000" max="2100" onchange="window.PayrollUI.updateData()">
          <button onclick="window.PayrollUI.changeMonth(1)" style="width:36px;height:36px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;font-weight:bold;">&gt;</button>
        </div><div id="payroll-content"></div></div>`;
      document.body.appendChild(modal);
      document.getElementById('payroll-month-select').value = now.getMonth() + 1;
      document.getElementById('payroll-year-input').value = now.getFullYear();
      setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('div').style.transform = 'translateY(0)'; }, 10);
    }
    updatePayslipData();
  }

  function exportPNG(btn) {
    const content = document.getElementById('payroll-content');
    btn.innerText = 'Đang xuất...'; btn.disabled = true;
    const m = parseInt(document.getElementById('payroll-month-select').value);
    const y = parseInt(document.getElementById('payroll-year-input').value);
    html2canvas(content.firstElementChild, { scale: 2, backgroundColor: '#fff' }).then(canvas => {
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `phieu_luong_${String(m).padStart(2,'0')}_${y}.png`; a.click();
      btn.innerText = '📥 Tải ảnh'; btn.disabled = false;
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const quickActions = document.querySelector('#page-home .quick-actions');
      if (quickActions && !document.querySelector('.qa-payroll-btn')) {
        const btn = document.createElement('div'); btn.className = 'quick-action qa-payroll-btn'; btn.onclick = openPayslip;
        btn.innerHTML = `<div class="qa-icon" style="background:linear-gradient(135deg,#F59E0B,#D97706);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg></div><span>Phiếu lương</span>`;
        quickActions.appendChild(btn);
      }
    }, 1000);
  });

  window.PayrollUI = { open: openPayslip, exportPNG, updateData: updatePayslipData, changeMonth, editCompany, saveCompany };
})();