import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Landmark,
  CircleDollarSign,
  TrendingUp,
  FileDown,
  ShieldCheck,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Users,
  Coins,
  Loader2
} from 'lucide-react';

const FinancePortal = () => {
  const { user } = useContext(AuthContext);

  // Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState('Overview');

  // API Data States
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('June 2026');
  const [banner, setBanner] = useState({ type: '', text: '' });

  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salRes, empRes] = await Promise.all([
        api.get('/salary/all'),
        api.get('/employee/department')
      ]);

      if (salRes.data.success) setSalaries(salRes.data.salaries);
      if (empRes.data.success) setEmployees(empRes.data.employees);
    } catch (err) {
      console.error('Failed to fetch finance portal data:', err.message);
      triggerBanner('danger', 'Error loading finance data. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run payroll generation
  const handleProcessPayroll = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/salary/process', { month: selectedMonth });
      if (res.data.success) {
        triggerBanner('success', `Payroll processed successfully for ${selectedMonth}!`);
        fetchData();
      }
    } catch (err) {
      triggerBanner('danger', err.response?.data?.message || 'Payroll processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Download payslip PDF
  const handleDownloadPayslip = async (salaryId, monthString) => {
    try {
      const res = await api.get(`/salary/${salaryId}/download`, {
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.setAttribute('download', `payslip-${monthString.replace(' ', '_')}.pdf`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download Payslip Failed:', err.message);
      triggerBanner('danger', 'Could not download payslip.');
    }
  };

  // Calculations for Overview Stats
  const totalEmployeesCount = employees.length;
  
  // Total Expenditure = Sum of all gross earnings in the current dataset
  const totalPayrollExp = salaries.reduce((acc, curr) => acc + curr.grossEarnings, 0);
  const totalPFContributions = salaries.reduce((acc, curr) => acc + curr.pf, 0);
  const totalProfessionalTax = salaries.reduce((acc, curr) => acc + curr.professionalTax, 0);
  const totalNetTakeHome = salaries.reduce((acc, curr) => acc + curr.netSalary, 0);

  // Group salaries by month
  const salariesByMonth = {};
  salaries.forEach(s => {
    if (!salariesByMonth[s.month]) salariesByMonth[s.month] = 0;
    salariesByMonth[s.month] += s.grossEarnings;
  });

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Landmark className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Finance & Payroll Control Center
            </h2>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-14">
            Govern corporate expenditures, manage compliant CTC structures, and process monthly payroll runs.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Payroll Active</span>
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

      {/* Financial Stat Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Payroll Card */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-brand-accent">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Total Payroll Payout</p>
              <h4 className="text-2xl font-extrabold text-white mt-2">₹{totalPayrollExp.toLocaleString('en-IN')}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Aggregate company gross payouts</span>
        </div>

        {/* Total PF Contributions */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-indigo-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Provident Fund (PF)</p>
              <h4 className="text-2xl font-extrabold text-white mt-2">₹{totalPFContributions.toLocaleString('en-IN')}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Statutory Employee PF holdings</span>
        </div>

        {/* Total Professional Tax */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-amber-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Professional Tax (PT)</p>
              <h4 className="text-2xl font-extrabold text-white mt-2">₹{totalProfessionalTax.toLocaleString('en-IN')}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Flat state tax collections</span>
        </div>

        {/* Net Take-Home */}
        <div className="glass-panel rounded-2xl p-5 bg-white/5 border-l-4 border-l-emerald-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Net Take-Home</p>
              <h4 className="text-2xl font-extrabold text-white mt-2">₹{totalNetTakeHome.toLocaleString('en-IN')}</h4>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-3">Total directly transferred net pay</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-slate-900/30 rounded-2xl border border-white/10 max-w-xl backdrop-blur-md">
        {['Overview', 'Process Payroll', 'Salaries Ledger', 'Compliance Report'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 ${
              activeSubTab === tab
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main content view */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        </div>
      ) : (
        <>
          {/* Tab 1: Overview Dashboard */}
          {activeSubTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Department stats */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-white/5 space-y-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>📊</span> Monthly Payout Allocations
                </h3>
                <div className="space-y-4">
                  {Object.entries(salariesByMonth).map(([month, val]) => (
                    <div key={month} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>{month}</span>
                        <span>₹{val.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-brand-accent h-2 rounded-full"
                          style={{ width: `${Math.min(100, (val / Math.max(1, totalPayrollExp)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(salariesByMonth).length === 0 && (
                    <p className="text-slate-400 text-sm">No payroll summaries available yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Workforce */}
              <div className="glass-panel rounded-3xl p-6 bg-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4">
                    <span>👥</span> Workforce Roster
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Review employees and managers across departments to release payslips.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Registered Workforce:</span>
                      <span className="font-bold text-white">{totalEmployeesCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Average Net Salary:</span>
                      <span className="font-bold text-white">
                        ₹{salaries.length > 0 ? Math.round(totalNetTakeHome / salaries.length).toLocaleString('en-IN') : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Process Payroll */}
          {activeSubTab === 'Process Payroll' && (
            <div className="glass-panel rounded-3xl p-6 bg-slate-900/20 border border-white/5 max-w-xl mx-auto space-y-6">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>⚙️</span> Batch Process Payroll Slips
              </h3>
              <p className="text-slate-400 text-sm">
                Select a salary month to compute and dynamically generate payslips for all registered employees based on their compliant CTC configurations.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Salary Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-accent"
                  >
                    <option value="May 2026">May 2026</option>
                    <option value="June 2026">June 2026</option>
                    <option value="July 2026">July 2026</option>
                    <option value="August 2026">August 2026</option>
                  </select>
                </div>

                <button
                  onClick={handleProcessPayroll}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-accent hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-white transition-all duration-300 shadow-lg shadow-brand-accent/25 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Computing & Releasing...</span>
                    </>
                  ) : (
                    <>
                      <CircleDollarSign className="w-5 h-5" />
                      <span>Process & Release Payslips</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Salaries Ledger */}
          {activeSubTab === 'Salaries Ledger' && (
            <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden border border-white/5">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>💵</span> Historical Payslip Ledger
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-white/5 text-slate-400 font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Designation</th>
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4">Gross Earnings</th>
                      <th className="px-6 py-4">Net Take-Home</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {salaries.map((s) => (
                      <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-white block font-bold">{s.employee?.name}</span>
                          <span className="text-xs text-slate-400">{s.employee?.email}</span>
                        </td>
                        <td className="px-6 py-4">{s.employee?.employeeDetails?.designation || 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-white">{s.month}</td>
                        <td className="px-6 py-4 text-white">₹{s.grossEarnings.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-emerald-400">₹{s.netSalary.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDownloadPayslip(s._id, s.month)}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {salaries.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                          No processed salary records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Compliance Report */}
          {activeSubTab === 'Compliance Report' && (
            <div className="glass-panel rounded-3xl bg-slate-900/20 overflow-hidden border border-white/5">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>📜</span> Statutory Compliance Registry
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-white/5 text-slate-400 font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Basic Salary</th>
                      <th className="px-6 py-4">PF (Employer 12%)</th>
                      <th className="px-6 py-4">PF (Employee 12%)</th>
                      <th className="px-6 py-4">Professional Tax (PT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {salaries.map((s) => (
                      <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-white block font-bold">{s.employee?.name}</span>
                          <span className="text-xs text-slate-400">{s.employee?.email}</span>
                        </td>
                        <td className="px-6 py-4">₹{s.basicSalary.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">₹{Math.round(s.basicSalary * 0.12).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">₹{s.pf.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-amber-400">₹{s.professionalTax.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {salaries.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400 font-medium">
                          No processed salary records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancePortal;
