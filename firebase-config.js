/* ═══════════════════════════════════════════════════════════════
   firebase-config.js — Config + Khởi tạo Firebase
   ═══════════════════════════════════════════════════════════════ */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAwmFaCFgj0FJF30umjD2D-TeaqrhHABTQ",
    authDomain: "a7btd-fide7.firebaseapp.com",
    projectId: "a7btd-fide7",
    storageBucket: "a7btd-fide7.firebasestorage.app",
    messagingSenderId: "394761248108",
    appId: "1:394761248108:web:dc94df1c9044180af36749"
};

const FAKE_EMAIL_DOMAIN = "u.timetracker.app";
const FIREBASE_DEBUG = true;

// ⭐ QUAN TRỌNG: Khởi tạo Firebase App
if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
            if (FIREBASE_DEBUG) console.log('🔥 Firebase App initialized');
        } else {
            if (FIREBASE_DEBUG) console.log('🔥 Firebase App already exists');
        }
    } catch (err) {
        console.error('❌ Firebase initializeApp failed:', err);
    }
} else {
    console.error('❌ firebase SDK not loaded!');
}

// Export
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
    window.FAKE_EMAIL_DOMAIN = FAKE_EMAIL_DOMAIN;
    window.FIREBASE_DEBUG = FIREBASE_DEBUG;
}