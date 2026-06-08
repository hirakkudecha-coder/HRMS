// Load environment variables
require('dotenv').config();

// Import express, database configuration, and modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');

// Import Mongoose Models for Auto-Seeding
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Task = require('./models/Task');
const Salary = require('./models/Salary');
const Notice = require('./models/Notice');
const Holiday = require('./models/Holiday');

// Import MVC Route Files
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const documentRoutes = require('./routes/documentRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const holidayRoutes = require('./routes/holidayRoutes');

// Initialize the Express Application
const app = express();

// 1. Establish Database Connection
connectDB();

// 2. Configure Global Middlewares
app.use(cors()); // Allow Cross-Origin Requests from React frontend
app.use(express.json()); // Enable JSON body parsing
app.use(express.urlencoded({ extended: true })); // Enable URL encoded parsing

// Create uploads directory on startup if it does not exist
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve the 'uploads' directory as public static folder
app.use('/uploads', express.static(uploadsPath));

// 3. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/holidays', holidayRoutes);

// Base route for API availability check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Apex HRMS API is online and fully operational.'
  });
});

// 4. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack || err.message);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 5. Automatic Database Seeding Engine
// Helper function to dynamically calculate details for the last three calendar months
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

const seedDemoData = async () => {
  try {
    // Force a database flush if the seeded salary records months are outdated
    const expectedMonths = getLastThreeMonths().map(m => m.month);
    const sampleSalaries = await Salary.find({}).select('month');
    const existingMonths = sampleSalaries.map(s => s.month);
    const hasOutdatedSalaries = expectedMonths.some(m => !existingMonths.includes(m));
    if (sampleSalaries.length > 0 && hasOutdatedSalaries) {
      console.log('Detected outdated salary records in database. Flushing database collections for dynamic re-seeding...');
      await Promise.all([
        User.deleteMany({}),
        Attendance.deleteMany({}),
        Leave.deleteMany({}),
        Task.deleteMany({}),
        Salary.deleteMany({}),
        Notice.deleteMany({}),
        Holiday.deleteMany({})
      ]);
    }

    // Force a database flush if the demo employee has the old region (India) or is missing, to ensure region is USA and password is reset
    const demoEmployee = await User.findOne({ email: 'employee@apex.com' });
    if (!demoEmployee || demoEmployee.employeeDetails?.region !== 'USA') {
      console.log('Detected missing or old demo employee region. Resetting database to apply USA region and restore default credentials...');
      await Promise.all([
        User.deleteMany({}),
        Attendance.deleteMany({}),
        Leave.deleteMany({}),
        Task.deleteMany({}),
        Salary.deleteMany({}),
        Notice.deleteMany({}),
        Holiday.deleteMany({})
      ]);
    }

    // Force a database flush if the Admin details are not configured, to apply backdated joiningDate
    const adminUser = await User.findOne({ email: 'admin@apex.com' });
    if (!adminUser || adminUser.employeeDetails?.employeeId !== 'ADM0001') {
      console.log('Detected missing or unconfigured Admin account. Resetting database to apply Admin details...');
      await Promise.all([
        User.deleteMany({}),
        Attendance.deleteMany({}),
        Leave.deleteMany({}),
        Task.deleteMany({}),
        Salary.deleteMany({}),
        Notice.deleteMany({}),
        Holiday.deleteMany({})
      ]);
    }

    // Check if there is incomplete RBAC support or missing Manager salary records, and clear database for clean complete re-seeding
    const managerExists = await User.findOne({ email: 'manager@apex.com' });
    let managerSalariesExist = false;
    if (managerExists) {
      const salCount = await Salary.countDocuments({ employee: managerExists._id });
      if (salCount > 0) managerSalariesExist = true;
    }

    if (!managerExists || !managerSalariesExist) {
      console.log('Detected missing Manager account or Manager salary records. Flushing database collections for full re-seeding...');
      await Promise.all([
        User.deleteMany({}),
        Attendance.deleteMany({}),
        Leave.deleteMany({}),
        Task.deleteMany({}),
        Salary.deleteMany({}),
        Notice.deleteMany({}),
        Holiday.deleteMany({})
      ]);
    }

    // Check if the India region employee is seeded, if not flush the database so they get seeded
    const indiaEmployeeExists = await User.findOne({ email: 'amit@apex.com' });
    if (!indiaEmployeeExists) {
      console.log('Detected missing India region employee (Amit Patel). Flushing database collections for complete re-seeding...');
      await Promise.all([
        User.deleteMany({}),
        Attendance.deleteMany({}),
        Leave.deleteMany({}),
        Task.deleteMany({}),
        Salary.deleteMany({}),
        Notice.deleteMany({}),
        Holiday.deleteMany({})
      ]);
    }

    // Check if admin salary records exist, if not flush for full re-seeding
    const adminExists = await User.findOne({ email: 'admin@apex.com' });
    let adminSalariesExist = false;
    if (adminExists) {
      const adminSalCount = await Salary.countDocuments({ employee: adminExists._id });
      if (adminSalCount > 0) adminSalariesExist = true;
    }
    if (!adminSalariesExist) {
      console.log('Detected missing Admin salary records. Flushing database collections for complete re-seeding...');
      await Promise.all([
        User.deleteMany({}),
        Attendance.deleteMany({}),
        Leave.deleteMany({}),
        Task.deleteMany({}),
        Salary.deleteMany({}),
        Notice.deleteMany({}),
        Holiday.deleteMany({})
      ]);
    }

    // Check if the Notice collection has records
    const noticeCount = await Notice.countDocuments();
    if (noticeCount === 0) {
      console.log('No notices found. Seeding default notices...');
      await Notice.create([
        {
          title: 'Quarterly Staff Virtual Townhall',
          content: 'Join the leadership team this Friday at 10:00 AM EST for our Q2 business alignment presentation and open employee Q&A session. A calendar invite has been sent.',
          category: 'Apex HR Bulletin',
          icon: '📢',
          postedDate: new Date('2026-05-24T10:00:00')
        },
        {
          title: 'Scheduled Server Infrastructure Upgrade',
          content: 'Our main DB instances will undergo scheduled optimization this coming Sunday between 02:00 AM and 05:00 AM EST. Access to the HRMS portal may be temporarily affected.',
          category: 'IT Operations Notice',
          icon: '🛠️',
          postedDate: new Date('2026-05-23T14:30:00')
        }
      ]);
      console.log('- Demo Notices Seeded');
    }

    // Check if Holiday collection is empty or has outdated holidays (wrong calendar year)
    const currentYear = new Date().getFullYear();
    const sampleHoliday = await Holiday.findOne({});
    if (sampleHoliday && new Date(sampleHoliday.date).getFullYear() !== currentYear) {
      console.log('Detected outdated holidays. Flushing holiday records for current year re-seeding...');
      await Holiday.deleteMany({});
    }

    const holidayCount = await Holiday.countDocuments({});
    if (holidayCount === 0) {
      console.log('No holidays found. Seeding dynamic Indian festivals & public holidays for the year...');
      await Holiday.create([
        { name: "New Year's Day", date: new Date(currentYear, 0, 1), description: 'Celebration of the new calendar year' },
        { name: 'Republic Day', date: new Date(currentYear, 0, 26), description: 'Anniversary of the Constitution of India' },
        { name: 'Holi Festival', date: new Date(currentYear, 2, 3), description: 'Festival of colors, marking the arrival of spring' },
        { name: 'Good Friday', date: new Date(currentYear, 3, 2), description: 'Christian holiday commemorating crucifixion' },
        { name: 'Ambedkar Jayanti', date: new Date(currentYear, 3, 14), description: 'Birthday of Dr. B. R. Ambedkar' },
        { name: 'May Day (Labor Day)', date: new Date(currentYear, 4, 1), description: 'Celebration of the international labor movement' },
        { name: 'Eid-ul-Fitr', date: new Date(currentYear, 5, 2), description: 'Islamic festival marking the end of Ramadan' },
        { name: 'Independence Day', date: new Date(currentYear, 7, 15), description: 'Anniversary of independence from British rule' },
        { name: 'Janmashtami', date: new Date(currentYear, 8, 4), description: 'Hindu festival celebrating the birth of Lord Krishna' },
        { name: 'Gandhi Jayanti', date: new Date(currentYear, 9, 2), description: 'Birthday of Mahatma Gandhi' },
        { name: 'Maha Navami / Dussehra', date: new Date(currentYear, 9, 19), description: 'Hindu festival victory of good over evil' },
        { name: 'Vijayadashami', date: new Date(currentYear, 9, 20), description: 'Hindu festival celebrating the end of Navratri' },
        { name: 'Diwali / Deepavali', date: new Date(currentYear, 10, 9), description: 'Festival of lights' },
        { name: 'Govardhan Puja', date: new Date(currentYear, 10, 10), description: 'Hindu festival honoring Lord Krishna' },
        { name: 'Christmas Day', date: new Date(currentYear, 11, 25), description: 'Celebration of the birth of Jesus Christ' }
      ]);
      console.log('- Demo Indian & Public Holidays Seeded');
    }

    // Check if the User collection has records
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already initialized. Skipping auto-seeding.');
      return;
    }

    console.log('Empty database detected! Initiating automatic HRMS demo data seeding...');

    // 5.1. Create Demo Administrator
    const admin = await User.create({
      name: 'Manager Admin',
      email: 'admin@apex.com',
      password: 'Password@123', // Will be hashed automatically by pre-save hook
      role: 'admin',
      employeeDetails: {
        employeeId: 'ADM0001',
        department: 'Administration',
        designation: 'System Administrator',
        region: 'USA',
        joiningDate: new Date('2023-01-15')
      }
    });
    console.log('- Demo Administrator Seeded: admin@apex.com');

    // 5.1.2. Create Demo Manager
    const manager = await User.create({
      name: 'Richard Roe',
      email: 'manager@apex.com',
      password: 'Password@123',
      role: 'manager',
      employeeDetails: {
        employeeId: 'MGR5521',
        department: 'Engineering',
        designation: 'Engineering Manager',
        phone: '+91 99999-55555',
        skills: ['Project Management', 'Agile Scrum', 'React.js', 'System Architecture'],
        region: 'India',
        joiningDate: new Date('2024-06-15')
      }
    });
    console.log('- Demo Manager Seeded: manager@apex.com');

    // 5.2. Create Demo Employee (Jane Doe)
    const employee = await User.create({
      name: 'Jane Doe',
      email: 'employee@apex.com',
      password: 'Password@123',
      role: 'employee',
      employeeDetails: {
        employeeId: 'EMP8842',
        department: 'Engineering',
        designation: 'Senior React Developer',
        phone: '+1 555-0142',
        skills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS', 'JavaScript', 'REST APIs'],
        region: 'USA',
        joiningDate: new Date('2025-01-10')
      }
    });
    console.log('- Demo Employee Seeded: employee@apex.com');

    // 5.2.2. Create Demo Employee in India Region (Amit Patel)
    const employeeIndia = await User.create({
      name: 'Amit Patel',
      email: 'amit@apex.com',
      password: 'Password@123',
      role: 'employee',
      employeeDetails: {
        employeeId: 'EMP8843',
        department: 'Engineering',
        designation: 'Software Engineer - Backend',
        phone: '+91 98765-43210',
        skills: ['Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Java', 'Spring Boot'],
        region: 'India',
        joiningDate: new Date('2025-03-01')
      }
    });
    console.log('- Demo India Employee Seeded: amit@apex.com');

    // 5.3. Seed Attendance History (Past 5 days for the Demo Employee)
    const attendanceRecords = [
      {
        employee: employee._id,
        date: '2026-05-20',
        checkIn: new Date('2026-05-20T09:02:15'),
        checkOut: new Date('2026-05-20T17:30:45'),
        status: 'Present',
        workHours: 8.48
      },
      {
        employee: employee._id,
        date: '2026-05-21',
        checkIn: new Date('2026-05-21T08:55:00'),
        checkOut: new Date('2026-05-21T18:00:10'),
        status: 'Present',
        workHours: 9.09
      },
      {
        employee: employee._id,
        date: '2026-05-22',
        checkIn: new Date('2026-05-22T10:15:30'), // Check-in after 10:00 AM
        checkOut: new Date('2026-05-22T18:05:00'),
        status: 'Late',
        workHours: 7.83
      },
      {
        employee: employee._id,
        date: '2026-05-23',
        checkIn: new Date('2026-05-23T09:00:00'),
        checkOut: new Date('2026-05-23T17:00:00'),
        status: 'Present',
        workHours: 8.00
      },
      {
        employee: employee._id,
        date: '2026-05-24',
        checkIn: new Date('2026-05-24T09:10:00'),
        checkOut: new Date('2026-05-24T12:30:00'), // Short hours (< 4 hours)
        status: 'Half Day',
        workHours: 3.33
      }
    ];
    await Attendance.insertMany(attendanceRecords);
    console.log('- Demo Attendance Logs Seeded');

    // Seed Attendance History for the India Employee (Amit Patel)
    const attendanceRecordsIndia = [
      {
        employee: employeeIndia._id,
        date: '2026-05-20',
        checkIn: new Date('2026-05-20T09:05:00'),
        checkOut: new Date('2026-05-20T17:35:00'),
        status: 'Present',
        workHours: 8.5
      },
      {
        employee: employeeIndia._id,
        date: '2026-05-21',
        checkIn: new Date('2026-05-21T08:58:00'),
        checkOut: new Date('2026-05-21T18:02:00'),
        status: 'Present',
        workHours: 9.07
      },
      {
        employee: employeeIndia._id,
        date: '2026-05-22',
        checkIn: new Date('2026-05-22T09:12:00'),
        checkOut: new Date('2026-05-22T17:15:00'),
        status: 'Late',
        workHours: 8.05
      },
      {
        employee: employeeIndia._id,
        date: '2026-05-23',
        checkIn: new Date('2026-05-23T09:00:00'),
        checkOut: new Date('2026-05-23T17:00:00'),
        status: 'Present',
        workHours: 8.00
      },
      {
        employee: employeeIndia._id,
        date: '2026-05-24',
        checkIn: new Date('2026-05-24T09:00:00'),
        checkOut: new Date('2026-05-24T12:00:00'),
        status: 'Half Day',
        workHours: 3.00
      }
    ];
    await Attendance.insertMany(attendanceRecordsIndia);
    console.log('- Demo India Employee Attendance Logs Seeded');

    // 5.4. Seed Leave Records (1 Approved Sick Leave, 1 Pending Casual Leave)
    const leaveRecords = [
      {
        employee: employee._id,
        leaveType: 'Sick',
        startDate: new Date('2026-05-12'),
        endDate: new Date('2026-05-13'),
        reason: 'Severe fever and doctor recommended bed rest',
        status: 'Approved'
      },
      {
        employee: employee._id,
        leaveType: 'Casual',
        startDate: new Date('2026-06-02'),
        endDate: new Date('2026-06-02'),
        reason: 'Personal family occasion at hometown',
        status: 'Pending'
      }
    ];
    await Leave.insertMany(leaveRecords);
    console.log('- Demo Leave History Seeded');

    // Seed Leave History for the India Employee (Amit Patel)
    const leaveRecordsIndia = [
      {
        employee: employeeIndia._id,
        leaveType: 'Casual',
        startDate: new Date('2026-05-18'),
        endDate: new Date('2026-05-18'),
        reason: 'Doctor consultation appointment',
        status: 'Approved'
      },
      {
        employee: employeeIndia._id,
        leaveType: 'Sick',
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-11'),
        reason: 'Dental treatment extraction recovery',
        status: 'Pending'
      }
    ];
    await Leave.insertMany(leaveRecordsIndia);
    console.log('- Demo India Employee Leave History Seeded');

    // 5.5. Seed Task Assignments
    const taskRecords = [
      {
        employee: employee._id,
        title: 'Refactor Authentication Layout',
        description: 'Update the styling of the login cards to match the new dark glassmorphic layout standard.',
        priority: 'High',
        status: 'Completed',
        deadline: new Date('2026-05-25')
      },
      {
        employee: employee._id,
        title: 'Integrate Dynamic Payslip Generator',
        description: 'Connect the frontend salary details slip page to the new backend PDFKit stream download endpoint.',
        priority: 'High',
        status: 'In Progress',
        deadline: new Date('2026-05-30')
      },
      {
        employee: employee._id,
        title: 'Write Jest API Route Tests',
        description: 'Implement unit testing suites for user auth logins, checking file upload exceptions, and token protections.',
        priority: 'Medium',
        status: 'To Do',
        deadline: new Date('2026-06-08')
      }
    ];
    await Task.insertMany(taskRecords);
    console.log('- Demo Tasks Seeded');

    // Seed Task Assignments for India Employee (Amit Patel)
    const taskRecordsIndia = [
      {
        employee: employeeIndia._id,
        title: 'Implement Spring Boot Security',
        description: 'Secure all microservices communication channels using OAuth2 and JWT authorizations.',
        priority: 'High',
        status: 'Completed',
        deadline: new Date('2026-05-24')
      },
      {
        employee: employeeIndia._id,
        title: 'Optimize Database Query Indexes',
        description: 'Improve search response speed for historical employee attendance lists by analyzing profiling indexes.',
        priority: 'High',
        status: 'In Progress',
        deadline: new Date('2026-05-29')
      },
      {
        employee: employeeIndia._id,
        title: 'Write API documentation Swagger specs',
        description: 'Generate complete API structure specifications inside Swagger / OpenAPI for partner integrations.',
        priority: 'Low',
        status: 'To Do',
        deadline: new Date('2026-06-12')
      }
    ];
    await Task.insertMany(taskRecordsIndia);
    console.log('- Demo India Employee Tasks Seeded');

    // 5.6. Seed Salary Records (Past 3 months of payslips in INR with all Pay Heads)
    const dynamicMonths = getLastThreeMonths();

    const salaryRecords = [
      {
        employee: employee._id,
        month: dynamicMonths[2].month,
        basicSalary: 60000,
        hra: 30000,
        adhocAllowance: 36000,
        educationAllowance: 2000,
        npsAdhocPay: 6000,
        lunchAllowance: 3000,
        monthlyLTA: 8000,
        shiftAllowance: 5000,
        grossEarnings: 150000,
        pf: 7200,
        professionalTax: 200,
        grossDeductions: 7400,
        netSalary: 142600,
        paidDays: dynamicMonths[2].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[2].paymentDate
      },
      {
        employee: employee._id,
        month: dynamicMonths[1].month,
        basicSalary: 60000,
        hra: 30000,
        adhocAllowance: 36000,
        educationAllowance: 2000,
        npsAdhocPay: 6000,
        lunchAllowance: 3000,
        monthlyLTA: 8000,
        shiftAllowance: 5000,
        grossEarnings: 150000,
        pf: 7200,
        professionalTax: 200,
        grossDeductions: 7400,
        netSalary: 142600,
        paidDays: dynamicMonths[1].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[1].paymentDate
      },
      {
        employee: employee._id,
        month: dynamicMonths[0].month,
        basicSalary: 60000,
        hra: 30000,
        adhocAllowance: 36000,
        educationAllowance: 2000,
        npsAdhocPay: 6000,
        lunchAllowance: 3000,
        monthlyLTA: 8000,
        shiftAllowance: 5000,
        grossEarnings: 150000,
        pf: 7200,
        professionalTax: 200,
        grossDeductions: 7400,
        netSalary: 142600,
        paidDays: dynamicMonths[0].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[0].paymentDate
      }
    ];
    await Salary.insertMany(salaryRecords);
    console.log('- Demo Salary Slip History Seeded');

    // Seed Salary Records for the India Employee (Amit Patel)
    const salaryRecordsIndia = [
      {
        employee: employeeIndia._id,
        month: dynamicMonths[2].month,
        basicSalary: 40000,
        hra: 20000,
        adhocAllowance: 20000,
        educationAllowance: 2000,
        npsAdhocPay: 4000,
        lunchAllowance: 2000,
        monthlyLTA: 5000,
        shiftAllowance: 2000,
        grossEarnings: 95000,
        pf: 4800,
        professionalTax: 200,
        grossDeductions: 5000,
        netSalary: 90000,
        paidDays: dynamicMonths[2].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[2].paymentDate
      },
      {
        employee: employeeIndia._id,
        month: dynamicMonths[1].month,
        basicSalary: 40000,
        hra: 20000,
        adhocAllowance: 20000,
        educationAllowance: 2000,
        npsAdhocPay: 4000,
        lunchAllowance: 2000,
        monthlyLTA: 5000,
        shiftAllowance: 2000,
        grossEarnings: 95000,
        pf: 4800,
        professionalTax: 200,
        grossDeductions: 5000,
        netSalary: 90000,
        paidDays: dynamicMonths[1].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[1].paymentDate
      },
      {
        employee: employeeIndia._id,
        month: dynamicMonths[0].month,
        basicSalary: 40000,
        hra: 20000,
        adhocAllowance: 20000,
        educationAllowance: 2000,
        npsAdhocPay: 4000,
        lunchAllowance: 2000,
        monthlyLTA: 5000,
        shiftAllowance: 2000,
        grossEarnings: 95000,
        pf: 4800,
        professionalTax: 200,
        grossDeductions: 5000,
        netSalary: 90000,
        paidDays: dynamicMonths[0].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[0].paymentDate
      }
    ];
    await Salary.insertMany(salaryRecordsIndia);
    console.log('- Demo India Employee Salary Slip History Seeded');

    // Seed salary records for the Manager (Richard Roe)
    const managerSalaryRecords = [
      {
        employee: manager._id,
        month: dynamicMonths[2].month,
        basicSalary: 100000,
        hra: 50000,
        adhocAllowance: 40000,
        educationAllowance: 5000,
        npsAdhocPay: 10000,
        lunchAllowance: 5000,
        monthlyLTA: 10000,
        shiftAllowance: 0,
        grossEarnings: 220000,
        pf: 12000,
        professionalTax: 200,
        grossDeductions: 12200,
        netSalary: 207800,
        paidDays: dynamicMonths[2].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[2].paymentDate
      },
      {
        employee: manager._id,
        month: dynamicMonths[1].month,
        basicSalary: 100000,
        hra: 50000,
        adhocAllowance: 40000,
        educationAllowance: 5000,
        npsAdhocPay: 10000,
        lunchAllowance: 5000,
        monthlyLTA: 10000,
        shiftAllowance: 0,
        grossEarnings: 220000,
        pf: 12000,
        professionalTax: 200,
        grossDeductions: 12200,
        netSalary: 207800,
        paidDays: dynamicMonths[1].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[1].paymentDate
      },
      {
        employee: manager._id,
        month: dynamicMonths[0].month,
        basicSalary: 100000,
        hra: 50000,
        adhocAllowance: 40000,
        educationAllowance: 5000,
        npsAdhocPay: 10000,
        lunchAllowance: 5000,
        monthlyLTA: 10000,
        shiftAllowance: 0,
        grossEarnings: 220000,
        pf: 12000,
        professionalTax: 200,
        grossDeductions: 12200,
        netSalary: 207800,
        paidDays: dynamicMonths[0].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[0].paymentDate
      }
    ];
    await Salary.insertMany(managerSalaryRecords);
    console.log('- Demo Manager Salary Slip History Seeded');

    // Seed salary records for the Admin (Manager Admin)
    const adminSalaryRecords = [
      {
        employee: admin._id,
        month: dynamicMonths[2].month,
        basicSalary: 120000,
        hra: 60000,
        adhocAllowance: 50000,
        educationAllowance: 8000,
        npsAdhocPay: 15000,
        lunchAllowance: 8000,
        monthlyLTA: 15000,
        shiftAllowance: 0,
        grossEarnings: 276000,
        pf: 14400,
        professionalTax: 200,
        grossDeductions: 14600,
        netSalary: 261400,
        paidDays: dynamicMonths[2].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[2].paymentDate
      },
      {
        employee: admin._id,
        month: dynamicMonths[1].month,
        basicSalary: 120000,
        hra: 60000,
        adhocAllowance: 50000,
        educationAllowance: 8000,
        npsAdhocPay: 15000,
        lunchAllowance: 8000,
        monthlyLTA: 15000,
        shiftAllowance: 0,
        grossEarnings: 276000,
        pf: 14400,
        professionalTax: 200,
        grossDeductions: 14600,
        netSalary: 261400,
        paidDays: dynamicMonths[1].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[1].paymentDate
      },
      {
        employee: admin._id,
        month: dynamicMonths[0].month,
        basicSalary: 120000,
        hra: 60000,
        adhocAllowance: 50000,
        educationAllowance: 8000,
        npsAdhocPay: 15000,
        lunchAllowance: 8000,
        monthlyLTA: 15000,
        shiftAllowance: 0,
        grossEarnings: 276000,
        pf: 14400,
        professionalTax: 200,
        grossDeductions: 14600,
        netSalary: 261400,
        paidDays: dynamicMonths[0].paidDays,
        paymentStatus: 'Paid',
        paymentDate: dynamicMonths[0].paymentDate
      }
    ];
    await Salary.insertMany(adminSalaryRecords);
    console.log('- Demo Admin Salary Slip History Seeded');

    console.log('Database auto-seeding successfully completed! App is ready.');
  } catch (err) {
    console.error('Database Auto-Seeding Failed:', err.message);
  }
};

// 6. Launch Express Server Listener
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

global.io = io;

io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, async () => {
  console.log(`HRMS Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (WS Enabled)`);
  
  // Seed demo data once the server launches successfully
  await seedDemoData();
});
