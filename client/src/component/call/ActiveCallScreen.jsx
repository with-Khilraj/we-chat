import { useCall } from "../../context/NewCallContext";
import { useCallTimer } from "../../hooks/useCallerTimer";

export default function ActiveCallScreen() {
  const {
    callType,
    remoteUser,
    isMuted,
    isCamOff,
    isSharing,
    localVideoRef,
    remoteVideoRef,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    endCall,
  } = useCall();

  const { formatted: timer } = useCallTimer();
  const isAudio = callType === "audio";

  const avatarUrl = remoteUser?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL}/${remoteUser.avatar}`
    : null;

  return (
    <div className="active-call-screen">

      {/* ── Remote area ── */}
      <div className="remote-area">
        {isAudio ? (
          <AudioOnlyRemote remoteUser={remoteUser} avatarUrl={avatarUrl} />
        ) : (
          <>
            {/* Remote video — hidden until stream attaches */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
            {/* Fallback avatar if remote camera is off */}
            <div className="remote-cam-off-fallback">
              <div className="fallback-avatar">
                {avatarUrl
                  ? <img src={avatarUrl} alt={remoteUser?.username} />
                  : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <p className="fallback-label">Camera off</p>
            </div>
          </>
        )}
      </div>

      {/* ── Top bar ── */}
      <div className="call-topbar">
        <div className="topbar-left">
          <div className="topbar-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={remoteUser?.username} />
              : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="topbar-meta">
            <span className="topbar-name">{remoteUser?.username}</span>
            <span className="topbar-timer">{timer}</span>
          </div>
        </div>
        <div className="topbar-badge">
          <span className="badge-dot" />
          HD · Encrypted
        </div>
      </div>

      {/* ── Local PiP (video only) ── */}
      {!isAudio && (
        <div className="local-pip">
          {isCamOff ? (
            <div className="pip-off">
              <span>👤</span>
              <span className="pip-off-label">Cam off</span>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="pip-video"
            />
          )}
          <span className="pip-label">You</span>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div className="controls-bar">
        <CtrlBtn
          onClick={toggleMic}
          active={isMuted}
          label={isMuted ? "Unmute" : "Mute"}
          danger={isMuted}
          icon={<MicIcon off={isMuted} />}
        />

        {!isAudio && (
          <CtrlBtn
            onClick={toggleCamera}
            active={isCamOff}
            label={isCamOff ? "Start Cam" : "Stop Cam"}
            danger={isCamOff}
            icon={<CamIcon off={isCamOff} />}
          />
        )}

        <CtrlBtn
          onClick={toggleScreenShare}
          active={isSharing}
          label={isSharing ? "Stop Share" : "Share Screen"}
          accent={isSharing}
          icon={<ScreenIcon />}
        />

        <CtrlBtn
          onClick={endCall}
          label="End Call"
          isEndCall
          icon={<PhoneOffIcon />}
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=DM+Mono:wght@300;400&display=swap');

        .active-call-screen {
          position: fixed;
          inset: 0;
          z-index: 9980;
          background: #08080f;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes waveBar {
          0%, 100% { height: 4px; opacity: 0.25; }
          50%       { height: 22px; opacity: 0.85; }
        }

        /* ── Remote area ── */
        .remote-area {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #08080f;
        }

        .remote-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
        }

        .remote-cam-off-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          position: relative;
          z-index: 1;
        }

        .fallback-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #1a1a2e;
          border: 2px solid rgba(255,255,255,0.08);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fallback-avatar img { width:100%; height:100%; object-fit:cover; }
        .fallback-avatar span {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #6ee7b7;
        }

        .fallback-label {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #475569;
          letter-spacing: 0.05em;
        }

        /* ── Audio only ── */
        .audio-only-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          position: relative;
          z-index: 1;
        }

        .audio-only-wrap::before {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(110,231,183,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .audio-avatar-stage {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .a-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(110,231,183,0.2);
          animation: expandRing 3s ease-out infinite;
        }
        .a-ring-1 { inset: -10px; animation-delay: 0s; }
        .a-ring-2 { inset: -22px; animation-delay: 1s; }
        .a-ring-3 { inset: -34px; animation-delay: 2s; }

        @keyframes expandRing {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.4); }
        }

        .audio-avatar {
          width: 120px;
          height: 120px;
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

        .audio-avatar img { width:100%; height:100%; object-fit:cover; }
        .audio-avatar span {
          font-family: 'Syne', sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: #6ee7b7;
        }

        .audio-name {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin-top: 4px;
        }

        .wave-bars {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 28px;
        }

        .w-bar {
          width: 3px;
          border-radius: 3px;
          background: #6ee7b7;
          animation: waveBar 1.3s ease-in-out infinite;
        }

        .audio-conn {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #6ee7b7;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.7;
        }

        /* ── Top bar ── */
        .call-topbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(to bottom, rgba(8,8,15,0.85) 0%, transparent 100%);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .topbar-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #1a1a2e;
          border: 1.5px solid rgba(255,255,255,0.08);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .topbar-avatar img { width:100%; height:100%; object-fit:cover; }
        .topbar-avatar span {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #6ee7b7;
        }

        .topbar-meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .topbar-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .topbar-timer {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #6ee7b7;
          letter-spacing: 0.08em;
        }

        .topbar-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 13px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px;
          backdrop-filter: blur(8px);
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6ee7b7;
          box-shadow: 0 0 6px #6ee7b7;
          animation: blinkDot 2.5s ease-in-out infinite;
        }

        @keyframes blinkDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── Local PiP ── */
        .local-pip {
          position: absolute;
          bottom: 108px;
          right: 18px;
          width: 130px;
          height: 180px;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.55);
          background: #1a1a2e;
          z-index: 10;
          cursor: grab;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .local-pip:hover {
          transform: scale(1.04);
          box-shadow: 0 12px 40px rgba(0,0,0,0.65);
        }

        .pip-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .pip-off {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 28px;
        }

        .pip-off-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #64748b;
        }

        .pip-label {
          position: absolute;
          bottom: 8px;
          left: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.6);
          background: rgba(0,0,0,0.5);
          padding: 2px 7px;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }

        /* ── Controls bar ── */
        .controls-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          padding: 18px 0 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: linear-gradient(to top, rgba(8,8,15,0.9) 0%, transparent 100%);
        }

        /* ── Ctrl buttons ── */
        .ctrl-btn {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #f1f5f9;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }

        .ctrl-btn:hover {
          background: rgba(255,255,255,0.11);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }

        .ctrl-btn.danger {
          background: rgba(248,113,113,0.12);
          border-color: rgba(248,113,113,0.25);
          color: #f87171;
        }

        .ctrl-btn.accent {
          background: rgba(129,140,248,0.12);
          border-color: rgba(129,140,248,0.25);
          color: #818cf8;
        }

        .ctrl-btn.end-call {
          width: 58px;
          height: 58px;
          background: #ef4444;
          border-color: #ef4444;
          color: #fff;
          box-shadow: 0 4px 18px rgba(239,68,68,0.4);
        }

        .ctrl-btn.end-call:hover {
          background: #dc2626;
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 28px rgba(239,68,68,0.5);
        }

        .ctrl-tooltip {
          position: absolute;
          bottom: calc(100% + 9px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
          letter-spacing: 0.05em;
        }

        .ctrl-btn:hover .ctrl-tooltip { opacity: 1; }
      `}</style>
    </div>
  );
}

