# Apex HRMS API Testing Guide (cURL Examples)

This document contains standard `cURL` commands to test the Apex HRMS Employee Module backend endpoints. You can run these commands from your PowerShell, Command Prompt, or Git Bash terminal.

The Express server runs on `http://localhost:5000` by default.

---

## 1. Authentication System

### 1.1. User Login (Retrieve JWT Token)
Run this command to authenticate and retrieve your Bearer JWT token:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"employee@apex.com\", \"password\": \"Password@123\"}"
```
**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "name": "Jane Doe",
    "email": "employee@apex.com",
    "role": "employee"
  }
}
```

> 💡 **IMPORTANT:** Copy the `token` string from the response. In all subsequent requests, replace `YOUR_JWT_TOKEN` with this copied token.

### 1.2. Fetch Logged-in Profile Session
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.3. Change Account Password
Change your account password by sending the current and new password values:
```bash
curl -X PUT http://localhost:5000/api/auth/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\": \"Password@123\", \"newPassword\": \"NewPassword@123\"}"
```

---

## 2. Employee Profile & Avatar Updates

### 2.1. Update Skills and Phone Number
```bash
curl -X PUT http://localhost:5000/api/employee/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+1 555-9999\", \"skills\": \"React, Node.js, Express, MongoDB, DevOps\"}"
```

---

## 3. Attendance Management

### 3.1. Daily Check-In Timestamp
Log your check-in event. If it is after 10:00 AM, the database flags the record as `Late`.
```bash
curl -X POST http://localhost:5000/api/attendance/checkin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.2. Daily Check-Out Timestamp
Log your check-out event. This calculates the decimal worked hours between check-in and out. If total hours are under 4, it flags the status as `Half Day`.
```bash
curl -X POST http://localhost:5000/api/attendance/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.3. Fetch Monthly Attendance Logs Summary
```bash
curl -X GET http://localhost:5000/api/attendance/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. Leave Management

### 4.1. Apply for Leave
Types supported: `Casual`, `Sick`, `Paid`, `Unpaid`.
```bash
curl -X POST http://localhost:5000/api/leaves \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"leaveType\": \"Casual\", \"startDate\": \"2026-06-10\", \"endDate\": \"2026-06-12\", \"reason\": \"Family wedding trip\"}"
```

### 4.2. Get Leaves History & Current Balances
```bash
curl -X GET http://localhost:5000/api/leaves \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.3. Cancel Pending Leave Request
Replace `LEAVE_ID_HERE` with the `_id` of a pending leave request from the leave list:
```bash
curl -X PUT http://localhost:5000/api/leaves/LEAVE_ID_HERE/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. Task Management

### 5.1. Fetch Assigned Tasks Checklists
```bash
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.2. Transition Task status
Transitions a task card to `In Progress` or `Completed`. Replace `TASK_ID_HERE` with the task's database ID:
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"Completed\"}"
```

---

## 6. Salary & PDF Downloads

### 6.1. Get Monthly Salary Slips History
```bash
curl -X GET http://localhost:5000/api/salary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6.2. Download Dynamic PDF Payslip
Stream a dynamic, styled PDF payslip directly from the server. Replace `SALARY_ID_HERE` with one of the salary IDs:
```bash
curl -o payslip.pdf -X GET http://localhost:5000/api/salary/SALARY_ID_HERE/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
> 💾 This command downloads the binary PDF stream and saves it locally as a file named `payslip.pdf` in your active command line folder!
