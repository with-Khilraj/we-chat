/**
 * Join OTP array into a string
 * @param {Array} otpArr 
 * @returns {string}
 */
export const joinOTP = (otpArr) => otpArr.join('');

/**
 * Format seconds to mm:ss
 * @param {number} seconds 
 * @returns {string}
 */
export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Validate OTP input (digits only)
 * @param {string} value 
 * @returns {boolean}
 */
export const isValidDigit = (value) => /^\d?$/.test(value);
