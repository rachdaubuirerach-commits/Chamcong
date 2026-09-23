/* ═══════════════════════════════════════════════════════════════
   ocr-compare.js — Đối chiếu công HR từ ảnh
   - Chỉ dùng tiếng Việt (tải nhanh ~5MB)
   - Ngưỡng: giờ vào/ra ±15p, giờ BT ±0.25h,
     tăng ca ±0.25h (ngày) / ±0.5h (đêm — do phụ cấp khác nhau)
   ═══════════════════════════════════════════════════════════════ */

const OCRCompare = (function () {
    'use strict';

    // ═══ NGƯỠNG SAI SỐ ═══
    const TOLERANCE_MINUTES = 15;          // giờ vào/ra
    const TOLERANCE_HOURS = 0.25;          // giờ BT
    const TOLERANCE_OT_DAY = 0.25;         // tăng ca ca ngày
    const TOLERANCE_OT_NIGHT = 0.5;        // tăng ca ca đêm (phụ cấp khác nhau)

    let worker = null;
    let lastResults = null;

    // ═══ 1. KHỞI TẠO TESSERACT WORKER ═══
    async function initWorker() {
        if (worker) return worker;

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js chưa tải. Kiểm tra kết nối internet.');
        }

        worker = await Tesseract.createWorker('vie', 1, {
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
            corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/',
            langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-data@5.0.0/vie',
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    updateProgress(50 + m.progress * 35, 'Đang đọc ảnh... ' + Math.round(m.progress * 100) + '%');
                } else if (m.status === 'loading language traineddata') {
                    updateProgress(15, 'Đang tải dữ liệu tiếng Việt (~5MB, lần đầu)...');
                } else if (m.status === 'initializing api') {
                    updateProgress(30, 'Đang khởi tạo OCR...');
                } else if (m.status === 'loading tesseract core') {
                    updateProgress(5, 'Đang tải Tesseract core...');
                }
            }
        });

        await worker.setParameters({
            tessedit_pageseg_mode: '6',
            preserve_interword_spaces: '1'
        });

        return worker;
    }

    // ═══ 2. TIỀN XỬ LÝ ẢNH ═══
    function preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = img.width < 1000 ? 2 : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const contrast = 1.6;
                    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        const val = Math.max(0, Math.min(255, factor * (gray - 128) + 128));
                        data[i] = data[i + 1] = data[i + 2] = val;
                    }
                    ctx.putImageData(imageData, 0, 0);
                } catch (e) {
                    console.warn('Preprocess skip:', e);
                }

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Không tạo được ảnh xử lý.'));
                }, 'image/png');
            };
            img.onerror = () => reject(new Error('Không đọc được file ảnh.'));
            img.src = URL.createObjectURL(file);
        });
    }

    // ═══ 3. PARSE TEXT OCR ═══
    function parseOCRText(text) {
        const lines = text.split('\n');
        const rows = [];
        const dateRegex = /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/;
        const timeRegex = /(\d{1,2}):(\d{2})/g;

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            const dateMatch = line.match(dateRegex);
            if (!dateMatch) continue;

            const y = dateMatch[1];
            const mo = String(dateMatch[2]).padStart(2, '0');
            const d = String(dateMatch[3]).padStart(2, '0');
            const date = `${y}-${mo}-${d}`;

            const times = [...line.matchAll(timeRegex)].map(m => m[0]);
            if (times.length < 2) continue;

            let start, end;
            if (times.length >= 4) {
                start = normalizeTime(times[2]);
                end = normalizeTime(times[3]);
            } else {
                start = normalizeTime(times[0]);
                end = normalizeTime(times[1]);
            }

            const afterTimes = extractNumbersAfterLastTime(line);
            let regularHours = 0;
            let overtimeHours = 0;
            if (afterTimes.length >= 2) {
                regularHours = afterTimes[0];
                overtimeHours = afterTimes[1];
            } else if (afterTimes.length === 1) {
                regularHours = afterTimes[0];
            }

            rows.push({ date, start, end, regularHours, overtimeHours, raw: line });
        }
        return rows;
    }

    function normalizeTime(t) {
        if (!t) return t;
        const [h, m] = t.split(':');
        return String(parseInt(h, 10)).padStart(2, '0') + ':' + m;
    }

    function extractNumbersAfterLastTime(line) {
        const timeRegex = /(\d{1,2}):(\d{2})/g;
        let lastIndex = -1;
        let m;
        while ((m = timeRegex.exec(line)) !== null) {
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex === -1) return [];
        const tail = line.slice(lastIndex);
        return [...tail.matchAll(/(\d+(?:[.,]\d+)?)/g)]
            .map(x => parseFloat(x[1].replace(',', '.')));
    }

    // ═══ 4. TÍNH CHÊNH LỆCH ═══
    function timeToMinutes(t) {
        if (!t || t === '—') return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    function timeDiffMinutes(t1, t2) {
        const m1 = timeToMinutes(t1);
        const m2 = timeToMinutes(t2);
        if (m1 === null || m2 === null) return null;
        let diff = Math.abs(m1 - m2);
        if (diff > 12 * 60) diff = Math.min(diff, 24 * 60 - diff);
        return diff;
    }

    function numDiff(a, b) {
        if (a === null || b === null) return null;
        return Math.abs(a - b);
    }

    // ═══ 5. XÁC ĐỊNH CA ═══
    // Ca đêm: giờ vào >= 18:00 hoặc giờ vào < 06:00
    function isNightShift(startTime) {
        if (!startTime || startTime === '—') return false;
        const [h] = startTime.split(':').map(Number);
        return h >= 18 || h < 6;
    }

    // ═══ 6. SO SÁNH ═══
    function compareWithApp(hrRows, workLogs) {
        const results = [];

        for (const hr of hrRows) {
            const appLog = workLogs.find(l => l.date === hr.date);
            const hrIsSunday = new Date(hr.date + 'T00:00:00').getDay() === 0;

            if (!appLog) {
                results.push({
                    date: hr.date, hr, hrIsSunday, appLog: null,
                    status: 'missing', message: 'App chưa chấm công ngày này'
                });
                continue;
            }

            const diffs = [];
            const fields = {};

            // Xác định ca đêm (dựa vào giờ vào của HR hoặc app)
            const startForShift = hr.start || appLog.start;
            const isNight = isNightShift(startForShift);

            // ─── Giờ vào ───
            const startDiff = timeDiffMinutes(appLog.start, hr.start);
            if (startDiff === null || startDiff <= TOLERANCE_MINUTES) {
                fields.start = true;
            } else {
                fields.start = false;
                diffs.push(`Vào lệch ${startDiff}p`);
            }

            // ─── Giờ ra ───
            const endDiff = timeDiffMinutes(appLog.end, hr.end);
            if (endDiff === null || endDiff <= TOLERANCE_MINUTES) {
                fields.end = true;
            } else {
                fields.end = false;
                diffs.push(`Ra lệch ${endDiff}p`);
            }

            // ─── Giờ BT ───
            const regDiff = numDiff(appLog.regularHours || 0, hr.regularHours || 0);
            if (regDiff === null || regDiff <= TOLERANCE_HOURS) {
                fields.reg = true;
            } else {
                fields.reg = false;
                diffs.push(`BT lệch ${regDiff.toFixed(2)}h`);
            }

            // ─── Tăng ca (ngưỡng khác nhau theo ca) ───
            const otTolerance = isNight ? TOLERANCE_OT_NIGHT : TOLERANCE_OT_DAY;
            const otDiff = numDiff(appLog.overtimeHours || 0, hr.overtimeHours || 0);
            if (otDiff === null || otDiff <= otTolerance) {
                fields.ot = true;
            } else {
                fields.ot = false;
                diffs.push(`TC lệch ${otDiff.toFixed(2)}h`);
            }

            // ─── Loại ngày ───
            if (!!appLog.isSunday === hrIsSunday) {
                fields.type = true;
            } else {
                fields.type = false;
                diffs.push('Loại ngày khác');
            }

            results.push({
                date: hr.date, hr, hrIsSunday, appLog,
                isNight,
                fields,
                status: diffs.length === 0 ? 'ok' : 'diff',
                diffs,
                message: diffs.length === 0 ? 'Khớp' : 'Lệch: ' + diffs.join(', ')
            });
        }
        results.sort((a, b) => a.date.localeCompare(b.date));
        return results;
    }

    // ═══ 7. HIỂN THỊ DẠNG THẺ ═══
    function renderResults(results) {
        const el = document.getElementById('ocr-result');
        const ok = results.filter(r => r.status === 'ok').length;
        const diff = results.filter(r => r.status === 'diff').length;
        const missing = results.filter(r => r.status === 'missing').length;

        let html = `
            <div class="ocr-summary">
                <span class="ocr-badge ok">✅ Khớp: ${ok}</span>
                <span class="ocr-badge diff">❌ Lệch: ${diff}</span>
                <span class="ocr-badge missing">⚠️ Thiếu: ${missing}</span>
            </div>
            <p class="ocr-note">
                💡 Ngưỡng cho phép:
                Vào/Ra ≤ <strong>${TOLERANCE_MINUTES}p</strong> ·
                BT ≤ <strong>${TOLERANCE_HOURS}h</strong> ·
                TC ca ngày ≤ <strong>${TOLERANCE_OT_DAY}h</strong> ·
                TC ca đêm ≤ <strong>${TOLERANCE_OT_NIGHT}h</strong>
            </p>
            <div class="ocr-cards">`;

        for (const r of results) {
            const isOk = r.status === 'ok';
            const isDiff = r.status === 'diff';
            const isMissing = r.status === 'missing';

            const cardClass = isOk ? 'ocr-card-ok' : isDiff ? 'ocr-card-diff' : 'ocr-card-missing';
            const icon = isOk ? '✅' : isDiff ? '❌' : '⚠️';
            const statusText = isOk ? 'Khớp' : isDiff ? 'Lệch' : 'Chưa chấm';

            const appVals = r.appLog ? {
                start: r.appLog.start,
                end: r.appLog.end,
                reg: (r.appLog.regularHours || 0).toFixed(2),
                ot: (r.appLog.overtimeHours || 0).toFixed(2)
            } : { start: '—', end: '—', reg: '—', ot: '—' };

            const hrVals = {
                start: r.hr.start || '—',
                end: r.hr.end || '—',
                reg: r.hr.regularHours != null ? String(r.hr.regularHours) : '—',
                ot: r.hr.overtimeHours != null ? String(r.hr.overtimeHours) : '—'
            };

            const f = r.fields || {};
            const cls = {
                start: (!isMissing && f.start === false) ? 'diff' : '',
                end: (!isMissing && f.end === false) ? 'diff' : '',
                reg: (!isMissing && f.reg === false) ? 'diff' : '',
                ot: (!isMissing && f.ot === false) ? 'diff' : '',
                type: (!isMissing && f.type === false) ? 'diff' : ''
            };

            // Note chênh lệch nhỏ
            let startNote = '', endNote = '';
            if (r.appLog && r.hr.start && r.appLog.start !== r.hr.start) {
                const d = timeDiffMinutes(r.appLog.start, r.hr.start);
                if (d !== null && d > 0) startNote = `<small>±${d}p</small>`;
            }
            if (r.appLog && r.hr.end && r.appLog.end !== r.hr.end) {
                const d = timeDiffMinutes(r.appLog.end, r.hr.end);
                if (d !== null && d > 0) endNote = `<small>±${d}p</small>`;
            }

            // Badge ca đêm
            const shiftBadge = r.isNight
                ? `<span class="ocr-shift-badge night">🌙 Đêm</span>`
                : `<span class="ocr-shift-badge day">☀️ Ngày</span>`;

            html += `
                <div class="ocr-card ${cardClass}">
                    <div class="ocr-card-head">
                        <span class="ocr-card-date">${r.date}</span>
                        ${shiftBadge}
                        <span class="ocr-card-type ${cls.type ? 'diff' : ''}">${r.hrIsSunday ? 'CN' : 'T'}</span>
                        <span class="ocr-card-status">${icon} ${statusText}</span>
                    </div>
                    <div class="ocr-card-body">
                        <div class="ocr-row-head">
                            <span></span>
                            <span>App</span>
                            <span>HR</span>
                        </div>
                        <div class="ocr-row">
                            <span class="ocr-row-label">Vào</span>
                            <span class="ocr-cell ${cls.start}">${appVals.start}</span>
                            <span class="ocr-cell ${cls.start}">${hrVals.start} ${startNote}</span>
                        </div>
                        <div class="ocr-row">
                            <span class="ocr-row-label">Ra</span>
                            <span class="ocr-cell ${cls.end}">${appVals.end}</span>
                            <span class="ocr-cell ${cls.end}">${hrVals.end} ${endNote}</span>
                        </div>
                        <div class="ocr-row">
                            <span class="ocr-row-label">Giờ BT</span>
                            <span class="ocr-cell ${cls.reg}">${appVals.reg}</span>
                            <span class="ocr-cell ${cls.reg}">${hrVals.reg}</span>
                        </div>
                        <div class="ocr-row">
                            <span class="ocr-row-label">Tăng ca</span>
                            <span class="ocr-cell ${cls.ot}">${appVals.ot}</span>
                            <span class="ocr-cell ${cls.ot}">${hrVals.ot}</span>
                        </div>
                    </div>
                </div>`;
        }
        html += `</div>`;
        el.innerHTML = html;
        el.style.display = 'block';

        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'block';
    }

    // ═══ 8. PROGRESS ═══
    function showProgress() {
        document.getElementById('ocr-progress').style.display = 'block';
        document.getElementById('ocr-result').style.display = 'none';
        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        updateProgress(0, 'Đang chuẩn bị...');
    }
    function hideProgress() {
        document.getElementById('ocr-progress').style.display = 'none';
    }
    function updateProgress(pct, text) {
        const fill = document.getElementById('ocr-progress-fill');
        const txt = document.getElementById('ocr-progress-text');
        if (fill) fill.style.width = Math.min(100, pct) + '%';
        if (txt) txt.textContent = text;
    }

    // ═══ 9. HÀM CHÍNH ═══
    async function processImage(file) {
        showProgress();
        try {
            updateProgress(5, 'Đang xử lý ảnh...');
            const processedBlob = await preprocessImage(file);

            updateProgress(10, 'Đang khởi tạo OCR (lần đầu cần tải ~5MB)...');
            const w = await initWorker();

            updateProgress(50, 'Đang đọc ảnh...');
            const result = await w.recognize(processedBlob);
            const text = result.data.text;

            updateProgress(85, 'Đang phân tích...');
            const hrRows = parseOCRText(text);
            if (hrRows.length === 0) {
                throw new Error('Không đọc được dòng nào có giờ vào/ra. Thử ảnh rõ hơn.');
            }

            updateProgress(92, 'Đang so sánh...');
            const results = compareWithApp(hrRows, workLogs);

            updateProgress(100, 'Hoàn tất!');
            renderResults(results);
            lastResults = results;

            const okCount = results.filter(r => r.status === 'ok').length;
            const diffCount = results.filter(r => r.status === 'diff').length;
            if (typeof showToast === 'function') {
                if (diffCount === 0) showToast(`✅ Đã đối chiếu ${hrRows.length} ngày — tất cả khớp!`, 'success');
                else showToast(`⚠️ ${okCount} khớp, ${diffCount} lệch`, 'warning');
            }
            setTimeout(hideProgress, 400);
        } catch (err) {
            hideProgress();
            console.error('OCR Error:', err);
            if (typeof showToast === 'function') showToast('❌ Lỗi OCR: ' + err.message, 'danger');
            else alert('Lỗi OCR: ' + err.message);
        }
    }

    // ═══ 10. XÓA ═══
    function clear() {
        const el = document.getElementById('ocr-result');
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        const input = document.getElementById('hr-image-input');
        if (input) input.value = '';
        lastResults = null;
    }

    // ═══ 11. INIT ═══
    function init() {
        const input = document.getElementById('hr-image-input');
        if (!input) return;
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            await processImage(file);
            e.target.value = '';
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return { processImage, clear, getLastResults: () => lastResults };
})();