// Import React, Axios API client, Lucide icons
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, FileDown, Calendar, AlertCircle, Info, Landmark, HelpCircle } from 'lucide-react';

const Salary = () => {
  // Salary slips history states
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI action states
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  // Fetch salary slips logs on component mount
  const fetchSalarySlips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/salary');
      if (res.data.success) {
        // The backend sorts by paymentDate descending, so slips[0] is the latest
        setSlips(res.data.slips);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Silently ignore 403 shift lockout error
        return;
      }
      console.error('Failed to load salary slips:', err.message);
      setError('Failed to fetch salary records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalarySlips();
  }, []);

  // Securely download payslip PDF as a binary blob file
  const handleDownloadPayslip = async (salaryId, monthString) => {
    setError('');
    setDownloadingId(salaryId);

    try {
      // Make Axios GET request to backend, expecting a 'blob' response type for binary files
      const res = await api.get(`/salary/${salaryId}/download`, {
        responseType: 'blob'
      });

      // Create a local URL pointing to the returned binary blob object
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      
      // Scaffolding a dummy anchor tag in DOM to force download
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.setAttribute('download', `payslip-${monthString.replace(' ', '_')}.pdf`);
      
      // Append, click, and clean up anchor element from document body
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      
      // Purge blob URL references
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download Payslip Failed:', err.message);
      setError('Could not generate or stream payslip PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Format date display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && slips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Current active structure is taken from the latest month (slips[0])
  const currentStructure = slips[0] || null;

  // Real-time top 3 months list
  const recentSlips = slips.slice(0, 3);

  // CTC = Gross Earnings + Employer PF (12% of Basic) — standard Indian payroll formula
  const calcCTC = (slip) => {
    const employerPF = Math.round(slip.basicSalary * 0.12);
    return slip.grossEarnings + employerPF;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Salary Slips Ledger
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Review your current active salary structure and securely download payslips in Indian Rupees.
        </p>
      </div>

      {/* Error Callout Alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {currentStructure ? (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
          
          {/* SECTION 1: MASTER SALARY STRUCTURE (Displays exactly ONE time at the top) */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 bg-slate-900/30 border border-white/5 relative overflow-hidden group">
            {/* Ambient accent stripe */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-accent via-indigo-500 to-violet-500"></div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                  Master Compensation Profile
                </span>
                <h3 className="text-lg font-bold text-white mt-3">Active Salary Pay Heads Breakdown</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Currency: <strong>INR (₹)</strong></span>
                </span>
              </div>
            </div>

            {/* Structured columns (Earnings on Left, Deductions on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 border-y border-white/5">
              
              {/* Earnings Pay Heads */}
              <div className="space-y-3.5">
                <h4 className="text-sm font-extrabold text-brand-accent uppercase tracking-wider pb-2 border-b border-white/5">
                  Earnings (Pay Heads)
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic Salary</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.basicSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">H.R.A (House Rent Allowance)</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Adhoc Allowance</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.adhocAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Education Allowance</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.educationAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NPS Adhoc Pay</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.npsAdhocPay.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lunch Allowance</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.lunchAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly LTA</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.monthlyLTA.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shift Allowance</span>
                    <span className="font-medium text-slate-200">₹{currentStructure.shiftAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Gross Earnings */}
                  <div className="flex justify-between pt-3.5 border-t border-white/5 font-extrabold text-white text-base">
                    <span className="text-slate-300">Gross Earnings</span>
                    <span className="text-brand-accent">₹{currentStructure.grossEarnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Pay Heads */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-brand-danger uppercase tracking-wider pb-2 border-b border-white/5">
                    Deductions
                  </h4>
                  <div className="space-y-2.5 text-sm mt-3.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">P.F. (Provident Fund)</span>
                      <span className="font-medium text-slate-200">₹{currentStructure.pf.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Professional Tax</span>
                      <span className="font-medium text-slate-200">₹{currentStructure.professionalTax.toLocaleString('en-IN')}</span>
                    </div>
                    
                    {/* Gross Deductions */}
                    <div className="flex justify-between pt-3.5 border-t border-white/5 font-extrabold text-white text-base">
                      <span className="text-slate-300">Gross Deductions</span>
                      <span className="text-brand-danger">₹{currentStructure.grossDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Info Note Block */}
                <div className="p-4 mt-6 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                  <Info className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This itemized panel represents your default active compensation layout structures. Specific monthly variations and deductions will reflect on your dynamically generated downloadable PDF salary receipts below.
                  </p>
                </div>
              </div>

            </div>

            {/* Compensation Summary Header */}
            <div className="flex flex-wrap items-center justify-between mt-6 pt-4 gap-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Reference Active Take-Home Net</span>
                <h4 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                  ₹{currentStructure.netSalary.toLocaleString('en-IN')}
                </h4>
              </div>

              {/* CTC Banner */}
              <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-violet-500/10 border border-brand-accent/25">
                <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3" /> Annual CTC
                </span>
                <h4 className="text-2xl font-extrabold text-white mt-0.5">
                  ₹{(calcCTC(currentStructure) * 12).toLocaleString('en-IN')}
                </h4>
                <span className="text-[10px] text-slate-500 mt-0.5">Monthly: ₹{calcCTC(currentStructure).toLocaleString('en-IN')}</span>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Payroll Code</span>
                <p className="text-sm font-semibold text-slate-300 mt-1">APX-CORP-INR</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: LAST THREE MONTHS PAYSLIP LOGS (Rendered in real-time below the master panel) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-accent animate-pulse" />
                <span>Recent Payslips (Last 3 Months)</span>
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 font-semibold">
                Real-Time Synchronized
              </span>
            </div>

            {/* List loop of last 3 months */}
            <div className="space-y-4">
              {recentSlips.map((slip) => (
                <div 
                  key={slip._id}
                  className="glass-panel rounded-2xl p-5 bg-slate-900/20 border border-white/5 hover:border-white/10 hover:bg-slate-900/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Side: Month & Date Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-brand-accent flex-shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{slip.month}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Paid Days: <strong className="text-slate-300">{slip.paidDays} Days</strong> | Processed: {formatDate(slip.paymentDate)}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Status, Net Amount and Download Button */}
                  <div className="flex flex-wrap items-center gap-6 justify-between md:justify-end">
                    
                    {/* Status Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {slip.paymentStatus}
                    </span>

                    {/* Net take-home Rupees display */}
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Take-Home Pay</span>
                      <span className="text-lg font-black text-white">₹{slip.netSalary.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Compact PDF Download Trigger */}
                    <button
                      onClick={() => handleDownloadPayslip(slip._id, slip.month)}
                      disabled={downloadingId === slip._id}
                      className="glass-btn text-xs px-4 py-2.5 rounded-xl gap-1.5 cursor-pointer hover:bg-indigo-500"
                      title={`Download detailed PDF slip for ${slip.month}`}
                    >
                      {downloadingId === slip._id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          <span>PDF Payslip</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-500">
          <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-2 animate-bounce" />
          <p className="text-sm font-medium">No processed salary slips found in database.</p>
        </div>
      )}
    </div>
  );
};

export default Salary;
