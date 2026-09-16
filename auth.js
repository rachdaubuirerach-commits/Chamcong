/* ═══════════════════════════════════════════════════════════════
   auth.js — Đăng nhập / Đăng ký / Đăng xuất
   ═══════════════════════════════════════════════════════════════ */

const Auth = (function () {
    'use strict';

    let _firebaseAuth = null;
    let _currentUser = null;
    let _currentProfile = null; // { username, email, hasRealEmail }
    let _authReady = false;
    const _authCallbacks = [];

    /* ═══════════════ HELPERS ═══════════════ */

    function log(...args) {
        if (window.FIREBASE_DEBUG) console.log('[AUTH]', ...args);
    }

    function err(...args) {
        console.error('[AUTH]', ...args);
    }

    /**
     * Chuyển username thành "email giả" để Firebase chấp nhận
     */
    function usernameToFakeEmail(username) {
        return `${username.toLowerCase()}@${window.FAKE_EMAIL_DOMAIN}`;
    }

    /**
     * Kiểm tra username hợp lệ
     */
    function isValidUsername(username) {
        if (!username) return false;
        // 3-20 ký tự, chỉ chữ, số, gạch dưới
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    }

    /**
     * Kiểm tra password hợp lệ
     */
    function isValidPassword(password) {
        return password && password.length >= 6;
    }

    /**
     * Dịch lỗi Firebase sang tiếng Việt
     */
    function translateError(code) {
        const map = {
            'auth/email-already-in-use': 'Tên đăng nhập này đã được sử dụng',
            'auth/invalid-email': 'Tên đăng nhập không hợp lệ',
            'auth/weak-password': 'Mật khẩu quá yếu (cần ít nhất 6 ký tự)',
            'auth/user-not-found': 'Không tìm thấy tài khoản',
            'auth/wrong-password': 'Sai tên đăng nhập hoặc mật khẩu',
            'auth/invalid-credential': 'Sai tên đăng nhập hoặc mật khẩu',
            'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi vài phút',
            'auth/network-request-failed': 'Lỗi kết nối mạng',
            'auth/user-disabled': 'Tài khoản đã bị khóa',
            'auth/invalid-login-credentials': 'Sai tên đăng nhập hoặc mật khẩu'
        };
        return map[code] || 'Có lỗi xảy ra, vui lòng thử lại';
    }

    /* ═══════════════ INIT ═══════════════ */

    /**
     * Khởi tạo Auth — gọi khi app load
     */
    function init() {
        if (!window.firebase) {
            err('Firebase SDK chưa load!');
            return Promise.reject(new Error('Firebase SDK chưa load'));
        }

        _firebaseAuth = firebase.auth();
        log('Auth initialized');

        return new Promise((resolve) => {
            _firebaseAuth.onAuthStateChanged(async (user) => {
                _authReady = true;
                if (user) {
                    _currentUser = user;
                    // Load profile từ Firestore
                    try {
                        _currentProfile = await loadUserProfile(user.uid);
                        log('User logged in:', _currentProfile?.username);
                    } catch (e) {
                        err('Cannot load profile:', e);
                        _currentProfile = null;
                    }
                } else {
                    _currentUser = null;
                    _currentProfile = null;
                    log('User logged out');
                }

                // Gọi tất cả callbacks đã đăng ký
                _authCallbacks.forEach(cb => {
                    try { cb(_currentUser, _currentProfile); } catch(e) { err(e); }
                });

                resolve(_currentUser);
            });
        });
    }

    /**
     * Đăng ký lắng nghe thay đổi auth state
     */
    function onAuthChange(callback) {
        _authCallbacks.push(callback);
        // Nếu đã ready → gọi ngay
        if (_authReady) {
            setTimeout(() => callback(_currentUser, _currentProfile), 0);
        }
    }

    /* ═══════════════ FIRESTORE HELPERS ═══════════════ */

    /**
     * Load profile user từ Firestore
     */
    async function loadUserProfile(uid) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (e) {
            err('loadUserProfile error:', e);
            throw e;
        }
    }

    /**
     * Lưu profile user vào Firestore
     */
    async function saveUserProfile(uid, profile) {
        const db = firebase.firestore();
        await db.collection('users').doc(uid).set(profile, { merge: true });
    }

    /**
     * Kiểm tra username đã tồn tại chưa
     */
    async function checkUsernameExists(username) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('usernames').doc(username.toLowerCase()).get();
            return doc.exists;
        } catch (e) {
            err('checkUsernameExists error:', e);
            return false;
        }
    }

    /**
     * Đăng ký username mapping (username → uid)
     */
    async function registerUsername(username, uid, email) {
        const db = firebase.firestore();
        await db.collection('usernames').doc(username.toLowerCase()).set({
            uid,
            username: username.toLowerCase(),
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Lấy email từ username
     */
    async function getEmailByUsername(username) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('usernames').doc(username.toLowerCase()).get();
            if (doc.exists) {
                return doc.data().email;
            }
            return null;
        } catch (e) {
            err('getEmailByUsername error:', e);
            return null;
        }
    }

    /* ═══════════════ REGISTER ═══════════════ */

    /**
     * Đăng ký tài khoản mới
     * @param {string} username - Tên đăng nhập
     * @param {string} password - Mật khẩu
     * @param {string} realEmail - Email thật (tùy chọn)
     */
    async function register(username, password, realEmail = '') {
        // Validate
        if (!isValidUsername(username)) {
            throw new Error('Tên đăng nhập phải 3-20 ký tự, chỉ chữ, số, dấu gạch dưới');
        }
        if (!isValidPassword(password)) {
            throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
        }
        if (realEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(realEmail)) {
            throw new Error('Email không hợp lệ');
        }

        const usernameLower = username.toLowerCase();

        // Check username đã tồn tại chưa
        const exists = await checkUsernameExists(usernameLower);
        if (exists) {
            throw new Error('Tên đăng nhập này đã được sử dụng');
        }

        // Quyết định dùng email gì
        let authEmail;
        let hasRealEmail = false;

        if (realEmail) {
            // User có email thật → dùng email thật
            authEmail = realEmail.toLowerCase();
            hasRealEmail = true;
            log('Register with real email:', authEmail);
        } else {
            // User không có email → dùng email giả
            authEmail = usernameToFakeEmail(usernameLower);
            log('Register with fake email:', authEmail);
        }

        try {
            // Tạo user trên Firebase Auth
            const userCredential = await _firebaseAuth.createUserWithEmailAndPassword(authEmail, password);
            const user = userCredential.user;

            // Lưu profile vào Firestore
            const profile = {
                uid: user.uid,
                username: usernameLower,
                displayName: username,
                email: hasRealEmail ? realEmail.toLowerCase() : null,
                hasRealEmail,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await saveUserProfile(user.uid, profile);
            await registerUsername(usernameLower, user.uid, authEmail);

            log('Register success:', usernameLower);
            return { user, profile };

        } catch (error) {
            err('Register error:', error);
            throw new Error(translateError(error.code));
        }
    }

    /* ═══════════════ LOGIN ═══════════════ */

    /**
     * Đăng nhập
     * @param {string} username - Tên đăng nhập
     * @param {string} password - Mật khẩu
     */
    async function login(username, password) {
        if (!username || !password) {
            throw new Error('Vui lòng nhập đầy đủ thông tin');
        }

        const usernameLower = username.toLowerCase().trim();

        try {
            // Tìm email tương ứng với username
            let authEmail = await getEmailByUsername(usernameLower);

            if (!authEmail) {
                // Không thấy trong Firestore → có thể là user cũ đã đăng ký với email thật
                // Thử với email giả trước
                authEmail = usernameToFakeEmail(usernameLower);
            }

            log('Login attempt with email:', authEmail);

            const userCredential = await _firebaseAuth.signInWithEmailAndPassword(authEmail, password);
            log('Login success:', usernameLower);
            return userCredential.user;

        } catch (error) {
            err('Login error:', error);

            // Nếu lỗi và username này có thể là email thật
            if (username.includes('@')) {
                // User nhập email trực tiếp
                try {
                    const userCredential = await _firebaseAuth.signInWithEmailAndPassword(username, password);
                    return userCredential.user;
                } catch (e2) {
                    throw new Error(translateError(e2.code));
                }
            }

            throw new Error(translateError(error.code));
        }
    }

    /* ═══════════════ LOGOUT ═══════════════ */

    async function logout() {
        try {
            await _firebaseAuth.signOut();
            log('Logout success');
            return true;
        } catch (error) {
            err('Logout error:', error);
            throw error;
        }
    }

    /* ═══════════════ RESET PASSWORD ═══════════════ */

    /**
     * Gửi email reset mật khẩu (chỉ cho user có email thật)
     */
    async function sendPasswordReset(emailOrUsername) {
        let email = emailOrUsername.trim();

        // Nếu không phải email → tìm email thật
        if (!email.includes('@')) {
            const foundEmail = await getEmailByUsername(email.toLowerCase());
            if (!foundEmail) {
                throw new Error('Không tìm thấy tài khoản');
            }
            if (foundEmail.endsWith('@' + window.FAKE_EMAIL_DOMAIN)) {
                throw new Error('Tài khoản này không có email khôi phục. Vui lòng liên hệ admin.');
            }
            email = foundEmail;
        }

        try {
            await _firebaseAuth.sendPasswordResetEmail(email);
            log('Password reset sent to:', email);
            return true;
        } catch (error) {
            err('sendPasswordReset error:', error);
            throw new Error(translateError(error.code));
        }
    }

    /* ═══════════════ UPDATE EMAIL ═══════════════ */

    /**
     * Cập nhật email khôi phục cho user hiện tại
     */
    async function updateRecoveryEmail(newEmail) {
        if (!_currentUser) throw new Error('Chưa đăng nhập');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            throw new Error('Email không hợp lệ');
        }

        try {
            // Cập nhật email trong Firebase Auth
            await _currentUser.updateEmail(newEmail.toLowerCase());

            // Cập nhật profile
            await saveUserProfile(_currentUser.uid, {
                email: newEmail.toLowerCase(),
                hasRealEmail: true
            });

            // Cập nhật username mapping
            const db = firebase.firestore();
            if (_currentProfile) {
                await db.collection('usernames').doc(_currentProfile.username).update({
                    email: newEmail.toLowerCase()
                });
            }

            // Reload profile
            _currentProfile = await loadUserProfile(_currentUser.uid);

            log('Recovery email updated:', newEmail);
            return true;
        } catch (error) {
            err('updateRecoveryEmail error:', error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('Email này đã được sử dụng');
            }
            if (error.code === 'auth/requires-recent-login') {
                throw new Error('Vui lòng đăng xuất và đăng nhập lại để thực hiện');
            }
            throw new Error(translateError(error.code));
        }
    }

    /* ═══════════════ PUBLIC API ═══════════════ */

    return {
        init,
        onAuthChange,
        register,
        login,
        logout,
        sendPasswordReset,
        updateRecoveryEmail,

        // Getters
        getCurrentUser: () => _currentUser,
        getCurrentProfile: () => _currentProfile,
        getUid: () => _currentUser ? _currentUser.uid : null,
        isLoggedIn: () => !!_currentUser,

        // Utils
        isValidUsername,
        isValidPassword,
        usernameToFakeEmail
    };
})();

if (typeof window !== 'undefined') window.Auth = Auth;