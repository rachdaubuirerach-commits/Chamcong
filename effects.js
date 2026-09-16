/* ═══════════════════════════════════════════════════════════════
   effects.js — Micro-interactions cho TimeTracker
   Ripple, confetti, count-up, checkmark, shake...
   ═══════════════════════════════════════════════════════════════ */

const Effects = (function () {
    'use strict';

    let _rippleStyleInjected = false;

    function ensureRippleStyle() {
        if (_rippleStyleInjected) return;
        const style = document.createElement('style');
        style.textContent = `
            .ripple-effect {
                position: absolute;
                border-radius: 50%;
                pointer-events: none;
                z-index: 100;
                transform: scale(0);
                animation: rippleExpand 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%);
            }
            @keyframes rippleExpand {
                to { transform: scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        _rippleStyleInjected = true;
    }

    function createRipple(el, e) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        ensureRippleStyle();
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0) - rect.top;
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (x - size / 2) + 'px';
        ripple.style.top = (y - size / 2) + 'px';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
    }

    /**
     * Gắn ripple cho tất cả elements tương tác
     */
    function attachRippleAll() {
        const selectors = [
            '.btn', '.icon-btn', '.nav-item', '.fab',
            '.pin-pad button', '.theme-swatch', '.profile-item',
            '.cal-cell', '.lunar-cell-view', '.stat-card', '.ach-item'
        ];
        const nodes = document.querySelectorAll(selectors.join(','));
        nodes.forEach(el => {
            if (el.dataset.rippleAttached) return;
            el.dataset.rippleAttached = '1';
            el.addEventListener('pointerdown', e => createRipple(el, e), { passive: true });
        });
    }

    /**
     * Count-up số liệu từ 0 → value
     */
    function countUp(el, endValue, duration, formatter) {
        if (!el) return;
        if (typeof endValue !== 'number' || isNaN(endValue)) return;
        duration = duration || 800;
        formatter = formatter || (v => Math.round(v).toLocaleString('vi-VN'));

        const startTime = performance.now();
        const start = 0;

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (endValue - start) * eased;
            el.innerText = formatter(current);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        pulse(el);
    }

    /**
     * Pulse element khi có update
     */
    function pulse(el) {
        if (!el) return;
        el.classList.remove('updated');
        void el.offsetWidth;
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 500);
    }

    /**
     * Shake element khi lỗi
     */
    function shake(el) {
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }

    /**
     * Confetti mini (15 mảnh) khi chấm công
     */
    function miniConfetti(x, y) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const colors = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#FBBF24'];
        for (let i = 0; i < 15; i++) {
            const p = document.createElement('div');
            p.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                will-change: transform, opacity;
            `;
            document.body.appendChild(p);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 100 + Math.random() * 200;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - 100;
            const startTime = performance.now();
            const duration = 800 + Math.random() * 400;

            function animate(now) {
                const t = (now - startTime) / duration;
                if (t >= 1) { p.remove(); return; }
                const px = vx * t;
                const py = vy * t + 400 * t * t;
                p.style.transform = `translate(${px}px, ${py}px) scale(${1 - t})`;
                p.style.opacity = 1 - t;
                requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        }
    }

    /**
     * Checkmark to ở giữa màn hình khi chấm công thành công
     */
    function showCheckmark() {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const container = document.createElement('div');
        container.className = 'checkmark-container';
        container.innerHTML = `
            <div class="checkmark-circle">
                <svg viewBox="0 0 52 52" fill="none">
                    <path d="M14 27 L22 35 L38 19" stroke="white" stroke-width="5" 
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
        document.body.appendChild(container);
        setTimeout(() => {
            const circle = container.querySelector('.checkmark-circle');
            if (circle) circle.classList.add('fade-out');
            setTimeout(() => container.remove(), 400);
        }, 900);
    }

    /**
     * Theme transition mượt
     */
    function smoothThemeChange(fn) {
        document.documentElement.classList.add('theme-changing');
        try { fn(); } catch (e) { console.error(e); }
        setTimeout(() => {
            document.documentElement.classList.remove('theme-changing');
        }, 500);
    }

    /**
     * Haptic feedback nhẹ khi bấm
     */
    function pressFeedback() {
        if (navigator.vibrate) {
            try { navigator.vibrate(10); } catch (e) {}
        }
    }

    /**
     * Auto-apply effects
     */
    function autoAttach() {
        attachRippleAll();
        document.querySelectorAll('.btn, .fab, .icon-btn, .nav-item').forEach(el => {
            if (el.dataset.hapticAttached) return;
            el.dataset.hapticAttached = '1';
            el.addEventListener('click', pressFeedback);
        });
    }

    return {
        attachRippleAll,
        autoAttach,
        countUp,
        pulse,
        shake,
        miniConfetti,
        showCheckmark,
        smoothThemeChange,
        pressFeedback
    };
})();

if (typeof window !== 'undefined') window.Effects = Effects;