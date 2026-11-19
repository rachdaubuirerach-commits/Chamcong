'use strict';

/**
 * theme-20-11.js — Chỉ đổi lời chào thành "Chúc mừng Ngày Nhà giáo VN"
 */

(function () {
  function changeGreeting() {
    const heroLabel = document.querySelector('.hero-header .greeting-label');
    if (!heroLabel) return;
    if (heroLabel.dataset.retro20Changed) return;
    heroLabel.dataset.retro20Changed = '1';

    // Đổi text
    heroLabel.textContent = '🌸 Chúc mừng Ngày Nhà giáo Việt Nam 🌸';

    // Style: chữ viết tay vàng nổi bật
    heroLabel.style.cssText = `
      font-family: 'Caveat', cursive !important;
      font-size: 17px !important;
      color: #FFC933 !important;
      font-weight: 700 !important;
      text-shadow: 0 1px 3px rgba(0,0,0,0.35) !important;
      letter-spacing: 0.4px !important;
    `;
  }

  function decorate() {
    changeGreeting();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(decorate, 700));
  } else {
    setTimeout(decorate, 700);
  }
  window.addEventListener('load', () => setTimeout(decorate, 1100));

  // Wrap switchPage để đổi lại mỗi khi về Home (vì Home có thể bị vẽ lại)
  let tries = 0;
  const interval = setInterval(() => {
    if (typeof window.switchPage === 'function' && !window.switchPage._retro20Wrapped) {
      const orig = window.switchPage;
      window.switchPage = function (p) {
        const r = orig.apply(this, arguments);
        if (p === 'home') setTimeout(decorate, 300);
        return r;
      };
      window.switchPage._retro20Wrapped = true;
      clearInterval(interval);
    }
    if (++tries > 40) clearInterval(interval);
  }, 200);
})();