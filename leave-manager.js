'use strict';

(function () {
  const LEAVE_KEY = 'tt_leave_types';
  
  function getLeaves() { try { return JSON.parse(localStorage.getItem(LEAVE_KEY) || '{}'); } catch(e) { return {}; } }
  function setLeave(date, type) {
    let leaves = getLeaves();
    if (type === 'none') delete leaves[date];
    else leaves[date] = type;
    localStorage.setItem(LEAVE_KEY, JSON.stringify(leaves));
  }

  function getLocalLogs() {
    const active = localStorage.getItem('tt_active_profile') || 'default';
    const logKey = active === 'default' ? 'timesheet_worklogs' : `timesheet_${active}_worklogs`;
    try { return JSON.parse(localStorage.getItem(logKey) || '[]'); } catch(e) { return []; }
  }

  function applyLeaveStyles() {
    try {
      const leaves = getLeaves();
      const logs = getLocalLogs(); 
      const grid = document.getElementById('cal-grid');
      if (!grid) return;
      
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      
      const cells = grid.querySelectorAll('.cal-day');
      cells.forEach(cell => {
        try {
          const onclickStr = cell.getAttribute('onclick');
          if (!onclickStr) return;
          const match = onclickStr.match(/'([^']+)'/);
          if (!match) return;
          const dateStr = match[1];
          
          let type = leaves[dateStr];
          const hoursEl = cell.querySelector('.cal-hours');
          
          // Xóa các class và badge cũ
          cell.classList.remove('leave-annual', 'leave-unpaid', 'absent-auto');
          const oldBadge = cell.querySelector('.leave-badge');
          if (oldBadge) oldBadge.remove();

          // NẾU KHÔNG CÓ LOẠI NGHỈ, KIỂM TRA XEM CÓ PHẢI NGÀY TỰ ĐỘNG VẮNG KHÔNG
          if (!type) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
              const isCurrentMonth = (m === now.getMonth() + 1 && y === now.getFullYear());
              
              if (isCurrentMonth) {
                const isPastOrToday = dateStr <= todayStr;
                const dateObj = new Date(y, m - 1, d);
                const isSunday = dateObj.getDay() === 0;
                const isHoliday = typeof HolidayResolver !== 'undefined' && HolidayResolver.getPaidHoliday(dateStr);
                const hasLog = logs.some(l => l.date === dateStr);

                // Nếu là ngày trong quá khứ, không phải CN/Lễ, và không chấm công -> Tự động gán là 'unpaid' (R)
                if (isPastOrToday && !isSunday && !isHoliday && !hasLog) {
                  type = 'unpaid'; 
                }
              }
            }
          }

          // HIỂN THỊ GIAO DIỆN
          if (type) {
            cell.classList.remove('done-normal', 'done-sunday', 'done-holiday');
            if (hoursEl) hoursEl.style.display = 'none';
          } else {
            if (hoursEl) hoursEl.style.display = '';
          }
          
          if (type === 'annual') {
            cell.classList.add('leave-annual');
            cell.style.background = '#DBEAFE';
            cell.style.borderColor = '#3B82F6';
            cell.style.color = '#1E3A8A';
            cell.style.borderStyle = 'dashed';
            cell.style.borderWidth = '2px';
            const badge = document.createElement('div');
            badge.className = 'leave-badge';
            badge.textContent = 'P';
            badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#3B82F6;color:#fff;font-size:9px;font-weight:900;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;';
            cell.appendChild(badge);
          } else if (type === 'unpaid') {
            // Dùng chung giao diện ĐỎ cho cả tự động lẫn thủ công
            cell.classList.add('leave-unpaid');
            cell.style.background = '#FEE2E2';
            cell.style.borderColor = '#EF4444';
            cell.style.color = '#991B1B';
            cell.style.borderStyle = 'dashed';
            cell.style.borderWidth = '2px';
            const badge = document.createElement('div');
            badge.className = 'leave-badge';
            badge.textContent = 'R';
            badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;font-size:9px;font-weight:900;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);z-index:10;';
            cell.appendChild(badge);
          } else {
            cell.style.background = '';
            cell.style.borderColor = '';
            cell.style.color = '';
            cell.style.borderStyle = '';
          }
        } catch (err) {}
      });
    } catch (e) {
      console.error('Lỗi applyLeaveStyles:', e);
    }
  }

  const originalRenderSolarTab = window.renderSolarTab;
  window.renderSolarTab = function() {
    if (typeof originalRenderSolarTab === 'function') originalRenderSolarTab();
    setTimeout(applyLeaveStyles, 10);
  };
  
  const originalRenderLunarTab = window.renderLunarTab;
  window.renderLunarTab = function() {
    if (typeof originalRenderLunarTab === 'function') originalRenderLunarTab();
    setTimeout(applyLeaveStyles, 10);
  };

  function getLeaveListHtml() {
    const leaves = getLeaves();
    let htmlRows = Object.keys(leaves).sort((a,b) => b.localeCompare(a)).map(date => {
      const typeStr = leaves[date] === 'annual' ? '<span style="color:#3b82f6;font-weight:bold;">Phép năm (P)</span>' : '<span style="color:#ef4444;font-weight:bold;">Việc riêng (R)</span>';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
        <div><b>${date}</b> - ${typeStr}</div>
        <button onclick="window.LeaveManager.removeLeave('${date}')" style="background:#fee2e2;color:#dc2626;border:none;border-radius:4px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;">Xóa</button>
      </div>`;
    }).join('');
    return htmlRows || '<div style="text-align:center;color:#94a3b8;padding:20px;font-size:13px;">Chưa có ngày nghỉ nào</div>';
  }

  function openLeaveManager() {
    document.querySelectorAll('.modal-bg').forEach(m => m.remove());

    let modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity 0.3s;';
    modal.innerHTML = `<div style="background:#f8fafc;width:100%;max-width:480px;max-height:90vh;border-radius:20px 20px 0 0;overflow-y:auto;padding:20px;transform:translateY(100%);transition:transform 0.3s;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-weight:800;font-size:16px;color:#0f172a;">Quản lý ngày nghỉ</div>
        <button onclick="this.closest('.modal-bg').remove()" style="background:#e2e8f0;border:none;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;">&times;</button>
      </div>
      
      <div style="background:#fff;padding:16px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#0f172a;">Thêm ngày nghỉ mới</div>
        <input type="date" id="leave-date" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:10px;font-family:inherit;">
        <div style="display:flex;gap:10px;">
          <button onclick="window.LeaveManager.addLeave('annual')" style="flex:1;padding:10px;background:#dbeafe;color:#1e3a8a;border:1px solid #3b82f6;border-radius:8px;font-weight:700;cursor:pointer;">Phép năm (P)</button>
          <button onclick="window.LeaveManager.addLeave('unpaid')" style="flex:1;padding:10px;background:#fee2e2;color:#991b1b;border:1px solid #ef4444;border-radius:8px;font-weight:700;cursor:pointer;">Việc riêng (R)</button>
        </div>
      </div>

      <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#0f172a;">Danh sách ngày nghỉ</div>
      <div id="leave-list-container" style="background:#fff;border-radius:12px;padding:0 16px;">${getLeaveListHtml()}</div>
    </div>`;
    document.body.appendChild(modal);
    setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('div').style.transform = 'translateY(0)'; document.getElementById('leave-date').valueAsDate = new Date(); }, 10);
  }

  function addLeave(type) {
    const dateInput = document.getElementById('leave-date');
    if (!dateInput.value) return alert('Vui lòng chọn ngày');
    const dateVal = dateInput.value;
    
    setLeave(dateVal, type);
    
    const listContainer = document.getElementById('leave-list-container');
    if (listContainer) listContainer.innerHTML = getLeaveListHtml();
    
    applyLeaveStyles();
    if (typeof window.toast === 'function') window.toast('Đã thêm ngày nghỉ thành công!', 'success');
    
    setTimeout(() => window.dispatchEvent(new Event('tour_leave_updated')), 100);
  }

  function removeLeave(date) {
    setLeave(date, 'none');
    
    const listContainer = document.getElementById('leave-list-container');
    if (listContainer) listContainer.innerHTML = getLeaveListHtml();
    
    applyLeaveStyles();
    if (typeof window.toast === 'function') window.toast('Đã xóa ngày nghỉ!', 'info');
    
    setTimeout(() => window.dispatchEvent(new Event('tour_leave_updated')), 100);
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const drawerMenu = document.querySelector('#drawer .drawer-menu');
      if (drawerMenu && !document.getElementById('leave-btn')) {
        const btnLeave = document.createElement('div'); btnLeave.id = 'leave-btn'; btnLeave.className = 'drawer-item';
        btnLeave.onclick = () => { if (typeof window.closeDrawer === 'function') window.closeDrawer(); setTimeout(openLeaveManager, 200); };
        btnLeave.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><span>Quản lý ngày nghỉ</span>`;
        drawerMenu.insertBefore(btnLeave, drawerMenu.firstChild);
      }
      applyLeaveStyles();
    }, 1000);
  });

  window.LeaveManager = { open: openLeaveManager, addLeave, removeLeave };
})();