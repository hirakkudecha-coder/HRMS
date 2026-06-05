// Import React, hooks, icons, and API client
import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  Clock,
  ClipboardList,
  CalendarDays,
  Megaphone,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Trash2,
  Pencil,
  Send,
  X,
  UserPlus,
  ShieldCheck,
  Building2,
  Globe,
  Activity,
  ListTodo,
  BadgeCheck,
  BarChart3,
  BellRing,
  Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  // Tab navigation via URL params
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // ── Data State ──────────────────────────────────────────────────
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState({ today: [], history: [] });
  const [notices, setNotices] = useState([]);

  // ── UI State ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal State ───────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ── Form State ────────────────────────────────────────────────────
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'employee', department: 'Engineering', designation: '', phone: '', region: 'India', employeeId: '' });
  const [editForm, setEditForm] = useState({ name: '', role: 'employee', department: '', designation: '', phone: '', region: 'India' });

  const [taskForm, setTaskForm] = useState({ employeeId: '', title: '', description: '', priority: 'Medium', deadline: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: '', icon: '📢' });

  // ── Fetch Functions ───────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ovRes, empRes, leavesRes, tasksRes, attRes, noticesRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/employee/department'),
        api.get('/leaves/department'),
        api.get('/tasks/department'),
        api.get('/attendance/department'),
        api.get('/notices')
      ]);

      if (ovRes.data.success) setOverview(ovRes.data);
      if (empRes.data.success) {
        setEmployees(empRes.data.employees);
        if (empRes.data.employees.length > 0) {
          setTaskForm(prev => ({ ...prev, employeeId: empRes.data.employees[0]._id }));
        }
      }
      if (leavesRes.data.success) setLeaves(leavesRes.data.leaves);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (attRes.data.success) setAttendance(attRes.data);
      if (noticesRes.data.success) setNotices(noticesRes.data.notices);
    } catch (err) {
      console.error('Admin Dashboard fetch error:', err.message);
      triggerBanner('danger', 'Error loading admin data. Please check the connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Socket Real-time ──────────────────────────────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('leave_update', fetchAll);
    socket.on('task_update', fetchAll);
    socket.on('attendance_update', fetchAll);
    socket.on('employee_update', fetchAll);
    socket.on('notice_update', fetchAll);
    return () => socket.disconnect();
  }, []);

  // ── Banner Helper ─────────────────────────────────────────────────
  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

  // ── Formatters ────────────────────────────────────────────────────
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': case 'Present': case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Rejected': case 'Late': case 'Half Day': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Cancelled': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'To Do': return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse';
    }
  };

  const getPriorityBadge = (p) => {
    if (p === 'High') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (p === 'Medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  };

  // ── Action Handlers ───────────────────────────────────────────────
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leaves/${leaveId}/status`, { status });
      triggerBanner('success', `Leave ${status.toLowerCase()} successfully.`);
      fetchAll();
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Action failed.');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      triggerBanner('danger', 'Name, email, and password are required.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(addForm.password);
    const hasLowercase = /[a-z]/.test(addForm.password);
    const hasDigit = /\d/.test(addForm.password);
    const hasSpecialChar = /[@$!%*?&]/.test(addForm.password);

    if (addForm.password.length < 8) {
      triggerBanner('danger', 'Password must be at least 8 characters long.');
      return;
    }

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
      triggerBanner('danger', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @$!%*?&).');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/employees', addForm);
      triggerBanner('success', 'New employee account created successfully.');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'employee', department: 'Engineering', designation: '', phone: '', region: 'India', employeeId: '' });
      fetchAll();
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to create employee.');
    } finally { setSubmitting(false); }
  };

  const openEditModal = (emp) => {
    setEditTarget(emp);
    setEditForm({
      name: emp.name,
      role: emp.role,
      department: emp.employeeDetails?.department || '',
      designation: emp.employeeDetails?.designation || '',
      phone: emp.employeeDetails?.phone || '',
      region: emp.employeeDetails?.region || 'India'
    });
    setShowEditModal(true);
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/admin/employees/${editTarget._id}`, editForm);
      triggerBanner('success', 'Employee details updated successfully.');
      setShowEditModal(false);
      fetchAll();
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to update employee.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await api.delete(`/admin/employees/${id}`);
      triggerBanner('success', 'Employee deleted successfully.');
      setDeleteConfirmId(null);
      fetchAll();
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  const handleDelegateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.employeeId || !taskForm.title || !taskForm.description || !taskForm.deadline) {
      triggerBanner('danger', 'Please fill all task fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/tasks/delegate', taskForm);
      triggerBanner('success', 'Task delegated successfully.');
      setTaskForm(prev => ({ ...prev, title: '', description: '', deadline: '', priority: 'Medium' }));
      fetchAll();
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to delegate task.');
    } finally { setSubmitting(false); }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content || !noticeForm.category) {
      triggerBanner('danger', 'Title, content, and category are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/notices', noticeForm);
      triggerBanner('success', 'Notice posted successfully to all employees.');
      setNoticeForm({ title: '', content: '', category: '', icon: '📢' });
      fetchAll();
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Failed to post notice.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await api.delete(`/notices/${id}`);
      triggerBanner('success', 'Notice deleted.');
      fetchAll();
    } catch (err) {
      triggerBanner('danger', 'Failed to delete notice.');
    }
  };

  // ── Filtered Employees ────────────────────────────────────────────
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.employeeDetails?.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Tab Config ────────────────────────────────────────────────────
  const tabs = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Employees', icon: Users, label: 'Employees' },
    { id: 'Leaves', icon: CalendarDays, label: 'Leaves' },
    { id: 'Tasks', icon: ClipboardList, label: 'Tasks' },
    { id: 'Attendance', icon: Clock, label: 'Attendance' },
    { id: 'Notices', icon: Megaphone, label: 'Notices' },
  ];

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <ShieldCheck className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Admin Control Panel
            </h2>
          </div>
          <p className="text-slate-400 text-sm ml-14">
            System-wide management — employees, leaves, tasks, attendance & announcements.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></div>
          <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">Admin Mode</span>
        </div>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────── */}
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

      {/* ── Tab Navigation ───────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-slate-950/60 rounded-2xl border border-white/5">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider whitespace-nowrap transition-all duration-300 ${
              activeTab === id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Overview' && overview && (
        <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Employees', value: overview.stats.totalEmployees, icon: Users, color: 'indigo', sub: `+${overview.stats.totalManagers} managers` },
              { label: 'Pending Leaves', value: overview.stats.pendingLeaves, icon: CalendarDays, color: 'amber', sub: `${overview.stats.approvedLeaves} approved` },
              { label: 'Tasks Completed', value: overview.stats.completedTasks, icon: CheckCircle2, color: 'emerald', sub: `of ${overview.stats.totalTasks} total` },
              { label: 'Present Today', value: overview.stats.presentToday, icon: Activity, color: 'violet', sub: `${overview.stats.checkedOutToday} checked out` },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="glass-panel rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-300">
                <div className={`flex items-center justify-between mb-3`}>
                  <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">{label}</p>
                  <div className={`p-2 rounded-xl bg-${color}-500/10`}>
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-white">{value ?? '—'}</h3>
                <p className="text-xs text-slate-500 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Department Breakdown + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-white">Department Breakdown</h3>
              </div>
              <div className="space-y-3">
                {overview.deptBreakdown.length > 0 ? overview.deptBreakdown.map(dept => {
                  const pct = Math.round((dept.count / overview.stats.totalEmployees) * 100) || 0;
                  return (
                    <div key={dept._id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium">{dept._id || 'Unassigned'}</span>
                        <span className="text-slate-400">{dept.count} emp · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }) : <p className="text-slate-500 text-sm">No department data available.</p>}
              </div>
            </div>

            {/* Task Status Breakdown */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white">Task Status Breakdown</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Completed', value: overview.stats.completedTasks, color: 'emerald', total: overview.stats.totalTasks },
                  { label: 'In Progress', value: overview.stats.inProgressTasks, color: 'blue', total: overview.stats.totalTasks },
                  { label: 'To Do', value: overview.stats.todoTasks, color: 'violet', total: overview.stats.totalTasks },
                ].map(({ label, value, color, total }) => {
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium">{label}</span>
                        <span className="text-slate-400">{value} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${color}-500 rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Leaves */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Recent Leave Requests</h3>
            </div>
            {overview.recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {overview.recentLeaves.map(leave => (
                  <div key={leave._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-bold text-sm text-indigo-400">
                        {leave.employee?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{leave.employee?.name}</p>
                        <p className="text-xs text-slate-400">{leave.leaveType} · {formatDate(leave.startDate)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 text-sm">No recent leave activity.</p>}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: EMPLOYEES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Employees' && (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="glass-input flex-1"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="glass-btn bg-violet-600 hover:bg-violet-500 shadow-violet-600/20 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>

          {/* Employee Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Region</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                    <tr key={emp._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 flex-shrink-0 overflow-hidden">
                            {emp.employeeDetails?.profileImage ? (
                              <img src={`http://localhost:5000${emp.employeeDetails.profileImage}`} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                            ) : emp.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-medium">
                          {emp.employeeDetails?.department || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.role === 'manager' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs text-slate-400">{emp.employeeDetails?.region || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                            title="Edit Employee"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirmId === emp._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteEmployee(emp._id)}
                                className="text-[11px] px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold transition-all cursor-pointer"
                              >Confirm</button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[11px] px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 font-bold transition-all cursor-pointer"
                              >Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(emp._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-16 text-center text-slate-500">
                        <Users className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="text-sm font-medium">No employees found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: LEAVES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Leaves' && (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
          {/* Leave Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: leaves.length, color: 'slate' },
              { label: 'Pending', value: leaves.filter(l => l.status === 'Pending').length, color: 'amber' },
              { label: 'Approved', value: leaves.filter(l => l.status === 'Approved').length, color: 'emerald' },
              { label: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length, color: 'rose' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`glass-panel rounded-xl p-4 border-l-4 border-l-${color}-500`}>
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">{label}</p>
                <h4 className="text-2xl font-extrabold text-white mt-1">{value}</h4>
              </div>
            ))}
          </div>

          {/* Leave Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">All Leave Requests</h3>
              <span className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 font-medium">{leaves.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {leaves.length > 0 ? leaves.map(leave => (
                    <tr key={leave._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{leave.employee?.name}</p>
                        <p className="text-xs text-slate-500">{leave.employee?.employeeDetails?.department}</p>
                      </td>
                      <td className="px-5 py-4 font-medium">{leave.leaveType}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <p>{formatDate(leave.startDate)}</p>
                        <p className="text-slate-500">to {formatDate(leave.endDate)}</p>
                      </td>
                      <td className="px-5 py-4 max-w-[180px] truncate text-xs" title={leave.reason}>{leave.reason}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {leave.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleLeaveAction(leave._id, 'Approved')}
                              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-bold transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-5 py-16 text-center text-slate-500">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="text-sm font-medium">No leave requests found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: TASKS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
          {/* Delegate Task Form */}
          <div className="glass-panel rounded-2xl p-6 self-start">
            <div className="flex items-center gap-2 mb-6">
              <ListTodo className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-white">Delegate New Task</h3>
            </div>
            <form onSubmit={handleDelegateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign To</label>
                <select className="glass-input cursor-pointer" value={taskForm.employeeId} onChange={e => setTaskForm(p => ({ ...p, employeeId: e.target.value }))} disabled={submitting}>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} — {emp.employeeDetails?.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
                <input type="text" className="glass-input" placeholder="Enter task title..." value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} disabled={submitting} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea rows="3" className="glass-input resize-none" placeholder="Describe the task..." value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} disabled={submitting} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                  <select className="glass-input cursor-pointer" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} disabled={submitting}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
                  <input type="date" className="glass-input" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} disabled={submitting} />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="glass-btn w-full bg-violet-600 hover:bg-violet-500 shadow-violet-600/20 mt-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /><span>Delegate Task</span></>}
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden self-start">
            <div className="p-5 border-b border-white/10 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-white">All System Tasks</h3>
              <span className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 font-medium">{tasks.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-5 py-4">Task</th>
                    <th className="px-5 py-4">Assigned To</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Deadline</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {tasks.length > 0 ? tasks.map(task => (
                    <tr key={task._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white max-w-[160px] truncate" title={task.title}>{task.title}</p>
                        <p className="text-xs text-slate-500 max-w-[160px] truncate" title={task.description}>{task.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">{task.employee?.name}</p>
                        <p className="text-xs text-slate-500">{task.employee?.employeeDetails?.department}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{formatDate(task.deadline)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-16 text-center text-slate-500">
                        <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="text-sm font-medium">No tasks assigned yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: ATTENDANCE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Attendance' && (
        <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
          {/* Today's Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Present Today", value: attendance.todayCount, color: 'emerald' },
              { label: "Checked Out", value: attendance.today.filter(r => r.checkOut).length, color: 'blue' },
              { label: "Total Records", value: attendance.count, color: 'slate' },
              { label: "Still Working", value: attendance.today.filter(r => !r.checkOut).length, color: 'amber' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`glass-panel rounded-xl p-4 border-l-4 border-l-${color}-500`}>
                <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">{label}</p>
                <h4 className="text-2xl font-extrabold text-white mt-1">{value ?? 0}</h4>
              </div>
            ))}
          </div>

          {/* Today's Check-ins */}
          {attendance.today.length > 0 && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">Today's Attendance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      <th className="px-5 py-4">Employee</th>
                      <th className="px-5 py-4">Department</th>
                      <th className="px-5 py-4">Check-In</th>
                      <th className="px-5 py-4">Check-Out</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {attendance.today.map(rec => (
                      <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-semibold text-white">{rec.employee?.name}</td>
                        <td className="px-5 py-4 text-xs text-slate-400">{rec.employee?.employeeDetails?.department}</td>
                        <td className="px-5 py-4 text-xs font-mono">{formatTime(rec.checkIn)}</td>
                        <td className="px-5 py-4 text-xs font-mono">{formatTime(rec.checkOut)}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Full Attendance History */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-white">Full Attendance History</h3>
              <span className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 font-medium">{attendance.count} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-white/5 text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Check-In</th>
                    <th className="px-5 py-4">Check-Out</th>
                    <th className="px-5 py-4">Hours</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {attendance.history?.slice(0, 50).map(rec => (
                    <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{rec.employee?.name}</p>
                        <p className="text-xs text-slate-500">{rec.employee?.employeeDetails?.department}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-300">{rec.date}</td>
                      <td className="px-5 py-4 text-xs font-mono">{formatTime(rec.checkIn)}</td>
                      <td className="px-5 py-4 text-xs font-mono">{formatTime(rec.checkOut)}</td>
                      <td className="px-5 py-4 text-xs font-mono">{rec.workHours ? `${rec.workHours}h` : '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: NOTICES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'Notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
          {/* Create Notice Form */}
          <div className="glass-panel rounded-2xl p-6 self-start">
            <div className="flex items-center gap-2 mb-6">
              <BellRing className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Post New Notice</h3>
            </div>
            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Icon Emoji</label>
                <input type="text" className="glass-input" placeholder="📢" value={noticeForm.icon} onChange={e => setNoticeForm(p => ({ ...p, icon: e.target.value }))} disabled={submitting} maxLength={4} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <input type="text" className="glass-input" placeholder="e.g. HR Bulletin, IT Notice..." value={noticeForm.category} onChange={e => setNoticeForm(p => ({ ...p, category: e.target.value }))} disabled={submitting} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notice Title</label>
                <input type="text" className="glass-input" placeholder="Enter notice headline..." value={noticeForm.title} onChange={e => setNoticeForm(p => ({ ...p, title: e.target.value }))} disabled={submitting} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                <textarea rows="4" className="glass-input resize-none" placeholder="Write the full notice content..." value={noticeForm.content} onChange={e => setNoticeForm(p => ({ ...p, content: e.target.value }))} disabled={submitting} />
              </div>
              <button type="submit" disabled={submitting} className="glass-btn w-full bg-amber-600 hover:bg-amber-500 shadow-amber-600/20 mt-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Megaphone className="w-4 h-4" /><span>Post Notice</span></>}
              </button>
            </form>
          </div>

          {/* Notices List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Published Notices</h3>
              <span className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 font-medium">{notices.length} total</span>
            </div>
            {notices.length > 0 ? notices.map(notice => (
              <div key={notice._id} className="glass-panel rounded-2xl p-5 hover:border-white/20 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
                      {notice.icon || '📢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm">{notice.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">{notice.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{notice.content}</p>
                      <p className="text-[10px] text-slate-600 mt-2 font-medium">{formatDate(notice.postedDate)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNotice(notice._id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="glass-panel rounded-2xl p-16 text-center text-slate-500">
                <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <p className="text-sm font-medium">No notices posted yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD NEW EMPLOYEE
      ══════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel rounded-3xl p-7 w-full max-w-lg bg-slate-900/90 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Add New Employee</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name *</label>
                  <input type="text" className="glass-input" placeholder="John Smith" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Employee ID</label>
                  <input type="text" className="glass-input" placeholder="EMP1234" value={addForm.employeeId} onChange={e => setAddForm(p => ({ ...p, employeeId: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Work Email *</label>
                <input type="email" className="glass-input" placeholder="name@apex.com" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password *</label>
                <input type="password" className="glass-input" placeholder="Min 8 chars (e.g., Password@123)" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                  <select className="glass-input cursor-pointer" value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Region</label>
                  <select className="glass-input cursor-pointer" value={addForm.region} onChange={e => setAddForm(p => ({ ...p, region: e.target.value }))}>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Russia">Russia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <input type="text" className="glass-input" placeholder="Engineering" value={addForm.department} onChange={e => setAddForm(p => ({ ...p, department: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Designation</label>
                  <input type="text" className="glass-input" placeholder="Software Engineer" value={addForm.designation} onChange={e => setAddForm(p => ({ ...p, designation: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                <input type="text" className="glass-input" placeholder="+91 98765-43210" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="glass-btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="glass-btn flex-1 bg-violet-600 hover:bg-violet-500 shadow-violet-600/20">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PlusCircle className="w-4 h-4" /><span>Create Account</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: EDIT EMPLOYEE
      ══════════════════════════════════════════════════════════════ */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel rounded-3xl p-7 w-full max-w-lg bg-slate-900/90 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Pencil className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Edit: {editTarget.name}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" className="glass-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                  <select className="glass-input cursor-pointer" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Region</label>
                  <select className="glass-input cursor-pointer" value={editForm.region} onChange={e => setEditForm(p => ({ ...p, region: e.target.value }))}>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Russia">Russia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <input type="text" className="glass-input" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Designation</label>
                  <input type="text" className="glass-input" value={editForm.designation} onChange={e => setEditForm(p => ({ ...p, designation: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                <input type="text" className="glass-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="glass-btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="glass-btn flex-1">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /><span>Save Changes</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
