// Import React, API client, Lucide icons
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Clock, Play, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

const Tasks = () => {
  // Task database states
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ total: 0, todo: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [banner, setBanner] = useState('');

  // Fetch all assigned tasks on mount
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.tasks);
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load assigned tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Setup real-time Socket.io listeners to refresh tasks lists
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Tasks page connected to real-time notification socket');
    });

    socket.on('task_update', () => {
      console.log('Real-time task update detected on Tasks page. Refreshing...');
      fetchTasks();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update a task's status on the server
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (res.data.success) {
        setBanner(`Task status updated to '${newStatus}' successfully!`);
        setTimeout(() => setBanner(''), 4000);
        
        // Reload all tasks
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update task status:', err.message);
    }
  };

  // Format deadline date to standard local string
  const formatDeadline = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Check if deadline is within 2 days and still pending
  const isDeadlineUrgent = (dateStr, status) => {
    if (status === 'Completed') return false;
    const diff = new Date(dateStr) - new Date();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  };

  // Determine priority color tag
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  if (loading && tasks.length === 0) {
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
          Assigned Tasks Board
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Track deadlines, update task workflow status, and organize your daily work assignments.
        </p>
      </div>

      {/* Action Banner Toast */}
      {banner && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 backdrop-blur-md transition-all duration-300 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{banner}</span>
        </div>
      )}

      {/* Board Summary Metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-5 bg-white/5 text-center">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Total Tasks</p>
          <h4 className="text-2xl font-bold text-white mt-1">{counts.total}</h4>
        </div>
        <div className="glass-panel rounded-2xl p-5 bg-white/5 text-center">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">To Do</p>
          <h4 className="text-2xl font-bold text-slate-400 mt-1">{counts.todo}</h4>
        </div>
        <div className="glass-panel rounded-2xl p-5 bg-white/5 text-center">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">In Progress</p>
          <h4 className="text-2xl font-bold text-brand-accent mt-1">{counts.inProgress}</h4>
        </div>
        <div className="glass-panel rounded-2xl p-5 bg-white/5 text-center">
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Completed</p>
          <h4 className="text-2xl font-bold text-brand-success mt-1">{counts.completed}</h4>
        </div>
      </div>

      {/* 3-Column Kanban Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: To Do */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <h3 className="font-bold text-white text-base">To Do</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-semibold">
              {tasks.filter(t => t.status === 'To Do').length}
            </span>
          </div>

          <div className="space-y-4">
            {tasks.filter(t => t.status === 'To Do').map((task) => (
              <div 
                key={task._id} 
                className="glass-panel rounded-2xl p-5 bg-slate-900/30 hover:border-slate-700 transition-all duration-300 relative group"
              >
                {/* Urgent Deadline Red Top Stripe */}
                {isDeadlineUrgent(task.deadline, task.status) && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 rounded-t-2xl animate-pulse"></div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  {isDeadlineUrgent(task.deadline, task.status) && (
                    <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mt-3 leading-tight">{task.title}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{task.description}</p>

                <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Deadline: {formatDeadline(task.deadline)}</span>
                </div>

                {/* Workflow Transitions Button */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'In Progress')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-accent/20 hover:text-white text-slate-400 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    <span>Start Work</span>
                    <Play className="w-3 h-3 text-brand-accent" />
                  </button>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'To Do').length === 0 && (
              <div className="text-center py-8 text-xs text-slate-600 font-medium">No tasks in To Do.</div>
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-ping"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-accent absolute"></span>
              <h3 className="font-bold text-white text-base">In Progress</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-brand-accent font-semibold">
              {tasks.filter(t => t.status === 'In Progress').length}
            </span>
          </div>

          <div className="space-y-4">
            {tasks.filter(t => t.status === 'In Progress').map((task) => (
              <div 
                key={task._id} 
                className="glass-panel rounded-2xl p-5 bg-slate-900/30 hover:border-brand-accent/20 transition-all duration-300 relative group"
              >
                {isDeadlineUrgent(task.deadline, task.status) && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 rounded-t-2xl animate-pulse"></div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                  {isDeadlineUrgent(task.deadline, task.status) && (
                    <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mt-3 leading-tight">{task.title}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{task.description}</p>

                <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Deadline: {formatDeadline(task.deadline)}</span>
                </div>

                {/* Workflow Transitions Button */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'Completed')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-success/20 hover:text-white text-slate-400 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    <span>Finish Task</span>
                    <ChevronRight className="w-3.5 h-3.5 text-brand-success" />
                  </button>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'In Progress').length === 0 && (
              <div className="text-center py-8 text-xs text-slate-600 font-medium">No tasks in Progress.</div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-success"></span>
              <h3 className="font-bold text-white text-base">Completed</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-brand-success font-semibold">
              {tasks.filter(t => t.status === 'Completed').length}
            </span>
          </div>

          <div className="space-y-4">
            {tasks.filter(t => t.status === 'Completed').map((task) => (
              <div 
                key={task._id} 
                className="glass-panel rounded-2xl p-5 bg-slate-900/10 border-white/5 opacity-70 transition-all duration-300 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-500 border border-slate-700/30">
                    {task.priority} Priority
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-brand-success" />
                </div>

                <h4 className="text-sm font-bold text-slate-400 mt-3 line-through leading-tight">{task.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{task.description}</p>

                <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Deadline: {formatDeadline(task.deadline)}</span>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'Completed').length === 0 && (
              <div className="text-center py-8 text-xs text-slate-600 font-medium">No completed tasks yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Tasks;
