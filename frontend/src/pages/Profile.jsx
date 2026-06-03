// Import React hooks, API service clients, context, and Lucide icons
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Phone, Key, Upload, Lock, ShieldCheck, Tag, Cpu, AlertCircle, Sparkles } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, uploadAvatar, changePassword } = useContext(AuthContext);

  // Profile fields inputs states
  const [phone, setPhone] = useState(user?.employeeDetails?.phone || '');
  const [skillsInput, setSkillsInput] = useState(user?.employeeDetails?.skills?.join(', ') || '');
  
  // Password fields inputs states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form submitting / UX feedback states
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  // Display feedback banner
  const triggerBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 5000);
  };

  // Submit profile details changes (phone and skills)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setBanner({ type: '', text: '' });

    try {
      const result = await updateProfile(phone, skillsInput);
      if (result.success) {
        triggerBanner('success', 'Profile details updated successfully.');
      } else {
        triggerBanner('danger', result.message);
      }
    } catch (err) {
      triggerBanner('danger', 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Submit profile photo (avatar) upload
  const handleAvatarUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Restrict avatar file size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        triggerBanner('danger', 'Profile picture size cannot exceed 2MB.');
        return;
      }

      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('avatar', file); // Matches the fieldname 'avatar' in backend upload route

      try {
        const result = await uploadAvatar(formData);
        if (result.success) {
          triggerBanner('success', 'Profile image updated successfully.');
        } else {
          triggerBanner('danger', result.message);
        }
      } catch (err) {
        triggerBanner('danger', 'Failed to upload image.');
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  // Submit password updates
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerBanner('danger', 'Please enter all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerBanner('danger', 'New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      triggerBanner('danger', 'New password must be at least 6 characters long.');
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        triggerBanner('success', 'Password updated successfully!');
        
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        triggerBanner('danger', result.message);
      }
    } catch (err) {
      triggerBanner('danger', 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Format joining date display
  const formatJoiningDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          My Profile & Security
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Update your corporate identity card, upload a profile photo, and change account passwords.
        </p>
      </div>

      {/* Visual Feedback Alerts */}
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

      {/* Grid of Profile Visuals & Data Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Corporate ID Card & Avatar Locker */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/40 text-center flex flex-col items-center justify-between min-h-[480px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent to-indigo-500"></div>
          
          {/* Circular Visual Avatar Frame */}
          <div className="flex flex-col items-center mt-6">
            <div className="relative w-28 h-28 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-3xl text-brand-accent overflow-hidden shadow-xl shadow-black/40">
              {user?.employeeDetails?.profileImage ? (
                <img
                  src={`http://localhost:5000${user.employeeDetails.profileImage}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}

              {/* Upload Overlay spinner */}
              {avatarUploading && (
                <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Custom Image selector button */}
            <div className="relative mt-4">
              <input
                id="avatar-picker"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button 
                type="button" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold hover:text-white transition-all duration-300"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Avatar</span>
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mt-4">{user?.name}</h3>
            <p className="text-xs text-brand-accent font-semibold">{user?.employeeDetails?.designation || 'Associate'}</p>
          </div>

          {/* Details list inside identity card */}
          <div className="w-full mt-6 text-left space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Employee ID:</span>
              <span className="text-white font-bold">{user?.employeeDetails?.employeeId || 'APEX'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Work Email:</span>
              <span className="text-slate-300 truncate max-w-[160px]" title={user?.email}>{user?.email}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Department:</span>
              <span className="text-slate-300">{user?.employeeDetails?.department}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Region:</span>
              <span className="text-slate-300 font-bold">{user?.employeeDetails?.region || 'India'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-semibold">Joining Date:</span>
              <span className="text-slate-300">{formatJoiningDate(user?.employeeDetails?.joiningDate)}</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Edit details & Password Manager Split */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Box 1: Edit Contact Skills */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/20">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-brand-accent" />
              <h3 className="text-lg font-bold text-white">Modify Professional Profile</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone input */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    className="glass-input text-sm"
                    style={{ paddingLeft: '3rem' }}
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={profileSaving}
                  />
                </div>
              </div>
              {/* Skills input */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Skills (Comma-separated)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                    <Tag className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    className="glass-input text-sm"
                    style={{ paddingLeft: '3rem' }}
                    placeholder="React, Node.js, Express, MongoDB"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    disabled={profileSaving}
                  />
                </div>
              </div>

              {/* Renders skills as glowing tags below */}
              {user?.employeeDetails?.skills?.length > 0 && (
                <div className="md:col-span-2 mt-1">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Skill Badges</span>
                  <div className="flex flex-wrap gap-2">
                    {user.employeeDetails.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs bg-indigo-500/10 text-brand-accent border border-indigo-500/20 font-medium"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="glass-btn text-sm py-2.5 px-6 rounded-xl"
                >
                  {profileSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Box 2: Password Changer Card */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/20">
            <div className="flex items-center gap-2 mb-6">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Security Password Manager</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              
              {/* Current password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    className="glass-input text-sm"
                    style={{ paddingLeft: '3rem' }}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={passwordSaving}
                  />
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      className="glass-input text-sm"
                      style={{ paddingLeft: '3rem' }}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordSaving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      className="glass-input text-sm"
                      style={{ paddingLeft: '3rem' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="glass-btn text-sm py-2.5 px-6 rounded-xl"
                >
                  {passwordSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
