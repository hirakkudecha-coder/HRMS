// Import React, hooks, context, and router redirection
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Clock, 
  CheckSquare, 
  FileText, 
  Sparkles 
} from 'lucide-react';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Dynamic redirection depending on login status
  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full bg-brand-dark flex flex-col relative overflow-hidden font-sans text-slate-300">
      {/* Decorative Premium Blurry Glowing Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-accent/10 blur-[150px] animate-pulse-slow"></div>

      {/* Landing Navbar */}
      <header className="w-full h-20 border-b border-white/5 z-10 px-6 md:px-12 flex items-center justify-between backdrop-blur-md bg-brand-dark/40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-brand-accent text-white shadow-lg shadow-brand-accent/20 flex items-center justify-center font-black text-lg">
            A
          </div>
          <span className="font-extrabold text-xl tracking-wider text-white">APEX <span className="text-brand-accent">HRMS</span></span>
        </div>
        
        <button
          onClick={handleCTA}
          className="glass-btn px-5 py-2 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>{user ? 'Go to Dashboard' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-[1200px] mx-auto px-6 py-16 md:py-24 z-10 flex flex-col items-center text-center justify-center gap-8">
        {/* Sparkle Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-accent text-xs font-bold uppercase tracking-widest animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Employee Workplace Suite</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl">
          Unified Operational Excellence, <br />
          <span className="bg-gradient-to-r from-brand-accent to-indigo-400 bg-clip-text text-transparent">
            Simplified in Real-Time
          </span>
        </h1>

        {/* Hero Subheading */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Manage timezone-aware attendance, delegate task check lists, review department leaves, and access secure salary ledgers from a single dark-mode glassmorphic control center.
        </p>

        {/* Action Button CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button
            onClick={handleCTA}
            className="px-8 py-4 rounded-2xl bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-brand-accent/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
          >
            <span>{user ? 'Open Dashboard Panel' : 'Get Started & Log In'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Core Features Directory */}
      <section className="w-full max-w-[1200px] mx-auto px-6 pb-24 z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-white">Full-Stack Modules Directory</h2>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Engineered for Global Scaling</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Timezone Attendance */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/20 border border-white/5 hover:border-white/10 hover:bg-slate-900/40 transition-all duration-300 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Timezone Shift Logs</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enforce local shift policies across multiple global time zones (EST, IST, GMT, MSK) with automated start gates and lateness evaluations.
            </p>
          </div>

          {/* Card 2: Task Check lists */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/20 border border-white/5 hover:border-white/10 hover:bg-slate-900/40 transition-all duration-300 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Live Kanban Delegation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enable managers to assign specific tasks to team members with priority levels and dates, synced live via real-time WebSocket connections.
            </p>
          </div>

          {/* Card 3: Secure Ledger */}
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/20 border border-white/5 hover:border-white/10 hover:bg-slate-900/40 transition-all duration-300 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Salary Slip Locker</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Review and access processed payroll salary structures secure in the ledger with multi-allowance pay head breakdowns and PDFKit generators.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="w-full py-8 border-t border-white/5 z-10 px-6 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 APEX HRMS Corporate Systems. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
