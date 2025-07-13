import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import "../styles/Calls.css";
import { useCall } from '../context/CallContext';

// const CallInitiation = ({ user, onCallCancel }) => {
const CallInitiation = () => {
  const { remoteUser, endCall } = useCall();

  const [isHovered, setIsHovered] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.length < 3 ? prev + '.' : "")
    }, 500);
    return () => clearInterval(interval);
  },[]);

  if(!remoteUser) return null;

  return (
    <motion.div
      className="call-initiation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="user-info">
        <div className="avatar">
          {remoteUser?.avatar ? (
            <img src={remoteUser.avatar} alt={remoteUser?.username} />
          ) : (
            <span>{remoteUser?.username.charAt(0).toUpperCase()}</span>
          )}
          <div className="status-indicator"></div>
        </div>
        <h3>{remoteUser.username || "Unknown User" }</h3>
        <p>Connecting{dots}</p>
      </div>
      <motion.button
        className="call-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={endCall}
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

// to ensure user and onCallCancel are provided correctly
// CallInitiation.propTypes = {
//   user: PropTypes.shape({
//     username: PropTypes.string.isRequired,
//     avatar: PropTypes.string,
//   }).isRequired,
//   onCallCancel: PropTypes.func.isRequired,
// };

export default CallInitiation;