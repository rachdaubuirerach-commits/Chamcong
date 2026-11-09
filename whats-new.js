'use strict';

(function () {
  // Đổi version để test
  const UPDATE_KEY = 'tt_update_v5_seen'; 

  function showUpdateNotice() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* ANIMATIONS */
      @keyframes wn-modal-in { 0% { opacity: 0; transform: scale(0.85) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes wn-item-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes wn-shimmer { 0% { left: -100%; } 100% { left: 100%; } }
      @keyframes wn-pulse-red { 0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); } 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); } }
      @keyframes wn-float { 0% { transform: translateY(0); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0); } }
      @keyframes wn-sparkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      @keyframes wn-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

      /* MODAL OVERLAY */
      .wn-overlay { position: fixed; inset: 0; z-index: 999999; background: rgba(10, 20, 37, 0.75); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 16px; }
      
      /* MODAL BOX */
      .wn-box { background: #ffffff; width: 100%; max-width: 380px; border-radius: 28px; overflow: hidden; position: relative; animation: wn-modal-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; box-shadow: 0 24px 48px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8); display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

      /* HEADER */
      .wn-header { background: linear-gradient(135deg, #005BAA 0%, #0073CC 100%); padding: 24px 20px 20px; text-align: center; color: #fff; position: relative; overflow: hidden; }
      .wn-sparkle { position: absolute; background: #fff; border-radius: 50%; animation: wn-sparkle 2s infinite; }
      .wn-sparkle.s1 { width: 6px; height: 6px; top: 20px; left: 30px; animation-delay: 0s; }
      .wn-sparkle.s2 { width: 4px; height: 4px; top: 40px; right: 40px; animation-delay: 0.5s; }
      .wn-sparkle.s3 { width: 8px; height: 8px; bottom: 20px; left: 60px; animation-delay: 1s; }
      .wn-sparkle.s4 { width: 5px; height: 5px; bottom: 30px; right: 30px; animation-delay: 1.5s; }
      
      .wn-logo { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px); }
      
      /* BADGE */
      .wn-badge { display: inline-block; background: #FFC933; color: #003B71; padding: 4px 14px; border-radius: 20px; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(255, 201, 51, 0.4); text-transform: uppercase; animation: wn-bounce 2s infinite; }
      .wn-title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
      .wn-subtitle { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }

      /* BODY */
      .wn-body { padding: 20px 20px 8px; display: flex; flex-direction: column; gap: 18px; }
      
      /* FEATURE ITEMS */
      .wn-item { display: flex; gap: 14px; align-items: flex-start; opacity: 0; animation: wn-item-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; position: relative; }
      .wn-item:nth-child(1) { animation-delay: 0.15s; }
      .wn-item:nth-child(2) { animation-delay: 0.25s; }
      
      .wn-item-text { flex: 1; padding-top: 2px; }
      .wn-item-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
      .wn-item-desc { font-size: 12.5px; color: #64748b; line-height: 1.5; }

      /* TAGS */
      .tag-pill { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
      .tag-hot { background: #FFE4E6; color: #E11D48; }
      .tag-new { background: #DBEAFE; color: #2563EB; }

      /* 3D CSS ICONS */
      .icon-box { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; box-shadow: 0 6px 12px rgba(0,0,0,0.06); animation: wn-float 4s ease-in-out infinite; }
      .wn-item:nth-child(2) .icon-box { animation-delay: 1s; }

      /* Icon Hóa Đơn */
      .icon-bg-receipt { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }
      .css-receipt { width: 20px; height: 24px; background: #fff; border-radius: 4px; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; padding-top: 5px; gap: 3px; }
      .css-receipt::after { content: ''; position: absolute; bottom: -3px; left: 0; width: 100%; height: 5px; background: inherit; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 75% 50%, 50% 100%, 25% 50%, 0% 100%); }
      .css-receipt-line { width: 12px; height: 2px; background: #D97706; border-radius: 2px; }
      .css-receipt-line:nth-child(2) { width: 8px; }
      .css-receipt-coin { position: absolute; top: -4px; right: -6px; background: #F59E0B; color: #fff; font-size: 8px; font-weight: 900; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

      /* Icon Lịch */
      .icon-bg-calendar { background: linear-gradient(135deg, #DBEAFE, #BFDBFE); }
      .css-calendar { width: 22px; height: 22px; background: #fff; border-radius: 5px; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 3px; display: flex; align-items: center; justify-content: center; }
      .css-calendar-top { position: absolute; top: 0; left: 0; width: 100%; height: 7px; background: #2563EB; border-radius: 5px 5px 0 0; }
      .css-calendar-rings { position: absolute; top: -2px; left: 5px; width: 2px; height: 4px; background: #94a3b8; border-radius: 1px; box-shadow: 10px 0 0 #94a3b8; }
      .css-calendar-heart { font-size: 8px; color: #F43F5E; margin-top: 6px; line-height: 1; }

      /* WARNING BOX */
      .wn-warning { background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px; margin-top: 4px; opacity: 0; animation: wn-item-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards; position: relative; overflow: hidden; }
      .wn-warning-header { display: flex; align-items: center; gap: 10px; }
      .wn-warning-icon { background: #E11D48; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; animation: wn-pulse-red 2s infinite; }
      .wn-warning-icon::before { content: '!'; color: #fff; font-size: 16px; font-weight: 900; font-family: sans-serif; }
      .wn-warning-title { font-size: 13px; font-weight: 800; color: #E11D48; }
      .wn-warning-text { font-size: 12.5px; color: #881337; line-height: 1.5; font-weight: 500; }
      .wn-warning-text b { color: #E11D48; font-weight: 800; }
      
      /* MINI P/R BUTTONS */
      .mini-pr { display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; padding: 1px 6px; border-radius: 6px; margin: 0 2px; border: 1px dashed; }
      .mini-p { background: #DBEAFE; color: #1E3A8A; border-color: #3B82F6; }
      .mini-r { background: #FEE2E2; color: #991B1B; border-color: #EF4444; }

      /* FOOTER */
      .wn-footer { padding: 16px 20px 24px; }
      .wn-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #005BAA, #003B71); color: #fff; border: none; border-radius: 99px; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 20px rgba(0,91,170,0.3); position: relative; overflow: hidden; transition: transform 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
      .wn-btn:active { transform: scale(0.96); }
      .wn-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: wn-shimmer 2.5s infinite; transform: skewX(-20deg); }
      .wn-btn-arrow { transition: transform 0.2s; }
      .wn-btn:hover .wn-btn-arrow { transform: translateX(4px); }
    `;
    document.head.appendChild(style);

    // Tạo giao diện
    const overlay = document.createElement('div');
    overlay.className = 'wn-overlay';
    overlay.innerHTML = `
      <div class="wn-box">
        
        <div class="wn-header">
          <div class="wn-sparkle s1"></div>
          <div class="wn-sparkle s2"></div>
          <div class="wn-sparkle s3"></div>
          <div class="wn-sparkle s4"></div>
          
          <!-- LOGO APP -->
          <div class="wn-logo">
            <svg width="44" height="44" viewBox="0 0 88 88">
              <rect width="88" height="88" rx="24" fill="#FFC933"/>
              <circle cx="44" cy="44" r="28" fill="#003B71"/>
              <path d="M30 44L39 53L58 32" stroke="#FFC933" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <br>
          <div class="wn-badge">BIG UPDATE</div>
          <div class="wn-title">Tính Năng Đột Phá</div>
          <div class="wn-subtitle">Nâng tầm quản lý thu nhập của bạn</div>
        </div>

        <div class="wn-body">
          
          <div class="wn-item">
            <div class="icon-box icon-bg-receipt">
              <div class="css-receipt">
                <div class="css-receipt-line"></div>
                <div class="css-receipt-line"></div>
                <div class="css-receipt-line"></div>
                <div class="css-receipt-coin">đ</div>
              </div>
            </div>
            <div class="wn-item-text">
              <div class="wn-item-title">Phiếu Lương <span class="tag-pill tag-hot">HOT</span></div>
              <div class="wn-item-desc">Xem chi tiết từng đồng lương, tăng ca, phụ cấp. Hỗ trợ xuất ảnh PNG sắc nét hoặc in trực tiếp.</div>
            </div>
          </div>

          <div class="wn-item">
            <div class="icon-box icon-bg-calendar">
              <div class="css-calendar">
                <div class="css-calendar-top"></div>
                <div class="css-calendar-rings"></div>
                <div class="css-calendar-heart">♥</div>
              </div>
            </div>
            <div class="wn-item-text">
              <div class="wn-item-title">Quản Lý Ngày Nghỉ <span class="tag-pill tag-new">NEW</span></div>
              <div class="wn-item-desc">Chủ động khai báo nghỉ Phép năm (P) hoặc Việc riêng (R) tại Menu để App tính lương chuẩn xác.</div>
            </div>
          </div>

          <div class="wn-warning">
            <div class="wn-warning-header">
              <div class="wn-warning-icon"></div>
              <div class="wn-warning-title">LƯU Ý QUAN TRỌNG</div>
            </div>
            <div class="wn-warning-text">
              Khi nghỉ làm, bạn <b>tuyệt đối phải chọn</b> <span class="mini-pr mini-p">P</span> hoặc <span class="mini-pr mini-r">R</span>. Nếu bỏ qua, hệ thống sẽ tự động trừ lương và mất thưởng chuyên cần!
            </div>
          </div>

        </div>

        <div class="wn-footer">
          <button id="wn-btn-finish" class="wn-btn">
            Đã Hiểu, Trải Nghiệm Ngay
            <span class="wn-btn-arrow">→</span>
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Xử lý sự kiện
    document.getElementById('wn-btn-finish').addEventListener('click', () => {
      localStorage.setItem(UPDATE_KEY, 'true');
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const hasOldData = localStorage.getItem('timesheet_worklogs') || localStorage.getItem('tt_profiles');
      const hasSeenUpdate = localStorage.getItem(UPDATE_KEY);

      if (hasOldData && !hasSeenUpdate) {
        showUpdateNotice();
      }
    }, 1500);
  });
})();