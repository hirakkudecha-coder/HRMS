// Import React, API client, icons
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Calendar, FileText, Send, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

const Leaves = () => {
  // Leave balances & history state
  const [balances, setBalances] = useState({ Casual: 10, Sick: 10, Paid: 15 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 15 Official Company Holidays for Year 2026
  const holidaysList = [
    { date: 'Jan 01', day: 'Thu', name: "New Year's Day" },
    { date: 'Jan 26', day: 'Mon', name: 'Republic Day' },
    { date: 'Mar 03', day: 'Tue', name: 'Holi Festival' },
    { date: 'Apr 02', day: 'Thu', name: 'Good Friday' },
    { date: 'Apr 14', day: 'Tue', name: 'Ambedkar Jayanti' },
    { date: 'May 01', day: 'Fri', name: 'May Day (Labor Day)' },
    { date: 'Jun 02', day: 'Tue', name: 'Eid-ul-Fitr' },
    { date: 'Aug 15', day: 'Sat', name: 'Independence Day' },
    { date: 'Sep 04', day: 'Fri', name: 'Janmashtami' },
    { date: 'Oct 02', day: 'Fri', name: 'Gandhi Jayanti' },
    { date: 'Oct 19', day: 'Mon', name: 'Maha Navami / Dussehra' },
    { date: 'Oct 20', day: 'Tue', name: 'Vijayadashami' },
    { date: 'Nov 09', day: 'Mon', name: 'Diwali / Deepavali' },
    { date: 'Nov 10', day: 'Tue', name: 'Govardhan Puja' },
    { date: 'Dec 25', day: 'Fri', name: 'Christmas Day' }
  ];

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

  useEffect(() => {
    fetchLeaveData();
  }, []);

  // Setup real-time Socket.io listeners to refresh leave lists and accrual balances
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Leaves page connected to real-time notification socket');
    });

    socket.on('leave_update', () => {
      console.log('Real-time leave update detected on Leaves page. Refreshing...');
      fetchLeaveData();
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
        
        // Reload leave history and balances
        fetchLeaveData();
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

      {/* Annual Official Holidays Section (15 Days) */}
      <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 mt-8 border border-white/5 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <span>📅</span>
            <span>Annual Official Company Holidays (15 Days)</span>
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-brand-accent font-bold">
            Year 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidaysList.map((holiday, index) => (
            <div 
              key={index} 
              className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-slate-900/30 transition-all duration-300 flex items-center gap-3.5"
            >
              {/* Date Badge */}
              <div className="w-14 h-14 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex flex-col items-center justify-center flex-shrink-0 text-brand-accent">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-1">{holiday.day}</span>
                <span className="text-xs font-black leading-none">{holiday.date}</span>
              </div>
              
              {/* Holiday Details */}
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-200 truncate" title={holiday.name}>
                  {holiday.name}
                </h4>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                  Official Holiday
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Leaves;
