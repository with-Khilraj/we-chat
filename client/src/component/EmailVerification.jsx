import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../Api';
import '../styles/emailVerification.css';
import { joinOTP, isValidDigit, formatTime } from '../services/emailVerificationService';


const EmailVerification = () => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(2 * 60); // in seconds
  const [error, setError] = useState('');
  const [state, setState] = useState('pending'); // pending | processing | success | error
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    if (state === 'pending') {
      const interval = setInterval(() => {
        setTimer(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [email, navigate, state]);

  const handleChange = (index, value) => {
    if (!isValidDigit(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOTP(newOtp);

    // auto-focus next input
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleResendOTP = async () => {
    try {
      await api.post('/api/users/resend-otp', { email });
      setTimer(2 * 60);
      setError('');
      toast.success('OTP resent successfully!', { position: 'top-center', autoClose: 2000 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState('processing');
    const otpString = joinOTP(otp);

    try {
      const response = await api.post('/api/users/verify-otp', { email, otp: otpString });

      // store token
      localStorage.setItem('token', response.data.accessToken);

      toast.success(response.data.message, { position: 'top-center', autoClose: 2000 });

      // simulate processing animation delay
      setTimeout(() => setState('success'), 1800);

    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
      setState('error');
    }
  };

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <div className="gradient-bg flex items-center justify-center min-h-screen p-4">
      <div className="verification-container glass animate-slide-up">
        {/* Pending State */}
        {state === 'pending' && (
          <div className="text-center animate-fade-in">
            <div className="pending-state p-6 rounded-2xl inline-block mb-4">
              <i className="fas fa-envelope text-white text-4xl animate-fade-in"></i>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Check Your Email</h1>
            <p className="text-black text-opacity-70">Enter the 6-digit code sent to</p>
            <p className="text-blue-400 font-medium">{email}</p>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="otp-inputs mb-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="btn-primary w-full py-3 rounded-xl text-white font-medium mt-2"
                disabled={otp.some(d => !d)}
              >
                Verify Email
              </button>
            </form>

            <div className="timer mt-3 text-lg font-semibold">{formatTime(timer)}</div>
            {timer === 0 && (
              <button
                onClick={handleResendOTP}
                className="btn-secondary w-full py-2 rounded-xl mt-2"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}

        {/* Processing State */}
        {state === 'processing' && (
          <div className="text-center animate-fade-in">
            <div className="pending-state p-6 rounded-2xl inline-block mb-4">
              <i className="fas fa-spinner spinner text-white text-4xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email...</h1>
            <p className="text-white text-opacity-70">Please wait while we verify your email</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center animate-bounce-in">
            <div className="success-state p-6 rounded-2xl inline-block mb-4">
              <i className="fas fa-check-circle text-white text-4xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Email Verified!</h1>
            <p className="text-black text-opacity-70 mb-4">Welcome to We-Chat, start chatting with your friends!</p>
            <button
              className="btn-primary w-full py-3 rounded-xl text-white font-medium animate-fade-in"
              onClick={handleContinue}
            >
              Continue to Login
            </button>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center animate-fade-in">
            <div className="error-state p-6 rounded-2xl inline-block mb-4">
              <i className="fas fa-times-circle text-white text-4xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Verification Failed</h1>
            <p className="text-white text-opacity-70">{error}</p>
            <button
              onClick={handleResendOTP}
              className="btn-primary w-full py-3 rounded-xl text-white font-medium mt-2"
            >
              Resend Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
