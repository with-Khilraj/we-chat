import { useState } from 'react';
import { motion } from 'framer-motion';
import "../styles/Calls.css";

const CallInitiation = ({ user, onCallCancel }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="call-initiation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
        <p>Connecting...</p>
      </div>
      <motion.button
        className="call-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onCallCancel}
      >
        <motion.span
          className="call-icon"
          animate={{ rotate: isHovered ? [0, 15, -15, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          📞
        </motion.span>
        End Call
      </motion.button>
    </motion.div>
  );
};

export default CallInitiation;