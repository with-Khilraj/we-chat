import { useState } from 'react';
import { motion } from 'framer-motion';

const CallInitiation = ({ user, onCallStart }) => {
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
        <h3>{user.usernme}</h3>
        <p>Connecting...</p>
      </div>
      <motion.button
        className="call-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onCallStart}
      >
        <motion.span
          className="call-icon"
          animate={{ rotate: isHovered ? [0, 15, -15, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          📞
        </motion.span>
        Start Call
      </motion.button>
    </motion.div>
  );
};