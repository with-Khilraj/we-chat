import { useState, useEffect } from "react";
import { verifyOTP, resendOTP } from "../services/emailVerificationService";

export const useOTPVerification = (initialEmail, timerDuration = 2 * 60 * 1000) => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(timerDuration);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");


  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1000), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle input change
  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOTP(newOtp);

    // auto-focus
    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };


  // Verify OTP
  const handleVerifyOTP = async (email, otp) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const result = await verifyOTP(email, otp);

    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setSuccessMsg(result.message);
    }

    setLoading(false);
    return result;
  };

  // Resend OTP
  const handleResend = async (email) => {
    setLoading(true);
    setSuccessMsg("");

    const response = await resendOTP(email);
    setLoading(false);

    if (response.success) {
      setSuccessMsg("📩 A new OTP has been sent to your email.");
      setTimer(timerDuration); // reset timer
      setOTP(['', '', '', '', '', '']); // clear input
    } else {
      setErrorMsg(response.message);
    }
  };

  const enteredOTP = otp.join("");


  return {
    otp,
    enteredOTP,
    timer,
    errorMsg,
    successMsg,
    loading,
    handleChange,
    handleKeyDown,
    handleResend,
    handleVerifyOTP
  };
};