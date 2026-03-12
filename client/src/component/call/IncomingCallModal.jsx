import { useCall } from "../../context/NewCallContext";

export default function IncomingCallModal() {
  const { remoteUser, callType, acceptCall, rejectCall } = useCall();

  const avatarUrl = remoteUser?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL}/${remoteUser.avatar}`
    : null;

  return (
    <div className="incoming-modal-overlay">
      <div className="incoming-modal">
        {/* Pulse rings */}
        <div className="pulse-rings">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />
          <div className="avatar-wrap">
            {avatarUrl
              ? <img src={avatarUrl} alt={remoteUser?.username} />
              : <span className="avatar-fallback">{remoteUser?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
        </div>

        <div className="caller-info">
          <p className="call-label">{callType === "video" ? "📹 Incoming Video Call" : "🎙 Incoming Audio Call"}</p>
          <h2 className="caller-name">{remoteUser?.username}</h2>
          <p className="caller-sub">is calling you…</p>
        </div>

        <div className="modal-actions">
          <button className="btn-reject" onClick={rejectCall} aria-label="Reject call">
            <PhoneOffIcon />
            <span>Decline</span>
          </button>
          <button className="btn-accept" onClick={acceptCall} aria-label="Accept call">
            <PhoneIcon />
            <span>Accept</span>
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700&family=DM+Mono:wght@400&display=swap');

        .incoming-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp {
          from { opacity:0; transform: translateY(24px) scale(0.96); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .incoming-modal {
          background: #0e0e16;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 40px 36px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 320px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1);
        }

        .pulse-rings {
          position: relative;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #6ee7b7;
          animation: pulseRing 2.4s cubic-bezier(0.25,0.46,0.45,0.94) infinite;
        }
        .ring-2 { animation-delay: 0.8s; }
        .ring-3 { animation-delay: 1.6s; }

        .avatar-wrap {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(110,231,183,0.25);
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .avatar-wrap img { width:100%; height:100%; object-fit:cover; }

        .avatar-fallback {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #6ee7b7;
        }

        .caller-info {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .call-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6ee7b7;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          padding: 3px 12px;
          border-radius: 100px;
          display: inline-block;
        }

        .caller-name {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin-top: 6px;
        }

        .caller-sub {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #64748b;
        }

        .modal-actions {
          display: flex;
          gap: 32px;
          margin-top: 8px;
        }

        .btn-reject, .btn-accept {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          transition: transform 0.2s;
        }

        .btn-reject span { color: #f87171; }
        .btn-accept span { color: #6ee7b7; }

        .btn-reject:hover, .btn-accept:hover { transform: scale(1.08); }

        .btn-reject svg-wrap, .btn-accept svg-wrap { display: block; }

        .btn-reject .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(248,113,113,0.12);
          border: 1px solid rgba(248,113,113,0.25);
          color: #f87171;
          transition: background 0.2s;
        }

        .btn-accept .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(110,231,183,0.12);
          border: 1px solid rgba(110,231,183,0.25);
          color: #6ee7b7;
          transition: background 0.2s;
        }

        .btn-reject:hover .icon-circle { background: rgba(248,113,113,0.2); }
        .btn-accept:hover .icon-circle { background: rgba(110,231,183,0.2); }
      `}</style>
    </div>
  );
}

function PhoneOffIcon() {
  return (
    <div className="icon-circle">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.32 6.68 13"/>
        <path d="M6.33 6.33A16.1 16.1 0 0 0 2.1 17.85 2 2 0 0 0 4 20h.09"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    </div>
  );
}

function PhoneIcon() {
  return (
    <div className="icon-circle">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
      </svg>
    </div>
  );
}