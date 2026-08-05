const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const db = require('./config/db');

const run = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hrms');
    
    const employee = await User.findOne({ email: 'employee@apex.com' });
    if (!employee) return console.log('No employee found');

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
    console.log('Inserted');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
};

run();
