/* ═══════════════════════════════════════════════════════════════
   image-export.js v4.2 — Xuất PNG (Monochrome V1)
   Header đen đặc, không gradient
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

        const rowsArr = [];
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const isSunday = r.type === 'Chủ nhật';
            const rowStyle = isSunday
                ? 'background:#FEF9C3;font-weight:700;'
                : (i % 2 === 0 ? 'background:#FFFFFF;' : 'background:#FAFAFA;');
            const dateStyle = isSunday ? 'color:#713F12;font-weight:800;' : 'color:#404040;';
            const otStyle = isSunday ? 'color:#DC2626;font-weight:800;' : 'color:#404040;';

            rowsArr.push(`
                <tr style="${rowStyle}">
                    <td style="padding:10px 8px;border:1px solid #E5E5E5;font-size:13px;text-align:center;${dateStyle}">${escapeHtml(r.date)}</td>
                    <td style="padding:10px 8px;border:1px solid #E5E5E5;font-size:13px;text-align:center;color:#404040;">${escapeHtml(r.shift)}</td>
                    <td style="padding:10px 8px;border:1px solid #E5E5E5;font-size:13px;text-align:center;color:#404040;">${escapeHtml(r.start)}</td>
                    <td style="padding:10px 8px;border:1px solid #E5E5E5;font-size:13px;text-align:center;color:#404040;">${escapeHtml(r.end)}</td>
                    <td style="padding:10px 8px;border:1px solid #E5E5E5;font-size:13px;text-align:center;${otStyle}">${escapeHtml(r.ot)}</td>
                    <td style="padding:10px 8px;border:1px solid #E5E5E5;font-size:13px;text-align:left;color:#404040;">${escapeHtml(r.note || '')}</td>
                </tr>
            `);
        }
        const rowsHTML = rowsArr.join('');

        const html = `
            <div style="width:1200px;background:#FFFFFF;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Roboto','Helvetica Neue',Arial,sans-serif;padding:0;box-sizing:border-box;">
                <div style="background:#000000;padding:28px 40px;color:#FFFFFF;text-align:center;">
                    <div style="font-size:32px;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;">
                        BẢNG CHẤM CÔNG
                    </div>
                    <div style="font-size:14px;opacity:0.75;font-weight:500;">
                        Tháng ${String(month).padStart(2, '0')}/${year}  ·  
                        Ngày công chuẩn: ${settings.standardWorkDays}
                    </div>
                </div>

                <div style="padding:24px 40px;">
                    <table style="width:100%;border-collapse:collapse;font-family:inherit;">
                        <thead>
                            <tr style="background:#171717;color:#FAFAFA;">
                                <th style="padding:12px 8px;border:1px solid #171717;font-size:13px;font-weight:700;text-align:center;">Ngày</th>
                                <th style="padding:12px 8px;border:1px solid #171717;font-size:13px;font-weight:700;text-align:center;">Ca</th>
                                <th style="padding:12px 8px;border:1px solid #171717;font-size:13px;font-weight:700;text-align:center;">Vào</th>
                                <th style="padding:12px 8px;border:1px solid #171717;font-size:13px;font-weight:700;text-align:center;">Ra</th>
                                <th style="padding:12px 8px;border:1px solid #171717;font-size:13px;font-weight:700;text-align:center;">Tăng ca</th>
                                <th style="padding:12px 8px;border:1px solid #171717;font-size:13px;font-weight:700;text-align:left;">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>

                    ${totalSunDays > 0 ? `
                        <div style="margin-top:14px;font-size:13px;color:#713F12;background:#FEF9C3;padding:10px 16px;border-radius:10px;border-left:4px solid #CA8A04;">
                            🟡 <strong>${totalSunDays} ngày Chủ nhật</strong> — nền vàng, chữ đậm
                        </div>
                    ` : ''}
                </div>

                <div style="margin:0 40px 24px;background:#F5F5F5;border-radius:14px;padding:22px 28px;border:1px solid #E5E5E5;">
                    <div style="font-size:17px;font-weight:800;color:#000000;margin-bottom:14px;letter-spacing:0.5px;">
                        TỔNG KẾT
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;font-size:14px;color:#404040;">
                        <div>📅 Tổng ngày công: <strong style="color:#000000;">${rows.length} ngày</strong></div>
                        <div>⏰ Tổng giờ thường: <strong style="color:#000000;">${totalRegH.toFixed(2)} h</strong></div>
                        <div>⚡ Tổng giờ tăng ca: <strong style="color:#DC2626;">${totalOtH.toFixed(2)} h</strong></div>
                    </div>
                </div>

                <div style="padding:14px 40px 22px;text-align:center;color:#737373;font-size:12px;border-top:1px solid #E5E5E5;">
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