import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import PropTypes from "prop-types";
import "../styles/Calls.css";
import { duration } from "moment";

const FloatingCallWindow = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0); // tracks horizontal pos
  const y = useMotionValue(0); // tracks vertical pos
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  const getConstraints = () => {
    const windowwidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const buffer = 50; // keep some padding
    return {
      top: -windowHeight / 2 + buffer,
      bottom: windowHeight / 2 - buffer,
      left: -windowwidth / 2 + buffer,
      right: windowwidth / 2 - buffer,
    };
  };

  return (
    <motion.div
      className="floating-window"
      style={{ x, y, rotate }}
      drag
      dragConstraints={getConstraints} 
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
          transition={{ duration: 0.2, scale: {repeat: Infinity, duration: 0.8 } }}
        >
          Drag to move
        </motion.div>
      )}
    </motion.div>
  );
};

// to ensure children is provided
FloatingCallWindow.prototype = {
  children: PropTypes.node.isRequired,
};

export default FloatingCallWindow;