// Import React hooks, API service client, and Lucide icons
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, TrendingUp, AlertTriangle, UserCheck } from 'lucide-react';

const Attendance = () => {
  // Page states
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ totalDays: 0, presentDays: 0, lateDays: 0, halfDays: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch complete attendance records on component mount
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/history');
      if (res.data.success) {
        setHistory(res.data.history);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  // Format Date timestamp to readable local time (e.g., 09:02 AM)
  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const d = new Date(timeStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Format Date to full printable string (e.g. Wednesday, May 20, 2026)
  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00'); // Prevent UTC timezone drift
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get dynamic CSS styles for attendance status pills
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Late':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Half Day':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  if (loading) {
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
          Attendance Shift Logs
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Review your historically tracked check-ins, worked hours, and daily attendance parameters.
        </p>
      </div>

      {/* Grid of Summary Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Days Logged Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Total Records</span>
            <Calendar className="w-5 h-5 text-brand-accent" />
          </div>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {summary.totalDays} <span className="text-xs text-slate-400 font-normal">days</span>
          </h4>
        </div>

        {/* Total Hours Worked Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Total Hours</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {summary.totalHours} <span className="text-xs text-slate-400 font-normal">hrs</span>
          </h4>
        </div>

        {/* Late Check-ins Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Late check-ins</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {summary.lateDays} <span className="text-xs text-slate-400 font-normal">times</span>
          </h4>
        </div>

        {/* Half Days Logged Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold tracking-wide uppercase">Half Days</span>
            <UserCheck className="w-5 h-5 text-rose-500" />
          </div>
          <h4 className="text-3xl font-extrabold text-white mt-2">
            {summary.halfDays} <span className="text-xs text-slate-400 font-normal">times</span>
          </h4>
        </div>
      </div>

      {/* detailed logs list card */}
      <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Daily Shift Logs Sheet</h3>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-semibold">
            Chronological Order
          </span>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  <th className="px-6 py-4">Shift Calendar Date</th>
                  <th className="px-6 py-4">Check-In</th>
                  <th className="px-6 py-4">Check-Out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Worked Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {formatTime(record.checkIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatTime(record.checkOut)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white">
                      {record.workHours ? `${record.workHours} hrs` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Clock className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
            <p className="text-sm font-medium">No attendance shift logs captured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
