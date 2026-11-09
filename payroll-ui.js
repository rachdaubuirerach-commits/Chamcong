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

  function renderPayslipHTML(m, y, isExport = false) {
    const data = getAppData();
    const monthLogs = filterLogsByMonth(data.logs, m, y);
    const p = PayrollEngine.calculate(m, y, monthLogs, data.settings.standardShiftHours);
    const companyName = getCompanyName();
    
    const boxStyle = isExport 
      ? 'width: 800px; padding: 40px; background: #ffffff; box-sizing: border-box; font-family: Arial, sans-serif;' 
      : 'background:#fff;color:#000;padding:16px;font-family:Arial,sans-serif;max-width:100%;box-sizing:border-box;border-radius:12px;';

    // Cấu hình bảng: Nếu xuất ảnh thì cố định cột, nếu hiển thị app thì để tự động
    const colgroup = isExport ? `
      <colgroup>
        <col style="width: 40%;">
        <col style="width: 20%;">
        <col style="width: 15%;">
        <col style="width: 25%;">
      </colgroup>
    ` : '';

    const tableStyle = 'width:100%;border-collapse:collapse;' + (isExport ? 'table-layout:fixed;' : 'table-layout:auto;');
    const thStyle = 'background:#0f172a;color:#fff;padding:' + (isExport ? '14px 16px' : '10px 8px') + ';font-weight:700;font-size:' + (isExport ? '13px' : '11px') + ';text-transform:uppercase;border:none;' + (isExport ? 'white-space:nowrap;' : 'word-break:break-word;');
    const tdBase = 'padding:' + (isExport ? '14px 16px' : '10px 8px') + ';border-bottom:1px solid #f1f5f9;font-size:' + (isExport ? '14px' : '12px') + ';';
    const tdLabel = tdBase + 'text-align:left;color:#334155;word-break:break-word;';
    const tdNum = tdBase + 'white-space:nowrap;text-align:right;color:#64748b;';
    const tdCenter = tdBase + 'white-space:nowrap;text-align:center;color:#64748b;';

    const hRow = (label, baseAmount, qty, actualAmount, bold = false) => `
      <tr style="${bold ? 'background:#f8fafc;font-weight:800;border-top:1.5px solid #e2e8f0;' : ''}">
        <td style="${tdLabel}font-weight:${bold ? '800' : '500'};">${label}</td>
        <td style="${tdNum}">${baseAmount}</td>
        <td style="${tdCenter}">${qty}</td>
        <td style="${tdNum}font-weight:${bold ? '800' : '600'};color:#1e293b;">${formatMoney(actualAmount)}</td>
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

    const tableWrapperStyle = 'border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;';

    return `
      <div style="${boxStyle}">
        
        <div style="text-align:center; margin-bottom: 30px;">
          <div style="font-size:${isExport ? '24px' : '18px'}; font-weight:900; text-transform:uppercase; color:#0f172a; letter-spacing:-0.5px; margin-bottom: 8px;">
            ${companyName}
          </div>
          <div style="font-size:${isExport ? '18px' : '15px'}; font-weight:700; color:#005BAA;">
            PHIẾU LƯƠNG THÁNG ${String(m).padStart(2,'0')}/${y}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:${isExport ? '20px 24px' : '16px'}; margin-bottom:24px;">
          <div>
            <div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Họ và Tên</div>
            <div style="font-size:${isExport ? '16px' : '14px'}; font-weight:800; color:#0f172a;">${data.settings.profileName || 'Nhân viên'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Ngày Công</div>
            <div style="font-size:${isExport ? '16px' : '14px'}; font-weight:800; color:#0f172a;">
              ${p.actualDays} / ${p.stdDaysDisplay}
              ${p.paidLeaveDays > 0 ? `<span style="color:#3b82f6;font-size:12px;margin-left:4px;">(+${p.paidLeaveDays}P)</span>` : ''} 
              ${p.unpaidLeaveDays > 0 ? `<span style="color:#f97316;font-size:12px;margin-left:4px;">(-${p.unpaidLeaveDays}R)</span>` : ''}
            </div>
          </div>
        </div>
        
        <div style="${tableWrapperStyle}">
          <table style="${tableStyle}">
            ${colgroup}
            <thead>
              <tr>
                <th style="${thStyle} text-align:left; border-radius: 12px 0 0 0;">Mục lục</th>
                <th style="${thStyle} text-align:right;">Định mức</th>
                <th style="${thStyle} text-align:center;">Thực tế</th>
                <th style="${thStyle} text-align:right; border-radius: 0 12px 0 0;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${fixedRowsHTML}
              ${hRow('Thưởng chuyên cần', '300.000 đ', p.attendanceBonus > 0 ? '100%' : '0%', p.attendanceBonus)}
              ${hRow('Thưởng khảo hạch', '500.000 đ', '-', p.appraisalBonus)}
            </tbody>
          </table>
        </div>

        ${otRows ? `
        <div style="${tableWrapperStyle}">
          <table style="${tableStyle}">
            ${colgroup}
            <thead>
              <tr>
                <th style="${thStyle} text-align:left; border-radius: 12px 0 0 0;">Khoản khác</th>
                <th style="${thStyle} text-align:right;">Hệ số</th>
                <th style="${thStyle} text-align:center;">Số giờ</th>
                <th style="${thStyle} text-align:right; border-radius: 0 12px 0 0;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${otRows}
            </tbody>
          </table>
        </div>` : ''}

        <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:16px; padding:${isExport ? '24px' : '16px'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #f1f5f9;">
            <span style="font-size:${isExport ? '16px' : '14px'}; font-weight:800; color:#0f172a; text-transform:uppercase;">Tổng Thu Nhập</span>
            <span style="font-size:${isExport ? '18px' : '16px'}; font-weight:800; color:#0f172a;">${formatMoney(p.grossIncome)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:${isExport ? '14px' : '12px'}; color:#dc2626; font-weight:600;">Truy thuế TN (10.5%)</span>
            <span style="font-size:${isExport ? '14px' : '12px'}; color:#dc2626; font-weight:700;">- ${formatMoney(p.insurance)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <span style="font-size:${isExport ? '14px' : '12px'}; color:#dc2626; font-weight:600;">Công đoàn</span>
            <span style="font-size:${isExport ? '14px' : '12px'}; color:#dc2626; font-weight:700;">- ${formatMoney(p.unionFee)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:16px; border-top:2px dashed #cbd5e1;">
            <span style="font-size:${isExport ? '18px' : '15px'}; font-weight:900; color:#16a34a; text-transform:uppercase;">Thực Lĩnh</span>
            <span style="font-size:${isExport ? '24px' : '20px'}; font-weight:900; color:${p.netIncome < 0 ? '#dc2626' : '#16a34a'};">${formatMoney(p.netIncome)}</span>
          </div>
          ${p.netIncome < 0 ? `<div style="text-align:center;font-size:12px;color:#dc2626;margin-top:8px;font-weight:600;">(Bạn chưa làm đủ ngày để bù trừ các khoản phí)</div>` : ''}
        </div>
        
        ${isExport ? `
        <div style="text-align:center; margin-top:40px; font-size:12px; color:#94a3b8; font-weight:600;">
          Phiếu lương được tạo tự động bởi TimeTracker • ${new Date().toLocaleDateString('vi-VN')}
        </div>` : ''}

        ${!isExport ? `
        <div style="margin-top:24px;text-align:center;" data-html2canvas-ignore="true">
          <button onclick="window.PayrollUI.exportPNG(this)" style="padding:12px 24px;background:#0f172a;color:#fff;border:none;border-radius:10px;font-weight:bold;cursor:pointer;margin-right:8px;font-size:13px;">📥 Tải ảnh</button>
          <button onclick="window.print()" style="padding:12px 24px;background:#e2e8f0;color:#000;border:none;border-radius:10px;font-weight:bold;cursor:pointer;font-size:13px;">🖨️ In</button>
        </div>` : ''}
      </div>`;
  }

  function updatePayslipData() {
    const mSel = document.getElementById('payroll-month-select');
    const yInp = document.getElementById('payroll-year-input');
    if (!mSel || !yInp) return;
    document.getElementById('payroll-content').innerHTML = renderPayslipHTML(parseInt(mSel.value), parseInt(yInp.value), false);
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
    if (typeof html2canvas === 'undefined') {
      alert('Thư viện html2canvas chưa tải, vui lòng thử lại!');
      return;
    }
    
    btn.innerText = 'Đang xuất...'; 
    btn.disabled = true;
    
    const m = parseInt(document.getElementById('payroll-month-select').value);
    const y = parseInt(document.getElementById('payroll-year-input').value);
    
    const printContainer = document.createElement('div');
    printContainer.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;width:800px;';
    printContainer.innerHTML = renderPayslipHTML(m, y, true);
    document.body.appendChild(printContainer);

    setTimeout(() => {
      html2canvas(printContainer.firstElementChild, {
        scale: 2.5, 
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: 800
      }).then(canvas => {
        const a = document.createElement('a'); 
        a.href = canvas.toDataURL('image/png'); 
        a.download = `phieu_luong_${String(m).padStart(2,'0')}_${y}.png`; 
        a.click();
        
        btn.innerText = '📥 Tải ảnh'; 
        btn.disabled = false;
        printContainer.remove();
      }).catch(err => {
        console.error(err);
        alert('Lỗi xuất ảnh: ' + err.message);
        btn.innerText = '📥 Tải ảnh'; 
        btn.disabled = false;
        printContainer.remove();
      });
    }, 300);
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