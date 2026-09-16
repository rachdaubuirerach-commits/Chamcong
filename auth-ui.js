/* ═══════════════════════════════════════════════════════════════
   auth-ui.js — UI Logic cho màn hình Đăng nhập/Đăng ký
   ═══════════════════════════════════════════════════════════════ */

const AuthUI = (function () {
    'use strict';

    let _currentTab = 'login';
    let _isProcessing = false;

    /* ═══════════════ HELPERS ═══════════════ */

    function $(id) { return document.getElementById(id); }

    function showLoading(text = 'Đang xử lý...') {
        const el = $('auth-loading');
        if (el) {
            el.querySelector('.auth-loading-text').textContent = text;
            el.classList.remove('hidden');
        }
        _isProcessing = true;
    }

    function hideLoading() {
        const el = $('auth-loading');
        if (el) el.classList.add('hidden');
        _isProcessing = false;
    }

    function setBtnLoading(btnId, isLoading) {
        const btn = $(btnId);
        if (!btn) return;
        const text = btn.querySelector('.auth-btn-text');
        const spinner = btn.querySelector('.auth-btn-spinner');
        if (isLoading) {
            btn.disabled = true;
            if (text) text.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            if (text) text.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    }

    function showError(message) {
        // Dùng toast nếu có
        if (window.showToast) {
            window.showToast(message, 'danger');
        } else {
            alert(message);
        }
    }

    function showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    /* ═══════════════ TAB SWITCHING ═══════════════ */

    function switchTab(tab) {
        _currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.authTab === tab);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        if (tab === 'login') {
            $('login-form').classList.add('active');
        } else if (tab === 'register') {
            $('register-form').classList.add('active');
        } else if (tab === 'forgot') {
            $('forgot-form').classList.add('active');
        }

        // Clear errors
        document.querySelectorAll('.auth-input').forEach(inp => {
            inp.classList.remove('error');
        });
    }

    /* ═══════════════ PASSWORD TOGGLE ═══════════════ */

    function togglePassword(inputId, btn) {
        const input = $(inputId);
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        // Đổi icon
        const svg = btn.querySelector('svg');
        if (svg) {
            if (isPassword) {
                // Đang hiện → đổi sang icon "ẩn"
                svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            } else {
                // Đang ẩn → đổi sang icon "hiện"
                svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            }
        }
    }

    /* ═══════════════ PASSWORD STRENGTH ═══════════════ */

    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Cap at 4
        score = Math.min(score, 4);

        const levels = [
            { text: 'Nhập mật khẩu', color: '' },
            { text: 'Yếu', color: '#EF4444' },
            { text: 'Trung bình', color: '#F59E0B' },
            { text: 'Tốt', color: '#10B981' },
            { text: 'Rất mạnh', color: '#059669' }
        ];

        return { score, ...levels[score] };
    }

    function updatePasswordStrength() {
        const password = $('register-password').value;
        const fill = $('strength-fill');
        const text = $('strength-text');
        if (!fill || !text) return;

        const { score, text: textVal, color } = checkPasswordStrength(password);
        const percent = (score / 4) * 100;

        fill.style.width = percent + '%';
        fill.style.background = color;
        text.textContent = textVal;
        text.style.color = color;
    }

    /* ═══════════════ LOGIN ═══════════════ */

    async function handleLogin(event) {
        event.preventDefault();
        if (_isProcessing) return;

        const username = $('login-username').value.trim();
        const password = $('login-password').value;

        if (!username || !password) {
            showError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setBtnLoading('login-submit-btn', true);
        showLoading('Đang đăng nhập...');

        try {
            await window.Auth.login(username, password);
            // onAuthStateChanged sẽ tự xử lý chuyển màn hình
            showSuccess('Đăng nhập thành công!');
        } catch (err) {
            showError(err.message);
            setBtnLoading('login-submit-btn', false);
        } finally {
            hideLoading();
        }
    }

    /* ═══════════════ REGISTER ═══════════════ */

    async function handleRegister(event) {
        event.preventDefault();
        if (_isProcessing) return;

        const username = $('register-username').value.trim();
        const password = $('register-password').value;
        const confirmPassword = $('register-password-confirm').value;
        const email = $('register-email').value.trim();

        // Validate
        if (!username || !password || !confirmPassword) {
            showError('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }

        if (password !== confirmPassword) {
            showError('Mật khẩu nhập lại không khớp');
            $('register-password-confirm').classList.add('error');
            return;
        }

        if (!window.Auth.isValidUsername(username)) {
            showError('Tên đăng nhập phải 3-20 ký tự, chỉ chữ, số, dấu gạch dưới');
            $('register-username').classList.add('error');
            return;
        }

        if (!window.Auth.isValidPassword(password)) {
            showError('Mật khẩu phải có ít nhất 6 ký tự');
            $('register-password').classList.add('error');
            return;
        }

        // Nếu có nhập email → xác nhận
        if (email) {
            const confirmed = confirm(
                `📧 Bạn đã nhập email khôi phục: ${email}\n\n` +
                `Nếu quên mật khẩu, hệ thống sẽ gửi link reset đến email này.\n\n` +
                `Xác nhận email đúng?`
            );
            if (!confirmed) return;
        } else {
            const confirmed = confirm(
                `⚠️ Bạn KHÔNG nhập email khôi phục.\n\n` +
                `Nếu quên mật khẩu → KHÔNG THỂ tự khôi phục.\n\n` +
                `Vẫn tiếp tục đăng ký?`
            );
            if (!confirmed) return;
        }

        setBtnLoading('register-submit-btn', true);
        showLoading('Đang tạo tài khoản...');

        try {
            await window.Auth.register(username, password, email);
            showSuccess('Tạo tài khoản thành công!');
            // onAuthStateChanged sẽ tự chuyển màn hình
        } catch (err) {
            showError(err.message);
            setBtnLoading('register-submit-btn', false);
        } finally {
            hideLoading();
        }
    }

    /* ═══════════════ FORGOT PASSWORD ═══════════════ */

    function showForgotPassword() {
        switchTab('forgot');
        // Pre-fill username nếu đã nhập
        const loginUsername = $('login-username').value.trim();
        if (loginUsername) {
            $('forgot-email').value = loginUsername;
        }
    }

    async function handleForgotPassword(event) {
        event.preventDefault();
        if (_isProcessing) return;

        const email = $('forgot-email').value.trim();
        if (!email) {
            showError('Vui lòng nhập email');
            return;
        }

        setBtnLoading('forgot-submit-btn', true);
        showLoading('Đang gửi email...');

        try {
            await window.Auth.sendPasswordReset(email);
            showSuccess(
                '✅ Đã gửi email khôi phục!\n\n' +
                'Kiểm tra hộp thư của bạn (kể cả thư rác) và làm theo hướng dẫn.'
            );
            setTimeout(() => switchTab('login'), 2000);
        } catch (err) {
            showError(err.message);
        } finally {
            setBtnLoading('forgot-submit-btn', false);
            hideLoading();
        }
    }

    /* ═══════════════ LOGOUT ═══════════════ */

    async function logout() {
        const confirmed = confirm(
            'Đăng xuất khỏi tài khoản?\n\n' +
            'Dữ liệu đã được lưu trên cloud. Bạn có thể đăng nhập lại bất cứ lúc nào.'
        );
        if (!confirmed) return;

        try {
            showLoading('Đang đăng xuất...');
            // Sync lần cuối trước khi logout
            if (window.FirebaseSync) {
                try { await window.FirebaseSync.uploadToCloud(); } catch(e) {}
            }
            await window.Auth.logout();
            showSuccess('Đã đăng xuất');
        } catch (err) {
            showError('Lỗi đăng xuất: ' + err.message);
        } finally {
            hideLoading();
        }
    }

    /* ═══════════════ ADD RECOVERY EMAIL ═══════════════ */

    async function showAddEmail() {
        const email = prompt(
            '📧 Nhập email khôi phục:\n\n' +
            'Email này dùng để reset mật khẩu nếu bạn quên.\n' +
            'VD: email@gmail.com'
        );
        if (!email || !email.trim()) return;

        try {
            showLoading('Đang thêm email...');
            await window.Auth.updateRecoveryEmail(email.trim());
            showSuccess('✅ Đã thêm email khôi phục!');
            updateRecoveryEmailStatus();
        } catch (err) {
            showError(err.message);
        } finally {
            hideLoading();
        }
    }

    function updateRecoveryEmailStatus() {
        const profile = window.Auth.getCurrentProfile();
        const status = $('recovery-email-status');
        if (!status) return;

        if (profile && profile.hasRealEmail && profile.email) {
            status.innerHTML = `<span class="status-badge status-ok">✓ ${profile.email}</span>`;
        } else {
            status.innerHTML = `<span class="status-badge status-none">Chưa có</span>`;
        }
    }

    /* ═══════════════ HANDLE AUTH STATE CHANGE ═══════════════ */

    function handleAuthStateChange(user, profile) {
        const authScreen = $('auth-screen');
        const appContent = $('app-content');

        if (user && profile) {
            // Đã đăng nhập
            authScreen.classList.add('hidden');
            appContent.classList.remove('hidden');

            // Cập nhật UI
            if (window.updateUserInfo) {
                window.updateUserInfo(profile);
            }
            updateRecoveryEmailStatus();

            // Init sync
            if (window.FirebaseSync) {
                window.FirebaseSync.init();
                window.FirebaseSync.startAutoSync();
            }

            // Init app (script.js)
            if (window.initApp) {
                window.initApp();
            }

        } else {
            // Chưa đăng nhập
            authScreen.classList.remove('hidden');
            appContent.classList.add('hidden');

            // Dừng sync
            if (window.FirebaseSync) {
                window.FirebaseSync.stopAutoSync();
            }

            // Reset form
            setTimeout(() => {
                const loginForm = $('login-form');
                if (loginForm) loginForm.reset();
                const registerForm = $('register-form');
                if (registerForm) registerForm.reset();
            }, 300);
        }
    }

    /* ═══════════════ INIT ═══════════════ */

    function init() {
        // Password strength listener
        const registerPassword = $('register-password');
        if (registerPassword) {
            registerPassword.addEventListener('input', updatePasswordStrength);
        }

        // Enter key trên login form
        const loginForm = $('login-form');
        if (loginForm) {
            loginForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !_isProcessing) {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            });
        }

        // Clear error khi nhập lại
        document.querySelectorAll('.auth-input').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('error');
            });
        });

        // Đăng ký listener cho auth state
        if (window.Auth) {
            window.Auth.onAuthChange(handleAuthStateChange);
        }

        console.log('✅ Auth UI initialized');
    }

    /* ═══════════════ PUBLIC API ═══════════════ */

    return {
        init,
        switchTab,
        togglePassword,
        handleLogin,
        handleRegister,
        handleForgotPassword,
        showForgotPassword,
        showAddEmail,
        logout,
        updateRecoveryEmailStatus
    };
})();

if (typeof window !== 'undefined') window.AuthUI = AuthUI;