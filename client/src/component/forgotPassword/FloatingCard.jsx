import React from "react";

const FloatingCard = ({ code, className = "", style }) => {
  return (
     <div className={`floating-element animate-float floating-code ${className}`} style={style}>
    {code}
  </div>
  )
}

export default FloatingCard;