import { motion } from "framer-motion";
import "../styles/Calls.css"

const IncomingCall = ({ user, onAccept, onReject }) => {
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
            <img src={user.avatar} alt={user?.avatar} />
          ) : (
            <span>{user.username.charAt(0).toUpperCase() || "?"}</span>
          )}
          <div className="ring-animation"></div>
        </div>
        <h3>{user.username}</h3>
        <p>Incomming call...</p>
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
};

export default IncomingCall;