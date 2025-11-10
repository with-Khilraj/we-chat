import { useEffect, useRef, useState } from "react"
import { FORGOT_STATUS } from "../constant/ForgotStatus";

export const useForgotPasswordEffect = ({ status, navigate, remainingTime }) => {
  const initialCountdownRef = useRef(null);
  const prevStatusRef = useRef(status);
  const [showToast, setShowToast] = useState(false);


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

  // capture initial countdown ONLY when entering RATE_LIMIT
  useEffect(() => {
    if (
      status === FORGOT_STATUS.RATE_LIMIT &&
      prevStatusRef.current !== FORGOT_STATUS.RATE_LIMIT
    ) {
      initialCountdownRef.current = remainingTime;
    }
    if (status !== FORGOT_STATUS.RATE_LIMIT) {
      initialCountdownRef.current = null;
    }
  }, [status, remainingTime]);


  // keep previous status to detect transitions
  useEffect(() => { prevStatusRef.current = status; }, [status]);

  // Escape to go back
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/login");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { initialCountdownRef, showToast };
}