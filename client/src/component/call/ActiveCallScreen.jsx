import { useCall } from "../../context/NewCallContext";
import { useCallTimer } from "../../hooks/useCallerTimer";
import styles from "../../styles/call/ActiveCallScreen.module.css";

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
    <div className={styles.activeCallScreen}>

      {/* ── Remote area ── */}
      <div className={styles.remoteArea}>
        {isAudio ? (
          <AudioOnlyRemote remoteUser={remoteUser} avatarUrl={avatarUrl} />
        ) : (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.remoteVideo}
            />
            <div className={styles.remoteCamOffFallback}>
              <div className={styles.fallbackAvatar}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={remoteUser?.username} />
                  : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <p className={styles.fallbackLabel}>Camera off</p>
            </div>
          </>
        )}
      </div>

      {/* ── Top bar ── */}
      <div className={styles.callTopbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.topbarAvatar}>
            {avatarUrl
              ? <img src={avatarUrl} alt={remoteUser?.username} />
              : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className={styles.topbarMeta}>
            <span className={styles.topbarName}>{remoteUser?.username}</span>
            <span className={styles.topbarTimer}>{timer}</span>
          </div>
        </div>
        <div className={styles.topbarBadge}>
          <span className={styles.badgeDot} />
          HD · Encrypted
        </div>
      </div>

      {/* ── Local PiP (video only) ── */}
      {!isAudio && (
        <div className={styles.localPip}>
          {isCamOff ? (
            <div className={styles.pipOff}>
              <span>👤</span>
              <span className={styles.pipOffLabel}>Cam off</span>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={styles.pipVideo}
            />
          )}
          <span className={styles.pipLabel}>You</span>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div className={styles.controlsBar}>
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

    </div>
  );
}

// ── Audio-only remote view ──
function AudioOnlyRemote({ remoteUser, avatarUrl }) {
  const bars = [0, 0.15, 0.3, 0.45, 0.6, 0.45, 0.3, 0.15, 0];
  return (
    <div className={styles.audioOnlyWrap}>
      <div className={styles.audioAvatarStage}>
        <div className={`${styles.aRing} ${styles.aRing1}`} />
        <div className={`${styles.aRing} ${styles.aRing2}`} />
        <div className={`${styles.aRing} ${styles.aRing3}`} />
        <div className={styles.audioAvatar}>
          {avatarUrl
            ? <img src={avatarUrl} alt={remoteUser?.username} />
            : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
          }
        </div>
      </div>
      <span className={styles.audioName}>{remoteUser?.username}</span>
      <div className={styles.waveBars}>
        {bars.map((delay, i) => (
          <div key={i} className={styles.wBar} style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
      <span className={styles.audioConn}>connected</span>
    </div>
  );
}

// ── Ctrl button ──
function CtrlBtn({ onClick, icon, label, danger, accent, isEndCall }) {
  const cls = [
    styles.ctrlBtn,
    danger   && styles.danger,
    accent   && styles.accent,
    isEndCall && styles.endCall,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} onClick={onClick} aria-label={label}>
      {icon}
      <span className={styles.ctrlTooltip}>{label}</span>
    </button>
  );
}

// ── Icons ──
function MicIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function CamIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.32 6.68 13" />
      <path d="M6.33 6.33A16.1 16.1 0 0 0 2.1 17.85 2 2 0 0 0 4 20h.09" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