// ── Audio-only remote view ──
function AudioOnlyRemote({ remoteUser, avatarUrl }) {
  const bars = [0, 0.15, 0.3, 0.45, 0.6, 0.45, 0.3, 0.15, 0];
  return (
    <div className="audio-only-wrap">
      <div className="audio-avatar-stage">
        <div className="a-ring a-ring-1" />
        <div className="a-ring a-ring-2" />
        <div className="a-ring a-ring-3" />
        <div className="audio-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt={remoteUser?.username} />
            : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
          }
        </div>
      </div>
      <span className="audio-name">{remoteUser?.username}</span>
      <div className="wave-bars">
        {bars.map((delay, i) => (
          <div key={i} className="w-bar" style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
      <span className="audio-conn">connected</span>
    </div>
  );
}

// ── Ctrl button ──
function CtrlBtn({ onClick, icon, label, danger, accent, isEndCall }) {
  const cls = ["ctrl-btn", danger && "danger", accent && "accent", isEndCall && "end-call"]
    .filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={onClick} aria-label={label}>
      {icon}
      <span className="ctrl-tooltip">{label}</span>
    </button>
  );
}

// ── Icons ──
function MicIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2"/>
      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function CamIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.32 6.68 13"/>
      <path d="M6.33 6.33A16.1 16.1 0 0 0 2.1 17.85 2 2 0 0 0 4 20h.09"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}