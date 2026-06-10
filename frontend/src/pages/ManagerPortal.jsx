// Import hooks, icons, and API client
import { useState, useEffect, useContext, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  Clock,
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

const ManagerPortal = () => {
  const { user, shiftActive } = useContext(AuthContext);

  // Active sub-tab state linked to URL Search Query parameter (?tab=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // API Integrated States
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [attendance, setAttendance] = useState({ today: [], history: [] });
  const [expandedTimesheetId, setExpandedTimesheetId] = useState(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Display feedback banner (declared early to avoid use-before-define issues)
  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

  // Fetch all department-wide data from backend REST APIs
  const fetchPortalData = async () => {
    try {
      setLoading(true);
      
      // Verify active shift status first to avoid race conditions during check-out socket broadcasts
      const checkRes = await api.get('/attendance/today');
      if (!checkRes.data.success || !checkRes.data.checkedIn) {
        return;
      }

      const [empRes, leavesRes, timesheetsRes, attendanceRes] = await Promise.all([
        api.get('/employee/department'),
        api.get('/leaves/department'),
        api.get('/timesheets/department'),
        api.get('/attendance/department')
      ]);

      if (empRes.data.success) setEmployees(empRes.data.employees);
      if (leavesRes.data.success) setLeaves(leavesRes.data.leaves);
      if (timesheetsRes.data.success) setTimesheets(timesheetsRes.data.timesheets);
      if (attendanceRes.data.success) setAttendance(attendanceRes.data);

    } catch (err) {
      if (err.response?.status === 403) {
        // Silently skip locked/checked-out errors as the layout is transitioning
        return;
      }
      console.error('Failed to load manager portal data:', err.message);
      triggerBanner('danger', 'Error loading department data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPortalData();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, shiftActive]);

  // Setup real-time Socket.io listeners to refresh data dynamically on live updates
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to real-time notification socket');
    });

    socket.on('attendance_update', () => {
      console.log('Real-time attendance update detected. Refreshing...');
      fetchPortalData();
    });

    socket.on('leave_update', () => {
      console.log('Real-time leave update detected. Refreshing...');
      fetchPortalData();
    });

    socket.on('timesheet_update', () => {
      console.log('Real-time timesheet update detected. Refreshing...');
      fetchPortalData();
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);



  // Format date display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format short timestamp / local check-in time
  const formatTime = (timeStr, region) => {
    if (!timeStr) return '--:--';
    const d = new Date(timeStr);
    const timeZoneMap = {
      'India': 'Asia/Kolkata',
      'USA': 'America/New_York',
      'UK': 'Europe/London',
      'Russia': 'Europe/Moscow'
    };
    const tZone = timeZoneMap[region] || 'Asia/Kolkata';
    return d.toLocaleTimeString('en-US', {
      timeZone: tZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Approve / Reject pending leaves
  const handleUpdateLeaveStatus = async (leaveId, status) => {
    try {
      const res = await api.put(`/leaves/${leaveId}/status`, { status });
      if (res.data.success) {
        triggerBanner('success', `Leave request has been successfully ${status.toLowerCase()}!`);
        // Reload all data to refresh statistics
        fetchPortalData();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to update leave status.');
    }
  };

  // Approve / Reject pending timesheets
  const handleUpdateTimesheetStatus = async (timesheetId, status, rejectionReason = '') => {
    try {
      const res = await api.put(`/timesheets/${timesheetId}/status`, { status, rejectionReason });
      if (res.data.success) {
        triggerBanner('success', `Timesheet has been successfully ${status.toLowerCase()}!`);
        fetchPortalData();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to update timesheet status.');
    }
  };

  // Determine attendance badge styling
  const getAttendanceStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Late':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Half Day':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Absent':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Determine leave request badge styling
  const getLeaveStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Cancelled':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse';
    }
  };

  // Standard text loading fallback
  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Overview Stats
  const teamSize = employees.length;
  const activeCheckins = attendance.today.length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const pendingTimesheetsCount = timesheets.filter(t => t.status === 'Submitted').length;

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

  const teamMembersOnLeaveToday = leaves
    .filter(l => {
      if (l.status !== 'Approved') return false;
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

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Page Title & Scoped Department Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Manager Control Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Delegate operational duties, verify daily shifts, and govern leave applications.
          </p>
        </div>
        <div className="px-5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 self-start md:self-auto flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
          <span className="text-sm font-bold text-indigo-300">
            Dept: {user?.employeeDetails?.department || 'Engineering'}
          </span>
        </div>
      </div>

      {/* Response Alert Banner */}
      {banner.text && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 animate-slideDown ${
          banner.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{banner.text}</span>
        </div>
      )}

      {/* Quick Status Numerical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Team Size Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-brand-accent">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Department Roster</p>
              <h4 className="text-3xl font-extrabold text-white mt-2">{teamSize}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Engineering Staff Members</span>
        </div>

        {/* Checked In Staff */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-emerald-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Today Checked-In</p>
              <h4 className="text-3xl font-extrabold text-white mt-2">{activeCheckins}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Checked in this shift today</span>
        </div>

        {/* Pending Leaves */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-amber-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Pending Leaves</p>
              <h4 className="text-3xl font-extrabold text-white mt-2">
                {pendingLeavesCount}
              </h4>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Awaiting review decisions</span>
        </div>

        {/* Pending Timesheets */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-indigo-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Pending Timesheets</p>
              <h4 className="text-3xl font-extrabold text-white mt-2">{pendingTimesheetsCount}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Daily logs awaiting approval</span>
        </div>
      </div>

      {/* Glass Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-slate-900/30 p-1.5 rounded-2xl backdrop-blur-md max-w-xl overflow-x-auto gap-1">
        {['Overview', 'Leave Approvals', 'Timesheet Approvals', 'Attendance Logs'].map((tab) => {
          let badgeCount = 0;
          if (tab === 'Leave Approvals') badgeCount = pendingLeavesCount;
          if (tab === 'Timesheet Approvals') badgeCount = pendingTimesheetsCount;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab}</span>
              {badgeCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel Views */}
      
      {/* 1. OVERVIEW TEAM ROSTER PANEL */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Live Status Map */}
          <div className="lg:col-span-3 glass-panel rounded-3xl p-6 bg-slate-900/20 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span>Team Live Status Map</span>
              </h3>
              <div className="flex gap-4 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Active ({employees.filter(emp => {
                    const rec = attendance.today.find(r => r.employee?._id === emp._id || r.employee === emp._id);
                    return rec && !rec.checkOut && !(rec.breaks && rec.breaks.length > 0 && rec.breaks[rec.breaks.length - 1].breakIn && !rec.breaks[rec.breaks.length - 1].breakOut);
                  }).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>On Break ({employees.filter(emp => {
                    const rec = attendance.today.find(r => r.employee?._id === emp._id || r.employee === emp._id);
                    return rec && !rec.checkOut && (rec.breaks && rec.breaks.length > 0 && rec.breaks[rec.breaks.length - 1].breakIn && !rec.breaks[rec.breaks.length - 1].breakOut);
                  }).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  <span>Off-Duty ({employees.filter(emp => {
                    const rec = attendance.today.find(r => r.employee?._id === emp._id || r.employee === emp._id);
                    return !rec || rec.checkOut;
                  }).length})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {employees.map(emp => {
                const rec = attendance.today.find(r => r.employee?._id === emp._id || r.employee === emp._id);
                let status = 'Off-Duty';
                let statusColor = 'bg-slate-800 border-slate-700 text-slate-400';
                let indicatorColor = 'bg-slate-600';
                
                if (rec && !rec.checkOut) {
                  const hasActiveBreak = rec.breaks && rec.breaks.length > 0 && 
                                        rec.breaks[rec.breaks.length - 1].breakIn && 
                                        !rec.breaks[rec.breaks.length - 1].breakOut;
                  if (hasActiveBreak) {
                    status = 'On Break';
                    statusColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                    indicatorColor = 'bg-amber-500';
                  } else {
                    status = 'Active';
                    statusColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                    indicatorColor = 'bg-emerald-500';
                  }
                }

                return (
                  <div key={emp._id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center space-y-2.5 animate-[fadeIn_0.3s_ease-out]">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden text-lg">
                        {emp.employeeDetails?.profileImage ? (
                          <img
                            src={`http://localhost:5000${emp.employeeDetails.profileImage}`}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          emp.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-slate-950 ${indicatorColor}`} />
                    </div>
                    <div>
                      <span className="block font-bold text-white text-xs truncate max-w-[100px]" title={emp.name}>{emp.name}</span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[100px] mt-0.5 block">{emp.employeeDetails?.designation || 'Staff'}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
              {employees.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-xs">No team members to show.</div>
              )}
            </div>
          </div>

          {/* Main Content: Team Roster Directory (col-span-2) */}
          <div className="lg:col-span-2 glass-panel rounded-3xl bg-slate-900/20 overflow-hidden self-start">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>👥</span> Team Roster Directory
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-semibold">
                Total {employees.length} Members
              </span>
            </div>

            {employees.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Role / Title</th>
                      <th className="px-6 py-4">Operating Region</th>
                      <th className="px-6 py-4">Contact Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden">
                            {emp.employeeDetails?.profileImage ? (
                              <img
                                src={`http://localhost:5000${emp.employeeDetails.profileImage}`}
                                alt={emp.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="block font-bold text-white leading-none">{emp.name}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">{emp.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                          {emp.employeeDetails?.employeeId || 'MGR-TBD'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="block font-semibold text-slate-300">{emp.employeeDetails?.designation}</span>
                          <span className="text-[10px] text-indigo-400 capitalize">{emp.role}</span>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <span className="px-2 py-1 rounded bg-slate-800 text-[10px] border border-slate-700 text-slate-300">
                            {emp.employeeDetails?.region || 'India'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                          {emp.employeeDetails?.phone || 'No phone supplied'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <AlertCircle className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
                <p className="text-sm font-medium">No employee team roster records found.</p>
              </div>
            )}
          </div>

          {/* Side Content: Team Members on Leave Today (col-span-1) */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/20 space-y-4 self-start">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🌴</span> Team Members on Leave Today
            </h3>
            {teamMembersOnLeaveToday.length > 0 ? (
              <div className="space-y-3">
                {teamMembersOnLeaveToday.map((leave) => (
                  <div key={leave._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{leave.employee?.name || 'Employee'}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{leave.employee?.employeeDetails?.designation || 'Staff'}</p>
                      <p className="text-xs text-slate-400 mt-1">{leave.leaveType} Leave</p>
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
                <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mb-2" />
                <p className="text-xs text-center text-slate-400">All team members are active today.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LEAVE APPROVALS PANEL */}
      {activeTab === 'Leave Approvals' && (
        <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>📋</span> Leave Approval Console
            </h3>
            <p className="text-slate-500 text-xs mt-1">Approve or reject leave applications submitted by Engineering department members.</p>
          </div>

          {leaves.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Leave Category</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Detailed Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden">
                          {leave.employee?.employeeDetails?.profileImage ? (
                            <img
                              src={`http://localhost:5000${leave.employee.employeeDetails.profileImage}`}
                              alt={leave.employee?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            leave.employee?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <span className="block font-bold text-white leading-none">{leave.employee?.name}</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">{leave.employee?.employeeDetails?.designation || 'Staff'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {leave.leaveType} Leave
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="block font-medium text-slate-300">
                          {formatDate(leave.startDate)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          to {formatDate(leave.endDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getLeaveStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateLeaveStatus(leave._id, 'Approved')}
                              className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1 font-semibold text-xs border border-emerald-500/20"
                              title="Approve Request"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateLeaveStatus(leave._id, 'Rejected')}
                              className="p-1.5 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1 font-semibold text-xs border border-rose-500/20"
                              title="Reject Request"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold select-none italic">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
              <p className="text-sm font-medium">No department leave requests found.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. TIMESHEET APPROVALS PANEL */}
      {activeTab === 'Timesheet Approvals' && (
        <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>📋</span> Timesheet Approvals Console
            </h3>
            <p className="text-slate-500 text-xs mt-1">Review and approve daily project hours submitted by team members.</p>
          </div>

          {timesheets.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Logged Date</th>
                    <th className="px-6 py-4 text-center">Total Hours</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {timesheets.map((ts) => {
                    const isExpanded = expandedTimesheetId === ts._id;

                    return (
                      <Fragment key={ts._id}>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden">
                              {ts.employee?.employeeDetails?.profileImage ? (
                                <img
                                  src={`http://localhost:5000${ts.employee.employeeDetails.profileImage}`}
                                  alt={ts.employee?.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                ts.employee?.name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div>
                              <span className="block font-bold text-white leading-none">{ts.employee?.name}</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">{ts.employee?.employeeDetails?.designation || 'Staff'} ({ts.employee?.employeeDetails?.region})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-white">
                            {formatDate(ts.date)}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-white">
                            {ts.totalHours} hrs
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getLeaveStatusBadge(ts.status)}`}>
                              {ts.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => setExpandedTimesheetId(isExpanded ? null : ts._id)}
                                className="p-1.5 rounded-lg text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                              </button>
                              
                              {ts.status === 'Submitted' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateTimesheetStatus(ts._id, 'Approved')}
                                    className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1 font-semibold text-xs border border-emerald-500/20"
                                    title="Approve Timesheet"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = window.prompt('Please enter a reason for rejecting this timesheet:');
                                      if (reason === null) return;
                                      if (!reason.trim()) {
                                        alert('Rejection reason is required.');
                                        return;
                                      }
                                      handleUpdateTimesheetStatus(ts._id, 'Rejected', reason);
                                    }}
                                    className="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1 font-semibold text-xs border border-rose-500/20"
                                    title="Reject Timesheet"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Timesheet Entries Area */}
                        {isExpanded && (
                          <tr className="bg-slate-950/40">
                            <td colSpan="5" className="px-6 py-4">
                              <div className="p-4 rounded-2xl border border-white/5 bg-slate-950/60 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Breakdown</h4>
                                  <span className="text-xs text-slate-300 font-bold">Total: {ts.totalHours} hrs</span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="text-slate-500 border-b border-white/5 uppercase font-semibold text-[10px] tracking-wider">
                                        <th className="pb-2 w-1/3">Project / Client</th>
                                        <th className="pb-2 w-1/2">Activity Description</th>
                                        <th className="pb-2 text-right">Hours Logged</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-slate-300">
                                      {ts.entries.map((entry, idx) => (
                                        <tr key={idx}>
                                          <td className="py-2.5 font-bold text-white">{entry.project}</td>
                                          <td className="py-2.5 text-slate-400" title={entry.description}>{entry.description}</td>
                                          <td className="py-2.5 text-right font-bold text-white">{entry.hours} hrs</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {ts.status === 'Rejected' && ts.rejectionReason && (
                                  <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                                    <span className="font-bold">Rejection Feedback:</span> "{ts.rejectionReason}"
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
              <p className="text-sm font-medium">No department timesheets logged.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. TEAM ATTENDANCE LOGS PANEL */}
      {activeTab === 'Attendance Logs' && (
        <div className="space-y-8">
          {/* Today's Shifts Check-In Board */}
          <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>⚡</span> Today's Shift Logs
              </h3>
              <p className="text-slate-500 text-xs mt-1">Live active status of employees in their respective timezones (EST, IST, GMT, MSK).</p>
            </div>

            {attendance.today.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Check-In Time</th>
                      <th className="px-6 py-4">Check-Out Time</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {attendance.today.map((rec) => (
                      <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden">
                            {rec.employee?.employeeDetails?.profileImage ? (
                              <img
                                src={`http://localhost:5000${rec.employee.employeeDetails.profileImage}`}
                                alt={rec.employee?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              rec.employee?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <span className="block font-bold text-white leading-none">{rec.employee?.name}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">Region: {rec.employee?.employeeDetails?.region}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">
                          {formatTime(rec.checkIn, rec.employee?.employeeDetails?.region)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-400">
                          {rec.checkOut ? formatTime(rec.checkOut, rec.employee?.employeeDetails?.region) : 'Pending Out'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {rec.workHours ? `${rec.workHours} hours` : 'Ongoing'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getAttendanceStatusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Clock className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
                <p className="text-sm font-medium">No check-ins logged for today's timezone shifts yet.</p>
              </div>
            )}
          </div>

          {/* Historical Attendance Sheet */}
          <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>📜</span> Historical Shift Logsheets
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-semibold">
                Archived Records
              </span>
            </div>

            {attendance.history.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Check-In Time</th>
                      <th className="px-6 py-4">Check-Out Time</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {attendance.history.map((rec) => (
                      <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white whitespace-nowrap text-xs">
                          {formatDate(rec.date)}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden text-xs">
                            {rec.employee?.employeeDetails?.profileImage ? (
                              <img
                                src={`http://localhost:5000${rec.employee.employeeDetails.profileImage}`}
                                alt={rec.employee?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              rec.employee?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <span className="block font-bold text-white leading-none text-xs">{rec.employee?.name}</span>
                            <span className="text-[9px] text-slate-500 mt-1 block">{rec.employee?.employeeDetails?.region}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                          {formatTime(rec.checkIn, rec.employee?.employeeDetails?.region)}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                          {rec.checkOut ? formatTime(rec.checkOut, rec.employee?.employeeDetails?.region) : '--:--'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {rec.workHours ? `${rec.workHours} hours` : '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getAttendanceStatusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <AlertCircle className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
                <p className="text-sm font-medium">No historic department attendance logs logged.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerPortal;
