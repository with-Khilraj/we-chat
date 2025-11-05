import api from '../Api';

// Verify OTP API call
export const verifyOTP = async (email, otp) => {
  try {
     const response = await api.post("/api/users/verify-otp", { email, otp });
    return { success: true, message: response.data.message };
  } catch (error) {
    if (error.response) {
      const msg = error.response.data?.error;
      if (msg?.includes("expired"))
        return { success: false, message: "OTP has expired. Please request a new one." };
      if (msg?.includes("Invalid"))
        return { success: false, message: "Invalid verification code. Please try again." };

      return { success: false, message: msg || "Verification failed. Try again." };
    } else {
      return { success: false, message: "Network error. Please check your connection." };
    }
  }
};

// Resend OTP API call
export const resendOTP = async (email) => {
  try {
    const res = await api.post('/api/users/resend-otp', { email }, { withCredentials: true });
    return res.data;
  } catch (err) {
    const data = err.response?.data;
    throw new Error(data?.error || "Failed to resend OTP");
  }
};
