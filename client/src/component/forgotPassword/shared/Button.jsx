import React from "react";

const Button = ({ children, onClick, disabled, type = 'button', className }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;