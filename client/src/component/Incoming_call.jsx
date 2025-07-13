import { motion } from "framer-motion";
import "../styles/Calls.css";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useCall } from "../context/CallContext";

// const IncomingCall = ({ user, onAccept, onReject }) => {
const IncomingCall = () => {
  const { remoteUser, acceptCall, rejectCall } = useCall();
  const [dots, setDots] = useState("");

  // safe fallbacks
  const username = remoteUser?.username || "Caller";
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.length < 3 ? prev + "." : "");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if(!remoteUser) return null;
  
  return (
    <motion.div
      className="incoming-call"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="call-content">
        <div className="user-info">
          <div className="avatar">
            {remoteUser?.avatar ? (
              <img src={remoteUser.avatar} alt={remoteUser?.username} />
            ) : (
              <span>{initial}</span>
            )}
            <div className="ring-animation"></div>
          </div>
          <h3>{remoteUser.username || "Incomming Call"}</h3>
          <p>Incoming call{dots}</p>
        </div>

        <div className="call-actions">
          <motion.button
            className="accept-button"
            aria-label="Accept call"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={acceptCall}
          >
            ✅ Accept
          </motion.button>
          <motion.button
            className="reject-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={rejectCall}
          >
            ❌ Reject
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// IncomingCall.propTypes = {
//   user: PropTypes.shape({
//     username: PropTypes.string.isRequired,
//     avatar: PropTypes.string,
//   }).isRequired,
//   onAccept: PropTypes.func.isRequired,
//   onReject: PropTypes.func.isRequired
// };

export default IncomingCall;