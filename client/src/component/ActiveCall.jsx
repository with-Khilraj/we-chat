import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import "../styles/Calls.css"

const ActiveCall = ({ user, onEndCall, onToggleMute }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}`;
  };

  return (
    <motion.div
      className="active-call"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >

      <div className="call-header">
        <div className="user-info">
          <div className="avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.avatar} />
            ) : (
              <span>{user?.username.charAt(0).toUpperCase()}</span>
            )}
            <div className="status-indicator"></div>
          </div>
          <h3>{user.username}</h3>
          <div className="call-timer">{formatTime(callDuration)}</div>
        </div>
      </div>
      <div className="call-controls">
        <motion.div
          className="control-button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsMuted(!isMuted);
            onToggleMute(!isMuted);
          }}
        >
          {isMuted ? '🔇' : '🎤'}
        </motion.div>

        <motion.div
          className="end-call-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEndCall}
        >
          🚫
        </motion.div>
      </div>
    </motion.div>
  )
}