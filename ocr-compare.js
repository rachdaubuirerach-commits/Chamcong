/* ═══════════════════════════════════════════════════════════════
   ocr-compare.js — Đối chiếu công HR từ ảnh (FULLY FIXED)
   - Hiểu layout bảng HR: mã NV | tên | bộ phận | ngày | loại | ca | giờ ca | vào | ra | BT | TC
   - Lọc dòng rác, fix năm, dedup theo ngày
   - So sánh: ngày, giờ vào, giờ ra, giờ BT, tăng ca, loại ngày
   ═══════════════════════════════════════════════════════════════ */

const OCRCompare = (function () {
    'use strict';

    // ═══ NGƯỠNG SAI SỐ ═══
    const TOLERANCE_MINUTES = 15;
    const TOLERANCE_HOURS = 0.25;
    const TOLERANCE_OT_DAY = 0.25;
    const TOLERANCE_OT_NIGHT = 0.5;

    // ═══ GIỚI HẠN HỢP LỆ ═══
    const VALID_YEAR_RANGE = 2;           // năm trong khoảng currentYear ± 2
    const MAX_OT_HOURS = 8;               // tăng ca tối đa 8h/ngày
    const MIN_REG_HOURS = 5;              // giờ BT tối thiểu
    const MAX_REG_HOURS = 12;             // giờ BT tối đa

    // ═══ GIỜ VÀO HỢP LỆ ═══
    // Ca sáng: 05:00 - 09:00
    // Ca đêm: 17:00 - 23:00
    const VALID_START_MINUTES = [
        [5 * 60, 9 * 60],      // ca sáng
        [17 * 60, 23 * 60]     // ca đêm
    ];

    // ═══ GIỜ RA HỢP LỆ ═══
    // Ca sáng: 17:00 - 21:00
    // Ca đêm: 04:00 - 09:00
    const VALID_END_MINUTES = [
        [17 * 60, 21 * 60],    // ca sáng
        [4 * 60, 9 * 60]       // ca đêm
    ];

    let worker = null;
    let lastResults = null;

    // ═══════════════════════════════════════════════════════════
    //  1. KHỞI TẠO TESSERACT WORKER
    // ═══════════════════════════════════════════════════════════
    async function initWorker() {
        if (worker) return worker;

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract undefined. Kiểm tra file tesseract/tesseract.min.js');
        }

        console.log('[OCR] Khởi tạo worker (vie + chi_sim)...');
        worker = await Tesseract.createWorker(['vie', 'chi_sim'], 1, {
            workerPath: './tesseract/worker.min.js',
            corePath: './tesseract/',
            langPath: './tesseract/lang-data/',
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    updateProgress(50 + m.progress * 35, 'Đang đọc ảnh... ' + Math.round(m.progress * 100) + '%');
                } else if (m.status === 'loading language traineddata') {
                    updateProgress(15, 'Đang tải dữ liệu ngôn ngữ...');
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

        console.log('[OCR] Worker sẵn sàng');
        return worker;
    }

    // ═══════════════════════════════════════════════════════════
    //  2. TIỀN XỬ LÝ ẢNH
    // ═══════════════════════════════════════════════════════════
    function preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 3;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Grayscale
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        data[i] = data[i + 1] = data[i + 2] = gray;
                    }

                    // Otsu threshold
                    const threshold = otsuThreshold(data);

                    // Nhị phân hoá
                    for (let i = 0; i < data.length; i += 4) {
                        const v = data[i] > threshold ? 255 : 0;
                        data[i] = data[i + 1] = data[i + 2] = v;
                    }

                    // Sharpen
                    sharpenImage(data, canvas.width, canvas.height);

                    ctx.putImageData(imageData, 0, 0);
                } catch (e) {
                    console.warn('[OCR] Preprocess skip:', e);
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

    function otsuThreshold(data) {
        const hist = new Array(256).fill(0);
        const totalPixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            const wF = totalPixels - wB;
            if (wF === 0) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const between = wB * wF * (mB - mF) * (mB - mF);
            if (between > maxVar) { maxVar = between; threshold = t; }
        }
        return threshold;
    }

    function sharpenImage(data, width, height) {
        const copy = new Uint8ClampedArray(data);
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const half = 1;
        for (let y = half; y < height - half; y++) {
            for (let x = half; x < width - half; x++) {
                let sum = 0;
                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        const px = (y + ky) * width + (x + kx);
                        const kIdx = (ky + half) * 3 + (kx + half);
                        sum += copy[px * 4] * kernel[kIdx];
                    }
                }
                const idx = (y * width + x) * 4;
                const v = Math.max(0, Math.min(255, sum));
                data[idx] = data[idx + 1] = data[idx + 2] = v;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  3. PARSE TEXT OCR — HIỂU LAYOUT BẢNG HR
    // ═══════════════════════════════════════════════════════════
    // Layout bảng HR (từ ảnh):
    // Mã NV | Tên | Bộ phận | Ngày | Loại | Ca | Giờ ca | Vào | Ra | BT | TC | ...
    // VN010722 | Lê Văn Phúc | IPQC | 2026-09-03 | 节假日 | 【越南】产线夜班 | 19:30~04:00 | 19:23 | 07:32 | 8 | 3.75 | ...
    //
    // Sau khi OCR, mỗi dòng text có dạng:
    // "VN010722 Lê Văn Phúc IPQC 2026-09-03 节假日 【越南】产线夜班 19:30~04:00 19:23 07:32 8 3.75 0 0 0 0"
    //
    // Cần lấy: ngày | giờ vào (sau dấu ~) | giờ ra | BT | TC

    function parseOCRText(text) {
        const lines = text.split('\n');
        const rows = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            // Tìm ngày
            const dateMatch = line.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if (!dateMatch) continue;

            const y = dateMatch[1];
            const mo = String(dateMatch[2]).padStart(2, '0');
            const d = String(dateMatch[3]).padStart(2, '0');
            const date = `${y}-${mo}-${d}`;

            // Tìm ca làm việc có dạng "19:30~04:00" hoặc "19:30-04:00"
            // Pattern: HH:MM ~ HH:MM
            const shiftMatch = line.match(/(\d{1,2}):(\d{2})\s*[~\-~]\s*(\d{1,2}):(\d{2})/);

            let shiftStart = null, shiftEnd = null;
            if (shiftMatch) {
                shiftStart = normalizeTime(shiftMatch[1] + ':' + shiftMatch[2]);
                shiftEnd = normalizeTime(shiftMatch[3] + ':' + shiftMatch[4]);
            }

            // Lấy TẤT CẢ times trong dòng
            const timeRegex = /(\d{1,2}):(\d{2})/g;
            const allTimes = [];
            let tm;
            while ((tm = timeRegex.exec(line)) !== null) {
                allTimes.push(tm[0]);
            }

            // ═══ GIỜ VÀO/RA THỰC TẾ ═══
            // Sau khi loại ca làm việc (2 times đầu nếu có shiftMatch) → 2 times tiếp theo là vào/ra
            let actualStart = null, actualEnd = null;
            let timesForActual = allTimes;

            if (shiftMatch) {
                // Bỏ 2 times của ca khỏi list
                timesForActual = allTimes.filter(t =>
                    t !== shiftMatch[1] + ':' + shiftMatch[2] &&
                    t !== shiftMatch[3] + ':' + shiftMatch[4]
                );
            }

            if (timesForActual.length >= 2) {
                actualStart = normalizeTime(timesForActual[0]);
                actualEnd = normalizeTime(timesForActual[1]);
            }

            if (!actualStart || !actualEnd) continue;

            // ═══ LẤY BT VÀ TC ═══
            // Sau time cuối cùng, các số tiếp theo là: BT | TC | (các cột 0 padding)
            const afterLastTime = extractNumbersAfterTime(line, timesForActual[timesForActual.length - 1]);

            let regularHours = 0;
            let overtimeHours = 0;

            // Lọc bỏ các số 0 padding ở cuối
            const meaningful = afterLastTime.filter(n => n > 0);

            if (meaningful.length >= 2) {
                regularHours = meaningful[0];
                overtimeHours = meaningful[1];
            } else if (meaningful.length === 1) {
                regularHours = meaningful[0];
            }

            rows.push({
                date,
                shiftStart,
                shiftEnd,
                start: actualStart,
                end: actualEnd,
                regularHours,
                overtimeHours,
                raw: line
            });
        }

        return rows;
    }

    function normalizeTime(t) {
        if (!t) return t;
        const parts = t.split(':');
        return String(parseInt(parts[0], 10)).padStart(2, '0') + ':' + parts[1];
    }

    function extractNumbersAfterTime(line, timeStr) {
        const idx = line.lastIndexOf(timeStr);
        if (idx === -1) return [];
        const tail = line.slice(idx + timeStr.length);
        return [...tail.matchAll(/(\d+(?:[.,]\d+)?)/g)]
            .map(x => parseFloat(x[1].replace(',', '.')));
    }

    // ═══════════════════════════════════════════════════════════
    //  4. HELPERS
    // ═══════════════════════════════════════════════════════════
    function timeToMinutes(t) {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return null;
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

    function isNightShift(startTime) {
        if (!startTime) return false;
        const m = timeToMinutes(startTime);
        if (m === null) return false;
        return m >= 17 * 60 || m < 9 * 60;
    }

    function isTimeInRanges(minutes, ranges) {
        for (const [min, max] of ranges) {
            if (minutes >= min && minutes <= max) return true;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════
    //  5. CLEAN HR ROWS — LỌC DÒNG RÁC
    // ═══════════════════════════════════════════════════════════
    function cleanHrRows(rows) {
        const currentYear = new Date().getFullYear();
        const filtered = [];

        for (const r of rows) {
            // ═══ FIX NĂM SAI ═══
            const y = parseInt(r.date.substring(0, 4));
            if (Math.abs(y - currentYear) > VALID_YEAR_RANGE) {
                const oldDate = r.date;
                r.date = String(currentYear) + r.date.substring(4);
                console.log('[OCR] Fix năm:', oldDate, '→', r.date);
            }

            // ═══ LỌC BT/TC BẤT THƯỜNG ═══
            const bt = r.regularHours || 0;
            const ot = r.overtimeHours || 0;

            if (ot > MAX_OT_HOURS) {
                console.warn('[OCR] Bỏ dòng TC quá lớn:', r.date, 'TC =', ot);
                continue;
            }

            // Cho phép BT = 0 (ngày nghỉ / lễ)
            if (bt !== 0 && (bt < MIN_REG_HOURS || bt > MAX_REG_HOURS)) {
                console.warn('[OCR] Bỏ dòng BT bất thường:', r.date, 'BT =', bt);
                continue;
            }

            // ═══ VALIDATE GIỜ VÀO ═══
            const startMin = timeToMinutes(r.start);
            if (startMin === null) {
                console.warn('[OCR] Bỏ dòng giờ vào không hợp lệ:', r.date, r.start);
                continue;
            }

            // Giờ vào phải nằm trong khoảng hợp lệ
            if (!isTimeInRanges(startMin, VALID_START_MINUTES)) {
                console.warn('[OCR] Bỏ dòng giờ vào bất thường:', r.date, 'start =', r.start);
                continue;
            }

            // ═══ VALIDATE GIỜ RA ═══
            const endMin = timeToMinutes(r.end);
            if (endMin === null) {
                console.warn('[OCR] Bỏ dòng giờ ra không hợp lệ:', r.date, r.end);
                continue;
            }

            if (!isTimeInRanges(endMin, VALID_END_MINUTES)) {
                console.warn('[OCR] Bỏ dòng giờ ra bất thường:', r.date, 'end =', r.end);
                continue;
            }

            // ═══ VALIDATE QUAN HỆ VÀO-RA ═══
            // Ca đêm: vào > ra (qua ngày)
            // Ca sáng: vào < ra (cùng ngày)
            const isNight = isNightShift(r.start);
            if (isNight) {
                // Vào 19:30, ra 07:30 → startMin > endMin
                if (startMin < endMin && (endMin - startMin) < 8 * 60) {
                    // Có thể là ca sáng nhưng start > 17h → loại
                    console.warn('[OCR] Bỏ dòng ca đêm bất thường:', r.date);
                    continue;
                }
            } else {
                // Vào 07:30, ra 19:30 → startMin < endMin
                if (startMin > endMin) {
                    console.warn('[OCR] Bỏ dòng ca ngày bất thường:', r.date);
                    continue;
                }
            }

            filtered.push(r);
        }

        // ═══ DEDUP THEO NGÀY ═══
        const byDate = {};
        for (const r of filtered) {
            if (!byDate[r.date]) {
                byDate[r.date] = r;
            } else {
                byDate[r.date] = pickBetterRow(byDate[r.date], r);
            }
        }

        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }

    function pickBetterRow(row1, row2) {
        const score = (r) => {
            let s = 0;
            if (Math.abs((r.regularHours || 0) - 8) < 0.5) s += 10;
            if (r.overtimeHours > 0 && r.overtimeHours < 6) s += 5;
            if (r.start && isTimeInRanges(timeToMinutes(r.start), VALID_START_MINUTES)) s += 3;
            if (r.end && isTimeInRanges(timeToMinutes(r.end), VALID_END_MINUTES)) s += 3;
            return s;
        };
        return score(row1) >= score(row2) ? row1 : row2;
    }

    // ═══════════════════════════════════════════════════════════
    //  6. SO SÁNH VỚI APP
    // ═══════════════════════════════════════════════════════════
    function compareWithApp(hrRows, workLogs) {
        const cleanedRows = cleanHrRows(hrRows);
        console.log('[OCR] Dòng gốc:', hrRows.length, '→ sau clean:', cleanedRows.length);

        const results = [];
        for (const hr of cleanedRows) {
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
            const isNight = isNightShift(hr.start || appLog.start);

            const startDiff = timeDiffMinutes(appLog.start, hr.start);
            if (startDiff === null || startDiff <= TOLERANCE_MINUTES) fields.start = true;
            else { fields.start = false; diffs.push(`Vào lệch ${startDiff}p`); }

            const endDiff = timeDiffMinutes(appLog.end, hr.end);
            if (endDiff === null || endDiff <= TOLERANCE_MINUTES) fields.end = true;
            else { fields.end = false; diffs.push(`Ra lệch ${endDiff}p`); }

            const regDiff = numDiff(appLog.regularHours || 0, hr.regularHours || 0);
            if (regDiff === null || regDiff <= TOLERANCE_HOURS) fields.reg = true;
            else { fields.reg = false; diffs.push(`BT lệch ${regDiff.toFixed(2)}h`); }

            const otTolerance = isNight ? TOLERANCE_OT_NIGHT : TOLERANCE_OT_DAY;
            const otDiff = numDiff(appLog.overtimeHours || 0, hr.overtimeHours || 0);
            if (otDiff === null || otDiff <= otTolerance) fields.ot = true;
            else { fields.ot = false; diffs.push(`TC lệch ${otDiff.toFixed(2)}h`); }

            if (!!appLog.isSunday === hrIsSunday) fields.type = true;
            else { fields.type = false; diffs.push('Loại ngày khác'); }

            results.push({
                date: hr.date, hr, hrIsSunday, appLog, isNight, fields,
                status: diffs.length === 0 ? 'ok' : 'diff',
                diffs,
                message: diffs.length === 0 ? 'Khớp' : 'Lệch: ' + diffs.join(', ')
            });
        }
        results.sort((a, b) => a.date.localeCompare(b.date));
        return results;
    }

    // ═══════════════════════════════════════════════════════════
    //  7. HIỂN THỊ
    // ═══════════════════════════════════════════════════════════
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
                💡 Ngưỡng: Vào/Ra ≤ <strong>${TOLERANCE_MINUTES}p</strong> ·
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

            let startNote = '', endNote = '';
            if (r.appLog && r.hr.start && r.appLog.start !== r.hr.start) {
                const d = timeDiffMinutes(r.appLog.start, r.hr.start);
                if (d !== null && d > 0) startNote = `<small>±${d}p</small>`;
            }
            if (r.appLog && r.hr.end && r.appLog.end !== r.hr.end) {
                const d = timeDiffMinutes(r.appLog.end, r.hr.end);
                if (d !== null && d > 0) endNote = `<small>±${d}p</small>`;
            }

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

    // ═══════════════════════════════════════════════════════════
    //  8. HIỂN THỊ TEXT THÔ (DEBUG)
    // ═══════════════════════════════════════════════════════════
    function renderRawText(text, hrRowsCount) {
        const el = document.getElementById('ocr-result');
        const escaped = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        el.innerHTML = `
            <div style="background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:14px;">
                <div style="font-weight:800;color:#92400E;margin-bottom:8px;">⚠️ Không parse được dòng nào</div>
                <div style="font-size:12px;color:#78350F;margin-bottom:8px;">
                    Tesseract đọc được <strong>${text ? text.length : 0}</strong> ký tự.
                    Parse được <strong>${hrRowsCount}</strong> dòng.
                </div>
                <textarea readonly style="width:100%;height:220px;font-family:monospace;font-size:11px;padding:8px;border:1px solid #F59E0B;border-radius:6px;background:#FFFBEB;color:#000;box-sizing:border-box;">${escaped}</textarea>
                <div style="font-size:11px;color:#78350F;margin-top:8px;">
                    📸 Chụp màn hình này gửi để debug.
                </div>
            </div>`;
        el.style.display = 'block';
        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'block';
    }

    // ═══════════════════════════════════════════════════════════
    //  9. PROGRESS
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    //  10. HÀM CHÍNH
    // ═══════════════════════════════════════════════════════════
    async function processImage(file) {
        showProgress();
        try {
            console.log('[OCR] === Bắt đầu ===');
            console.log('[OCR] File:', file.name, file.size, 'bytes');

            updateProgress(5, 'Đang xử lý ảnh...');
            const processedBlob = await preprocessImage(file);

            updateProgress(10, 'Đang khởi tạo OCR...');
            const w = await initWorker();

            updateProgress(50, 'Đang đọc ảnh...');
            const result = await w.recognize(processedBlob);
            const text = result.data.text;
            console.log('[OCR] Text (300 ký tự đầu):', text.substring(0, 300));

            updateProgress(85, 'Đang phân tích...');
            const hrRows = parseOCRText(text);
            console.log('[OCR] Parse được:', hrRows.length, 'dòng');
            if (hrRows.length > 0) {
                console.log('[OCR] Sample dòng đầu:', hrRows[0]);
            }

            if (hrRows.length === 0) {
                hideProgress();
                renderRawText(text, hrRows.length);
                if (typeof showToast === 'function') showToast('⚠️ Không parse được — xem text thô', 'warning');
                return;
            }

            updateProgress(92, 'Đang so sánh...');
            const results = compareWithApp(hrRows, workLogs);

            if (results.length === 0) {
                hideProgress();
                renderRawText(text, hrRows.length);
                if (typeof showToast === 'function') showToast('⚠️ Tất cả dòng bị lọc — xem text thô', 'warning');
                return;
            }

            updateProgress(100, 'Hoàn tất!');
            renderResults(results);
            lastResults = results;

            const okCount = results.filter(r => r.status === 'ok').length;
            const diffCount = results.filter(r => r.status === 'diff').length;
            if (typeof showToast === 'function') {
                if (diffCount === 0) showToast(`✅ ${hrRows.length} ngày — tất cả khớp!`, 'success');
                else showToast(`⚠️ ${okCount} khớp, ${diffCount} lệch`, 'warning');
            }
            setTimeout(hideProgress, 400);
            console.log('[OCR] === Xong ===');
        } catch (err) {
            hideProgress();
            console.error('[OCR] LỖI:', err);
            let msg = 'Lỗi không xác định';
            if (err) {
                if (err.message) msg = err.message;
                else if (err.name) msg = err.name;
                else if (typeof err === 'string') msg = err;
                else {
                    try { msg = JSON.stringify(err); } catch (e) { msg = String(err); }
                }
            }
            if (typeof showToast === 'function') showToast('❌ ' + msg, 'danger');
            else alert('Lỗi OCR: ' + msg);

            const el = document.getElementById('ocr-result');
            if (el) {
                el.innerHTML = `
                    <div style="background:#FEE2E2;border:2px solid #EF4444;border-radius:12px;padding:14px;">
                        <div style="font-weight:800;color:#991B1B;margin-bottom:8px;">❌ Lỗi OCR</div>
                        <div style="font-size:13px;color:#7F1D1D;word-break:break-word;">${msg}</div>
                    </div>`;
                el.style.display = 'block';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  11. XÓA
    // ═══════════════════════════════════════════════════════════
    function clear() {
        const el = document.getElementById('ocr-result');
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        const input = document.getElementById('hr-image-input');
        if (input) input.value = '';
        lastResults = null;
    }

    // ═══════════════════════════════════════════════════════════
    //  12. INIT
    // ═══════════════════════════════════════════════════════════
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