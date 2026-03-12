import { useCall } from "../../context/NewCallContext";

export default function OutgoingCallScreen() {
  const { remoteUser, callType, cancelCall } = useCall();

  const avatarUrl = remoteUser?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL}/${remoteUser.avatar}`
    : null;

  return (
    <div className="outgoing-screen">
      <div className="outgoing-card">

        <span className="call-type-pill">
          {callType === "video" ? "📹 Video Call" : "🎙 Audio Call"}
        </span>

        {/* Avatar with animated rings */}
        <div className="avatar-stage">
          <div className="o-ring o-ring-1" />
          <div className="o-ring o-ring-2" />
          <div className="avatar-circle">
            {avatarUrl
              ? <img src={avatarUrl} alt={remoteUser?.username} />
              : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
        </div>

        <h2 className="remote-name">{remoteUser?.username}</h2>

        {/* Animated calling dots */}
        <div className="calling-row">
          <div className="dot" style={{ animationDelay: "0s" }} />
          <div className="dot" style={{ animationDelay: "0.2s" }} />
          <div className="dot" style={{ animationDelay: "0.4s" }} />
        </div>
        <p className="calling-label">Ringing…</p>

        {/* Cancel button */}
        <button className="btn-cancel" onClick={cancelCall} aria-label="Cancel call">
          <CancelIcon />
          <span>Cancel</span>
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700&family=DM+Mono:wght@400&display=swap');

        .outgoing-screen {
          position: fixed;
          inset: 0;
          z-index: 9990;
          background: #08080f;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.4s ease;
        }

        .outgoing-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 40%, rgba(110,231,183,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(16px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes pulseOut {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; }
          40%            { transform: scale(1.3); opacity: 1; }
        }

        .outgoing-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
          animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1);
        }

        .call-type-pill {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6ee7b7;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.2);
          padding: 4px 14px;
          border-radius: 100px;
          margin-bottom: 8px;
        }

        .avatar-stage {
          position: relative;
          width: 110px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 12px 0;
        }

        .o-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1.5px solid rgba(110,231,183,0.3);
          animation: pulseOut 2.8s ease-out infinite;
        }
        .o-ring-2 { animation-delay: 1s; inset: -20px; }

        .avatar-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #1a1a2e;
          border: 2px solid rgba(110,231,183,0.2);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .avatar-circle img { width:100%; height:100%; object-fit:cover; }

        .avatar-circle span {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 700;
          color: #6ee7b7;
        }

        .remote-name {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin-top: 4px;
        }

        .calling-row {
          display: flex;
          gap: 7px;
          align-items: center;
          height: 20px;
          margin-top: 4px;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6ee7b7;
          animation: dotBounce 1.4s ease-in-out infinite;
        }

        .calling-label {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #64748b;
          letter-spacing: 0.08em;
        }

        .btn-cancel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 24px;
          transition: transform 0.2s;
        }

        .btn-cancel:hover { transform: scale(1.07); }

        .btn-cancel span {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #f87171;
          letter-spacing: 0.08em;
        }

        .cancel-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-cancel:hover .cancel-circle {
          background: rgba(248,113,113,0.2);
        }
      `}</style>
    </div>
  );
}

function CancelIcon() {
  return (
    <div className="cancel-circle">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.32 6.68 13"/>
        <path d="M6.33 6.33A16.1 16.1 0 0 0 2.1 17.85 2 2 0 0 0 4 20h.09"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    </div>
  );
}