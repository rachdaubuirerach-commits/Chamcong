'use strict';

(function () {
  const TUTORIAL_KEY = 'tt_tutorial_v4_seen';

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes tour-heartbeat {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 91, 170, 0.8); z-index: 9999999; position: relative; }
      50% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(0, 91, 170, 0); z-index: 9999999; position: relative; }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 91, 170, 0); z-index: 9999999; position: relative; }
    }
    .tour-heartbeat { animation: tour-heartbeat 1.5s infinite; border-radius: 12px; }
    
    .tour-overlay-mask {
      position: fixed; inset: 0; background: rgba(15,23,42,0.7); 
      z-index: 99990; pointer-events: auto; touch-action: none;
      transition: clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes bubble-in {
      0% { opacity: 0; transform: scale(0.8) translateY(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    .tour-bubble {
      position: absolute; background: #fff; border-radius: 20px; padding: 20px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.2); 
      width: 290px; border: 1px solid rgba(0,0,0,0.05);
      z-index: 10000005; pointer-events: none;
      animation: bubble-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .tour-bubble::after {
      content: ''; position: absolute; border: 12px solid transparent;
    }
    .tour-bubble.pos-bottom::after {
      bottom: 100%; left: 50%; margin-left: -12px; border-bottom-color: #fff;
    }
    .tour-bubble.pos-top::after {
      top: 100%; left: 50%; margin-left: -12px; border-top-color: #fff;
    }
    
    .tour-btn {
      margin-top: 16px; width: 100%; padding: 12px; 
      background: linear-gradient(135deg, #005BAA, #0073CC); color: #fff; 
      border: none; border-radius: 12px; font-weight: 700; font-size: 14px; 
      cursor: pointer; box-shadow: 0 4px 12px rgba(0, 91, 170, 0.3);
      transition: transform 0.2s; pointer-events: auto;
    }
    .tour-btn:active { transform: scale(0.96); }
  `;
  document.head.appendChild(style);

  let currentTarget = null;
  let mask = null;
  let bubble = null;

  function lockScreen() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScreen() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  function clearUI() {
    if (currentTarget) currentTarget.classList.remove('tour-heartbeat');
    if (bubble && bubble.parentNode) {
      if (bubble.parentNode.classList.contains('tour-wrapper')) bubble.parentNode.remove();
      else bubble.remove();
    }
    if (mask) {
      mask.remove(); 
      mask = null;
    }
  }

  function createMask() {
    if (mask) mask.remove();
    mask = document.createElement('div');
    mask.className = 'tour-overlay-mask';
    document.body.appendChild(mask);
  }

  function setMaskHole(rect) {
    if (!mask) createMask();
    const p = 10;
    const x1 = rect.left - p;
    const y1 = rect.top - p;
    const x2 = rect.right + p;
    const y2 = rect.bottom + p;

    mask.style.clipPath = `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px
    )`;
    mask.style.clipRule = 'evenodd';
  }

  function showBubble(rect, title, text, preferredPos = 'bottom', btnText = '') {
    if (bubble && bubble.parentNode) bubble.remove();
    bubble = document.createElement('div');
    bubble.className = `tour-bubble`;
    
    let btnHtml = btnText ? `<button id="tour-btn-action" class="tour-btn">${btnText}</button>` : '';
    
    bubble.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px; pointer-events:none;">
        <div style="background:#E6F0F9; color:#005BAA; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <div style="width:100%;">
          <div style="font-weight:800;font-size:15px;color:#0f172a;margin-bottom:6px;letter-spacing:-0.2px;">${title}</div>
          <div style="font-size:13px;color:#475569;line-height:1.5;">${text}</div>
          ${btnHtml}
        </div>
      </div>
    `;
    
    bubble.style.top = '-9999px';
    bubble.style.left = '-9999px';
    document.body.appendChild(bubble);

    const bubbleHeight = bubble.offsetHeight;
    const bubbleWidth = bubble.offsetWidth;

    let top, finalPos;
    
    if (preferredPos === 'bottom' && (rect.bottom + 20 + bubbleHeight < window.innerHeight - 20)) {
      top = rect.bottom + 20;
      finalPos = 'bottom';
    } else if (preferredPos === 'top' && (rect.top - 20 - bubbleHeight > 20)) {
      top = rect.top - bubbleHeight - 20;
      finalPos = 'top';
    } else {
      if (rect.top > window.innerHeight / 2) {
        top = rect.top - bubbleHeight - 20;
        finalPos = 'top';
      } else {
        top = rect.bottom + 20;
        finalPos = 'bottom';
      }
    }

    top = Math.max(20, Math.min(window.innerHeight - bubbleHeight - 20, top));
    let left = Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, rect.left + rect.width / 2 - bubbleWidth / 2));

    bubble.className = `tour-bubble pos-${finalPos}`;
    bubble.style.top = top + 'px';
    bubble.style.left = left + 'px';
    
    return bubble;
  }

  // ==========================================
  // CÁC BƯỚC HƯỚNG DẪN
  // ==========================================
  function step1() {
    clearUI();
    lockScreen(); 
    if (document.body.dataset.page !== 'home' && typeof window.switchPage === 'function') window.switchPage('home');
    
    setTimeout(() => {
      currentTarget = document.querySelector('.qa-payroll-btn');
      if (!currentTarget) return;
      
      currentTarget.classList.add('tour-heartbeat');
      const rect = currentTarget.getBoundingClientRect();
      setMaskHole(rect);
      
      showBubble(rect, 'Xem Phiếu Lương', 'Màn hình đã bị khóa. Bạn bắt buộc phải chạm vào nút đang đập nhịp tim này để mở phiếu lương.', 'top');

      currentTarget.addEventListener('click', function onPayrollClick(e) {
        currentTarget.removeEventListener('click', onPayrollClick);
        clearUI(); 
        
        setTimeout(() => {
          const checkClose = setInterval(() => {
            if (!document.getElementById('payroll-modal')) { 
              clearInterval(checkClose);
              step2(); 
            }
          }, 500);
        }, 500);
      }, { once: true });
    }, 300);
  }

  function step2() {
    clearUI();
    setTimeout(() => {
      currentTarget = document.querySelector('.app-bar-actions .app-bar-btn:last-child');
      if (!currentTarget) return;
      
      currentTarget.classList.add('tour-heartbeat');
      const rect = currentTarget.getBoundingClientRect();
      setMaskHole(rect);
      
      showBubble(rect, 'Mở Menu Tính Năng', 'Bây giờ bạn phải chạm vào nút 3 gạch này để mở Menu.', 'bottom');

      currentTarget.addEventListener('click', function onMenuClick(e) {
        currentTarget.removeEventListener('click', onMenuClick);
        clearUI();
        setTimeout(step3, 500);
      }, { once: true });
    }, 300);
  }

  function step3() {
    clearUI();
    setTimeout(() => {
      if (typeof window.openDrawer === 'function' && !document.querySelector('.drawer.open')) {
        window.openDrawer();
      }
      setTimeout(() => {
        currentTarget = document.querySelector('#leave-btn');
        if (!currentTarget) return;
        
        currentTarget.classList.add('tour-heartbeat');
        const rect = currentTarget.getBoundingClientRect();
        setMaskHole(rect);
        
        showBubble(rect, 'Quản Lý Ngày Nghỉ', 'Chạm vào đây để xem tính năng khai báo ngày nghỉ.', 'bottom');

        currentTarget.addEventListener('click', function onLeaveClick(e) {
          currentTarget.removeEventListener('click', onLeaveClick);
          clearUI(); 
          setTimeout(step4, 800);
        }, { once: true });
      }, 400); 
    }, 300);
  }

  function step4() {
    clearUI();
    
    setTimeout(() => {
      const targetBox = document.querySelector('#leave-date').closest('div[style*="background:#fff"]');
      if (!targetBox) return;

      currentTarget = targetBox;
      currentTarget.classList.add('tour-heartbeat');
      const rect = targetBox.getBoundingClientRect();
      
      showBubble(rect, 'Thêm ngày nghỉ mới', 'Hãy chọn ngày bạn muốn nghỉ, sau đó bấm <b>Phép năm (P)</b> hoặc <b>Việc riêng (R)</b>. Hệ thống sẽ tự động ghi nhận.', 'bottom');

      const onLeaveAdded = () => {
        window.removeEventListener('tour_leave_updated', onLeaveAdded);
        if (currentTarget) currentTarget.classList.remove('tour-heartbeat');
        setTimeout(step5, 300);
      };
      window.addEventListener('tour_leave_updated', onLeaveAdded);
      
      const existingDelete = document.querySelector('#leave-list-container button[onclick*="removeLeave"]');
      if (existingDelete) {
        window.removeEventListener('tour_leave_updated', onLeaveAdded);
        if (currentTarget) currentTarget.classList.remove('tour-heartbeat');
        setTimeout(step5, 300);
      }
    }, 500); 
  }

  function step5() {
    clearUI();
    
    setTimeout(() => {
      let deleteBtn = document.querySelector('#leave-list-container button[onclick*="removeLeave"]');
      if (!deleteBtn) return finishTour();
      
      currentTarget = deleteBtn;
      currentTarget.classList.add('tour-heartbeat');
      const rect = currentTarget.getBoundingClientRect();
      
      showBubble(rect, 'Xóa ngày nghỉ', 'Nếu bạn chọn nhầm, hãy bấm vào nút <b>Xóa</b> này để hủy bỏ ngày nghỉ đó. Hãy thử bấm vào nút Xóa để thấy nó biến mất nhé!', 'top');

      const onLeaveDeleted = () => {
        window.removeEventListener('tour_leave_updated', onLeaveDeleted);
        if (currentTarget) currentTarget.classList.remove('tour-heartbeat');
        clearUI();
        setTimeout(step6, 300);
      };
      window.addEventListener('tour_leave_updated', onLeaveDeleted);
    }, 500); 
  }

  // ==========================================
  // BƯỚC 6: TỰ ĐỘNG ĐÁNH DẤU NGHỈ VIỆC RIÊNG
  // ==========================================
  function step6() {
    clearUI();
    
    // Đóng bảng Quản lý ngày nghỉ
    document.querySelectorAll('.modal-bg').forEach(m => m.remove());
    
    // Chuyển sang tab Lịch
    const calTab = document.querySelector('.nav-item[data-page="calendar"]');
    if (calTab) calTab.click();
    
    setTimeout(() => {
      // Ưu tiên tìm một ngày có nhãn R (leave-unpaid) để khoanh sáng
      let target = document.querySelector('.cal-day.leave-unpaid') || document.querySelector('.cal-grid');
      if (!target) return finishTour();

      currentTarget = target;
      // Không thêm hiệu ứng heartbeat cho cả lưới lịch, chỉ thêm cho từng ô
      if (target.classList.contains('cal-day')) currentTarget.classList.add('tour-heartbeat');
      
      const rect = target.getBoundingClientRect();
      
      // Nếu là lưới lịch, khoét một khoảng rộng hơn
      let holeRect = target.classList.contains('cal-grid') 
        ? { left: rect.left, top: rect.top + 40, right: rect.right, bottom: rect.top + 200, width: rect.width, height: 160 } 
        : rect;
        
      setMaskHole(holeRect);
      
      showBubble(holeRect, 'Tự động đánh dấu nghỉ', 'Ngày nào bạn quên chấm công, App sẽ tự động tô đỏ chữ <b>R</b> (Nghỉ việc riêng). Nếu thực sự có đi làm, bạn chỉ cần bấm vào ngày đó để chấm bù, chữ R sẽ biến mất.', 'bottom', 'Tiếp tục');

      document.getElementById('tour-btn-action').addEventListener('click', () => {
        clearUI();
        setTimeout(step7, 300);
      });
    }, 600); 
  }

  // ==========================================
  // BƯỚC 7: CẢNH BÁO TỐI QUAN TRỌNG
  // ==========================================
  function step7() {
    clearUI();
    
    setTimeout(() => {
      const msg = `Nếu bạn nghỉ làm nhưng <b>không chọn "Phép năm (P)"</b> hoặc <b>"Việc riêng (R)"</b>, hệ thống sẽ không biết bạn đã nghỉ. <br><br>
      Điều này dẫn đến việc <b>tính sai lệch phiếu lương</b> (bị trừ lương oan hoặc mất thưởng chuyên cần).<br><br>
      Hãy luôn nhớ khai báo nghỉ phép mỗi khi nghỉ nhé!`;
      
      createMask();
      mask.style.clipPath = 'none';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'tour-wrapper';
      wrapper.style.cssText = 'position:fixed; inset:0; z-index:10000010; display:flex; align-items:center; justify-content:center; pointer-events:none; padding:16px;';
      
      bubble = document.createElement('div');
      bubble.className = `tour-bubble`;
      bubble.style.position = 'relative'; 
      bubble.style.top = 'auto'; bubble.style.left = 'auto'; bubble.style.transform = 'none'; 
      bubble.style.width = '100%'; bubble.style.maxWidth = '320px';
      bubble.style.pointerEvents = 'auto'; 
      bubble.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)';
      
      bubble.innerHTML = `
        <div style="text-align:center; margin-bottom:12px;">
          <div style="background:#FEE2E2; color:#EF4444; width:56px; height:56px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
        <div style="font-weight:800;font-size:16px;color:#0f172a;margin-bottom:8px;text-align:center;">Cảnh báo quan trọng</div>
        <div style="font-size:13px;color:#475569;line-height:1.6;text-align:center;margin-bottom:16px;">${msg}</div>
        <button id="tour-finish" class="tour-btn" style="background:linear-gradient(135deg, #EF4444, #DC2626); box-shadow:0 4px 12px rgba(239, 68, 68, 0.4);">Đã hiểu rõ</button>
      `;
      
      wrapper.appendChild(bubble);
      document.body.appendChild(wrapper);

      document.getElementById('tour-finish').addEventListener('click', () => {
        wrapper.remove();
        clearUI();
        unlockScreen(); 
        
        localStorage.setItem(TUTORIAL_KEY, 'true');
        if (typeof window.toast === 'function') window.toast('Đã hoàn thành hướng dẫn! Bạn có thể tiếp tục thao tác.', 'success');
      });
    }, 500); 
  }

  function finishTour() {
    clearUI();
    unlockScreen();
    localStorage.setItem(TUTORIAL_KEY, 'true');
    if (typeof window.toast === 'function') window.toast('Đã hoàn thành hướng dẫn!', 'success');
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!localStorage.getItem(TUTORIAL_KEY)) {
        step1();
      }
    }, 1500);
  });
})();