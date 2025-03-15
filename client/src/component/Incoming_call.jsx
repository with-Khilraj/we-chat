import { motion } from "framer-motion";
import "../styles/Calls.css";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

const IncomingCall = ({ user, onAccept, onReject }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.length < 3 ? prev + "." : "");
    }, 500);
    return () => clearInterval(interval);
  });

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
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.username} />
            ) : (
              <span>{user?.username.charAt(0).toUpperCase() || "?"}</span>
            )}
            <div className="ring-animation"></div>
          </div>
          <h3>{user.username}</h3>
          <p>Incoming call{dots}</p> 
        </div>
        <div className="call-actions">
          <motion.button
            className="accept-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAccept}
          >
            ✅ Accept
          </motion.button>
          <motion.button
            className="reject-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onReject}
          >
            ❌ Reject
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

IncomingCall.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired
};

export default IncomingCall;