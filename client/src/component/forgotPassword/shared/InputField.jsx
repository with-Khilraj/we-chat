import React from "react";

const InputField = ({ type, value, onChange, label, placeholder, error }) => {
  return (
    <div className="input-group">
      <label className="block text-sm font-medium text-white mb-2">{label}</label>

      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder} 
        className={`form-input w-full px-4 py-3 rounded-xl ${error ? 'form-error' : ''}`}
      />

      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default InputField;