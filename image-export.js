/* ═══════════════════════════════════════════════════════════════
   image-export.js v3.3 — Xuất PNG (tối ưu memory + tốc độ)
   ═══════════════════════════════════════════════════════════════ */

const ImageExporter = (function () {
    'use strict';

    let _lastBuildKey = '';
    let _lastBuildHTML = '';

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildTableHTML(rows, month, year, settings, appVersion) {
        const cacheKey = `${month}-${year}-${rows.length}-${rows[0] ? rows[0].date : ''}-${rows[rows.length-1] ? rows[rows.length-1].date : ''}`;
        if (cacheKey === _lastBuildKey && _lastBuildHTML) {
            return _lastBuildHTML;
        }

        let totalRegH = 0, totalOtH = 0, totalSunDays = 0;
        for (let i = 0; i < rows.length; i++) {
            totalRegH += parseFloat(rows[i].reg);
            totalOtH += parseFloat(rows[i].ot);
            if (rows[i].type === 'Chủ nhật') totalSunDays++;
        }

        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim() || '#4F46E5';
        const themeLight = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-light').trim() || '#818CF8';

        const rowsArr = [];
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const isSunday = r.type === 'Chủ nhật';
            const rowStyle = isSunday
                ? 'background:linear-gradient(90deg, #FEF3C7, #FDE68A);font-weight:700;'
                : (i % 2 === 0 ? 'background:#FFFFFF;' : 'background:#F8FAFC;');
            const dateStyle = isSunday ? 'color:#B45309;font-weight:800;' : 'color:#334155;';
            const shiftStyle = isSunday ? 'color:#B45309;font-weight:800;' : 'color:#334155;';
            const otStyle = isSunday ? 'color:#DC2626;font-weight:800;' : 'color:#334155;';

            rowsArr.push(`
                <tr style="${rowStyle}">
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;${dateStyle}">${escapeHtml(r.date)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;${shiftStyle}">${escapeHtml(r.shift)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.start)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.end)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;${otStyle}">${escapeHtml(r.ot)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:left;color:#334155;">${escapeHtml(r.note || '')}</td>
                </tr>
            `);
        }
        const rowsHTML = rowsArr.join('');

        const html = `
            <div style="width:1200px;background:#FFFFFF;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Roboto','Helvetica Neue',Arial,sans-serif;padding:0;box-sizing:border-box;">
                <div style="background:linear-gradient(135deg,${themeColor} 0%,${themeLight} 100%);padding:28px 40px;color:white;text-align:center;">
                    <div style="font-size:32px;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        BẢNG CHẤM CÔNG
                    </div>
                    <div style="font-size:14px;opacity:0.95;font-weight:500;">
                        Tháng ${String(month).padStart(2, '0')}/${year}  ·  
                        Ngày công chuẩn: ${settings.standardWorkDays}
                    </div>
                </div>

                <div style="padding:24px 40px;">
                    <table style="width:100%;border-collapse:collapse;font-family:inherit;">
                        <thead>
                            <tr style="background:${themeColor};color:white;">
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Ngày</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Ca</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Vào</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Ra</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Tăng ca</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:left;">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>

                    ${totalSunDays > 0 ? `
                        <div style="margin-top:14px;font-size:13px;color:#92400E;background:#FEF3C7;padding:10px 16px;border-radius:10px;border-left:4px solid #F59E0B;">
                            🟡 <strong>${totalSunDays} ngày Chủ nhật</strong> — nền vàng, chữ đậm
                        </div>
                    ` : ''}
                </div>

                <div style="margin:0 40px 24px;background:#F5F7FC;border-radius:14px;padding:22px 28px;">
                    <div style="font-size:17px;font-weight:800;color:${themeColor};margin-bottom:14px;letter-spacing:0.5px;">
                        TỔNG KẾT
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;font-size:14px;color:#334155;">
                        <div>📅 Tổng ngày công: <strong style="color:#0F172A;">${rows.length} ngày</strong></div>
                        <div>⏰ Tổng giờ thường: <strong style="color:#0F172A;">${totalRegH.toFixed(2)} h</strong></div>
                        <div>⚡ Tổng giờ tăng ca: <strong style="color:#DC2626;">${totalOtH.toFixed(2)} h</strong></div>
                    </div>
                </div>

                <div style="padding:14px 40px 22px;text-align:center;color:#94A3B8;font-size:12px;border-top:1px solid #E2E8F0;">
                    TimeTracker v${appVersion}  ·  Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>
        `;

        _lastBuildKey = cacheKey;
        _lastBuildHTML = html;
        return html;
    }

    async function exportImage(options) {
        const { rows, month, year, settings, appVersion } = options;

        if (typeof html2canvas === 'undefined') {
            throw new Error('Thư viện html2canvas chưa load. Vui lòng refresh trang.');
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-99999px';
        container.style.top = '0';
        container.style.zIndex = '-1';
        container.innerHTML = buildTableHTML(rows, month, year, settings, appVersion);
        document.body.appendChild(container);

        try {
            await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));

            const scale = rows.length > 30 ? 1.8 : 2;

            const canvas = await html2canvas(container.firstElementChild, {
                scale,
                backgroundColor: '#FFFFFF',
                logging: false,
                useCORS: true,
                windowWidth: 1200,
                removeContainer: true
            });

            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });

            if (!blob) throw new Error('Không tạo được ảnh PNG');

            canvas.width = 0;
            canvas.height = 0;

            const filename = `chamcong_${String(month).padStart(2, '0')}_${year}.png`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            return filename;
        } finally {
            if (container.parentElement) {
                document.body.removeChild(container);
            }
        }
    }

    return {
        exportImage,
        clearCache() {
            _lastBuildKey = '';
            _lastBuildHTML = '';
        }
    };
})();

if (typeof window !== 'undefined') window.ImageExporter = ImageExporter;