import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

const Timesheets = () => {
  // Active date state (defaulting to today, timezone-aware)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [status, setStatus] = useState('Draft');
  const [rejectionReason, setRejectionReason] = useState('');
  const [entries, setEntries] = useState([
    { project: '', description: '', hours: 0 }
  ]);

  // History and UI states
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Format date helper (YYYY-MM-DD)
  const formatDateString = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Human readable date display helper
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Display feedback banner
  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

  // Fetch daily timesheet data for the selected date
  const fetchDailyTimesheet = async (date) => {
    try {
      setLoading(true);
      const dateStr = formatDateString(date);
      const res = await api.get(`/timesheets/date/${dateStr}`);
      
      if (res.data.success && res.data.timesheet) {
        const ts = res.data.timesheet;
        setStatus(ts.status);
        setRejectionReason(ts.rejectionReason || '');
        setEntries(ts.entries.map(e => ({
          project: e.project,
          description: e.description,
          hours: Number(e.hours) || 0
        })));
      } else {
        // No timesheet in database, initialize empty draft structure
        setStatus('Draft');
        setRejectionReason('');
        setEntries([
          { project: '', description: '', hours: 0 }
        ]);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Silently ignore 403 shift lockout error
        return;
      }
      console.error('Failed to load daily timesheet:', err.message);
      triggerBanner('danger', 'Error loading timesheet data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch timesheets submission history
  const fetchTimesheetHistory = async () => {
    try {
      const res = await api.get('/timesheets');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Silently ignore 403 shift lockout error
        return;
      }
      console.error('Failed to load timesheet history:', err.message);
    }
  };

  // Load timesheet on mount and whenever selected date changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDailyTimesheet(selectedDate);
      fetchTimesheetHistory();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Real-time updates via Socket.io
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    socket.on('timesheet_update', () => {
      fetchDailyTimesheet(selectedDate);
      fetchTimesheetHistory();
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Navigate between dates
  const handlePrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  // Handle hours input change
  const handleHoursChange = (entryIndex, val) => {
    let num = Number(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 24) num = 24;

    setEntries(prev => prev.map((entry, idx) => {
      if (idx !== entryIndex) return entry;
      return { ...entry, hours: num };
    }));
  };

  // Handle text input changes
  const handleTextChange = (entryIndex, field, val) => {
    setEntries(prev => prev.map((entry, idx) => {
      if (idx !== entryIndex) return entry;
      return { ...entry, [field]: val };
    }));
  };

  // Add a new row to the timesheet
  const handleAddRow = () => {
    setEntries(prev => [
      ...prev,
      { project: '', description: '', hours: 0 }
    ]);
  };

  // Remove a row from the timesheet
  const handleRemoveRow = (idx) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate grand total hours for the day
  const getGrandTotal = () => {
    return entries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  };

  // Save the timesheet progress as Draft
  const handleSaveDraft = async (e) => {
    if (e) e.preventDefault();

    // Basic client validation
    const emptyRow = entries.some(e => !e.project.trim() || !e.description.trim());
    if (emptyRow) {
      triggerBanner('danger', 'Please provide a project name and description for all logged rows.');
      return;
    }

    if (getGrandTotal() > 24) {
      triggerBanner('danger', 'Daily logged hours cannot exceed 24 hours.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/timesheets', {
        date: formatDateString(selectedDate),
        entries
      });

      if (res.data.success) {
        triggerBanner('success', res.data.message || 'Progress saved as Draft successfully!');
        fetchDailyTimesheet(selectedDate);
        fetchTimesheetHistory();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to save timesheet draft.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lock and submit the timesheet for manager review
  const handleSubmitTimesheet = async () => {
    const emptyRow = entries.some(e => !e.project.trim() || !e.description.trim());
    if (emptyRow) {
      triggerBanner('danger', 'Please fill in all project and description columns before submitting.');
      return;
    }

    const grandTotal = getGrandTotal();
    if (grandTotal <= 0) {
      triggerBanner('danger', 'Cannot submit an empty timesheet. Please log hours worked.');
      return;
    }

    if (grandTotal > 24) {
      triggerBanner('danger', 'Daily logged hours cannot exceed 24 hours.');
      return;
    }

    if (!window.confirm('Are you sure you want to submit today\'s timesheet? Once submitted, hours cannot be edited unless rejected by your manager.')) {
      return;
    }

    setSubmitting(true);
    try {
      // First, save current draft edits to ensure latest data is submitted
      const saveRes = await api.post('/timesheets', {
        date: formatDateString(selectedDate),
        entries
      });

      if (saveRes.data.success && saveRes.data.timesheet) {
        const submitId = saveRes.data.timesheet._id;
        const res = await api.put(`/timesheets/${submitId}/submit`);
        if (res.data.success) {
          triggerBanner('success', 'Daily timesheet submitted successfully!');
          fetchDailyTimesheet(selectedDate);
          fetchTimesheetHistory();
        }
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to submit timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to determine status badge styling
  const getStatusBadge = (s) => {
    switch (s) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Submitted':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const isEditable = status === 'Draft' || status === 'Rejected';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner Notifications */}
      {banner.text && (
        <div className={`flex items-center gap-2.5 p-4 rounded-2xl animate-shake border ${
          banner.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {banner.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-semibold">{banner.text}</span>
        </div>
      )}

      {/* Header and Date Selection Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/10 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-accent animate-pulse" />
            <span>Daily Work Timesheet</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">Log your dynamic daily work allocation details against client/projects.</p>
        </div>

        {/* Date Navigator & DatePicker */}
        <div className="flex items-center justify-center bg-slate-950/60 border border-white/10 rounded-2xl p-1.5 self-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <input
            type="date"
            className="p-2 text-sm font-bold text-white bg-slate-900/80 border border-white/10 rounded-xl cursor-pointer focus:outline-none"
            value={formatDateString(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(new Date(e.target.value + 'T00:00:00'));
              }
            }}
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Timesheet Editor Card */}
          <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden self-start">
            {/* Status Information Header */}
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-lg">Logged Entries</h3>
                <p className="text-slate-500 text-xs mt-1">Specify project names, descriptions, and daily logged hours for {formatDateDisplay(selectedDate)}.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold select-none uppercase">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(status)}`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Rejection Alert Callout */}
            {status === 'Rejected' && rejectionReason && (
              <div className="p-4 mx-6 mt-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Correction Requested by Manager:</p>
                  <p className="text-xs text-rose-300 mt-1 italic">"{rejectionReason}"</p>
                </div>
              </div>
            )}

            {/* Hours Log Grid Form */}
            <form onSubmit={handleSaveDraft} className="p-6">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-white/5 text-[10px] md:text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-4 py-4 w-1/3">Project / Client</th>
                      <th className="px-4 py-4 w-1/3">Activity Description</th>
                      <th className="px-4 py-4 text-center w-28">Hours Today</th>
                      {isEditable && <th className="px-4 py-4 text-right"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {entries.map((entry, entryIdx) => (
                      <tr key={entryIdx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            required
                            placeholder="e.g., Apex Redesign"
                            className="glass-input text-sm p-2 w-full"
                            value={entry.project}
                            onChange={(e) => handleTextChange(entryIdx, 'project', e.target.value)}
                            disabled={!isEditable || submitting}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            required
                            placeholder="Describe your work..."
                            className="glass-input text-sm p-2 w-full"
                            value={entry.description}
                            onChange={(e) => handleTextChange(entryIdx, 'description', e.target.value)}
                            disabled={!isEditable || submitting}
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="number"
                            min="0.25"
                            max="24"
                            step="0.25"
                            placeholder="0"
                            className="glass-input text-center text-sm p-2 w-20 mx-auto"
                            value={entry.hours || ''}
                            onChange={(e) => handleHoursChange(entryIdx, e.target.value)}
                            disabled={!isEditable || submitting}
                          />
                        </td>
                        {isEditable && (
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(entryIdx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent"
                              disabled={entries.length <= 1 || submitting}
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    
                    {/* Sum Totals Row */}
                    <tr className="bg-slate-950/60 font-bold border-t border-white/10">
                      <td colSpan="2" className="px-4 py-4 text-right text-xs uppercase tracking-wider text-slate-400 font-extrabold">
                        Total Logged Today:
                      </td>
                      <td className={`px-4 py-4 text-center text-base font-extrabold underline ${getGrandTotal() > 24 ? 'text-rose-400' : 'text-brand-accent'}`}>
                        {getGrandTotal()} hrs
                      </td>
                      {isEditable && <td className="px-4 py-4"></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons Row */}
              {isEditable && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="p-2.5 rounded-xl border border-dashed border-white/20 text-slate-300 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-98"
                    disabled={submitting}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Row</span>
                  </button>

                  <div className="flex items-center gap-3 justify-end">
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
                      disabled={submitting}
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitTimesheet}
                      className="p-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 shadow-md shadow-brand-accent/25"
                      disabled={submitting}
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Daily Log</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Timesheets Submission History List */}
          <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>Daily Timesheet Log History</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">Review status checks of your previous daily timesheet logs.</p>
            </div>

            {history.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-6 py-4">Logged Date</th>
                      <th className="px-6 py-4 text-center">Hours Worked</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Manager Comments</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {history.map((ts) => (
                      <tr key={ts._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {formatDateDisplay(ts.date)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold">
                          {ts.totalHours} hours
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(ts.status)}`}>
                            {ts.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 max-w-[250px] truncate" title={ts.rejectionReason}>
                          {ts.status === 'Rejected' ? (
                            <span className="text-rose-400 italic">"Correction required: {ts.rejectionReason}"</span>
                          ) : (
                            ts.status === 'Approved' ? <span className="text-emerald-400">Approved by manager</span> : <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedDate(new Date(ts.date + 'T00:00:00'))}
                            className="p-1.5 rounded-lg text-brand-accent bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                          >
                            Load Date
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <FileSpreadsheet className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
                <p className="text-sm font-medium">No previous daily records logged.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;
