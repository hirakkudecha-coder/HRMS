// Import React core hooks and React Router redirect
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ProtectedRoute Wrapper Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  // Pull authentication states from AuthContext
  const { user, loading } = useContext(AuthContext);

  // If session state is still loading from local storage, display visual glass spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="relative flex flex-col items-center gap-4">
          {/* Animated loading rings */}
          <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute w-16 h-16 border-4 border-indigo-500/20 rounded-full animate-pulse"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse-slow">Securing Session...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect them to the Login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role is defined and user role is not authorized, redirect to home page/dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If user is logged in and authorized, render the page children
  return children;
};

// Export Route Protector
export default ProtectedRoute;
