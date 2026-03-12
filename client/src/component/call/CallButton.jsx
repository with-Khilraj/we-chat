import { useCall, CALL_STATE } from "../../context/NewCallContext";

export default function CallButton({ targetUser, type = "video" }) {
  const { callState, initiateCall } = useCall();
  const disabled = callState !== CALL_STATE.IDLE;

  return (
    <button
      className={`call-btn ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && initiateCall(targetUser, type)}
      aria-label={`${type === "video" ? "Video" : "Audio"} call ${targetUser?.username}`}
      title={disabled ? "Already in a call" : `${type === "video" ? "Video" : "Audio"} call`}
    >
      {type === "video" ? <VideoIcon /> : <AudioIcon />}

      <style>{`
        .call-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .call-btn:hover:not(.disabled) {
          background: rgba(110,231,183,0.1);
          border-color: rgba(110,231,183,0.25);
          color: #6ee7b7;
          transform: scale(1.06);
        }

        .call-btn.disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </button>
  );
}

function VideoIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.03-1.04a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}