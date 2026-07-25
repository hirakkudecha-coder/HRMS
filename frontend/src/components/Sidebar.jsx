import { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Clock,
  CreditCard,
  FolderLock,
  User,
  LogOut,
  X,
  Briefcase,
  ShieldCheck,
  Lock,
  Landmark
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      setIsHovered(false);
    }
  };

  // On mobile/tablet, isExpanded is determined by the open drawer state.
  // On desktop, isExpanded is strictly determined by mouse hover to prevent layout overflow.
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isExpanded = (isDesktop ? false : isOpen) || isHovered;
  // Access global logout action
  const { logout, user, shiftActive } = useContext(AuthContext);
  const location = useLocation();

  // Define sidebar menu options with icons and path URIs
  const baseMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Leaves', path: '/leaves', icon: FileSpreadsheet },
    { name: 'Timesheets Log', path: '/timesheets', icon: Clock },
    { name: 'Salary Slips', path: '/salary', icon: CreditCard },
    { name: 'Documents Locker', path: '/documents', icon: FolderLock },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  // Dynamically inject Portal links based on user roles
  const menuItems = [...baseMenuItems];
  
  if (user?.role === 'admin' || user?.role === 'hr') {
    const adminLabel = user.role === 'hr' ? 'HR Portal' : 'Admin Panel';
    menuItems.splice(0, 0, { name: adminLabel, path: '/admin', icon: ShieldCheck });
  }
  
  if (user?.role === 'finance' || user?.role === 'admin') {
    menuItems.splice(0, 0, { name: 'Finance Portal', path: '/finance', icon: Landmark });
  }

  if (user?.role === 'manager' || user?.role === 'admin') {
    menuItems.splice(1, 0, { name: 'Manager Portal', path: '/manager', icon: Briefcase });
  }

  // Common NavLink styling logic
  const linkStyle = (path, isLocked) => {
    const isActive = location.pathname === path;
    if (isLocked) {
      return `flex items-center rounded-xl transition-all duration-300 font-medium text-slate-500 bg-transparent border border-transparent opacity-40 cursor-not-allowed ${
        isExpanded ? 'gap-3 px-4 py-3' : 'lg:py-3 lg:px-0 lg:justify-center lg:w-10 lg:mx-auto'
      }`;
    }
    return `flex items-center rounded-xl transition-all duration-300 font-medium ${
      isActive
        ? 'text-white bg-brand-accent/20 border border-brand-accent/30 shadow-lg shadow-brand-accent/10'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
    } ${isExpanded ? 'gap-3 px-4 py-3' : 'lg:py-3 lg:px-0 lg:justify-center lg:w-10 lg:mx-auto'}`;
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop (only visible when opened on smaller screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Core Panel */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-white/10 glass-panel bg-slate-950/80 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isHovered ? 'lg:w-64 shadow-2xl shadow-brand-dark/80' : 'lg:w-[72px]'}`}
      >
        {/* Logo Banner and Mobile Close Button */}
        <div className={`flex items-center border-b border-white/10 transition-all duration-300 ${isExpanded ? 'justify-between px-6 h-20' : 'justify-center h-20'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-white shadow-md shadow-brand-accent/30 flex-shrink-0">
              A
            </div>
            <span className={`font-extrabold text-lg tracking-wider text-white transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:h-0 lg:overflow-hidden'}`}>APEX HRMS</span>
          </div>
          
          {isExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Mini Profile Summary */}
        <div className={`border border-white/5 flex items-center transition-all duration-300 ${isExpanded ? 'p-4 mx-4 my-6 rounded-2xl bg-white/5 gap-3' : 'lg:mx-2 lg:my-6 lg:p-2 lg:justify-center lg:rounded-2xl lg:bg-white/5'}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden flex-shrink-0">
            {user?.employeeDetails?.profileImage ? (
              <img
                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${user.employeeDetails.profileImage}`}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className={`min-w-0 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:h-0 lg:overflow-hidden'}`}>
            <h4 className="text-sm font-semibold truncate text-white">{user?.name}</h4>
            <p className="text-xs text-slate-400 truncate">{user?.employeeDetails?.designation || 'Employee'}</p>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isLocked = !shiftActive && item.path !== '/dashboard' && item.path !== '/leaves' && item.path !== '/salary' && item.path !== '/finance';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    return;
                  }
                  if (isOpen) toggleSidebar();
                }}
                className={linkStyle(item.path, isLocked)}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-5 h-5" />
                  {isLocked && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 ring-2 ring-slate-950">
                      <Lock className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>
                <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:h-0 lg:overflow-hidden'}`}>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer - Logout Button */}
        <div className={`border-t border-white/10 transition-all duration-300 ${isExpanded ? 'p-4' : 'lg:p-4 lg:px-2'}`}>
          <button
            onClick={logout}
            className={`flex items-center text-rose-400 hover:bg-rose-500/10 transition-all duration-300 font-medium cursor-pointer active:scale-95 ${isExpanded ? 'gap-3 w-full px-4 py-3 rounded-xl' : 'lg:py-3 lg:px-0 lg:justify-center lg:w-10 lg:mx-auto lg:rounded-xl'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:h-0 lg:overflow-hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
