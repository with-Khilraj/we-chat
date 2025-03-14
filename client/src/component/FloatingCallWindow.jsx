import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import "../styles/Calls.css";

const FloatingCallWindow = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  return (
    <motion.div
      className="floating-window"
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ top: -200, left: -200, right: 200, bottom: 200 }} // Adjusted for flexibility
      dragElastic={0.1}
      whileDrag={{ scale: 1.05 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {children}
      {isDragging && (
        <motion.div
          className="drag-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          Drag to move
        </motion.div>
      )}
    </motion.div>
  );
};

export default FloatingCallWindow;