import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOTPVerification } from "../hooks/useOTPVerification";
import "../styles/emailVerification.css";
import VerificationForm from "../component/emailVerification/VerificationForm";
import SuccessCard from "../component/emailVerification/SuccessCard";
import { useAuth } from "../context/AuthContext";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;
  const {
    otp, enteredOTP, timer, errorMsg, successMsg, loading,
    handleChange, handleKeyDown, handleResend, handleVerifyOTP
  } = useOTPVerification(email);

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!email) {
      const timer = setTimeout(() => {
        navigate("/signup", { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [email, navigate]);

  // If no email, don't render anything
  if (!email) {
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
      // If verification returns a user (it should), sync AuthContext state
      if (result.user) {
        login(result.user);
      }
      setIsVerified(true);
    }
  };


  return (
    <div className="gradient-bg flex items-center justify-center min-h-screen p-4">

      <div className="verification-container glass rounded-3xl p-8 w-full max-w-md animate-slide-up">
        {!isVerified ? (

          <VerificationForm
            email={email}
            otp={otp}
            handleChange={handleChange}
            handleKeyDown={handleKeyDown}
            errorMsg={errorMsg}
            successMsg={successMsg}
            loading={loading}
            handleVerify={handleVerify}
            timer={timer}
            handleResend={handleResend}
            formatTime={formatTime}
          />
        ) : (
          <SuccessCard />
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
