import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faSpinner } from "@fortawesome/free-solid-svg-icons";
import OPTInput from "./OTPInput";

const VerificationForm = ({
  email,
  otp,
  handleChange,
  handleKeyDown,
  errorMsg,
  successMsg,
  loading,
  handleVerify,
  timer,
  handleResend,
  formatTime
}) => {
  return (
    <div className="text-center">
      <div className="pending-state p-6 rounded-2xl inline-block mb-4">
        {/* <i className="fas fa-envelope text-white text-4xl animate-fade-in"></i> */}
        <FontAwesomeIcon icon={faEnvelope} className="text-white text-3xl animate-fade-in" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Email Verification</h2>
      <p className="text-white text-opacity-70 mb-6">Enter the 6-digit code sent to <span className="text-blue-400 font-medium">{email}</span></p>

      <OPTInput
        otp={otp}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
      />

      {/* === Error Message === */}
      {errorMsg && <div className="error-message mb-4">{errorMsg}</div>}
      {successMsg && (
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
          <button className="btn-secondary py-2 px-4 rounded-xl" onClick={() => handleResend(email)}>Resend OTP</button>
        )}
      </div>
    </div>
  );
};

export default VerificationForm;