import React, { forwardRef } from "react";

const InputField = forwardRef(({ label, id, type, placeholder, value, onChange, disabled, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-2 transition-all duration-300">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-500 hover:border-blue-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        {...props}
      />
      {error && (
        <span className="text-red-500 text-xs mt-1 animate-pulse" role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

InputField.displayName = "InputField";

export default InputField;