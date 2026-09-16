/* ═══════════════════════════════════════════════════════════════
   firebase-config.js — Config Firebase cho TimeTracker
   ═══════════════════════════════════════════════════════════════ */

// ⚠️ ĐÂY LÀ CONFIG CỦA BẠN — KHÔNG ĐƯỢC CHIA SẺ CHO NGƯỜI LẠ
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAwmFaCFgj0FJF30umjD2D-TeaqrhHABTQ",
    authDomain: "a7btd-fide7.firebaseapp.com",
    projectId: "a7btd-fide7",
    storageBucket: "a7btd-fide7.firebasestorage.app",
    messagingSenderId: "394761248108",
    appId: "1:394761248108:web:dc94df1c9044180af36749"
};

// ⚠️ DOMAIN cho "email giả" khi user không nhập email
// Ví dụ: user "nguyenvana" → "nguyenvana@u.timetracker.app"
const FAKE_EMAIL_DOMAIN = "u.timetracker.app";

// ⚠️ Bật/tắt debug log
const FIREBASE_DEBUG = true;

// Export ra window
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
    window.FAKE_EMAIL_DOMAIN = FAKE_EMAIL_DOMAIN;
    window.FIREBASE_DEBUG = FIREBASE_DEBUG;

    if (FIREBASE_DEBUG) {
        console.log('🔥 Firebase config loaded');
        console.log('📧 Fake email domain:', FAKE_EMAIL_DOMAIN);
    }
}