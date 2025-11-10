import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useForgotPasswordReducer from "../../hooks/useForgotPasswordLogic";
import { FORGOT_STATUS } from "../../constant/ForgotStatus";

import InputField from "../forgotPassword/shared/InputField";
import Button from "./shared/Button";
import ErrorMessage from "./ErrorMessage";
import SuccessState from "./SuccessState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faKey, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const Toast = ({ message, visible }) => {
  return (
    <div
      aria-live="polite"
      role="status"
      className={`fixed top-6 right-6 z-50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
    >
      <div className="bg-white bg-opacity-95 text-gray-900 px-4 py-2 rounded-lg shadow-md">
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

const ForgotPassForm = () => {
  const navigate = useNavigate();
  const { state, handleForgotPassword, resetState } = useForgotPasswordReducer();
  const { status, error, message, email: sentEmail, remainingTime, retryAfter } = state;

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [showToast, setShowToast] = useState(false);

  // store initial countdown seconds to compute progress
  const initialCountdownRef = useRef(null);

  // keep previous status to detect transitions
  const prevStatusRef = useRef(status);
  useEffect(() => { prevStatusRef.current = status; }, [status]);

  // when entering RATE_LIMIT capture initial remaining seconds
  useEffect(() => {
    if (status === FORGOT_STATUS.RATE_LIMIT) {
      // capture initial value (only the first time)
      if (!initialCountdownRef.current || initialCountdownRef.current < remainingTime) {
        initialCountdownRef.current = remainingTime;
      }
    } else {
      // clear initial when not rate-limited
      initialCountdownRef.current = null;
    }
  }, [status, remainingTime]);

  // trigger subtle toast / button animation when countdown ends
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === FORGOT_STATUS.RATE_LIMIT && status === FORGOT_STATUS.IDLE) {
      // countdown finished (hook dispatches RESET -> IDLE)
      // show a subtle toast
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2200);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Escape to go back
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/login");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Validate email quickly on client side
  const validateEmail = (val) => {
    if (!val || !val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Please enter a valid email address";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validateEmail(email);
    if (v) {
      setFieldError(v);
      return;
    }
    setFieldError("");
    // kick off request (reducer manages loading)
    await handleForgotPassword(email.trim().toLowerCase());
  };

  const handleTryDifferent = () => {
    setEmail("");
    setFieldError("");
    resetState();
  };

  // progress calculations
  const initialSeconds = initialCountdownRef.current || remainingTime || 0;
  const currentSeconds = remainingTime || 0;
  const progressPercent =
    initialSeconds > 0 ? Math.max(0, Math.round(((initialSeconds - currentSeconds) / initialSeconds) * 100)) : 100;

  // derive UI states
  const isSubmitting = status === FORGOT_STATUS.SUBMITTING;
  const isRateLimited = status === FORGOT_STATUS.RATE_LIMIT;
  const isSuccess = status === FORGOT_STATUS.SUCCESS;
  const hasError = status === FORGOT_STATUS.ERROR && !!error;

  // If success state, render SuccessState (keeps component tree simple)
  if (isSuccess) {
    return (
      <div className="text-center animate-fade-in" role="status" aria-live="polite">
        <SuccessState email={sentEmail || email} onTryDifferent={handleTryDifferent} />
        <Toast message="You can try again if needed." visible={showToast} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-b rounded-3xl">
      <Toast message="You can now retry to send the reset email." visible={showToast} />

      <div className="mb-6 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl inline-block mb-4">
          <FontAwesomeIcon icon={faKey} className="text-white text-3xl" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
        <p className="text-white text-opacity-70">No worries — we'll send you reset instructions.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" aria-live="polite">
        <InputField
          id="forgot-email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(validateEmail(e.target.value));
          }}
          error={fieldError}
          aria-describedby={fieldError ? "forgot-email-error" : undefined}
          aria-invalid={!!fieldError}
          autoFocus
        />

        {/* Server-side error */}
        {hasError && <div role="alert"><ErrorMessage message={error} /></div>}

        {/* Inline rate limit progress + message (keeps UI on same form) */}
        {isRateLimited && (
          <div className="mt-1 space-y-2" aria-live="polite" aria-atomic="true">
            <div className="w-full bg-white bg-opacity-6 rounded-lg overflow-hidden h-3">
              <div
                className="h-3 transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background:
                    "linear-gradient(90deg, rgba(34,197,94,1), rgba(34,139,230,1))",
                }}
                aria-hidden="true"
              />
            </div>

            <div className="flex items-center justify-between text-sm text-white text-opacity-80">
              <span>
                Try again in <strong className="text-white">{currentSeconds}s</strong>
              </span>
              <div className="mt-8 animate-fade-in">
                <a href="/login" id="backToLoginRateLimit" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Back to Login
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Primary action */}
        <div>
          <Button
            type="submit"
            disabled={isSubmitting || isRateLimited}
            className={`btn-primary w-full py-3 rounded-xl text-white font-medium transition-all ${isSubmitting ? "transform -translate-y-0.5 shadow-md" : ""
              }`}
            aria-disabled={isSubmitting || isRateLimited}
            aria-live="polite"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faSpinner} spin /> Sending...
              </span>
            ) : isRateLimited ? (
              `Try Again in ${currentSeconds}s`
            ) : (
              "Send Reset Instructions"
            )}
          </Button>
        </div>

        {/* Small help / back link */}
        <div className="mt-8 animate-fade-in">
          <a href="/login" id="backToLoginRateLimit" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassForm;
