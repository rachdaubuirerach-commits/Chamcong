/* ═══════════════════════════════════════════════════════════════
   ocr-compare.js v8.0 — VietSUN/HR Factory Parser & Preview
   - Tự động inject CSS (độc lập hoàn toàn)
   - Parser chuyên biệt cho bảng công có chữ Hán (缺卡, 免卡)
   - Preview Editable (sửa/xóa trước khi so sánh)
   - So sánh thông minh (tolerance 30p, detect shift)
   ═══════════════════════════════════════════════════════════════ */

const OCRCompare = (function () {
    'use strict';

    // ═══ CẤU HÌNH ═══
    const CONFIG = {
        TOL_START_MIN: 60,      // Cho phép lệch giờ vào 60 phút (HR quẹt thẻ thực tế)
        TOL_END_MIN: 30,        // Cho phép lệch giờ ra 30 phút
        TOL_REG_HOURS: 0.25,    // Lệch giờ BT 15 phút
        TOL_OT_HOURS: 0.25,     // Lệch giờ OT 15 phút
        MAX_IMAGE_DIM: 2400,
    };

    const BROWSER = {
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isSamsung: /SamsungBrowser/i.test(navigator.userAgent),
        isWeak: /SamsungBrowser|iPad|iPhone|iPod/i.test(navigator.userAgent)
    };

    // ═══ STATE ═══
    let state = {
        worker: null,
        parsedRows: [],     // Mảng chứa data sau khi parse (cho phép edit)
        lastResults: null,  // Mảng chứa kết quả so sánh
        isProcessing: false
    };

    // ═══ HELPERS ═══
    const pad = n => String(n).padStart(2, '0');
    
    function timeToMin(t) {
        if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    function calcDiffMin(t1, t2) {
        const m1 = timeToMin(t1), m2 = timeToMin(t2);
        if (m1 === null || m2 === null) return null;
        let d = Math.abs(m1 - m2);
        if (d > 12 * 60) d = 24 * 60 - d; // Xử lý ca đêm qua ngày
        return d;
    }

    // ═══ 1. INJECT CSS TỰ ĐỘNG ═══
    function injectCSS() {
        if (document.getElementById('ocr-custom-style')) return;
        const style = document.createElement('style');
        style.id = 'ocr-custom-style';
        style.textContent = `
            .ocr-preview-wrap { overflow-x: auto; margin-top: 10px; }
            .ocr-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 500px; }
            .ocr-table th { background: #F1F5F9; padding: 8px 4px; text-align: center; font-weight: 700; color: #475569; border-bottom: 2px solid #CBD5E1; }
            .ocr-table td { padding: 6px 4px; text-align: center; border-bottom: 1px solid #E2E8F0; vertical-align: middle; }
            .ocr-table tr.row-low { background: #FEF2F2; }
            .ocr-table tr.row-warn { background: #FFFBEB; }
            .ocr-inp { width: 100%; padding: 4px; border: 1px solid #CBD5E1; border-radius: 4px; font-family: monospace; font-size: 12px; text-align: center; box-sizing: border-box; }
            .ocr-inp:focus { border-color: #005BAA; outline: none; }
            .ocr-inp.num { width: 50px; }
            .ocr-badge-miss { background: #FEE2E2; color: #991B1B; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
            .ocr-card { border-radius: 10px; padding: 12px; margin-bottom: 10px; border: 1px solid; }
            .ocr-card-ok { background: #F0FDF4; border-color: #BBF7D0; }
            .ocr-card-diff { background: #FEF2F2; border-color: #FECACA; }
            .ocr-card-miss { background: #FFFBEB; border-color: #FDE68A; }
            .ocr-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 800; }
            .ocr-grid { display: grid; grid-template-columns: 50px 1fr 1fr; gap: 4px; font-size: 12px; }
            .ocr-grid .lbl { color: #64748B; font-weight: 600; }
            .ocr-cell.diff { color: #DC2626; font-weight: 800; text-decoration: line-through; }
            .ocr-cell.match { color: #16A34A; font-weight: 700; }
        `;
        document.head.appendChild(style);
    }

    // ═══ 2. TIỀN XỬ LÝ ẢNH & OCR ═══
    async function preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.max(img.width, img.height) > CONFIG.MAX_IMAGE_DIM 
                    ? CONFIG.MAX_IMAGE_DIM / Math.max(img.width, img.height) : 1;
                
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Tăng contrast nhẹ
                try {
                    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const p = d.data;
                    for (let i = 0; i < p.length; i += 4) {
                        const g = 0.299 * p[i] + 0.587 * p[i+1] + 0.114 * p[i+2];
                        const v = Math.min(255, Math.max(0, 1.2 * (g - 128) + 128));
                        p[i] = p[i+1] = p[i+2] = v;
                    }
                    ctx.putImageData(d, 0, 0);
                } catch (e) {}

                canvas.toBlob(b => resolve(b), BROWSER.isIOS ? 'image/jpeg' : 'image/png', 0.92);
            };
            img.onerror = () => reject(new Error('Không đọc được ảnh.'));
            img.src = URL.createObjectURL(file);
        });
    }

    async function initWorker() {
        if (state.worker) return state.worker;
        if (typeof Tesseract === 'undefined') throw new Error('Thư viện Tesseract chưa tải.');
        
        state.worker = await Tesseract.createWorker(['vie', 'chi_sim'], 1, {
            workerPath: './tesseract/worker.min.js',
            corePath: './tesseract/',
            langPath: './tesseract/lang-data/',
            logger: m => {
                if (m.status === 'recognizing text') {
                    updateProgress(50 + m.progress * 40, `Đang đọc... ${Math.round(m.progress*100)}%`);
                } else if (m.status === 'loading language traineddata') {
                    updateProgress(20, 'Đang tải ngôn ngữ...');
                }
            }
        });
        // PSM 6: Coi text như 1 block văn bản
        await state.worker.setParameters({ tessedit_pageseg_mode: '6' });
        return state.worker;
    }

    // ═══ 3. PARSER CHUYÊN BIỆT CHO VIETSUN ═══
    function parseHRText(rawText) {
        const lines = rawText.split('\n');
        const rows = [];
        const dateRegex = /\b(\d{4})-(\d{2})-(\d{2})\b/;
        const timeRegex = /(\d{1,2}):(\d{2})/g;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            const dateMatch = line.match(dateRegex);
            if (!dateMatch) continue; // Dòng không có ngày -> Bỏ qua

            const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            
            // Bỏ qua ngày nghỉ có lương / miễn chấm công
            if (line.includes('免卡') || line.includes('休息') || line.includes('节假')) {
                continue;
            }

            // Tìm tất cả giờ
            const times = [];
            let m;
            while ((m = timeRegex.exec(line)) !== null) {
                times.push(`${pad(m[1])}:${m[2]}`);
            }

            // Bảng VietSUN luôn có cột ca (VD: 19:30~04:00) ở đầu -> Bỏ 2 số đầu
            let start = null, end = null;
            let isMissing = line.includes('缺卡') || line.includes('缺');

            if (times.length >= 4) {
                start = times[2];
                end = times[3];
            } else if (times.length === 3) {
                start = times[2]; // Chỉ có giờ vào
            }

            // Tìm giờ BT và OT (nằm ở phần đuôi)
            let regHours = 0, otHours = 0;
            let cutIdx = line.lastIndexOf(end || times[times.length-1]);
            if (cutIdx === -1) cutIdx = line.lastIndexOf(times[0]); // fallback

            if (cutIdx !== -1) {
                const tail = line.substring(cutIdx + 5);
                const nums = tail.match(/\d+(?:\.\d+)?/g) || [];
                // Mảng nums thường là: [8, 3.75, 0, 0, 0, 0, 0]
                if (nums.length >= 2) {
                    regHours = parseFloat(nums[0]) || 0;
                    otHours = parseFloat(nums[1]) || 0;
                }
            }

            // Chỉ lấy những dòng có data thực sự
            if (start || end || regHours > 0 || isMissing) {
                rows.push({
                    date,
                    start: start || '',
                    end: end || '',
                    regHours,
                    otHours,
                    isMissing,
                    edited: false
                });
            }
        }
        return rows;
    }

    // ═══ 4. RENDER PREVIEW (CHO PHÉP SỬA) ═══
    function renderPreview() {
        const el = document.getElementById('ocr-result');
        if (!el) return;
        injectCSS();

        let html = `
            <div style="background:#E0F2FE;border:1.5px solid #0284C7;border-radius:12px;padding:12px;margin-bottom:12px;">
                <div style="font-weight:800;color:#075985;margin-bottom:4px;">📋 Xem trước ${state.parsedRows.length} dòng</div>
                <div style="font-size:12px;color:#0C4A6E;">Kiểm tra và sửa nếu cần, sau đó bấm <strong>So sánh</strong>.</div>
            </div>
            <div class="ocr-preview-wrap">
                <table class="ocr-table">
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Giờ Vào</th>
                            <th>Giờ Ra</th>
                            <th>Giờ BT</th>
                            <th>OT</th>
                            <th>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>`;

        state.parsedRows.forEach((r, i) => {
            const rowCls = r.isMissing ? 'row-low' : (r.regHours === 0 ? 'row-warn' : '');
            html += `
                <tr class="${rowCls}">
                    <td style="font-weight:700;color:#1E293B;">${r.date}</td>
                    <td><input type="time" class="ocr-inp" value="${r.start}" data-idx="${i}" data-field="start" ${r.isMissing ? 'placeholder="缺卡"' : ''}></td>
                    <td><input type="time" class="ocr-inp" value="${r.end}" data-idx="${i}" data-field="end" ${r.isMissing ? 'placeholder="缺卡"' : ''}></td>
                    <td><input type="number" step="0.25" class="ocr-inp num" value="${r.regHours}" data-idx="${i}" data-field="regHours"></td>
                    <td><input type="number" step="0.25" class="ocr-inp num" value="${r.otHours}" data-idx="${i}" data-field="otHours"></td>
                    <td><button class="log-del" onclick="OCRCompare.removeRow(${i})">×</button></td>
                </tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
                <button class="btn btn-primary" style="flex:1;" onclick="OCRCompare.confirmCompare()">
                    <svg width="16" height="16"><use href="#i-check"/></svg> So sánh
                </button>
                <button class="btn" style="flex:1;background:var(--surface-2);border:1px solid var(--border);color:var(--text-2);" onclick="OCRCompare.clear()">
                    Hủy
                </button>
            </div>`;

        el.innerHTML = html;
        el.style.display = 'block';
        document.getElementById('ocr-actions').style.display = 'none';

        // Bind events
        el.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const field = e.target.dataset.field;
                let val = e.target.value;
                if (field === 'regHours' || field === 'otHours') {
                    state.parsedRows[idx][field] = parseFloat(val) || 0;
                } else {
                    state.parsedRows[idx][field] = val;
                }
                state.parsedRows[idx].edited = true;
                state.parsedRows[idx].isMissing = false; // Đã sửa thì bỏ cờ missing
            });
        });
    }

    // ═══ 5. SO SÁNH VỚI APP ═══
    function confirmCompare() {
        if (!state.parsedRows.length) return;
        
        const results = [];
        // Lấy workLogs từ app.js (biến global)
        const appLogs = window.workLogs || [];

        state.parsedRows.forEach(hr => {
            const appLog = appLogs.find(l => l.date === hr.date);
            const hrIsSunday = new Date(hr.date + 'T00:00:00').getDay() === 0;

            if (!appLog) {
                results.push({ date: hr.date, hr, appLog: null, hrIsSunday, status: 'missing', diffs: ['App chưa chấm công'], fields: {} });
                return;
            }

            const diffs = [];
            const fields = {};

            // So sánh Giờ Vào
            if (hr.start) {
                const d = calcDiffMin(appLog.start, hr.start);
                fields.start = d !== null && d <= CONFIG.TOL_START_MIN;
                if (!fields.start) diffs.push(`Vào lệch ${d}p`);
            } else {
                fields.start = false;
                diffs.push('HR thiếu giờ vào (缺卡)');
            }

            // So sánh Giờ Ra
            if (hr.end) {
                const d = calcDiffMin(appLog.end, hr.end);
                fields.end = d !== null && d <= CONFIG.TOL_END_MIN;
                if (!fields.end) diffs.push(`Ra lệch ${d}p`);
            } else {
                fields.end = false;
                diffs.push('HR thiếu giờ ra (缺卡)');
            }

            // So sánh BT & OT
            const rd = Math.abs((appLog.regularHours || 0) - hr.regHours);
            fields.reg = rd <= CONFIG.TOL_REG_HOURS;
            if (!fields.reg) diffs.push(`BT lệch ${rd.toFixed(2)}h`);

            const od = Math.abs((appLog.overtimeHours || 0) - hr.otHours);
            fields.ot = od <= CONFIG.TOL_OT_HOURS;
            if (!fields.ot) diffs.push(`OT lệch ${od.toFixed(2)}h`);

            // Kiểm tra loại ngày
            fields.type = !!appLog.isSunday === hrIsSunday;
            if (!fields.type) diffs.push('Loại ngày khác (CN/Thường)');

            results.push({
                date: hr.date, hr, appLog, hrIsSunday,
                status: diffs.length === 0 ? 'ok' : 'diff',
                diffs, fields
            });
        });

        state.lastResults = results.sort((a, b) => a.date.localeCompare(b.date));
        renderResults();
    }

    // ═══ 6. RENDER KẾT QUẢ ═══
    function renderResults() {
        const el = document.getElementById('ocr-result');
        const res = state.lastResults;
        const ok = res.filter(r => r.status === 'ok').length;
        const diff = res.filter(r => r.status === 'diff').length;
        const miss = res.filter(r => r.status === 'missing').length;

        let html = `
            <div style="display:flex;gap:8px;margin-bottom:16px;">
                <div style="flex:1;background:#D1FAE5;border-left:4px solid #10B981;padding:10px;border-radius:8px;">
                    <div style="font-size:11px;color:#065F46;font-weight:700;">KHỚP</div>
                    <div style="font-size:20px;font-weight:800;color:#059669;">${ok}</div>
                </div>
                <div style="flex:1;background:#FEE2E2;border-left:4px solid #EF4444;padding:10px;border-radius:8px;">
                    <div style="font-size:11px;color:#991B1B;font-weight:700;">LỆCH</div>
                    <div style="font-size:20px;font-weight:800;color:#DC2626;">${diff}</div>
                </div>
                <div style="flex:1;background:#FEF3C7;border-left:4px solid #F59E0B;padding:10px;border-radius:8px;">
                    <div style="font-size:11px;color:#92400E;font-weight:700;">THIẾU</div>
                    <div style="font-size:20px;font-weight:800;color:#D97706;">${miss}</div>
                </div>
            </div>
            <div style="max-height:400px;overflow-y:auto;padding-right:4px;">`;

        res.forEach(r => {
            const isOk = r.status === 'ok';
            const isMiss = r.status === 'missing';
            const cls = isOk ? 'ocr-card-ok' : isMiss ? 'ocr-card-miss' : 'ocr-card-diff';
            const icon = isOk ? '✅' : isMiss ? '⚠️' : '❌';
            const statusText = isOk ? 'Khớp' : isMiss ? 'Thiếu (App)' : 'Lệch';

            const appS = r.appLog ? r.appLog.start : '—';
            const appE = r.appLog ? r.appLog.end : '—';
            const appR = r.appLog ? r.appLog.regularHours : '—';
            const appO = r.appLog ? r.appLog.overtimeHours : '—';

            html += `
                <div class="ocr-card ${cls}">
                    <div class="ocr-card-head">
                        <span>${r.date} ${r.hrIsSunday ? '(CN)' : ''}</span>
                        <span>${icon} ${statusText}</span>
                    </div>
                    <div class="ocr-grid">
                        <div class="lbl">Giờ</div>
                        <div style="text-align:center;font-weight:700;">App</div>
                        <div style="text-align:center;font-weight:700;">HR</div>

                        <div class="lbl">Vào</div>
                        <div class="ocr-cell ${r.fields.start === false ? 'diff' : 'match'}">${appS}</div>
                        <div class="ocr-cell ${r.fields.start === false ? 'diff' : 'match'}">${r.hr.start || '缺卡'}</div>

                        <div class="lbl">Ra</div>
                        <div class="ocr-cell ${r.fields.end === false ? 'diff' : 'match'}">${appE}</div>
                        <div class="ocr-cell ${r.fields.end === false ? 'diff' : 'match'}">${r.hr.end || '缺卡'}</div>

                        <div class="lbl">BT</div>
                        <div class="ocr-cell ${r.fields.reg === false ? 'diff' : 'match'}">${appR}h</div>
                        <div class="ocr-cell ${r.fields.reg === false ? 'diff' : 'match'}">${r.hr.regHours}h</div>

                        <div class="lbl">OT</div>
                        <div class="ocr-cell ${r.fields.ot === false ? 'diff' : 'match'}">${appO}h</div>
                        <div class="ocr-cell ${r.fields.ot === false ? 'diff' : 'match'}">${r.hr.otHours}h</div>
                    </div>
                    ${r.diffs.length > 0 ? `<div style="font-size:11px;color:#B91C1C;margin-top:8px;font-weight:700;">Lỗi: ${r.diffs.join(' · ')}</div>` : ''}
                </div>`;
        });

        html += `
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
                <button class="btn btn-primary" style="flex:1;" onclick="OCRCompare.exportImage()">📥 Xuất ảnh</button>
                <button class="btn" style="flex:1;background:var(--surface-2);border:1px solid var(--border);color:var(--text-2);" onclick="OCRCompare.clear()">Đóng</button>
            </div>`;

        el.innerHTML = html;
        el.style.display = 'block';
        document.getElementById('ocr-actions').style.display = 'none';
    }

    // ═══ 7. LUỒNG CHÍNH ═══
    async function processImage(file) {
        if (state.isProcessing) return;
        state.isProcessing = true;
        showProgress();

        try {
            const blob = await preprocessImage(file);
            const worker = await initWorker();
            
            updateProgress(50, 'Đang đọc ảnh...');
            const res = await worker.recognize(blob);
            const text = res.data.text || '';

            updateProgress(90, 'Đang phân tích...');
            const rows = parseHRText(text);

            if (rows.length === 0) {
                hideProgress();
                const el = document.getElementById('ocr-result');
                el.innerHTML = `<div style="background:#FEE2E2;padding:16px;border-radius:12px;text-align:center;">
                    <p style="font-weight:700;color:#991B1B;">Không đọc được dòng nào hợp lệ.</p>
                    <p style="font-size:12px;color:#7F1D1D;margin-top:4px;">Thử chụp rõ hơn hoặc dùng nút Xóa để chụp lại.</p>
                </div>`;
                el.style.display = 'block';
                return;
            }

            state.parsedRows = rows;
            hideProgress();
            renderPreview();
            
            if (typeof toast === 'function') toast(`✅ Đọc được ${rows.length} dòng`, 'success');

        } catch (err) {
            hideProgress();
            console.error('[OCR]', err);
            if (typeof toast === 'function') toast('❌ ' + (err.message || 'Lỗi OCR'), 'danger');
        } finally {
            state.isProcessing = false;
        }
    }

    function removeRow(idx) {
        state.parsedRows.splice(idx, 1);
        renderPreview();
    }

    // ═══ 8. UI HELPERS ═══
    function showProgress() {
        const p = document.getElementById('ocr-progress');
        if (p) p.style.display = 'block';
        const r = document.getElementById('ocr-result');
        if (r) r.style.display = 'none';
        updateProgress(0, 'Đang chuẩn bị...');
    }
    function hideProgress() {
        const p = document.getElementById('ocr-progress');
        if (p) p.style.display = 'none';
    }
    function updateProgress(pct, text) {
        const fill = document.getElementById('ocr-progress-fill');
        const txt = document.getElementById('ocr-progress-text');
        if (fill) fill.style.width = pct + '%';
        if (txt) txt.textContent = text;
    }
    function clear() {
        state.parsedRows = [];
        state.lastResults = null;
        const el = document.getElementById('ocr-result');
        if (el) { el.innerHTML = ''; el.style.display = 'none'; }
        document.getElementById('ocr-actions').style.display = 'none';
        document.getElementById('hr-image-input').value = '';
    }

    // ═══ INIT ═══
    function init() {
        const input = document.getElementById('hr-image-input');
        if (!input) return;
        // Tránh gắn event 2 lần
        if (input.dataset.ocrAttached) return;
        input.dataset.ocrAttached = '1';
        
        input.addEventListener('change', async (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            await processImage(f);
            e.target.value = '';
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return {
        processImage, clear, removeRow, confirmCompare, init,
        exportImage: () => { if (typeof toast === 'function') toast('Chức năng xuất ảnh đang phát triển', 'info'); }
    };
})();