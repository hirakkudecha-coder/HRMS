const mongoose = require('mongoose');
const User = require('./models/User');
const Salary = require('./models/Salary');
const db = require('./config/db');

const getLastThreeMonths = () => {
  const list = [];
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const tempDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = tempDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    const lastDay = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    list.push({
      month: monthName,
      paidDays: lastDay.getDate(),
      paymentDate: lastDay
    });
  }
  return list;
};

const run = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hrms');
    
    const dynamicMonths = getLastThreeMonths();
    
    const salaryConfig = [
        { email: 'manager@apex.com', gross: 150000, basic: 75000, hra: 37500, education: 2000, nps: 7500, lunch: 3000, lta: 5000, shift: 5000, special: 15000 },
        { email: 'admin@apex.com', gross: 120000, basic: 60000, hra: 30000, education: 2000, nps: 6000, lunch: 3000, lta: 4000, shift: 4000, special: 11000 },
        { email: 'employee@apex.com', gross: 100000, basic: 50000, hra: 25000, education: 2000, nps: 5000, lunch: 2000, lta: 3000, shift: 3000, special: 10000 },
        { email: 'amit@apex.com', gross: 80000, basic: 40000, hra: 20000, education: 1000, nps: 4000, lunch: 2000, lta: 2500, shift: 2000, special: 8500 },
        { email: 'finance@apex.com', gross: 60000, basic: 30000, hra: 15000, education: 1000, nps: 3000, lunch: 1500, lta: 2000, shift: 1500, special: 6000 },
        { email: 'hr@apex.com', gross: 50000, basic: 25000, hra: 12500, education: 1000, nps: 2500, lunch: 1500, lta: 2000, shift: 1500, special: 4000 }
    ];

    for (const config of salaryConfig) {
      const user = await User.findOne({ email: config.email });
      if (user) {
        await Salary.deleteMany({ employee: user._id });
        const records = dynamicMonths.map(m => {
          const pfVal = Math.round(config.basic * 0.12);
          const ptVal = 200;
          const grossDeductionsVal = pfVal + ptVal;
          const netSalaryVal = config.gross - grossDeductionsVal;
          
          return {
            employee: user._id,
            month: m.month,
            basicSalary: config.basic,
            hra: config.hra,
            educationAllowance: config.education,
            npsAdhocPay: config.nps,
            lunchAllowance: config.lunch,
            monthlyLTA: config.lta,
            shiftAllowance: config.shift,
            adhocAllowance: config.special,
            grossEarnings: config.gross,
            pf: pfVal,
            professionalTax: ptVal,
            grossDeductions: grossDeductionsVal,
            netSalary: netSalaryVal,
            paidDays: m.paidDays,
            paymentStatus: 'Paid',
            paymentDate: m.paymentDate
          };
        });
        await Salary.insertMany(records);
        console.log(`- Seeded compliant salaries for ${config.email}`);
      } else {
        console.log(`- User not found: ${config.email}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err.message);
    process.exit(1);
  }
};

run();
