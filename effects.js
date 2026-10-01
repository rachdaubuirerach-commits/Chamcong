/* ═══════════════════════════════════════════════════════════════
   effects.js v4.2 — Micro-interactions cho TimeTracker (Monochrome V1)
   Ripple đen/trắng theo mode, confetti grayscale
   ═══════════════════════════════════════════════════════════════ */

const Effects = (function () {
    'use strict';

    let _rippleStyleInjected = false;

    function isDarkMode() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

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
                background: radial-gradient(circle, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 70%);
            }
            [data-theme="dark"] .ripple-effect {
                background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%);
            }
            /* Nút primary/fab nền tối ở light mode → ripple sáng */
            .btn-primary .ripple-effect,
            .fab .ripple-effect {
                background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
            }
            [data-theme="dark"] .btn-primary .ripple-effect,
            [data-theme="dark"] .fab .ripple-effect {
                background: radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 70%);
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

    function attachRippleAll() {
        const selectors = [
            '.btn', '.icon-btn', '.nav-item', '.fab',
            '.pin-pad button', '.profile-item',
            '.cal-cell', '.lunar-cell-view', '.stat-card', '.ach-item'
        ];
        const nodes = document.querySelectorAll(selectors.join(','));
        nodes.forEach(el => {
            if (el.dataset.rippleAttached) return;
            el.dataset.rippleAttached = '1';
            el.addEventListener('pointerdown', e => createRipple(el, e), { passive: true });
        });
    }

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

    function pulse(el) {
        if (!el) return;
        el.classList.remove('updated');
        void el.offsetWidth;
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 500);
    }

    function shake(el) {
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }

    /**
     * Confetti mini — palette monochrome + 1 semantic
     */
    function miniConfetti(x, y) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const colors = ['#000000', '#404040', '#737373', '#A3A3A3', '#D4D4D4', '#16A34A'];
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

    function showCheckmark() {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const container = document.createElement('div');
        container.className = 'checkmark-container';
        // Đổi màu checkmark theo mode: light = đen, dark = trắng
        const bg = isDarkMode()
            ? 'linear-gradient(135deg, #FAFAFA, #E5E5E5)'
            : 'linear-gradient(135deg, #171717, #404040)';
        const fg = isDarkMode() ? '#0A0A0A' : '#FFFFFF';
        const shadow = isDarkMode()
            ? '0 20px 60px rgba(255,255,255,0.20)'
            : '0 20px 60px rgba(0,0,0,0.30)';

        container.innerHTML = `
            <div class="checkmark-circle" style="background:${bg};box-shadow:${shadow};">
                <svg viewBox="0 0 52 52" fill="none">
                    <path d="M14 27 L22 35 L38 19" stroke="${fg}" stroke-width="5" 
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

    function smoothThemeChange(fn) {
        document.documentElement.classList.add('theme-changing');
        try { fn(); } catch (e) { console.error(e); }
        setTimeout(() => {
            document.documentElement.classList.remove('theme-changing');
        }, 500);
    }

    function pressFeedback() {
        if (navigator.vibrate) {
            try { navigator.vibrate(10); } catch (e) {}
        }
    }

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