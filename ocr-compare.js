/* ═══════════════════════════════════════════════════════════════
   ocr-compare.js — Đối chiếu công HR từ ảnh (OFFLINE 100%)
   Chỉ so: ngày, giờ vào, giờ ra, giờ làm BT, tăng ca
   ═══════════════════════════════════════════════════════════════ */

const OCRCompare = (function () {
    'use strict';

    let worker = null;
    let lastResults = null;

    // ═══ 1. KHỞI TẠO TESSERACT WORKER ═══
    async function initWorker() {
        if (worker) return worker;

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js chưa tải. Kiểm tra thư mục tesseract/.');
        }

        worker = await Tesseract.createWorker(['vie', 'chi_sim'], 1, {
            workerPath: './tesseract/worker.min.js',
            corePath: './tesseract/',
            langPath: './tesseract/lang-data/',
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    updateProgress(30 + m.progress * 50, 'Đang đọc ảnh... ' + Math.round(m.progress * 100) + '%');
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

            const isSunday = line.includes('休息日') || line.includes('Chủ nhật') || line.includes('CN');
            const isHoliday = line.includes('节假日') || line.includes('Lễ');
            const isExempt = line.includes('免卡') || line.includes('miễn');

            rows.push({
                date, start, end, regularHours, overtimeHours,
                isSunday, isHoliday, isExempt, raw: line
            });
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

    // ═══ 4. SO SÁNH ═══
    function compareWithApp(hrRows, workLogs) {
        const results = [];
        for (const hr of hrRows) {
            if (hr.isExempt) {
                results.push({ date: hr.date, hr, appLog: null, status: 'skip', message: '免卡 — bỏ qua' });
                continue;
            }
            const appLog = workLogs.find(l => l.date === hr.date);
            if (!appLog) {
                results.push({ date: hr.date, hr, appLog: null, status: 'missing', message: 'App chưa chấm công' });
                continue;
            }
            const diffs = [];
            if (hr.start && appLog.start !== hr.start) diffs.push(`Vào: ${appLog.start} ≠ ${hr.start}`);
            if (hr.end && appLog.end !== hr.end) diffs.push(`Ra: ${appLog.end} ≠ ${hr.end}`);
            if (Math.abs((appLog.regularHours || 0) - (hr.regularHours || 0)) > 0.01) {
                diffs.push(`BT: ${(appLog.regularHours || 0).toFixed(2)} ≠ ${hr.regularHours}`);
            }
            if (Math.abs((appLog.overtimeHours || 0) - (hr.overtimeHours || 0)) > 0.01) {
                diffs.push(`TC: ${(appLog.overtimeHours || 0).toFixed(2)} ≠ ${hr.overtimeHours}`);
            }
            if (diffs.length === 0) {
                results.push({ date: hr.date, hr, appLog, status: 'ok', message: 'Khớp' });
            } else {
                results.push({ date: hr.date, hr, appLog, status: 'diff', diffs, message: diffs.join(' · ') });
            }
        }
        results.sort((a, b) => a.date.localeCompare(b.date));
        return results;
    }

    // ═══ 5. HIỂN THỊ ═══
    function renderResults(results) {
        const el = document.getElementById('ocr-result');
        const ok = results.filter(r => r.status === 'ok').length;
        const diff = results.filter(r => r.status === 'diff').length;
        const missing = results.filter(r => r.status === 'missing').length;
        const skip = results.filter(r => r.status === 'skip').length;

        let html = `
            <div class="ocr-summary">
                <span class="ocr-badge ok">✅ Khớp: ${ok}</span>
                <span class="ocr-badge diff">❌ Lệch: ${diff}</span>
                <span class="ocr-badge missing">⚠️ Thiếu: ${missing}</span>
                <span class="ocr-badge skip">⚪ Bỏ qua: ${skip}</span>
            </div>
            <div class="table-responsive" style="margin-top:10px;">
                <table class="ocr-table">
                    <thead><tr>
                        <th>Ngày</th>
                        <th>Vào<br><small>app / HR</small></th>
                        <th>Ra<br><small>app / HR</small></th>
                        <th>BT<br><small>app / HR</small></th>
                        <th>TC<br><small>app / HR</small></th>
                        <th>KQ</th>
                    </tr></thead>
                    <tbody>`;

        for (const r of results) {
            const appStart = r.appLog ? r.appLog.start : '—';
            const appEnd = r.appLog ? r.appLog.end : '—';
            const appReg = r.appLog ? (r.appLog.regularHours || 0).toFixed(2) : '—';
            const appOT = r.appLog ? (r.appLog.overtimeHours || 0).toFixed(2) : '—';
            const hrStart = r.hr.start || '—';
            const hrEnd = r.hr.end || '—';
            const hrReg = r.hr.regularHours != null ? r.hr.regularHours : '—';
            const hrOT = r.hr.overtimeHours != null ? r.hr.overtimeHours : '—';

            let rowClass = '', icon = '';
            if (r.status === 'ok') { rowClass = 'row-ok'; icon = '✅'; }
            else if (r.status === 'diff') { rowClass = 'row-diff'; icon = '❌'; }
            else if (r.status === 'missing') { rowClass = 'row-missing'; icon = '⚠️'; }
            else { rowClass = 'row-skip'; icon = '⚪'; }

            const startCls = (r.appLog && r.hr.start && r.appLog.start !== r.hr.start) ? 'cell-diff' : '';
            const endCls = (r.appLog && r.hr.end && r.appLog.end !== r.hr.end) ? 'cell-diff' : '';
            const regCls = (r.appLog && Math.abs((r.appLog.regularHours || 0) - (r.hr.regularHours || 0)) > 0.01) ? 'cell-diff' : '';
            const otCls = (r.appLog && Math.abs((r.appLog.overtimeHours || 0) - (r.hr.overtimeHours || 0)) > 0.01) ? 'cell-diff' : '';

            html += `<tr class="${rowClass}">
                <td>${r.date}</td>
                <td class="${startCls}">${appStart} <span class="sep">/</span> ${hrStart}</td>
                <td class="${endCls}">${appEnd} <span class="sep">/</span> ${hrEnd}</td>
                <td class="${regCls}">${appReg} <span class="sep">/</span> ${hrReg}</td>
                <td class="${otCls}">${appOT} <span class="sep">/</span> ${hrOT}</td>
                <td title="${r.message}">${icon}</td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
        el.innerHTML = html;
        el.style.display = 'block';

        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'block';
    }

    // ═══ 6. PROGRESS ═══
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

    // ═══ 7. HÀM CHÍNH ═══
    async function processImage(file) {
        showProgress();
        try {
            updateProgress(5, 'Đang xử lý ảnh...');
            const processedBlob = await preprocessImage(file);

            updateProgress(15, 'Đang khởi tạo OCR...');
            const w = await initWorker();

            updateProgress(25, 'Đang đọc ảnh...');
            const result = await w.recognize(processedBlob);
            const text = result.data.text;

            updateProgress(85, 'Đang phân tích...');
            const hrRows = parseOCRText(text);
            if (hrRows.length === 0) {
                throw new Error('Không đọc được dòng nào. Thử ảnh rõ hơn.');
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

    // ═══ 8. XÓA ═══
    function clear() {
        const el = document.getElementById('ocr-result');
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
        const clearBtn = document.getElementById('ocr-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        const input = document.getElementById('hr-image-input');
        if (input) input.value = '';
        lastResults = null;
    }

    // ═══ 9. INIT ═══
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