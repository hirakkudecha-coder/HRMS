// Import React hooks, icons, and context
import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  BellRing,
  ArrowRight,
  FileDown,
  CreditCard
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // Real-time clock state
  const [time, setTime] = useState(new Date());

  // API Integrated States
  const [attendance, setAttendance] = useState({ checkedIn: false, checkedOut: false, onBreak: false, record: null });
  const [leaves, setLeaves] = useState({ balances: { Casual: 10, Sick: 10, Paid: 15 }, history: [] });
  const [tasks, setTasks] = useState({ counts: { total: 0, todo: 0, inProgress: 0, completed: 0 }, tasks: [] });
  const [notices, setNotices] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [departmentLeaves, setDepartmentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [downloadingId, setDownloadingId] = useState(null);

  // Update ticking clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all dashboard summary data from backend REST APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Call APIs concurrently for fast loading times
      const [attendanceRes, leavesRes, tasksRes, noticesRes, salaryRes, deptLeavesRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/leaves'),
        api.get('/tasks'),
        api.get('/notices').catch(err => {
          console.error('Failed to load notices API:', err.message);
          return { data: { success: false, notices: [] } };
        }),
        api.get('/salary').catch(err => {
          console.error('Failed to load salary API:', err.message);
          return { data: { success: false, slips: [] } };
        }),
        api.get('/leaves/department').catch(err => {
          console.error('Failed to load department leaves API:', err.message);
          return { data: { success: false, leaves: [] } };
        })
      ]);

      if (attendanceRes.data.success) setAttendance(attendanceRes.data);
      if (leavesRes.data.success) setLeaves(leavesRes.data);
      if (tasksRes.data.success) setTasks(tasksRes.data);
      if (noticesRes && noticesRes.data && noticesRes.data.success) {
        setNotices(noticesRes.data.notices);
      }
      if (salaryRes && salaryRes.data && salaryRes.data.success) {
        setSalaries(salaryRes.data.slips);
      }
      if (deptLeavesRes && deptLeavesRes.data && deptLeavesRes.data.success) {
        setDepartmentLeaves(deptLeavesRes.data.leaves);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
      showBanner('danger', 'Error connecting to server. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Setup real-time Socket.io listeners to refresh dashboard data dynamically
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Dashboard connected to real-time notification socket');
    });

    socket.on('attendance_update', () => {
      console.log('Real-time attendance update detected on Dashboard. Refreshing...');
      fetchDashboardData();
    });

    socket.on('leave_update', () => {
      console.log('Real-time leave update detected on Dashboard. Refreshing...');
      fetchDashboardData();
    });

    socket.on('task_update', () => {
      console.log('Real-time task update detected on Dashboard. Refreshing...');
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Helper to show visual warning/success message banner
  const showBanner = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Perform daily check-in call
  const handleCheckIn = async () => {
    try {
      const res = await api.post('/attendance/checkin');
      if (res.data.success) {
        showBanner('success', res.data.message || 'Checked in successfully!');
        // Refresh dashboard statistics
        fetchDashboardData();
      }
    } catch (err) {
      showBanner('danger', err.response?.data?.message || 'Check-in failed');
    }
  };

  // Perform daily check-out call
  const handleCheckOut = async () => {
    try {
      const res = await api.post('/attendance/checkout');
      if (res.data.success) {
        showBanner('success', 'Checked out successfully! Shift logged.');
        fetchDashboardData();
      }
    } catch (err) {
      showBanner('danger', err.response?.data?.message || 'Check-out failed');
    }
  };

  // Start a break
  const handleBreakIn = async () => {
    try {
      const res = await api.post('/attendance/breakin');
      if (res.data.success) {
        showBanner('success', 'Break started successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      showBanner('danger', err.response?.data?.message || 'Failed to start break');
    }
  };

  // End a break
  const handleBreakOut = async () => {
    try {
      const res = await api.post('/attendance/breakout');
      if (res.data.success) {
        showBanner('success', 'Break ended successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      showBanner('danger', err.response?.data?.message || 'Failed to end break');
    }
  };

  // Quick mark a task as completed directly from the checklist on the Dashboard
  const handleQuickCompleteTask = async (taskId) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: 'Completed' });
      if (res.data.success) {
        showBanner('success', 'Task checked off as completed! Excellent.');
        fetchDashboardData();
      }
    } catch (err) {
      showBanner('danger', 'Failed to update task.');
    }
  };

  // Securely download payslip PDF as a binary blob file
  const handleDownloadPayslip = async (salaryId, monthString) => {
    try {
      setDownloadingId(salaryId);
      const res = await api.get(`/salary/${salaryId}/download`, {
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.setAttribute('download', `payslip-${monthString.replace(' ', '_')}.pdf`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
      showBanner('success', `Payslip for ${monthString} downloaded successfully!`);
    } catch (err) {
      console.error('Download Payslip Failed:', err.message);
      showBanner('danger', 'Could not generate or stream payslip PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Timezone mapper helper
  const regionTimeZones = {
    'India': 'Asia/Kolkata',
    'USA': 'America/New_York',
    'UK': 'Europe/London',
    'Russia': 'Europe/Moscow'
  };
  const employeeTimeZone = regionTimeZones[user?.employeeDetails?.region] || 'Asia/Kolkata';

  // Format real-time ticking clock display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: employeeTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date display
  const formatDateString = (date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: employeeTimeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format timeline event time (HH:MM AM/PM)
  const formatEventTime = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleTimeString('en-US', {
      timeZone: employeeTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate dynamic real-time worked hours if currently checked in
  const getLiveWorkedHours = () => {
    if (attendance.checkedIn && !attendance.checkedOut && attendance.record?.checkIn) {
      const checkInMs = new Date(attendance.record.checkIn).getTime();
      const currentMs = time.getTime();

      // 1. Calculate completed breaks duration
      let completedBreaksMs = 0;
      const breaks = attendance.record?.breaks || [];
      breaks.forEach(b => {
        if (b.breakIn && b.breakOut) {
          completedBreaksMs += new Date(b.breakOut).getTime() - new Date(b.breakIn).getTime();
        }
      });

      // 2. If currently on break, calculate active break duration
      let activeBreakMs = 0;
      const openBreak = breaks.find(b => !b.breakOut);
      if (openBreak) {
        activeBreakMs = Math.max(0, currentMs - new Date(openBreak.breakIn).getTime());
      }

      const diffMs = Math.max(0, currentMs - checkInMs - completedBreaksMs - activeBreakMs);
      return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }
    if (attendance.checkedOut && attendance.record?.workHours !== undefined) {
      return attendance.record.workHours;
    }
    return 0.0;
  };

  // Calculate target compulsory checkout time (check-in + 8 hours, or fixed at 05:00 PM if on-time)
  const getTargetCheckoutTime = () => {
    if (attendance.checkedIn && attendance.record?.checkIn) {
      const checkInDate = new Date(attendance.record.checkIn);
      
      // Get check-in time in the employee's timezone
      const localTimeString = checkInDate.toLocaleTimeString('en-US', {
        timeZone: employeeTimeZone,
        hour12: false
      });
      const [localHour, localMinute] = localTimeString.split(':').map(Number);

      // Standard shift window is 09:00 AM to 05:00 PM.
      // If check-in is on-time (at or before 09:00 AM local time), target checkout is fixed at 05:00 PM.
      if (localHour < 9 || (localHour === 9 && localMinute === 0)) {
        return '05:00 PM';
      }

      // If check-in is late (after 09:00 AM local time), target checkout is dynamically extended to Check-In + 8 Hours.
      const targetDate = new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000);
      return targetDate.toLocaleTimeString('en-US', {
        timeZone: employeeTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return null;
  };

  const isLeaveActiveToday = (startDateStr, endDateStr) => {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return todayZero >= startZero && todayZero <= endZero;
  };

  const formatLeavePeriod = (startDateStr, endDateStr) => {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (todayZero >= startZero && todayZero <= endZero) {
      return 'On Leave Today';
    }

    const startOption = { month: 'short', day: 'numeric' };
    const endOption = { month: 'short', day: 'numeric' };
    if (start.getFullYear() !== today.getFullYear()) {
      startOption.year = '2-digit';
    }
    const localStart = start.toLocaleDateString('en-US', startOption);
    const localEnd = end.toLocaleDateString('en-US', endOption);
    
    return localStart === localEnd ? localStart : `${localStart} - ${localEnd}`;
  };

  const colleaguesOnLeaveToday = departmentLeaves
    .filter(l => {
      if (l.status !== 'Approved') return false;
      const isCurrentUser = l.employee?._id === user?._id || l.employee === user?._id || l.employee?._id === user?.id || l.employee === user?.id;
      if (isCurrentUser) return false;
      const today = new Date();
      const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(l.endDate);
      const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return endZero >= todayZero;
    })
    .sort((a, b) => {
      const today = new Date();
      const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const startA = new Date(a.startDate);
      const startZeroA = new Date(startA.getFullYear(), startA.getMonth(), startA.getDate());
      
      const startB = new Date(b.startDate);
      const startZeroB = new Date(startB.getFullYear(), startB.getMonth(), startB.getDate());

      const isActiveA = todayZero >= startZeroA;
      const isActiveB = todayZero >= startZeroB;

      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;

      return startZeroA - startZeroB;
    });

  if (loading && !attendance.record) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Visual Response Message Banner */}
      {message.text && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 animate-slideDown ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Timezone Shift & Compulsory Hours Alert Banner */}
      {attendance.checkedIn && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 animate-fadeIn ${
          getLiveWorkedHours() >= 8
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <Clock className={`w-5 h-5 flex-shrink-0 ${getLiveWorkedHours() >= 8 ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} style={{ animationDuration: '4s' }} />
          <span className="text-sm font-medium">
            {getLiveWorkedHours() >= 8 ? (
              <><strong>Compulsory 8 Hours Completed!</strong> You are eligible to check out safely from your flexible shift in region <strong>{user?.employeeDetails?.region || 'India'}</strong>.</>
            ) : (
              <><strong>Flexible Shift In-Progress:</strong> You have logged <strong>{getLiveWorkedHours().toFixed(2)} hours</strong> in region <strong>{user?.employeeDetails?.region || 'India'}</strong>. Compulsory checkout target is at <strong>{getTargetCheckoutTime()}</strong> local time.</>
            )}
          </span>
        </div>
      )}

      {/* Hero Welcome & Check-In Widget Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Personal Greetings Panel */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8 bg-slate-900/20 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
          {/* Subtle decoration gradient */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-accent/10 blur-3xl group-hover:bg-brand-accent/20 transition-all duration-500"></div>
          
          <div>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
              Employee Workspace Portal
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-4 tracking-tight leading-tight">
              Have a wonderful work shift, <br />
              <span className="text-brand-accent">{user?.name}</span>!
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-md">
              Review your tasks, verify monthly leave balances, log daily attendance, and download PDF payslips.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/5">
            <span className="text-xs text-slate-400 font-medium">Quick details:</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
              Department: <strong className="text-white font-semibold">{user?.employeeDetails?.department}</strong>
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
              Region: <strong className="text-white font-semibold">{user?.employeeDetails?.region || 'India'}</strong>
            </span>
          </div>
        </div>

        {/* Right Side: Visual Ticking Clock and Check-In Action Card */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 border-brand-accent/10 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-indigo-400 to-violet-500"></div>
          
          {/* Digital Time Ticker */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Clock className="w-4 h-4 text-brand-accent" />
              <span>Current Time ({user?.employeeDetails?.region || 'India'})</span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-widest font-mono select-none drop-shadow-md">
              {formatTime(time)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{formatDateString(time)}</p>
            {attendance.checkedIn && (
              <div className="flex flex-col gap-2 mt-2.5 items-center">
                <div className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5 animate-pulse">
                  <span>Target Checkout: <strong>{getTargetCheckoutTime()}</strong></span>
                </div>
                {attendance.onBreak && (
                  <div className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5 animate-pulse">
                    <span>☕ Currently on Break</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Trigger check-in / check-out button */}
          <div className="w-full mt-6">
            {!attendance.checkedIn ? (
              <button
                onClick={handleCheckIn}
                className="w-full glass-btn text-sm py-3.5"
              >
                <LogIn className="w-4 h-4 animate-bounce" />
                <span>Check In for Shift</span>
              </button>
            ) : !attendance.checkedOut ? (
              attendance.onBreak ? (
                <button
                  onClick={handleBreakOut}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl px-6 py-3.5 transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  <Clock className="w-4 h-4" />
                  <span>End Break (Resume Shift)</span>
                </button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleCheckOut}
                    className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-semibold rounded-xl px-6 py-3.5 transition-all duration-300 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Check Out from Shift</span>
                  </button>
                  <button
                    onClick={handleBreakIn}
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold rounded-xl px-6 py-3.5 transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start Break</span>
                  </button>
                </div>
              )
            ) : (
              <div className="w-full p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Today's Shift Completed!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Shift Timeline Section ───────────────────────────────────────── */}
      {attendance.checkedIn && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 relative overflow-hidden animate-[fadeIn_0.4s_ease-out]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-brand-accent"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⏱️</span> Live Shift Progression Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualizing checks, breaks, and active work hours logged in your local region.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
                attendance.checkedOut 
                  ? 'bg-slate-500' 
                  : attendance.onBreak 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
              }`}></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                attendance.checkedOut 
                  ? 'text-slate-400' 
                  : attendance.onBreak 
                    ? 'text-amber-400' 
                    : 'text-emerald-400'
              }`}>
                {attendance.checkedOut 
                  ? 'Shift Completed' 
                  : attendance.onBreak 
                    ? 'On Break' 
                    : 'Active Shift'}
              </span>
            </div>
          </div>
          
          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
            {/* 1. Check-In Node */}
            <div className="relative">
              <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                ✓
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm font-bold text-white">Shift Checked In</span>
                <span className="text-[11px] text-slate-500 font-mono">({formatEventTime(attendance.record?.checkIn)})</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Shift started officially in region {user?.employeeDetails?.region || 'India'}.</p>
            </div>

            {/* 2. Break Events */}
            {attendance.record?.breaks?.map((b, idx) => (
              <React.Fragment key={idx}>
                {/* Break Start */}
                <div className="relative">
                  <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                    ☕
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm font-bold text-white">Break {idx + 1} Started</span>
                    <span className="text-[11px] text-slate-500 font-mono">({formatEventTime(b.breakIn)})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Pause active working hours.</p>
                </div>

                {/* Break End */}
                <div className="relative">
                  {b.breakOut ? (
                    <>
                      <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                        ✓
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-sm font-bold text-white">Break {idx + 1} Ended</span>
                        <span className="text-[11px] text-slate-500 font-mono">({formatEventTime(b.breakOut)})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Resumed shift activity.</p>
                    </>
                  ) : (
                    <>
                      <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-[10px] text-amber-400 animate-ping"></span>
                      <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-[10px] text-amber-400 z-10 font-bold">
                        ☕
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-sm font-bold text-amber-400">Active Break in Progress...</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Pause active working hours.</p>
                    </>
                  )}
                </div>
              </React.Fragment>
            ))}

            {/* 3. Live Active Shift Node */}
            {attendance.checkedIn && !attendance.checkedOut && !attendance.onBreak && (
              <div className="relative">
                <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 animate-ping"></span>
                <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 z-10 font-bold">
                  ⚡
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm font-bold text-emerald-400">Shift In-Progress (Active)</span>
                  <span className="text-[11px] text-slate-500 font-mono">({formatTime(time)})</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Currently tracking live worked duration.</p>
              </div>
            )}

            {/* 4. Check-Out Node */}
            {attendance.checkedOut && (
              <div className="relative">
                <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                  ✓
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm font-bold text-white">Shift Checked Out</span>
                  <span className="text-[11px] text-slate-500 font-mono">({formatEventTime(attendance.record?.checkOut)})</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Today's work shift has been logged with total {attendance.record?.workHours?.toFixed(2) || 0} hours.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of Key Numerical Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hours Logged Today Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-brand-accent flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Today's Hours</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {getLiveWorkedHours().toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">/ 8.0 hrs</span>
            </h4>
            {attendance.checkedIn && (
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    getLiveWorkedHours() >= 8 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-brand-accent shadow-lg shadow-brand-accent/20'
                  }`}
                  style={{ width: `${Math.min(100, (getLiveWorkedHours() / 8) * 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Leaves Remaining Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-success flex-shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Leaves Balance</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {leaves.balances.Casual + leaves.balances.Sick + leaves.balances.Paid}{' '}
              <span className="text-xs text-slate-400 font-normal">avail. days</span>
            </h4>
          </div>
        </div>

        {/* Task Completion Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-brand-danger flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Tasks Checklist</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {tasks.counts.completed} / {tasks.counts.total}{' '}
              <span className="text-xs text-slate-400 font-normal">completed</span>
            </h4>
          </div>
        </div>

        {/* Quick Payslip Download Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Quick Payslip</p>
              {salaries.length > 0 ? (
                <div className="mt-1">
                  <h4 className="text-sm font-bold text-white truncate">{salaries[0].month}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Net: ₹{salaries[0].netSalary.toLocaleString('en-IN')}</p>
                </div>
              ) : (
                <h4 className="text-sm font-bold text-slate-500 mt-1">N/A</h4>
              )}
            </div>
          </div>
          {salaries.length > 0 && (
            <button
              onClick={() => handleDownloadPayslip(salaries[0]._id, salaries[0].month)}
              disabled={downloadingId === salaries[0]._id}
              className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
              title={`Download PDF for ${salaries[0].month}`}
            >
              {downloadingId === salaries[0]._id ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileDown className="w-4.5 h-4.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Visual Leave balances & Assigned Tasks Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side (Col span 1): Leave category trackers & Colleagues on Leave Today */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/20 space-y-6">
            <h3 className="text-lg font-bold text-white">Leave Balance</h3>
            
            <div className="space-y-4">
              {/* Casual Leave Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Casual Leave</span>
                  <span className="text-brand-accent">{leaves.balances.Casual} / 10 remaining</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-brand-accent transition-all duration-500" 
                    style={{ width: `${(leaves.balances.Casual / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Sick Leave Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Sick Leave</span>
                  <span className="text-brand-success">{leaves.balances.Sick} / 10 remaining</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-brand-success transition-all duration-500" 
                    style={{ width: `${(leaves.balances.Sick / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Paid Leave Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Paid Annual Leave</span>
                  <span className="text-amber-400">{leaves.balances.Paid} / 15 remaining</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 transition-all duration-500" 
                    style={{ width: `${(leaves.balances.Paid / 15) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Colleagues on Leave Today */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/20 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🌴</span> Colleagues on Leave
            </h3>
            {colleaguesOnLeaveToday.length > 0 ? (
              <div className="space-y-3">
                {colleaguesOnLeaveToday.map((leave) => (
                  <div key={leave._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{leave.employee?.name || 'Colleague'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{leave.leaveType} Leave</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      isLeaveActiveToday(leave.startDate, leave.endDate)
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-brand-accent border border-indigo-500/20'
                    }`}>
                      {formatLeavePeriod(leave.startDate, leave.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                <CheckCircle className="w-8 h-8 text-emerald-500/30 mb-2" />
                <p className="text-xs">All department team members are active today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Side (Col span 2): Active Task Check-offs List */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-slate-900/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Upcoming Tasks Checklist</h3>
              <span className="text-xs font-semibold bg-white/5 text-slate-300 px-2.5 py-1 rounded-lg">
                Pending: {tasks.counts.todo + tasks.counts.inProgress}
              </span>
            </div>

            {/* Filter and display only To Do or In Progress tasks */}
            {tasks.tasks.filter(t => t.status !== 'Completed').length > 0 ? (
              <div className="space-y-3">
                {tasks.tasks
                  .filter(t => t.status !== 'Completed')
                  .slice(0, 3) // Show top 3 pending tasks
                  .map((task) => (
                    <div 
                      key={task._id} 
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3.5 group"
                    >
                      <button
                        onClick={() => handleQuickCompleteTask(task._id)}
                        className="w-5 h-5 mt-0.5 rounded-lg border-2 border-slate-600 hover:border-brand-success flex items-center justify-center cursor-pointer transition-colors"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-brand-success opacity-0 group-hover:opacity-40 transition-opacity" />
                      </button>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            task.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : task.priority === 'Medium' 
                                ? 'bg-amber-500/10 text-amber-400' 
                                : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-1">{task.description}</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                          Deadline: {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-500/30 mb-2 animate-bounce" />
                <p className="text-sm">Hooray! No pending tasks assigned.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
            <a 
              href="/tasks" 
              className="text-xs text-brand-accent hover:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>View full checklist board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Admin Bulletin Board Announcement Section */}
      <div className="glass-panel rounded-3xl p-6 bg-slate-900/20">
        <div className="flex items-center gap-2 mb-6">
          <BellRing className="w-5 h-5 text-brand-accent animate-pulse" />
          <h3 className="text-lg font-bold text-white">Notice Bulletin Board</h3>
        </div>

        {notices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notices.map((notice) => {
              const isHR = notice.category.toLowerCase().includes('hr');
              return (
                <div key={notice._id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold ${
                    isHR ? 'bg-brand-accent/10 text-brand-accent' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {notice.icon || '📢'}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isHR ? 'text-brand-accent' : 'text-amber-500'
                    }`}>
                      {notice.category}
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-1">{notice.title}</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {notice.content}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-3 block font-semibold">
                      Posted: {new Date(notice.postedDate || notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <BellRing className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
            <p className="text-sm">No new corporate announcements posted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
