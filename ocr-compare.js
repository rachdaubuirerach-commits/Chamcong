/* ═══════════════════════════════════════════════════════════════
   ocr-compare.js — Đối chiếu công HR từ ảnh (v5.0)
   - Gộp dòng thông minh, fix lỗi OCR
   - Xuất ảnh PNG dạng bảng tối giản (nút 📸 Xuất ảnh)
   ═══════════════════════════════════════════════════════════════ */

const OCRCompare = (function () {
    'use strict';

    // ═══ NGƯỠNG SAI SỐ ═══
    const TOLERANCE_MINUTES = 15;
    const TOLERANCE_HOURS = 0.25;
    const TOLERANCE_OT_DAY = 0.25;
    const TOLERANCE_OT_NIGHT = 0.5;

    // ═══ GIỚI HẠN HỢP LỆ ═══
    const VALID_YEAR_RANGE = 2;
    const MAX_OT_HOURS = 8;
    const MIN_REG_HOURS = 5;
    const MAX_REG_HOURS = 12;

    const VALID_START_MINUTES = [
        [5 * 60, 9 * 60],
        [17 * 60, 23 * 60]
    ];

    const VALID_END_MINUTES = [
        [4 * 60, 9 * 60],
        [17 * 60, 21 * 60]
    ];

    let worker = null;
    let lastResults = null;
    let lastRawText = '';

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
                const scale = 2;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const contrast = 1.3;
                    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        const val = Math.max(0, Math.min(255, factor * (gray - 128) + 128));
                        data[i] = data[i + 1] = data[i + 2] = val;
                    }
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

    // ═══════════════════════════════════════════════════════════
    //  3. PARSE TEXT OCR
    // ═══════════════════════════════════════════════════════════
    function parseOCRText(text) {
        const lines = text.split('\n');
        const dateRegex = /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/;

        // ═══ BƯỚC 1: GỘP DÒNG CÙNG RECORD ═══
        const records = [];
        let currentRecord = '';

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            const hasDate = dateRegex.test(line);
            const hasRowNumberAndId = /^\d{1,4}\s*[|I]?\s*(VN|vw|VW|vn)\d{4,}/i.test(line);

            if (hasDate) {
                if (currentRecord) records.push(currentRecord);
                currentRecord = line;
            } else if (hasRowNumberAndId && currentRecord) {
                records.push(currentRecord);
                currentRecord = line;
            } else if (currentRecord) {
                currentRecord += ' ' + line;
            }
        }
        if (currentRecord) records.push(currentRecord);

        console.log('[OCR] Gộp được', records.length, 'records');

        // ═══ BƯỚC 2: PARSE TỪNG RECORD ═══
        const rows = [];

        for (const record of records) {
            const dateMatch = record.match(dateRegex);
            if (!dateMatch) continue;

            const y = dateMatch[1];
            const mo = String(dateMatch[2]).padStart(2, '0');
            const d = String(dateMatch[3]).padStart(2, '0');
            const date = `${y}-${mo}-${d}`;

            // Bỏ ngày miễn chấm / nghỉ / lễ
            if (record.includes('缺卡') || record.includes('休息') || record.includes('免卡') || record.includes('节假日')) {
                console.log('[OCR] Bỏ (miễn/nghỉ/lễ):', date);
                continue;
            }

            // ═══ FIX LỖI OCR ═══
            let fixedRecord = record;

            fixedRecord = fixedRecord.replace(/(\d{2}):(\d{2})7(\d{2}):\s*(\d{2})/g, '$1:$2~$3:$4');
            fixedRecord = fixedRecord.replace(/(\d{1,2})\s+:\s*(\d{2})/g, '$1:$2');
            fixedRecord = fixedRecord.replace(/(\d{1,2}):\s+(\d{2})/g, '$1:$2');
            fixedRecord = fixedRecord.replace(/(\b\d{1,2}):(\d{1,2})\b/g, (match, a, b) => {
                const h = parseInt(a), m = parseInt(b);
                if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return match;
                return a + '.' + b;
            });
            fixedRecord = fixedRecord.replace(/(\d)\.\s+(\d+)/g, '$1.$2');
            fixedRecord = fixedRecord.replace(/(\d)\s+\.\s+(\d+)/g, '$1.$2');

            // Lấy tất cả times
            const timeRegex = /(\d{1,2}):(\d{2})/g;
            const allTimes = [];
            let tm;
            while ((tm = timeRegex.exec(fixedRecord)) !== null) {
                allTimes.push(tm[0]);
            }

            if (allTimes.length < 4) continue;

            const shiftStart = allTimes[0];
            const shiftEnd = allTimes[1];
            const timesForActual = allTimes.slice(2);

            if (timesForActual.length < 2) continue;

            const actualStart = normalizeTime(timesForActual[0]);
            const actualEnd = normalizeTime(timesForActual[1]);

            // Lấy BT và TC
            const lastTimeStr = timesForActual[1];
            const idx = fixedRecord.lastIndexOf(lastTimeStr);
            const tail = idx === -1 ? '' : fixedRecord.slice(idx + lastTimeStr.length);
            const numsAfter = [...tail.matchAll(/(\d+(?:[.,]\d+)?)/g)]
                .map(x => parseFloat(x[1].replace(',', '.')));

            const meaningful = numsAfter.filter(n => n > 0);

            let regularHours = 0;
            let overtimeHours = 0;
            if (meaningful.length >= 2) {
                regularHours = meaningful[0];
                overtimeHours = meaningful[1];
            } else if (meaningful.length === 1) {
                regularHours = meaningful[0];
            }

            rows.push({
                date, shiftStart, shiftEnd,
                start: actualStart, end: actualEnd,
                regularHours, overtimeHours,
                raw: record
            });
        }

        return rows;
    }

    function normalizeTime(t) {
        if (!t) return t;
        const parts = t.split(':');
        return String(parseInt(parts[0], 10)).padStart(2, '0') + ':' + parts[1];
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
    //  5. CLEAN HR ROWS
    // ═══════════════════════════════════════════════════════════
    function cleanHrRows(rows) {
        const currentYear = new Date().getFullYear();
        const filtered = [];

        for (const r of rows) {
            const y = parseInt(r.date.substring(0, 4));
            if (Math.abs(y - currentYear) > VALID_YEAR_RANGE) {
                r.date = String(currentYear) + r.date.substring(4);
            }

            const bt = r.regularHours || 0;
            const ot = r.overtimeHours || 0;

            if (ot > MAX_OT_HOURS) continue;
            if (bt !== 0 && (bt < MIN_REG_HOURS || bt > MAX_REG_HOURS)) continue;

            const startMin = timeToMinutes(r.start);
            if (startMin === null) continue;
            if (!isTimeInRanges(startMin, VALID_START_MINUTES)) continue;

            const endMin = timeToMinutes(r.end);
            if (endMin === null) continue;
            if (!isTimeInRanges(endMin, VALID_END_MINUTES)) continue;

            const isNight = isNightShift(r.start);
            if (isNight) {
                if (startMin < endMin && (endMin - startMin) < 8 * 60) continue;
            } else {
                if (startMin > endMin) continue;
            }

            filtered.push(r);
        }

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
    //  6. SO SÁNH
    // ═══════════════════════════════════════════════════════════
    function compareWithApp(hrRows, workLogs) {
        const cleanedRows = cleanHrRows(hrRows);

        const results = [];
        for (const hr of cleanedRows) {
            const appLog = workLogs.find(l => l.date === hr.date);
            const hrIsSunday = new Date(hr.date + 'T00:00:00').getDay() === 0;

            if (!appLog) {
                results.push({
                    date: hr.date, hr, hrIsSunday, appLog: null,
                    status: 'missing', message: 'App chưa chấm công'
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
    //  7. HIỂN THỊ KẾT QUẢ (app — dạng thẻ)
    // ═══════════════════════════════════════════════════════════
    function renderResults(results, rawText) {
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

            <details style="margin-bottom:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px;">
                <summary style="cursor:pointer;font-weight:700;color:#475569;font-size:13px;">
                    🔍 Xem text thô OCR đọc được (${rawText ? rawText.length : 0} ký tự)
                </summary>
                <textarea readonly style="width:100%;height:200px;font-family:monospace;font-size:10px;padding:8px;margin-top:8px;border:1px solid #CBD5E1;border-radius:6px;background:#FFF;color:#000;box-sizing:border-box;">${(rawText || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
            </details>

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

        const actions = document.getElementById('ocr-actions');
        if (actions) actions.style.display = 'flex';
    }

    // ═══════════════════════════════════════════════════════════
    //  8. HIỂN THỊ TEXT THÔ (khi parse fail)
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
            </div>`;
        el.style.display = 'block';

        const actions = document.getElementById('ocr-actions');
        if (actions) actions.style.display = 'flex';
    }

    // ═══════════════════════════════════════════════════════════
    //  9. XUẤT ẢNH PNG
    // ═══════════════════════════════════════════════════════════
    async function exportImage() {
        if (!lastResults || lastResults.length === 0) {
            if (typeof showToast === 'function') showToast('⚠️ Chưa có kết quả để xuất', 'warning');
            return;
        }

        const btn = document.getElementById('ocr-export-btn');
        const originalHTML = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Đang xuất...';
        }

        try {
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas chưa tải');
            }

            const html = buildExportHTML(lastResults);

            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.background = '#FFFFFF';
            container.innerHTML = html;
            document.body.appendChild(container);

            const canvas = await html2canvas(container.firstElementChild, {
                scale: 2,
                backgroundColor: '#FFFFFF',
                useCORS: true,
                logging: false
            });

            document.body.removeChild(container);

            const now = new Date();
            const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
            const filename = `doi_chieu_cong_${ts}.png`;

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (typeof showToast === 'function') showToast(`✅ Đã xuất ${filename}`, 'success');
                if (typeof haptic === 'function') haptic();
                if (typeof playSound === 'function') playSound();
            }, 'image/png');

        } catch (err) {
            console.error('[OCR] Export error:', err);
            if (typeof showToast === 'function') showToast('❌ Lỗi xuất ảnh: ' + (err.message || err), 'danger');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }
    }

    // ═══ BUILD HTML CHO ẢNH XUẤT ═══
    function buildExportHTML(results) {
        const ok = results.filter(r => r.status === 'ok').length;
        const diff = results.filter(r => r.status === 'diff').length;
        const missing = results.filter(r => r.status === 'missing').length;

        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        let monthLabel = '';
        if (results.length > 0) {
            const [y, m] = results[0].date.split('-');
            monthLabel = `Tháng ${m}/${y}`;
        }

        let html = `
        <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background:#FFFFFF; padding:24px; width:720px; box-sizing:border-box; color:#1E293B;">
            <div style="border-bottom:3px solid #4F46E5; padding-bottom:14px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:20px; font-weight:800; color:#4F46E5;">📊 ĐỐI CHIẾU CÔNG HR</div>
                        <div style="font-size:13px; color:#64748B; margin-top:3px;">${monthLabel}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px; color:#94A3B8;">Ngày xuất</div>
                        <div style="font-size:14px; font-weight:700; color:#475569;">${dateStr} ${timeStr}</div>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:16px;">
                <div style="flex:1; background:#D1FAE5; border-left:4px solid #10B981; padding:10px 14px; border-radius:8px;">
                    <div style="font-size:11px; color:#065F46; font-weight:700;">KHỚP</div>
                    <div style="font-size:22px; font-weight:800; color:#059669;">${ok}</div>
                </div>
                <div style="flex:1; background:#FEE2E2; border-left:4px solid #EF4444; padding:10px 14px; border-radius:8px;">
                    <div style="font-size:11px; color:#991B1B; font-weight:700;">LỆCH</div>
                    <div style="font-size:22px; font-weight:800; color:#DC2626;">${diff}</div>
                </div>
                <div style="flex:1; background:#FEF3C7; border-left:4px solid #F59E0B; padding:10px 14px; border-radius:8px;">
                    <div style="font-size:11px; color:#92400E; font-weight:700;">THIẾU</div>
                    <div style="font-size:22px; font-weight:800; color:#D97706;">${missing}</div>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:13px; font-family:monospace;">
                <thead>
                    <tr style="background:#F1F5F9;">
                        <th style="padding:8px 6px; text-align:left; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">Ngày</th>
                        <th style="padding:8px 6px; text-align:left; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">Loại</th>
                        <th style="padding:8px 6px; text-align:center; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">Vào App→HR</th>
                        <th style="padding:8px 6px; text-align:center; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">Ra App→HR</th>
                        <th style="padding:8px 6px; text-align:center; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">BT</th>
                        <th style="padding:8px 6px; text-align:center; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">TC</th>
                        <th style="padding:8px 6px; text-align:center; font-size:11px; color:#475569; border-bottom:2px solid #CBD5E1;">KQ</th>
                    </tr>
                </thead>
                <tbody>`;

        for (const r of results) {
            const isOk = r.status === 'ok';
            const isDiff = r.status === 'diff';
            const isMissing = r.status === 'missing';

            let rowBg = '#FFFFFF';
            if (isOk) rowBg = '#F0FDF4';
            else if (isDiff) rowBg = '#FEF2F2';
            else if (isMissing) rowBg = '#FFFBEB';

            const [, mo, d] = r.date.split('-');
            const dateShort = `${d}/${mo}`;
            const typeLabel = r.isNight ? '🌙 Đêm' : '☀️ Ngày';

            // Vào
            const appStart = r.appLog ? r.appLog.start : '—';
            const hrStart = r.hr.start || '—';
            const startMatch = r.fields && r.fields.start !== false;
            const startColor = (r.appLog && !startMatch) ? '#DC2626' : '#1E293B';
            const startIcon = r.appLog ? (startMatch ? ' ✓' : ' ✗') : '';
            const startCell = r.appLog ? `${appStart}→${hrStart}${startIcon}` : `${hrStart}`;

            // Ra
            const appEnd = r.appLog ? r.appLog.end : '—';
            const hrEnd = r.hr.end || '—';
            const endMatch = r.fields && r.fields.end !== false;
            const endColor = (r.appLog && !endMatch) ? '#DC2626' : '#1E293B';
            const endIcon = r.appLog ? (endMatch ? ' ✓' : ' ✗') : '';
            const endCell = r.appLog ? `${appEnd}→${hrEnd}${endIcon}` : `${hrEnd}`;

            // BT
            const appReg = r.appLog ? (r.appLog.regularHours || 0).toFixed(0) : '—';
            const hrReg = r.hr.regularHours != null ? String(r.hr.regularHours) : '—';
            const regMatch = r.fields && r.fields.reg !== false;
            const regColor = (r.appLog && !regMatch) ? '#DC2626' : '#1E293B';
            const regIcon = r.appLog ? (regMatch ? ' ✓' : ' ✗') : '';
            const regCell = r.appLog ? `${appReg}→${hrReg}${regIcon}` : `${hrReg}`;

            // TC
            const appOT = r.appLog ? (r.appLog.overtimeHours || 0).toFixed(2) : '—';
            const hrOT = r.hr.overtimeHours != null ? String(r.hr.overtimeHours) : '—';
            const otMatch = r.fields && r.fields.ot !== false;
            const otColor = (r.appLog && !otMatch) ? '#DC2626' : '#1E293B';
            const otIcon = r.appLog ? (otMatch ? ' ✓' : ' ✗') : '';
            const otCell = r.appLog ? `${appOT}→${hrOT}${otIcon}` : `${hrOT}`;

            const kqIcon = isOk ? '✅' : isDiff ? '❌' : '⚠️';
            const kqText = isOk ? 'Khớp' : isDiff ? 'Lệch' : 'Thiếu';
            const kqColor = isOk ? '#059669' : isDiff ? '#DC2626' : '#D97706';

            html += `
                <tr style="background:${rowBg}; border-bottom:1px solid #E2E8F0;">
                    <td style="padding:8px 6px; font-weight:700; color:#1E293B;">${dateShort}</td>
                    <td style="padding:8px 6px; color:#475569;">${typeLabel}</td>
                    <td style="padding:8px 6px; text-align:center; color:${startColor}; font-weight:600;">${startCell}</td>
                    <td style="padding:8px 6px; text-align:center; color:${endColor}; font-weight:600;">${endCell}</td>
                    <td style="padding:8px 6px; text-align:center; color:${regColor}; font-weight:600;">${regCell}</td>
                    <td style="padding:8px 6px; text-align:center; color:${otColor}; font-weight:600;">${otCell}</td>
                    <td style="padding:8px 6px; text-align:center; color:${kqColor}; font-weight:800; font-size:12px;">${kqIcon} ${kqText}</td>
                </tr>`;
        }

        html += `
                </tbody>
            </table>

            <div style="margin-top:16px; padding-top:12px; border-top:1px solid #E2E8F0; font-size:11px; color:#64748B; line-height:1.6;">
                <div>💡 Ngưỡng: Vào/Ra ≤ <strong>15p</strong> · BT ≤ <strong>0.25h</strong> · TC ngày ≤ <strong>0.25h</strong> · TC đêm ≤ <strong>0.5h</strong></div>
                <div style="margin-top:4px;">📱 TimeTracker · Đối chiếu tự động từ ảnh HR</div>
            </div>
        </div>`;

        return html;
    }

    // ═══════════════════════════════════════════════════════════
    //  10. PROGRESS
    // ═══════════════════════════════════════════════════════════
    function showProgress() {
        document.getElementById('ocr-progress').style.display = 'block';
        document.getElementById('ocr-result').style.display = 'none';
        const actions = document.getElementById('ocr-actions');
        if (actions) actions.style.display = 'none';
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
    //  11. HÀM CHÍNH
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
            lastRawText = text;
            console.log('[OCR] Text đầy đủ:\n', text);

            updateProgress(85, 'Đang phân tích...');
            const hrRows = parseOCRText(text);
            console.log('[OCR] Parse được:', hrRows.length, 'dòng');

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
            renderResults(results, text);
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
    //  12. XÓA
    // ═══════════════════════════════════════════════════════════
    function clear() {
        const el = document.getElementById('ocr-result');
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
        const actions = document.getElementById('ocr-actions');
        if (actions) actions.style.display = 'none';
        const input = document.getElementById('hr-image-input');
        if (input) input.value = '';
        lastResults = null;
        lastRawText = '';
    }

    // ═══════════════════════════════════════════════════════════
    //  13. INIT
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

    return {
        processImage,
        clear,
        exportImage,
        getLastResults: () => lastResults,
        getRawText: () => lastRawText
    };
})();