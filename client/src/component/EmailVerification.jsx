import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import api from '../Api';
import '../styles/EmailVerification.css'


const EmailVerification = () => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(2 * 60 * 1000); // 2 minutes
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    };

    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer > 0 ? prevTimer - 1 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;  // prevent multiple digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOTP(newOtp);

    // auto-focus next input
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  }

  const handleResendOTP = async () => {
    try {
      await api.post('/api/users/resend-otp', { email });
      setTimer(2 * 60 * 1000); // reset timer to 2 minutes
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resend OTP')
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    try {
      const response = await api.post('/api/users/verify-otp', {
        email,
        otp: otpString
      });

      // store tokens and user data
      localStorage.setItem('token', response.data.accessToken);

      toast.success(response.data.message, {
        position: 'top-center',
        autoClose: 2000,
      })

      // set timeout to redirect to login page
      setTimeout(() =>  {
        navigate('/login');
      }, 2010);
    } catch (error) {
      setError(error.response?.data?.error || 'Verification failed');
    }
  };


  return (
    <div className="verification-container">
      <h2>Email Verification</h2>
      <p>Enter the 6-digit code sent to your {email}</p>

      <form onSubmit={handleSubmit}>
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              type="text"
              id={`otp-${index}`}
              key={index}
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              pattern="\d*"
            />
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type='submit' disabled={otp.some(digit => !digit)}>
          Verify Email
        </button>
      </form>

      <div className="timer">
        Time Remaining: {Math.floor(timer / 60)} : {(timer % 60).toString().padStart(2, '0')}
      </div>

      {timer === 0 && (
        <button className="resend-button" onClick={handleResendOTP}>
          Resend OTP
        </button>
      )}
    </div>
  );
};

export default EmailVerification;
