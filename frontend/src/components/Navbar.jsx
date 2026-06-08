// Import React, routing, hooks, and context
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Menu, LogOut, Calendar } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  // Access auth context values
  const { user, logout } = useContext(AuthContext);
  
  // State to track today's attendance status in Navbar
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In');

  // Load check-in status on mount
  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        const res = await api.get('/attendance/today');
        if (res.data.success) {
          if (res.data.checkedOut) {
            setAttendanceStatus('Checked Out');
          } else if (res.data.checkedIn) {
            setAttendanceStatus('Working');
          } else {
            setAttendanceStatus('Not Checked In');
          }
        }
      } catch (err) {
        console.error('Navbar attendance check failed:', err.message);
      }
    };

    fetchTodayStatus();
    
    // Refresh status every 2 minutes for real-time accuracy
    const interval = setInterval(fetchTodayStatus, 120000);
    return () => clearInterval(interval);
  }, [user]);

  // Determine pill styling based on today's status
  const getStatusBadge = () => {
    switch (attendanceStatus) {
      case 'Working':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute"></span>
            On Duty
          </span>
        );
      case 'Checked Out':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Shift Completed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Off Duty
          </span>
        );
    }
  };

  return (
    <header className="h-20 px-6 border-b border-white/10 glass-panel bg-brand-dark/40 sticky top-0 z-30 flex items-center justify-between backdrop-blur-md">
      {/* Left section: Hamburger & Greetings */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger toggle button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Dynamic Personal Welcome Greeting */}
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-white tracking-wide">
            Welcome back, <span className="text-brand-accent">{user?.name || 'Employee'}</span>! 👋
          </h1>
          <p className="text-xs text-slate-400">{user?.employeeDetails?.employeeId || 'APEX'} | {user?.employeeDetails?.department || 'Staff'}</p>
        </div>
      </div>

      {/* Right section: Attendance Status pill & Quick actions */}
      <div className="flex items-center gap-4">
        {/* Real-time status tracker */}
        {getStatusBadge()}

        {/* Date display card */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-medium">
          <Calendar className="w-4 h-4 text-brand-accent" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Divider */}
        <span className="h-6 w-px bg-white/10"></span>

        {/* Quick Logout Button */}
        <button
          onClick={logout}
          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 active:scale-95 cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
