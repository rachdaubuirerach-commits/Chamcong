/* =========================================================
   holiday-resolver.js — Chuyển lễ âm → dương, gộp 2 hệ
   Cache theo năm để tăng tốc
   ========================================================= */

const HolidayResolver = (function () {
    'use strict';

    const _solarMapCache = {};
    const _lunarMapCache = {};

    function buildSolarYearMap(year) {
        if (_solarMapCache[year]) return _solarMapCache[year];
        const map = {};

        Object.entries(HOLIDAY_DATA.solar).forEach(([mmdd, info]) => {
            const key = `${year}-${mmdd}`;
            if (!map[key]) map[key] = [];
            map[key].push({ ...info, system: 'solar' });
        });

        Object.entries(HOLIDAY_DATA.lunar).forEach(([mmdd, info]) => {
            const [lm, ld] = mmdd.split('-').map(Number);
            const solar = LunarEngine.getSolarDateOfLunar(ld, lm, year);
            if (solar) {
                const key = `${solar.year}-${String(solar.month).padStart(2,'0')}-${String(solar.day).padStart(2,'0')}`;
                if (!map[key]) map[key] = [];
                map[key].push({ ...info, system: 'lunar', lunarDate: `${ld}/${lm}` });
            }
        });

        _solarMapCache[year] = map;
        return map;
    }

    function buildLunarMonthMap(lunarMonth, lunarYear) {
        const cacheKey = `${lunarMonth}-${lunarYear}`;
        if (_lunarMapCache[cacheKey]) return _lunarMapCache[cacheKey];

        const days = LunarEngine.getLunarMonthDays(lunarMonth, lunarYear);
        const map = {};

        days.forEach(d => {
            const holidays = [];

            const mmdd = `${String(lunarMonth).padStart(2,'0')}-${String(d.lunarDay).padStart(2,'0')}`;
            if (HOLIDAY_DATA.lunar[mmdd]) {
                holidays.push({ ...HOLIDAY_DATA.lunar[mmdd], system: 'lunar' });
            }

            if (HOLIDAY_DATA.recurring[d.lunarDay]) {
                holidays.push({ ...HOLIDAY_DATA.recurring[d.lunarDay], system: 'recurring' });
            }

            const solarKey = `${String(d.solarMonth).padStart(2,'0')}-${String(d.solarDay).padStart(2,'0')}`;
            if (HOLIDAY_DATA.solar[solarKey]) {
                holidays.push({ ...HOLIDAY_DATA.solar[solarKey], system: 'solar' });
            }

            map[`${d.lunarDay}`] = holidays;
        });

        _lunarMapCache[cacheKey] = map;
        return map;
    }

    return {
        getSolarDayHolidays(ds) {
            const year = parseInt(ds.split('-')[0]);
            const map = buildSolarYearMap(year);
            return map[ds] || [];
        },
        getLunarDayHolidays(lunarDay, lunarMonth, lunarYear) {
            const map = buildLunarMonthMap(lunarMonth, lunarYear);
            return map[`${lunarDay}`] || [];
        },
        getPaidHoliday(ds) {
            return this.getSolarDayHolidays(ds).find(h => h.paid) || null;
        },
        clearCache() {
            Object.keys(_solarMapCache).forEach(k => delete _solarMapCache[k]);
            Object.keys(_lunarMapCache).forEach(k => delete _lunarMapCache[k]);
        }
    };
})();

if (typeof window !== 'undefined') window.HolidayResolver = HolidayResolver;