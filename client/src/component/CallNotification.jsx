import { motion, AnimatePresence } from "framer-motion";

const CallNotification = ({ user, onAccept, onReject }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="call-notification"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="notification-content">
          <div className="user-info">
            <div className="avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.avatar} />
              ) : (
                <span>{user?.username.charAt(0).toUpperCase()}</span>
              )}
              <div className="ring-animation"></div>
            </div>
            <h3>{user.username}</h3>
            <p>Incomming Call...</p>
          </div>
          <div className="notification-actions">
            <button className="accept-button" onClick={onAccept}>
              ✅
            </button>
            <button className="reject-button" onClick={onReject}>
              ❌
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}