/* =========================================================
   holiday-data.js — Data lễ VN, tách 2 tầng rõ ràng
   paid: true  → BẮT BUỘC NGHỈ (đi làm x3)
   paid: false → KHÔNG BẮT BUỘC NGHỈ
   ========================================================= */

const HOLIDAY_DATA = {
    // ═══════════════ LỄ DƯƠNG LỊCH ═══════════════
    solar: {
        // Bắt buộc nghỉ
        '01-01': { name: 'Tết Dương lịch',    icon: '🎊', category: 'paid',     paid: true  },
        '04-30': { name: 'Ngày Giải phóng',   icon: '🇻🇳', category: 'paid',     paid: true  },
        '05-01': { name: 'Quốc tế Lao động',  icon: '⚒️', category: 'paid',     paid: true  },
        '09-02': { name: 'Quốc khánh',        icon: '🇻🇳', category: 'paid',     paid: true  },
        // Không bắt buộc — xã hội
        '03-08': { name: 'Quốc tế Phụ nữ',    icon: '🌹', category: 'social',   paid: false },
        '06-01': { name: 'Quốc tế Thiếu nhi', icon: '🧒', category: 'social',   paid: false },
        '10-20': { name: 'Phụ nữ Việt Nam',   icon: '🌷', category: 'social',   paid: false },
        '11-20': { name: 'Nhà giáo Việt Nam', icon: '📚', category: 'social',   paid: false },
        // Không bắt buộc — tôn giáo
        '12-25': { name: 'Giáng sinh',        icon: '🎄', category: 'religion', paid: false }
    },

    // ═══════════════ LỄ ÂM LỊCH ═══════════════
    lunar: {
        // Bắt buộc nghỉ
        '01-01': { name: 'Tết Nguyên Đán',    icon: '🎋', category: 'paid',     paid: true  },
        '01-02': { name: 'Mùng 2 Tết',        icon: '🎋', category: 'paid',     paid: true  },
        '01-03': { name: 'Mùng 3 Tết',        icon: '🎋', category: 'paid',     paid: true  },
        '03-10': { name: 'Giỗ Tổ Hùng Vương', icon: '🏛️', category: 'paid',     paid: true  },
        // Không bắt buộc — truyền thống
        '01-15': { name: 'Tết Nguyên Tiêu',   icon: '🏮', category: 'trad',     paid: false },
        '05-05': { name: 'Tết Đoan Ngọ',      icon: '🍙', category: 'trad',     paid: false },
        '07-07': { name: 'Thất Tịch',         icon: '💕', category: 'trad',     paid: false },
        '08-15': { name: 'Tết Trung Thu',     icon: '🏮', category: 'trad',     paid: false },
        '12-23': { name: 'Ông Công Ông Táo',  icon: '🐟', category: 'trad',     paid: false },
        '12-30': { name: 'Tất Niên',          icon: '🎊', category: 'trad',     paid: false },
        // Không bắt buộc — tôn giáo
        '07-15': { name: 'Vu Lan',            icon: '🙏', category: 'religion', paid: false }
    },

    // ═══════════════ NGÀY ĐỊNH KỲ (ÂM LỊCH) ═══════════════
    recurring: {
        1:  { name: 'Mùng 1', icon: '📿', category: 'recurring', paid: false },
        15: { name: 'Rằm',    icon: '🌕', category: 'recurring', paid: false }
    }
};

if (typeof window !== 'undefined') window.HOLIDAY_DATA = HOLIDAY_DATA;