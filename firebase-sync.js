/* ═══════════════════════════════════════════════════════════════
   firebase-sync.js — Đồng bộ dữ liệu lên/xuống Firebase
   ═══════════════════════════════════════════════════════════════ */

const FirebaseSync = (function () {
    'use strict';

    let _db = null;
    let _syncTimer = null;
    let _isSyncing = false;
    let _lastSyncTime = 0;
    let _pendingSync = false;
    let _syncCallbacks = [];

    const SYNC_DEBOUNCE = 2000;       // Chờ 2s sau thao tác cuối mới sync
    const SYNC_INTERVAL = 5 * 60 * 1000; // Sync định kỳ 5 phút
    const SYNC_KEY = 'tt_last_sync';

    /* ═══════════════ HELPERS ═══════════════ */

    function log(...args) {
        if (window.FIREBASE_DEBUG) console.log('[SYNC]', ...args);
    }

    function err(...args) {
        console.error('[SYNC]', ...args);
    }

    function getUid() {
        return window.Auth ? window.Auth.getUid() : null;
    }

    /**
     * Lấy tất cả data cần sync
     */
    function getLocalData() {
        const profile = window.Auth ? window.Auth.getCurrentProfile() : null;
        if (!profile) return null;

        // Đọc từ localStorage (theo cách của script.js)
        // Lưu ý: script.js có cơ chế storageKey theo profile
        // Nhưng khi dùng Firebase, chúng ta dùng 1 key duy nhất per user

        const key = `firebase_data_${profile.username}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try { return JSON.parse(stored); } catch(e) { return null; }
        }
        return null;
    }

    /**
     * Lưu data vào localStorage (cache local)
     */
    function saveLocalData(data) {
        const profile = window.Auth ? window.Auth.getCurrentProfile() : null;
        if (!profile) return;

        const key = `firebase_data_${profile.username}`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * Chuyển data thành dạng Firestore-friendly
     * (Firestore không hỗ trợ undefined, Date → Timestamp)
     */
    function sanitizeData(data) {
        if (data === null || data === undefined) return null;
        if (Array.isArray(data)) return data.map(sanitizeData);
        if (typeof data === 'object') {
            const clean = {};
            Object.keys(data).forEach(k => {
                const v = data[k];
                if (v !== undefined) {
                    clean[k] = sanitizeData(v);
                }
            });
            return clean;
        }
        return data;
    }

    /* ═══════════════ INIT ═══════════════ */

    function init() {
        if (!window.firebase) {
            err('Firebase SDK chưa load');
            return;
        }
        _db = firebase.firestore();
        log('Firestore initialized');

        // Bật offline persistence
        _db.enablePersistence({ synchronizeTabs: true })
            .then(() => log('Offline persistence enabled'))
            .catch((e) => {
                if (e.code === 'failed-precondition') {
                    log('Persistence failed: multiple tabs');
                } else if (e.code === 'unimplemented') {
                    log('Persistence not supported');
                }
            });

        // Lắng nghe auth change → start sync
        if (window.Auth) {
            window.Auth.onAuthChange((user, profile) => {
                if (user && profile) {
                    log('User logged in, starting auto-sync');
                    startAutoSync();
                } else {
                    log('User logged out, stopping sync');
                    stopAutoSync();
                }
            });
        }
    }

    /* ═══════════════ UPLOAD (Local → Cloud) ═══════════════ */

    /**
     * Upload data lên Firebase
     * @param {object} data - Data cần upload (nếu không truyền → lấy từ localStorage)
     */
    async function uploadToCloud(data) {
        const uid = getUid();
        if (!uid) {
            log('Upload skipped: not logged in');
            return false;
        }

        if (!data) {
            data = getLocalData();
        }
        if (!data) {
            log('Upload skipped: no data');
            return false;
        }

        try {
            _isSyncing = true;
            notifySyncState('uploading');

            const sanitized = sanitizeData(data);
            sanitized.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
            sanitized._version = Date.now();

            await _db.collection('users').doc(uid)
                .collection('data').doc('main')
                .set(sanitized, { merge: false });

            _lastSyncTime = Date.now();
            localStorage.setItem(SYNC_KEY, _lastSyncTime.toString());

            log('Upload success');
            notifySyncState('success');
            return true;

        } catch (error) {
            err('Upload failed:', error);
            notifySyncState('error', error);
            return false;
        } finally {
            _isSyncing = false;
        }
    }

    /* ═══════════════ DOWNLOAD (Cloud → Local) ═══════════════ */

    /**
     * Download data từ Firebase về
     */
    async function downloadFromCloud() {
        const uid = getUid();
        if (!uid) {
            log('Download skipped: not logged in');
            return null;
        }

        try {
            _isSyncing = true;
            notifySyncState('downloading');

            const doc = await _db.collection('users').doc(uid)
                .collection('data').doc('main')
                .get();

            if (doc.exists) {
                const data = doc.data();
                log('Download success');
                notifySyncState('success');
                return data;
            } else {
                log('No cloud data found');
                notifySyncState('empty');
                return null;
            }

        } catch (error) {
            err('Download failed:', error);
            notifySyncState('error', error);
            return null;

        } finally {
            _isSyncing = false;
        }
    }

    /* ═══════════════ SMART SYNC ═══════════════ */

    /**
     * Smart sync: So sánh local và cloud → Chọn cái mới hơn
     */
    async function smartSync() {
        const uid = getUid();
        if (!uid) return false;

        try {
            notifySyncState('checking');

            // Lấy cloud
            const cloudData = await downloadFromCloud();

            // Lấy local
            const localData = getLocalData();

            // Trường hợp 1: Không có gì cả
            if (!cloudData && !localData) {
                log('Nothing to sync');
                notifySyncState('empty');
                return false;
            }

            // Trường hợp 2: Chỉ có cloud → Tải về local
            if (cloudData && !localData) {
                log('Cloud only → Download to local');
                saveLocalData(cloudData);
                notifySyncState('downloaded');
                return { action: 'download', data: cloudData };
            }

            // Trường hợp 3: Chỉ có local → Upload lên cloud
            if (!cloudData && localData) {
                log('Local only → Upload to cloud');
                await uploadToCloud(localData);
                return { action: 'upload', data: localData };
            }

            // Trường hợp 4: Cả 2 đều có → So sánh timestamp
            const cloudVersion = cloudData._version || 0;
            const localVersion = localData._version || 0;

            if (cloudVersion > localVersion) {
                log('Cloud newer → Download');
                saveLocalData(cloudData);
                notifySyncState('downloaded');
                return { action: 'download', data: cloudData };
            } else if (localVersion > cloudVersion) {
                log('Local newer → Upload');
                await uploadToCloud(localData);
                return { action: 'upload', data: localData };
            } else {
                log('Both same version');
                notifySyncState('synced');
                return { action: 'none', data: localData };
            }

        } catch (error) {
            err('Smart sync failed:', error);
            notifySyncState('error', error);
            return false;
        }
    }

    /* ═══════════════ AUTO SYNC ═══════════════ */

    /**
     * Bắt đầu auto sync
     */
    function startAutoSync() {
        // Sync lần đầu ngay
        setTimeout(() => {
            smartSync().then(result => {
                if (result && result.action === 'download') {
                    log('Data downloaded, triggering reload');
                    if (window.onDataSynced) window.onDataSynced(result.data);
                }
            });
        }, 1000);

        // Sync định kỳ
        stopAutoSync();
        _syncTimer = setInterval(() => {
            smartSync().then(result => {
                if (result && result.action === 'download') {
                    if (window.onDataSynced) window.onDataSynced(result.data);
                }
            });
        }, SYNC_INTERVAL);

        log('Auto-sync started');
    }

    function stopAutoSync() {
        if (_syncTimer) {
            clearInterval(_syncTimer);
            _syncTimer = null;
            log('Auto-sync stopped');
        }
    }

    /* ═══════════════ DEBOUNCED SYNC ═══════════════ */

    /**
     * Gọi khi có thay đổi data → Sync sau 2s
     */
    function queueSync() {
        if (_isSyncing) {
            _pendingSync = true;
            return;
        }

        if (_syncTimer) clearTimeout(_syncTimer);

        _syncTimer = setTimeout(async () => {
            if (_isSyncing) {
                _pendingSync = true;
                return;
            }
            await uploadToCloud();
            _pendingSync = false;

            if (_pendingSync) {
                queueSync(); // Sync lại nếu có thay đổi trong lúc sync
            }
        }, SYNC_DEBOUNCE);

        log('Sync queued');
    }

    /* ═══════════════ STATE NOTIFICATION ═══════════════ */

    function notifySyncState(state, error) {
        _syncCallbacks.forEach(cb => {
            try { cb(state, error); } catch(e) { err(e); }
        });
    }

    function onSyncState(callback) {
        _syncCallbacks.push(callback);
    }

    /* ═══════════════ PUBLIC API ═══════════════ */

    return {
        init,
        uploadToCloud,
        downloadFromCloud,
        smartSync,
        queueSync,
        startAutoSync,
        stopAutoSync,
        onSyncState,

        // Getter
        getLastSyncTime: () => _lastSyncTime,
        isSyncing: () => _isSyncing,

        // Utils
        getLocalData,
        saveLocalData
    };
})();

if (typeof window !== 'undefined') window.FirebaseSync = FirebaseSync;