import React from 'react';

const InputField = ({ type, value, onChange, name, label }) => {
  return (
     <div className="input-container">
            <input
              type={type}
              value={value}
              onChange={onChange}
              name={name}
              required
            />
            <label htmlFor={name}>{label}</label>
          </div>
  )
}

export default InputField;