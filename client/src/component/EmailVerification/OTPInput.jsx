const OPTInput = ({ otp, handleChange, handleKeyDown }) => {
  return (
    <div className="otp-inputs mb-4">
      {otp.map((digit, idx) => (
        <input
          key={idx}
          id={`otp-${idx}`}
          type="text"
          maxLength="1"
          value={digit}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          className="otp-input"
        />
      ))}
    </div>
  )
};

export default OPTInput;