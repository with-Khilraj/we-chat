import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOTPVerification } from "../hooks/useOTPVerification";
import "../styles/emailVerification.css";
import VerificationForm from "../component/emailVerification/VerificationForm";
import SuccessCard from "../component/emailVerification/SuccessCard";

const EmailVerification = () => {
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
