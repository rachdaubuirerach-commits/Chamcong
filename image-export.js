/* ═══════════════════════════════════════════════════════════════
   image-export.js — Xuất PNG (không tính tiền, CN nổi bật)
   ═══════════════════════════════════════════════════════════════ */

const ImageExporter = (function () {
    'use strict';

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
        // Tổng giờ
        const totalRegH = rows.reduce((s, r) => s + parseFloat(r.reg), 0);
        const totalOtH = rows.reduce((s, r) => s + parseFloat(r.ot), 0);
        const totalSunDays = rows.filter(r => r.type === 'Chủ nhật').length;

        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim() || '#4F46E5';
        const themeLight = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-light').trim() || '#818CF8';

        // ═══ ROWS HTML — Chủ nhật nổi bật ═══
        const rowsHTML = rows.map(r => {
            const isSunday = r.type === 'Chủ nhật';
            const bg = isSunday
                ? 'linear-gradient(90deg, #FEF3C7, #FDE68A)'
                : '#FFFFFF';
            const rowStyle = isSunday
                ? `background:${bg};font-weight:700;`
                : '';
            const dateStyle = isSunday
                ? 'color:#B45309;font-weight:800;'
                : 'color:#334155;';
            const shiftStyle = isSunday
                ? 'color:#B45309;font-weight:800;'
                : 'color:#334155;';
            const otStyle = isSunday
                ? 'color:#DC2626;font-weight:800;'
                : 'color:#334155;';

            return `
                <tr style="${rowStyle}">
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;${dateStyle}">${escapeHtml(r.date)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;${shiftStyle}">${escapeHtml(r.shift)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.start)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.end)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;${otStyle}">${escapeHtml(r.ot)}</td>
                    <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:left;color:#334155;">${escapeHtml(r.note || '')}</td>
                </tr>
            `;
        }).join('');

        return `
            <div style="width:1200px;background:#FFFFFF;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Roboto','Helvetica Neue',Arial,sans-serif;padding:0;box-sizing:border-box;">
                <!-- HEADER -->
                <div style="background:linear-gradient(135deg,${themeColor} 0%,${themeLight} 100%);padding:28px 40px;color:white;text-align:center;">
                    <div style="font-size:32px;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        BẢNG CHẤM CÔNG
                    </div>
                    <div style="font-size:14px;opacity:0.95;font-weight:500;">
                        Tháng ${String(month).padStart(2, '0')}/${year}  ·  
                        Ngày công chuẩn: ${settings.standardWorkDays}
                    </div>
                </div>

                <!-- TABLE -->
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

                    <!-- CHÚ THÍCH CHỦ NHẬT -->
                    ${totalSunDays > 0 ? `
                        <div style="margin-top:14px;font-size:13px;color:#92400E;background:#FEF3C7;padding:10px 16px;border-radius:10px;border-left:4px solid #F59E0B;">
                            🟡 <strong>${totalSunDays} ngày Chủ nhật</strong> — nền vàng, chữ đậm
                        </div>
                    ` : ''}
                </div>

                <!-- SUMMARY -->
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

                <!-- FOOTER -->
                <div style="padding:14px 40px 22px;text-align:center;color:#94A3B8;font-size:12px;border-top:1px solid #E2E8F0;">
                    TimeTracker v${appVersion}  ·  Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>
        `;
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
            await new Promise(r => setTimeout(r, 150));

            const canvas = await html2canvas(container.firstElementChild, {
                scale: 2,
                backgroundColor: '#FFFFFF',
                logging: false,
                useCORS: true,
                windowWidth: 1200
            });

            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });

            if (!blob) throw new Error('Không tạo được ảnh PNG');

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
            document.body.removeChild(container);
        }
    }

    return { exportImage };
})();

if (typeof window !== 'undefined') window.ImageExporter = ImageExporter;