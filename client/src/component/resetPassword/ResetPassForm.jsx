import React, { useState } from 'react';
import { RESET_PASSWORD_MESSAGES } from '../../constant/ResetActions';

const ResetPassForm = ({ state, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onSubmit(password, confirmPassword);
  };

  const togglePassword = () => setShowPassword(!showPassword);
  const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthWidth = `${(strength / 5) * 100}%`;
  const strengthClass = strength <= 1 ? 'bg-red-500' : strength <= 3 ? 'bg-yellow-500' : 'bg-green-500';

  if (state.loading) {
    return (
      <div className="text-center animate-fade-in">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-2xl inline-block mb-4">
          <i className="fas fa-spinner animate-spin text-white text-3xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Validating Reset Link</h1>
        <p className="text-white opacity-70">Please wait while we verify your reset token...</p>
      </div>
    );
  }

  if (state.invalid) {
    return (
      <div className="text-center animate-fade-in">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-2xl inline-block mb-4">
          <i className="fas fa-times-circle text-white text-4xl animate-shake"></i>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Invalid Reset Link</h1>
        <p className="text-white opacity-70">This password reset link is not valid</p>
        <div className="glass-dark rounded-xl p-6 mb-6 mt-4">
          <h3 className="font-medium text-white mb-4">Possible reasons:</h3>
          <div className="space-y-3 text-sm text-white opacity-80 text-left">
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-red-400 mt-0.5"></i>
              <span>The link has already been used</span>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-red-400 mt-0.5"></i>
              <span>The link is malformed or incomplete</span>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle text-red-400 mt-0.5"></i>
              <span>The reset request was cancelled</span>
            </div>
          </div>
        </div>
        <button className="btn-primary w-full py-3 rounded-xl text-white font-medium" onClick={() => window.location.href = '/forgot-password'}>
          <i className="fas fa-redo mr-2"></i> Request New Reset Link
        </button>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="text-center animate-fade-in">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl inline-block mb-4">
          <i className="fas fa-check-circle text-white text-4xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Password Reset Successfully</h1>
        <p className="text-white opacity-70">Your password has been updated securely</p>
        <div className="glass-dark rounded-xl p-6 mb-6 mt-4">
          <div className="space-y-3 text-sm text-white opacity-80">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 opacity-20 p-1 rounded-full">
                <i className="fas fa-check text-green-400 text-xs"></i>
              </div>
              <span>Password updated with strong encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500 opacity-20 p-1 rounded-full">
                <i className="fas fa-check text-green-400 text-xs"></i>
              </div>
              <span>All active sessions have been logged out</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-500 opacity-20 p-1 rounded-full">
                <i className="fas fa-check text-green-400 text-xs"></i>
              </div>
              <span>Security notification sent to your email</span>
            </div>
          </div>
        </div>
        <button className="btn-primary w-full py-3 rounded-xl text-white font-medium" onClick={() => window.location.href = '/login'}>
          <i className="fas fa-sign-in-alt mr-2"></i> Sign In with New Password
        </button>
      </div>
    );
  }

  // Valid state: Reset form
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl inline-block mb-4">
          <i className="fas fa-shield-alt text-white text-3xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
        <p className="text-white opacity-70">Create a new secure password for your account</p>
      </div>
      <div className="glass-dark rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 opacity-20 p-2 rounded-full">
            <i className="fas fa-user text-blue-400"></i>
          </div>
          <div>
            <p className="text-white font-medium">Resetting password for your account</p>
            {/* <p className="text-blue-400 text-sm">{userEmail || 'user@example.com'}</p> */}
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input w-full px-4 py-3 pl-12 pr-12 rounded-xl"
              required
            />
            <i className="fas fa-lock absolute left-4 top-4 text-white opacity-60"></i>
            <button type="button" onClick={togglePassword} className="absolute right-4 top-4 text-white opacity-60 hover:text-white">
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          <div className={`h-1 rounded mt-2 ${strengthClass}`} style={{ width: strengthWidth }}></div>
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input w-full px-4 py-3 pl-12 pr-12 rounded-xl"
              required
            />
            <i className="fas fa-lock absolute left-4 top-4 text-white opacity-60"></i>
            <button type="button" onClick={toggleConfirmPassword} className="absolute right-4 top-4 text-white opacity-60 hover:text-white">
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={state.loading} className="btn-primary w-full py-3 rounded-xl text-white font-medium">
          {state.loading ? 'Resetting...' : 'Reset Password'}
          {state.loading && <i className="fas fa-spinner animate-spin ml-2"></i>}
        </button>
        {state.error && <p className="text-red-400 text-sm">{state.error}</p>}
      </form>
    </div>
  );
};

export default ResetPassForm;