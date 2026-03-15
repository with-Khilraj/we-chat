import { useCall } from "../../context/NewCallContext";
import styles from "../../styles/call/IncomingCallModal.module.css";

export default function IncomingCallModal() {
  const { remoteUser, callType, acceptCall, rejectCall } = useCall();

  const avatarUrl = remoteUser?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL}/${remoteUser.avatar}`
    : null;

  return (
    <div className={styles.incomingModalOverlay}>
      <div className={styles.incomingModal}>

        {/* Pulse rings */}
        <div className={styles.pulseRings}>
          <span className={styles.ring} />
          <span className={`${styles.ring} ${styles.ring2}`} />
          <span className={`${styles.ring} ${styles.ring3}`} />
          <div className={styles.avatarWrap}>
            {avatarUrl
              ? <img src={avatarUrl} alt={remoteUser?.username} />
              : <span className={styles.avatarFallback}>{remoteUser?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
        </div>

        <div className={styles.callerInfo}>
          <p className={styles.callLabel}>
            {callType === "video" ? "📹 Incoming Video Call" : "🎙 Incoming Audio Call"}
          </p>
          <h2 className={styles.callerName}>{remoteUser?.username}</h2>
          <p className={styles.callerSub}>is calling you…</p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnReject} onClick={rejectCall} aria-label="Reject call">
            <PhoneOffIcon iconClass={styles.iconCircleReject} />
            <span>Decline</span>
          </button>
          <button className={styles.btnAccept} onClick={acceptCall} aria-label="Accept call">
            <PhoneIcon iconClass={styles.iconCircleAccept} />
            <span>Accept</span>
          </button>
        </div>

      </div>
    </div>
  );
}

function PhoneOffIcon({ iconClass }) {
  return (
    <div className={iconClass}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.32 6.68 13" />
        <path d="M6.33 6.33A16.1 16.1 0 0 0 2.1 17.85 2 2 0 0 0 4 20h.09" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </div>
  );
}

function PhoneIcon({ iconClass }) {
  return (
    <div className={iconClass}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    </div>
  );
}
