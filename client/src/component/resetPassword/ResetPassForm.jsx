import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faShieldAlt, faSpinner, faUser } from '@fortawesome/free-solid-svg-icons';

const ResetPassForm = ({ state, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!password || password.length < 5) newErrors.password = 'Password must be at least 5 characters';
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


  // Valid state: Reset form
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 rounded-2xl inline-block mb-4">
          <FontAwesomeIcon icon={faShieldAlt} className="text-white text-3xl" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
        <p className="text-white opacity-70">Create a new secure password for your account</p>
      </div>
      <div className="glass-dark rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 opacity-20 p-2 rounded-full">
            <FontAwesomeIcon icon={faUser} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white font-medium">Resetting password for your account</p>
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
            <FontAwesomeIcon icon={faLock} className="absolute left-4 top-4 text-white opacity-60" />
            <button type="button" onClick={togglePassword} className="absolute right-4 top-4 text-white opacity-60 hover:text-white">
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
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
            <FontAwesomeIcon icon={faLock} className="absolute left-4 top-4 text-white opacity-60" />
            <button type="button" onClick={toggleConfirmPassword} className="absolute right-4 top-4 text-white opacity-60 hover:text-white">
              <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={state.loading} className="btn-primary w-full py-3 rounded-xl text-white font-medium">
          {state.loading ? 'Resetting...' : 'Reset Password'}
          {state.loading && <FontAwesomeIcon icon={faSpinner} className="fas fa-spinner animate-spin ml-2" />}
        </button>
        {state.error && <p className="text-red-400 text-sm">{state.error}</p>}
      </form>
    </div>
  );
};

export default ResetPassForm;