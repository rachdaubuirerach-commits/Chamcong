/* ═══════════════════════════════════════════════════════════════
   image-export.js — Xuất PNG với tiếng Việt 100% có dấu
   Dùng html2canvas — render HTML thành ảnh, không cần font
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
        const totalPay = rows.reduce((s, r) => s + r.pay, 0);
        const totalRegH = rows.reduce((s, r) => s + parseFloat(r.reg), 0);
        const totalOtH = rows.reduce((s, r) => s + parseFloat(r.ot), 0);

        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary').trim() || '#4F46E5';
        const themeLight = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-light').trim() || '#818CF8';

        const rowsHTML = rows.map((r, i) => `
            <tr style="background:${i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.date)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.shift)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.type)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.start)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.end)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.reg)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:center;color:#334155;">${escapeHtml(r.ot)}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:right;color:#0F172A;font-weight:600;">${parseInt(r.pay).toLocaleString('vi-VN')}</td>
                <td style="padding:10px 8px;border:1px solid #E2E8F0;font-size:13px;text-align:left;color:#334155;">${escapeHtml(r.note || '')}</td>
            </tr>
        `).join('');

        return `
            <div style="width:1400px;background:#FFFFFF;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Roboto','Helvetica Neue',Arial,sans-serif;padding:0;box-sizing:border-box;">
                <div style="background:linear-gradient(135deg,${themeColor} 0%,${themeLight} 100%);padding:28px 40px;color:white;text-align:center;">
                    <div style="font-size:32px;font-weight:800;letter-spacing:1.5px;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        BẢNG CHẤM CÔNG
                    </div>
                    <div style="font-size:14px;opacity:0.95;font-weight:500;">
                        Tháng ${String(month).padStart(2, '0')}/${year}  ·  
                        Lương CB: ${settings.baseSalary.toLocaleString('vi-VN')} đ  ·  
                        Ngày công chuẩn: ${settings.standardWorkDays}
                    </div>
                </div>

                <div style="padding:24px 40px;">
                    <table style="width:100%;border-collapse:collapse;font-family:inherit;">
                        <thead>
                            <tr style="background:${themeColor};color:white;">
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Ngày</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Ca</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Loại</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Vào</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Ra</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Giờ thường</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:center;">Tăng ca</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:right;">Tiền công (đ)</th>
                                <th style="padding:12px 8px;border:1px solid ${themeColor};font-size:13px;font-weight:700;text-align:left;">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                            <tr style="background:#F0F2F8;font-weight:800;">
                                <td colspan="7" style="padding:14px 10px;border:1px solid #E2E8F0;font-size:14px;text-align:right;color:${themeColor};font-weight:800;">
                                    TỔNG CỘNG:
                                </td>
                                <td style="padding:14px 10px;border:1px solid #E2E8F0;font-size:14px;text-align:right;color:${themeColor};font-weight:800;">
                                    ${totalPay.toLocaleString('vi-VN')} đ
                                </td>
                                <td style="padding:14px 10px;border:1px solid #E2E8F0;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="margin:0 40px 24px;background:#F5F7FC;border-radius:14px;padding:22px 28px;">
                    <div style="font-size:17px;font-weight:800;color:${themeColor};margin-bottom:14px;letter-spacing:0.5px;">
                        TỔNG KẾT
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:14px;font-size:14px;color:#334155;">
                        <div>📅 Tổng ngày công: <strong style="color:#0F172A;">${rows.length} ngày</strong></div>
                        <div>⏰ Giờ thường: <strong style="color:#0F172A;">${totalRegH.toFixed(2)} h</strong></div>
                        <div>⚡ Giờ tăng ca: <strong style="color:#0F172A;">${totalOtH.toFixed(2)} h</strong></div>
                    </div>
                    <div style="font-size:22px;font-weight:800;color:${themeColor};border-top:2px dashed #CBD5E1;padding-top:14px;">
                        💰 TỔNG LƯƠNG: ${totalPay.toLocaleString('vi-VN')} đ
                    </div>
                </div>

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
                windowWidth: 1400
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