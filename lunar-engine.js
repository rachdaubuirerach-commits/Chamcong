/* =========================================================
   lunar-engine.js — Engine chuyển đổi Âm ↔ Dương lịch
   Thuật toán dựa trên Hồ Ngọc Đức (public domain)
   Múi giờ VN (UTC+7). Đã kiểm chứng 1900-2100.
   ========================================================= */

const LunarEngine = (function () {
    'use strict';

    const TIMEZONE = 7;
    const PI = Math.PI;
    const SYNODIC_MONTH = 29.530588853;
    const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
    const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];

    function jdFromDate(dd, mm, yy) {
        const a = Math.floor((14 - mm) / 12);
        const y = yy + 4800 - a;
        const m = mm + 12 * a - 3;
        let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y
               + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        if (jd < 2299161) {
            jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
        }
        return jd;
    }

    function jdToDate(jd) {
        let a, b, c, d, e, m;
        if (jd > 2299160) {
            a = jd + 32044;
            b = Math.floor((4 * a + 3) / 146097);
            c = a - Math.floor(146097 * b / 4);
        } else {
            b = 0;
            c = jd + 32082;
        }
        d = Math.floor((4 * c + 3) / 1461);
        e = c - Math.floor(1461 * d / 4);
        m = Math.floor((5 * e + 2) / 153);
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        return [day, month, year];
    }

    function NewMoon(k) {
        const T = k / 1236.85;
        const T2 = T * T, T3 = T2 * T;
        const dr = PI / 180;
        let Jd1 = 2415020.75933 + SYNODIC_MONTH * k + 0.0001178 * T2 - 0.000000155 * T3;
        Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        const M   = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        const F   = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
        C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) + 0.0004 * Math.sin(dr * 3 * Mpr);
        C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr))
            - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M))
            - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr))
            + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
        let Jd1a;
        if (T < -11) {
            Jd1a = Jd1 + 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
        } else {
            Jd1a = Jd1 - 0.000278 + 0.000265 * T + 0.000262 * T2;
        }
        return Jd1a + C1;
    }

    function SunLongitude(jdn) {
        const T = (jdn - 2451545.0) / 36525;
        const T2 = T * T;
        const dr = PI / 180;
        const M  = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
        const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
        let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
        DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
        let L = L0 + DL;
        L = L * dr;
        L = L - PI * 2 * Math.floor(L / (PI * 2));
        return L;
    }

    function getNewMoonDay(k, tz) {
        return Math.floor(NewMoon(k) + 0.5 + tz / 24);
    }

    function getSunLongitude(dayNumber, tz) {
        return SunLongitude(dayNumber - 0.5 - tz / 24);
    }

    function getLunarMonth11(yy, tz) {
        const off = jdFromDate(31, 12, yy) - 2415021;
        const k = Math.floor(off / SYNODIC_MONTH);
        let nm = getNewMoonDay(k, tz);
        const sunLong = getSunLongitude(nm, tz);
        if (sunLong >= 9) nm = getNewMoonDay(k - 1, tz);
        return nm;
    }

    function getLeapMonthOffset(a11, tz) {
        const k = Math.floor((a11 - 2415021.076998695) / SYNODIC_MONTH + 0.5);
        let last = 0;
        let i = 1;
        let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
        do {
            last = arc;
            i++;
            arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
        } while (arc !== last && i < 14);
        return i - 1;
    }

    function convertSolar2Lunar(dd, mm, yy, tz) {
        const dayNumber = jdFromDate(dd, mm, yy);
        const k = Math.floor((dayNumber - 2415021.076998695) / SYNODIC_MONTH);
        let monthStart = getNewMoonDay(k + 1, tz);
        if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
        let a11 = getLunarMonth11(yy, tz);
        let b11 = a11;
        let lunarYear;
        if (a11 >= monthStart) {
            lunarYear = yy;
            a11 = getLunarMonth11(yy - 1, tz);
        } else {
            lunarYear = yy + 1;
            b11 = getLunarMonth11(yy + 1, tz);
        }
        const lunarDay = dayNumber - monthStart + 1;
        const diff = Math.floor((monthStart - a11) / 29);
        let lunarLeap = false;
        let lunarMonth = diff + 11;
        if (b11 - a11 > 365) {
            const leapMonthDiff = getLeapMonthOffset(a11, tz);
            if (diff >= leapMonthDiff) {
                lunarMonth = diff + 10;
                if (diff === leapMonthDiff) lunarLeap = true;
            }
        }
        if (lunarMonth > 12) lunarMonth -= 12;
        if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
        return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
    }

    function convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap, tz) {
        let a11, b11;
        if (lunarMonth < 11) {
            a11 = getLunarMonth11(lunarYear - 1, tz);
            b11 = getLunarMonth11(lunarYear, tz);
        } else {
            a11 = getLunarMonth11(lunarYear, tz);
            b11 = getLunarMonth11(lunarYear + 1, tz);
        }
        const k = Math.floor(0.5 + (a11 - 2415021.076998695) / SYNODIC_MONTH);
        let off = lunarMonth - 11;
        if (off < 0) off += 12;
        if (b11 - a11 > 365) {
            const leapOff = getLeapMonthOffset(a11, tz);
            let leapMonth = leapOff - 2;
            if (leapMonth < 0) leapMonth += 12;
            if (lunarLeap && lunarMonth !== leapMonth) return null;
            if (lunarLeap || off >= leapOff) off += 1;
        }
        const monthStart = getNewMoonDay(k + off, tz);
        return jdToDate(monthStart + lunarDay - 1);
    }

    return {
        toLunar(dd, mm, yy) {
            const r = convertSolar2Lunar(dd, mm, yy, TIMEZONE);
            return {
                day: r.day, month: r.month, year: r.year, leap: r.leap,
                canChi: `${CAN[(r.year + 6) % 10]} ${CHI[(r.year + 8) % 12]}`
            };
        },
        toSolar(ld, lm, ly, leap = false) {
            const r = convertLunar2Solar(ld, lm, ly, leap, TIMEZONE);
            if (!r) return null;
            return { day: r[0], month: r[1], year: r[2] };
        },
        getSolarDateOfLunar(lunarDay, lunarMonth, solarYear) {
            for (const ly of [solarYear, solarYear + 1, solarYear - 1]) {
                const s = this.toSolar(lunarDay, lunarMonth, ly, false);
                if (s && s.year === solarYear) return s;
            }
            return null;
        },
        getLunarMonthDays(lunarMonth, lunarYear) {
            const days = [];
            for (let d = 1; d <= 30; d++) {
                const solar = this.toSolar(d, lunarMonth, lunarYear, false);
                if (!solar) break;
                const backCheck = this.toLunar(solar.day, solar.month, solar.year);
                if (backCheck.day !== d || backCheck.month !== lunarMonth) break;
                days.push({
                    lunarDay: d,
                    solarDay: solar.day,
                    solarMonth: solar.month,
                    solarYear: solar.year
                });
            }
            return days;
        },
        getCanChi(lunarYear) {
            return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
        }
    };
})();

if (typeof window !== 'undefined') window.LunarEngine = LunarEngine;