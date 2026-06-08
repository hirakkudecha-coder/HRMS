// Import React, hooks, icons, and API client
import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  Clock,
  ClipboardList,
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  UserCheck,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

const ManagerPortal = () => {
  const { user } = useContext(AuthContext);

  // Active sub-tab state linked to URL Search Query parameter (?tab=...)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // API Integrated States
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState({ today: [], history: [] });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Task Form input states
  const [taskForm, setTaskForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    priority: 'Medium',
    deadline: ''
  });

  // Fetch all department-wide data from backend REST APIs
  const fetchPortalData = async () => {
    try {
      setLoading(true);
      
      const [empRes, leavesRes, tasksRes, attendanceRes] = await Promise.all([
        api.get('/employee/department'),
        api.get('/leaves/department'),
        api.get('/tasks/department'),
        api.get('/attendance/department')
      ]);

      if (empRes.data.success) setEmployees(empRes.data.employees);
      if (leavesRes.data.success) setLeaves(leavesRes.data.leaves);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (attendanceRes.data.success) setAttendance(attendanceRes.data);

      // Pre-select first employee in task form if available
      if (empRes.data.employees && empRes.data.employees.length > 0) {
        setTaskForm(prev => ({ ...prev, employeeId: empRes.data.employees[0]._id }));
      }

    } catch (err) {
      console.error('Failed to load manager portal data:', err.message);
      triggerBanner('danger', 'Error loading department data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [user]);

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

    socket.on('task_update', () => {
      console.log('Real-time task update detected. Refreshing...');
      fetchPortalData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Display feedback banner
  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

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

  // Delegate / Assign a task
  const handleDelegateTask = async (e) => {
    e.preventDefault();
    const { employeeId, title, description, priority, deadline } = taskForm;

    if (!employeeId || !title || !description || !deadline) {
      triggerBanner('danger', 'Please enter all required task fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/tasks/delegate', {
        employeeId,
        title,
        description,
        priority,
        deadline
      });

      if (res.data.success) {
        triggerBanner('success', 'Task assigned and delegated successfully!');
        
        // Reset form but retain employee selection
        setTaskForm(prev => ({
          ...prev,
          title: '',
          description: '',
          deadline: ''
        }));

        fetchPortalData();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to delegate task.');
    } finally {
      setSubmitting(false);
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

  // Determine task priority badge styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Determine task status badge styling
  const getTaskStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

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
  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;

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

        {/* Assigned/Pending Tasks */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-indigo-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Active Tasks</p>
              <h4 className="text-3xl font-extrabold text-white mt-2">{pendingTasksCount}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Tasks in progress or checklist</span>
        </div>
      </div>

      {/* Glass Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-slate-900/30 p-1.5 rounded-2xl backdrop-blur-md max-w-lg">
        {['Overview', 'Leave Approvals', 'Task Delegator', 'Attendance Logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === tab
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab Panel Views */}
      
      {/* 1. OVERVIEW TEAM ROSTER PANEL */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

      {/* 3. TASK DELEGATOR PANEL */}
      {activeTab === 'Task Delegator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Task Form */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 self-start border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>✍️</span> Delegate Task
            </h3>
            
            <form onSubmit={handleDelegateTask} className="space-y-5">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Team Member</label>
                <select
                  className="glass-input cursor-pointer"
                  value={taskForm.employeeId}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  disabled={submitting}
                >
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeDetails?.designation || 'Staff'} - {emp.employeeDetails?.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
                <input
                  type="text"
                  placeholder="Task title or milestone name"
                  className="glass-input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Description</label>
                <textarea
                  rows="3"
                  placeholder="Explain requirements, deliverables, and expectation..."
                  className="glass-input resize-none"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={submitting}
                ></textarea>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority Level</label>
                <select
                  className="glass-input cursor-pointer"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Completion Deadline</label>
                <input
                  type="date"
                  className="glass-input"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting}
                className="glass-btn w-full mt-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Delegate Task</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Assigned Tasks Tracking List */}
          <div className="lg:col-span-2 glass-panel rounded-3xl bg-slate-900/20 overflow-hidden self-start border border-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>📋</span> Task Progress Tracker
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-brand-accent font-bold">
                Live Status
              </span>
            </div>

            {tasks.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-6 py-4">Assigned To</th>
                      <th className="px-6 py-4">Task Details</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden text-xs">
                            {task.employee?.employeeDetails?.profileImage ? (
                              <img
                                src={`http://localhost:5000${task.employee.employeeDetails.profileImage}`}
                                alt={task.employee?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              task.employee?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <span className="block font-bold text-white leading-none text-xs">{task.employee?.name}</span>
                            <span className="text-[9px] text-slate-500 mt-1 block">{task.employee?.employeeDetails?.region}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="block font-semibold text-slate-200">{task.title}</span>
                          <span className="text-xs text-slate-500 font-medium block max-w-sm truncate" title={task.description}>
                            {task.description}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-300 text-xs">
                          {formatDate(task.deadline)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTaskStatusBadge(task.status)}`}>
                            {task.status}
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
                <p className="text-sm font-medium">No tasks delegated to department employees.</p>
              </div>
            )}
          </div>
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
