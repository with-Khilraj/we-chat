import "../styles/Calls.css";
const { motion, useMotionValue, useTransform } = require("framer-motion");
const { useState } = require("react");

const FloatingCallWindow = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  return (
    <motion.div
      className="floation-window"
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0}}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {children}
      {isDragging && (
        <motion.div
          className="drag-indicator"
          inital={{ opacity: 0}}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          Drag to move
        </motion.div>
      )}
    </motion.div>
  )
}

export default FloatingCallWindow;