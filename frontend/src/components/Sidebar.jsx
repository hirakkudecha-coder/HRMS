import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  CheckSquare,
  CreditCard,
  FolderLock,
  User,
  LogOut,
  X,
  Briefcase,
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  // Access global logout action
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  // Define sidebar menu options with icons and path URIs
  const baseMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Leaves', path: '/leaves', icon: FileSpreadsheet },
    { name: 'Tasks Check list', path: '/tasks', icon: CheckSquare },
    { name: 'Salary Slips', path: '/salary', icon: CreditCard },
    { name: 'Documents Locker', path: '/documents', icon: FolderLock },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  // Dynamically inject Manager Portal link if the logged-in user is a manager or admin
  const menuItems = [...baseMenuItems];
  if (user?.role && user.role !== 'employee') {
    menuItems.splice(1, 0, { name: 'Manager Portal', path: '/manager', icon: Briefcase });
  }
  // Inject Admin Panel link exclusively for admin role (at the top, position 0)
  if (user?.role === 'admin') {
    menuItems.splice(0, 0, { name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  // Common NavLink styling logic
  const linkStyle = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
      isActive
        ? 'text-white bg-brand-accent/20 border border-brand-accent/30 shadow-lg shadow-brand-accent/10'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`;
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-white/10 glass-panel bg-slate-950/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Banner and Mobile Close Button */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-white shadow-md shadow-brand-accent/30">
              A
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">APEX HRMS</span>
          </div>
          
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden focus:outline-none"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile Summary */}
        <div className="p-4 mx-4 my-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-brand-accent overflow-hidden">
            {user?.employeeDetails?.profileImage ? (
              <img
                src={`http://localhost:5000${user.employeeDetails.profileImage}`}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate text-white">{user?.name}</h4>
            <p className="text-xs text-slate-400 truncate">{user?.employeeDetails?.designation || 'Employee'}</p>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isOpen && toggleSidebar()} // Close menu overlay on mobile tap
                className={linkStyle(item.path)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer - Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all duration-300 font-medium cursor-pointer active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
