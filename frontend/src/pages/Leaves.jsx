// Import React, API client, icons
import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, FileText, Send, XCircle, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

const Leaves = () => {
  const { user } = useContext(AuthContext);
  // Leave balances & history state
  const [balances, setBalances] = useState({ Casual: 10, Sick: 10, Paid: 15 });
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [departmentLeaves, setDepartmentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Form input states
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // UI Action states
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Fetch leave balances and application records
  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves');
      if (res.data.success) {
        setHistory(res.data.history);
        setBalances(res.data.balances);
      }
    } catch (err) {
      console.error('Failed to load leave records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch corporate holidays list dynamically from backend
  const fetchHolidays = async () => {
    try {
      const res = await api.get('/holidays');
      if (res.data.success) {
        setHolidays(res.data.holidays);
      }
    } catch (err) {
      console.error('Failed to load corporate holidays:', err.message);
    }
  };

  // Fetch department leaves list dynamically from backend
  const fetchDepartmentLeaves = async () => {
    try {
      const res = await api.get('/leaves/department');
      if (res.data.success) {
        setDepartmentLeaves(res.data.leaves);
      }
    } catch (err) {
      console.error('Failed to load department leaves:', err.message);
    }
  };

  useEffect(() => {
    fetchLeaveData();
    fetchHolidays();
    fetchDepartmentLeaves();
  }, []);

  // Setup real-time Socket.io listeners to refresh leave lists and accrual balances
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

    socket.on('connect', () => {
      console.log('Leaves page connected to real-time notification socket');
    });

    socket.on('leave_update', () => {
      console.log('Real-time leave update detected on Leaves page. Refreshing...');
      fetchLeaveData();
      fetchDepartmentLeaves();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Display feedback banner
  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

  // Submit leave form
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason) {
      triggerBanner('danger', 'Please enter all required fields.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      triggerBanner('danger', 'Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leaves', { leaveType, startDate, endDate, reason });
      if (res.data.success) {
        triggerBanner('success', res.data.message || 'Leave applied successfully!');
        
        // Reset form inputs
        setStartDate('');
        setEndDate('');
        setReason('');
        
        // Reload leave history, balances, and department leaves
        fetchLeaveData();
        fetchDepartmentLeaves();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel pending leave request
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;

    try {
      const res = await api.put(`/leaves/${leaveId}/cancel`);
      if (res.data.success) {
        triggerBanner('success', 'Leave application cancelled successfully.');
        fetchLeaveData();
        fetchDepartmentLeaves();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Cancellation failed.');
    }
  };

  // Format date display
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Determine badge styling based on leave status
  const getStatusBadge = (status) => {
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

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Leave Management
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Apply for new leaves, track accrued balances, and check approval records.
        </p>
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

      {/* Leave Balances Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Casual Leaves Counter */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-brand-accent">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Casual Leave Balance</p>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {balances.Casual} <span className="text-sm text-slate-400 font-normal">/ 10 days</span>
          </h4>
        </div>

        {/* Sick Leaves Counter */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-brand-success">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Sick Leave Balance</p>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {balances.Sick} <span className="text-sm text-slate-400 font-normal">/ 10 days</span>
          </h4>
        </div>

        {/* Paid Leaves Counter */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-amber-400">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Paid Annual Leave</p>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {balances.Paid} <span className="text-sm text-slate-400 font-normal">/ 15 days</span>
          </h4>
        </div>
      </div>

      {/* Form and History Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Apply Leave Panel */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 self-start">
          <h3 className="text-lg font-bold text-white mb-6">Apply for Leave</h3>
          
          <form onSubmit={handleApplyLeave} className="space-y-5">
            {/* Leave Type Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Leave Category</label>
              <select
                className="glass-input cursor-pointer"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                disabled={submitting}
              >
                <option value="Casual">Casual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Paid">Paid Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  className="glass-input"
                  style={{ paddingLeft: '3rem' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  className="glass-input"
                  style={{ paddingLeft: '3rem' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detailed Reason</label>
              <div className="relative">
                <span className="absolute top-3 left-4 text-slate-500 pointer-events-none">
                  <FileText className="w-4 h-4" />
                </span>
                <textarea
                  rows="3"
                  className="glass-input resize-none"
                  style={{ paddingLeft: '3rem' }}
                  placeholder="Explain the purpose of this leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                ></textarea>
              </div>
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
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Applied Leave History Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl bg-slate-900/20 overflow-hidden self-start">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">Leave Requests History</h3>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-semibold">
              Track Status
            </span>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Leave Duration</th>
                    <th className="px-6 py-4">Reason Statement</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {history.map((leave) => (
                    <tr key={leave._id} className="hover:bg-white/5 transition-colors">
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
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === 'Pending' ? (
                          <button
                            onClick={() => handleCancelLeave(leave._id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer active:scale-95 transition-all"
                            title="Cancel Application"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold select-none italic">Locked</span>
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
              <p className="text-sm font-medium">No leave applications recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Department Leave & Holiday Calendar */}
      {(() => {
        const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
        const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

        const handlePrevMonth = () => {
          setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        };

        const handleNextMonth = () => {
          setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        };

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayIndex = getFirstDayOfMonth(year, month);
        
        const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });

        // Generate calendar grid cells
        const calendarCells = [];
        for (let i = 0; i < firstDayIndex; i++) {
          calendarCells.push({ type: 'empty', id: `empty-${i}` });
        }

        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          
          // Find matching holiday
          const holidayMatch = holidays.find(h => {
            const hDate = new Date(h.date);
            return hDate.getFullYear() === year && hDate.getMonth() === month && hDate.getDate() === d;
          });

          // Find matching approved department leave
          const leaveMatch = departmentLeaves.find(l => {
            if (l.status !== 'Approved') return false;
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            
            const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            
            return dateObj >= startZero && dateObj <= endZero;
          });

          calendarCells.push({
            type: 'day',
            dayNumber: d,
            holiday: holidayMatch || null,
            leave: leaveMatch || null,
            id: `day-${d}`
          });
        }

        // Compile all holiday and leave events for the dynamic feed list on the right
        const monthlyEvents = [];

        // 1. Gather holidays in current month
        holidays.forEach(h => {
          const hDate = new Date(h.date);
          if (hDate.getFullYear() === year && hDate.getMonth() === month) {
            monthlyEvents.push({
              type: 'holiday',
              name: h.name,
              category: 'Holiday',
              dateStr: hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              dateVal: hDate.getDate()
            });
          }
        });

        // 2. Gather approved department leaves falling in current month
        departmentLeaves.forEach(l => {
          if (l.status !== 'Approved') return;
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          
          // Check if the leave overlap with current month/year
          const startMonth = new Date(year, month, 1);
          const endMonth = new Date(year, month + 1, 0);

          if (start <= endMonth && end >= startMonth) {
            const localStart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const localEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const isCurrentUser = l.employee?._id === user?._id || l.employee === user?._id || l.employee?._id === user?.id || l.employee === user?.id;
            const displayName = isCurrentUser ? 'You' : (l.employee?.name || 'Colleague');

            monthlyEvents.push({
              type: 'leave',
              name: `${displayName} - ${l.leaveType} Leave`,
              category: l.leaveType,
              dateStr: localStart === localEnd ? localStart : `${localStart} - ${localEnd}`,
              dateVal: start.getDate()
            });
          }
        });

        // Sort events chronologically by date
        monthlyEvents.sort((a, b) => a.dateVal - b.dateVal);

        return (
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 mt-8 border border-white/5 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-6 gap-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>📅</span>
                <span>Department Leave & Holiday Calendar</span>
              </h3>
              
              {/* Calendar Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white min-w-[120px] text-center select-none uppercase tracking-wider">
                  {monthName} {year}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Grid: Calendar on Left, Dynamic Feed List on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 1. Monthly Calendar Grid (Col span 2) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Weekdays Header Row */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest pb-2">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Monthly Calendar Cells Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((cell) => {
                    if (cell.type === 'empty') {
                      return (
                        <div 
                          key={cell.id} 
                          className="aspect-square rounded-xl bg-slate-950/20 border border-white/[0.02] opacity-30"
                        ></div>
                      );
                    }

                    // Determine styling classes based on holiday or leave matches
                    let cellClasses = "aspect-square rounded-xl flex flex-col justify-between p-2.5 transition-all duration-300 relative border select-none ";
                    const isToday = new Date().toDateString() === new Date(year, month, cell.dayNumber).toDateString();
                    
                    if (cell.holiday && cell.leave) {
                      cellClasses += "bg-gradient-to-br from-violet-500/25 to-emerald-500/25 border-violet-500/40 hover:border-violet-500/80 text-white";
                    } else if (cell.holiday) {
                      cellClasses += "bg-violet-500/10 border-violet-500/20 hover:border-violet-500/60 text-violet-300";
                    } else if (cell.leave) {
                      cellClasses += "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/60 text-emerald-300";
                    } else {
                      cellClasses += "bg-white/5 border-white/5 hover:border-white/15 text-slate-300 hover:text-white";
                    }

                    if (isToday) {
                      cellClasses += " ring-2 ring-brand-accent ring-offset-2 ring-offset-slate-950 shadow-lg shadow-brand-accent/20";
                    }

                    const isCurrentUserLeave = cell.leave?.employee?._id === user?._id || cell.leave?.employee === user?._id || cell.leave?.employee?._id === user?.id || cell.leave?.employee === user?.id;
                    const leaveEmployeeName = isCurrentUserLeave ? 'You' : (cell.leave?.employee?.name || 'Colleague');

                    return (
                      <div 
                        key={cell.id}
                        className={cellClasses}
                        title={cell.holiday ? `Holiday: ${cell.holiday.name}` : cell.leave ? `${leaveEmployeeName} (${cell.leave.leaveType} Leave)` : undefined}
                      >
                        <span className={`text-xs font-black ${isToday ? 'text-brand-accent' : ''}`}>
                          {cell.dayNumber}
                        </span>

                        <div className="flex gap-1 flex-wrap mt-auto">
                          {cell.holiday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" title={`Holiday: ${cell.holiday.name}`}></span>
                          )}
                          {cell.leave && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${leaveEmployeeName} (${cell.leave.leaveType} Leave)`}></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend / Key indicators */}
                <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-white/5 border border-white/10"></span>
                    <span>Work Day</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-violet-500/10 border border-violet-500/20"></span>
                    <span className="text-violet-400">Company Holiday</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20"></span>
                    <span className="text-emerald-400">Scheduled Leave</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md ring-2 ring-brand-accent ring-offset-1 ring-offset-slate-950"></span>
                    <span className="text-brand-accent">Today</span>
                  </span>
                </div>
              </div>

              {/* 2. Dynamic Monthly Event Feed (Col span 1) */}
              <div className="glass-panel rounded-2xl p-5 bg-slate-900/30 border border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-white/10 mb-4">
                    Events in {monthName}
                  </h4>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {monthlyEvents.length > 0 ? (
                      monthlyEvents.map((evt, index) => {
                        const isHoliday = evt.type === 'holiday';
                        return (
                          <div 
                            key={index}
                            className={`p-3 rounded-xl border flex gap-3 ${
                              isHoliday 
                                ? 'bg-violet-500/5 border-violet-500/10 text-violet-200' 
                                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-200'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                              isHoliday ? 'bg-violet-500/10' : 'bg-emerald-500/10'
                            }`}>
                              {isHoliday ? '🎉' : '🏝️'}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold truncate text-white">{evt.name}</h5>
                              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                {isHoliday ? 'Corporate Holiday' : `${evt.category} Leave`}
                              </p>
                              <span className="text-[9px] text-slate-500 font-bold block mt-1">
                                Date: {evt.dateStr}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        <p>No holidays or approved leaves</p>
                        <p className="mt-1 font-semibold">scheduled for this month.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 mt-6 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                  Use the month selector at the top to check upcoming holidays or plan out future leave requests.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Leaves;
