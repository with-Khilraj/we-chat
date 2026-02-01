import React, { forwardRef } from "react";

const InputField = forwardRef(({ label, id, type, placeholder, value, onChange, disabled, error, helperText, helperClass, ...props }, ref) => {
  return (
    <div className={`input-container ${error ? 'has-error' : ''}`}>
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
        placeholder=" "
        {...props}
      />
      <label htmlFor={id}>{label || placeholder}</label>
      {error && (
        <span className="text-red-500 text-[11px] mt-1 ml-1 block animate-pulse" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span className={`${helperClass} text-[11px] mt-1 ml-1 block`} role="status">
          {helperText}
        </span>
      )}
    </div>
  );
});

InputField.displayName = "InputField";

export default InputField;