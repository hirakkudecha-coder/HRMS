// Import React core hooks, routing modules, and context provider
import { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Lock, ArrowLeft } from 'lucide-react';

// Import Protected Route Gatekeeper
import ProtectedRoute from './components/ProtectedRoute';

// Import Layout Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Import Page Views
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Timesheets from './pages/Timesheets';
import Salary from './pages/Salary';
import Documents from './pages/Documents';
import Profile from './pages/Profile';
import ManagerPortal from './pages/ManagerPortal';
import AdminDashboard from './pages/AdminDashboard';
import FinancePortal from './pages/FinancePortal';
import Home from './pages/Home';

// Layout Wrapper for all protected dashboard views
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { shiftActive } = useContext(AuthContext);
  const location = useLocation();

  // Determine if the current route should be locked based on check-in state
  const isLocked = !shiftActive && location.pathname !== '/dashboard' && location.pathname !== '/leaves' && location.pathname !== '/salary' && location.pathname !== '/finance';

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {/* Sidebar navigation panel */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content right panel */}
      <div className="flex-1 lg:pl-[72px] flex flex-col min-w-0 min-h-screen transition-all duration-300">
        {/* Top visual navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Scrollable page container with fade animations */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto flex flex-col justify-center">
          <div className="animate-[fadeIn_0.5s_ease-out] w-full flex-1 flex flex-col justify-center">
            {isLocked ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center my-auto">
                <div className="relative mb-6">
                  {/* Glowing background behind lock */}
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
                    <Lock className="w-10 h-10 animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                  Shift Check-in Required
                </h2>
                <p className="text-slate-400 max-w-md mb-8 text-base leading-relaxed">
                  To access this portal, you must first start or check in to your daily shift. You can do this at any time from your main dashboard.
                </p>
                
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-brand-accent/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Dashboard
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Public Landing Home Route */}
          <Route path="/" element={<Home />} />

          {/* Protected Employee Module Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Leaves />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheets"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Timesheets />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salary"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Salary />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Documents />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <DashboardLayout>
                  <ManagerPortal />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin and HR Dashboard Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'hr']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Finance Portal Route */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={['finance', 'admin']}>
                <DashboardLayout>
                  <FinancePortal />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
