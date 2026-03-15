import { useCall, CALL_STATE } from "../../context/NewCallContext";
import IncomingCallModal from "./IncomingCallModal";
import OutgoingCallScreen from "./OutgoingCallScreen";
import ActiveCallScreen from "./ActiveCallScreen";
import styles from "../../styles/call/CallManager.module.css";

export default function CallManager() {
  const { callState, callError } = useCall();

  return (
    <>
      {callError && <CallErrorToast message={callError} />}
      {callState === CALL_STATE.INCOMING && <IncomingCallModal />}
      {callState === CALL_STATE.OUTGOING && <OutgoingCallScreen />}
      {callState === CALL_STATE.ACTIVE && <ActiveCallScreen />}
    </>
  );
}

function CallErrorToast({ message }) {
  return (
    <div className={styles.callErrorToast}>
      <span className={styles.errIcon}>⚠</span>
      <span className={styles.errMsg}>{message}</span>
    </div>
  );
}
