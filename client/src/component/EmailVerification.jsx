import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOTPVerification } from "../hooks/useOTPVerification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faSpinner, faCheckCircle, faComment, faUsers, faBell } from "@fortawesome/free-solid-svg-icons";
import "../styles/emailVerification.css";
import { useState } from "react";

const EmailVerification = (userEmail, onContinue) => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const {
    otp, enteredOTP, timer, errorMsg, successMsg, loading,
    handleChange, handleKeyDown, handleResend, handleVerifyOTP
  } = useOTPVerification(email);

  const [isVerified, setIsVerified] = useState(false);

  if (!email) {
    navigate("/signup");
    return null;
  }

  const formatTime = ms => {
    const totalSeconds = Math.floor(ms / 1000);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (enteredOTP.length !== 6) return;

    const result = await handleVerifyOTP(email, enteredOTP);
    if (result?.success) {
      setIsVerified(true);
    }
  };

  return (
    <div className="gradient-bg flex items-center justify-center min-h-screen p-4">

      <div className="verification-container glass rounded-3xl p-8 w-full max-w-md animate-slide-up">
        {!isVerified ? (

          <div className="text-center">
            <div className="pending-state p-6 rounded-2xl inline-block mb-4">
              {/* <i className="fas fa-envelope text-white text-4xl animate-fade-in"></i> */}
              <FontAwesomeIcon icon={faEnvelope} className="text-white text-3xl animate-fade-in" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Email Verification</h2>
            <p className="text-white text-opacity-70 mb-6">Enter the 6-digit code sent to <span className="text-blue-400 font-medium">{email}</span></p>

            <div className="otp-inputs mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className="otp-input"
                />
              ))}
            </div>

             {/* === Error Message === */}
            {errorMsg && <div className="error-message mb-4">{errorMsg}</div>}
            {successMsg && !isVerified && (
              <div className="success-message mb-4">{successMsg}</div>
            )}

            <button
              className={`btn-primary w-full py-3 rounded-xl text-white font-medium flex justify-center items-center`}
              disabled={otp.some(d => !d) || loading}
              onClick={handleVerify}
            >
              {loading ? (
                <>
                  Verifying Email
                  <FontAwesomeIcon icon={faSpinner} spin className="ml-2" />
                </>
              ) : "Verify Email"}
            </button>

            <div className="mt-4 flex justify-between items-center">
              {timer > 0 ? (
                <span className="text-white text-opacity-50">Time Remaining: {formatTime(timer)}</span>
              ) : (
                <button className="btn-secondary py-2 px-4 rounded-xl" onClick= { () => handleResend(email) }>Resend OTP</button>
              )}
            </div>
          </div>
        ) : (
          <div className="success-card text-center animate-bounce-in">
            {/* Top success message */}
            <div className="mb-8">
              <div className="success-state p-6 rounded-2xl inline-block mb-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-4xl checkmark-animation" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-white text-opacity-70">
                Your account has been successfully verified
              </p>
            </div>

            {/* Welcome message card */}
            <div className="glass-dark rounded-xl p-6 mb-6 animate-fade-in">
              <h3 className="font-medium text-white mb-4">Welcome to We-Chat!</h3>
              <div className="space-y-3 text-sm text-white text-opacity-80 text-left">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faComment} className="text-blue-400 mt-0.5" />
                  <span>Start chatting with your friends in real-time</span>
                </div>
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faUsers} className="text-purple-400 mt-0.5" />
                  <span>Collaborate in group chats and communities</span>
                </div>
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faBell} className="text-green-400 mt-0.5" />
                  <span>Get notifications for messages and calls instantly</span>
                </div>
              </div>
            </div>


            <button
              className="btn-primary w-full py-3 rounded-xl text-white font-medium"
              onClick={() => navigate("/login")}
            >
              Continue to Login
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmailVerification;
