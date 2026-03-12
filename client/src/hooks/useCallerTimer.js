import { useState, useEffect } from "react";
import { useCall, CALL_STATE } from "../context/NewCallContext";

export function useCallTimer() {
  const { callState } = useCall();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (callState !== CALL_STATE.ACTIVE) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  const hours   = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs    = seconds % 60;

  const formatted = hours > 0
    ? `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`
    : `${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;

  return { seconds, formatted };
}