'use strict';

const PAYROLL_CONFIG = {
  fixedEarnings: [
    { id: 'base',   name: 'Lương CB',      amount: 5939400, proRate: true },
    { id: 'job',    name: 'PC Công việc',  amount: 300000,  proRate: true },
    { id: 'gas',    name: 'PC Xăng xe',    amount: 400000,  proRate: true },
    { id: 'house',  name: 'PC Nhà ở',      amount: 500000,  proRate: true }
  ],
  bonus: {
    attendance: { name: 'Thưởng chuyên cần', amount: 300000, type: 'all-or-nothing' },
    appraisal:  { name: 'Thưởng khảo hạch',  amount: 500000, type: 'fixed' }
  },
  deductions: {
    insurancePct: 0.105,
    insuranceBase: 6239400,
    unionFee: 50000
  },
  paidHolidays: ['01-01', '04-30', '05-01', '09-02']
};