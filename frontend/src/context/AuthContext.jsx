// Import React core hooks and our API client
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// Create the Context object
export const AuthContext = createContext();

// Create the Provider Component
export const AuthProvider = ({ children }) => {
  // State for storing the authenticated employee details
  const [user, setUser] = useState(null);
  
  // State to track if session check is happening on startup
  const [loading, setLoading] = useState(true);

  // Hook to restore session on app launch
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      // If no token exists, immediately stop loading state
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch current user details from '/auth/me'
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          // If session is expired, clean up token
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Session restoration failed:', err.message);
        localStorage.removeItem('token');
      } finally {
        // Mark session check as completed
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Function to login an employee
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.success) {
        // Store JWT token in localStorage
        localStorage.setItem('token', res.data.token);
        // Set user state
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      // Return custom message from server error
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  // Function to logout the employee
  const logout = () => {
    // Purge JWT token from localStorage
    localStorage.removeItem('token');
    // Clear user state
    setUser(null);
  };

  // Function to change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      // If password change is successful, cache the new password in localStorage for demo credentials autofill
      if (user && user.role) {
        localStorage.setItem(`autofill_password_${user.role}`, newPassword);
      }
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to change password';
      return { success: false, message };
    }
  };

  // Function to update profile info (skills & contact phone)
  const updateProfile = async (phone, skills) => {
    try {
      const res = await api.put('/employee/profile', { phone, skills });
      if (res.data.success) {
        // Update user state with returned updated profile details
        setUser(res.data.user);
        return { success: true, message: 'Profile updated successfully' };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  // Function to upload a new profile picture (avatar)
  const uploadAvatar = async (formData) => {
    try {
      const res = await api.post('/employee/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        // Update user state with new profile picture URL path
        setUser(res.data.user);
        return { success: true, imageUrl: res.data.profileImage };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload profile picture';
      return { success: false, message };
    }
  };

  // Render context provider with user state and helper auth actions
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        changePassword,
        updateProfile,
        uploadAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
