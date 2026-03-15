import { useCall } from "../../context/NewCallContext";
import styles from "../../styles/call/OutgoingCallScreen.module.css";

export default function OutgoingCallScreen() {
  const { remoteUser, callType, cancelCall } = useCall();

  const avatarUrl = remoteUser?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL}/${remoteUser.avatar}`
    : null;

  return (
    <div className={styles.outgoingScreen}>
      <div className={styles.outgoingCard}>

        <span className={styles.callTypePill}>
          {callType === "video" ? "📹 Video Call" : "🎙 Audio Call"}
        </span>

        {/* Avatar with animated rings */}
        <div className={styles.avatarStage}>
          <div className={styles.oRing} />
          <div className={`${styles.oRing} ${styles.oRing2}`} />
          <div className={styles.avatarCircle}>
            {avatarUrl
              ? <img src={avatarUrl} alt={remoteUser?.username} />
              : <span>{remoteUser?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
        </div>

        <h2 className={styles.remoteName}>{remoteUser?.username}</h2>

        {/* Animated calling dots */}
        <div className={styles.callingRow}>
          <div className={styles.dot} style={{ animationDelay: "0s" }} />
          <div className={styles.dot} style={{ animationDelay: "0.2s" }} />
          <div className={styles.dot} style={{ animationDelay: "0.4s" }} />
        </div>
        <p className={styles.callingLabel}>Ringing…</p>

        {/* Cancel button */}
        <button className={styles.btnCancel} onClick={cancelCall} aria-label="Cancel call">
          <CancelIcon cancelCircleClass={styles.cancelCircle} />
          <span>Cancel</span>
        </button>

      </div>
    </div>
  );
}

function CancelIcon({ cancelCircleClass }) {
  return (
    <div className={cancelCircleClass}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.32 6.68 13" />
        <path d="M6.33 6.33A16.1 16.1 0 0 0 2.1 17.85 2 2 0 0 0 4 20h.09" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </div>
  );
}
