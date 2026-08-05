const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Salary = require('./backend/models/Salary');
const db = require('./backend/config/db');

const getLastThreeMonths = () => {
  const list = [];
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const tempDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = tempDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Get last day of that specific month
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
    console.log("Connected");
    
    const dynamicMonths = getLastThreeMonths();
    console.log("Dynamic months:", dynamicMonths);
    
    const salaryConfig = [
        { email: 'employee@apex.com', gross: 100000, basic: 50000, hra: 25000, education: 2000, nps: 5000, lunch: 2000, lta: 3000, shift: 3000, special: 10000 }
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
        console.log("Records to insert:", records);
        await Salary.insertMany(records);
        console.log('Inserted!');
      } else {
        console.log("User not found!");
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

run();
