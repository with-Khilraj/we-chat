import { useCall, CALL_STATE } from "../../context/NewCallContext";
import IncomingCallModal  from "./IncomingCallModal";
import OutgoingCallScreen from "./OutgoingCallScreen";
import ActiveCallScreen   from "./ActiveCallScreen";


export default function CallManager() {
  const { callState, callError } = useCall();

  return (
    <>
      {/* Floating error toast */}
      {callError && <CallErrorToast message={callError} />}

      {/* Incoming call — shown as a modal overlay */}
      {callState === CALL_STATE.INCOMING && <IncomingCallModal />}

      {/* Outgoing call — full screen */}
      {callState === CALL_STATE.OUTGOING && <OutgoingCallScreen />}

      {/* Active call — full screen */}
      {callState === CALL_STATE.ACTIVE && <ActiveCallScreen />}
    </>
  );
}

function CallErrorToast({ message }) {
  return (
    <div className="call-error-toast">
      <span className="err-icon">⚠</span>
      <span className="err-msg">{message}</span>
      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .call-error-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          background: rgba(20,10,10,0.95);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 12px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .err-icon {
          font-size: 14px;
          color: #f87171;
        }
        .err-msg {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #fca5a5;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}