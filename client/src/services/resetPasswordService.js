import { api } from "../Api";

export const validateResetToken = async (token) => {
  try {
    const res = await api.get(`/api/users/reset-password/${token}/validate`);
    
    // console.log("Service Response from validateResetToken:", res.data);

      // FIXED: Check both response structures
    if (res.data.valid === true) {
      return { valid: true };
    } else {
      // Extract error from response - it could be in 'error' or 'reason' field
      const errorReason = res.data.error || res.data.reason;
      
      return { 
        valid: false, 
        reason: errorReason || 'INVALID_TOKEN' // Default if no error specified
      };
    }
  } catch (error) {
    const errorData = error.response?.data;

    if (errorData?.error === 'TOKEN_EXPIRED') {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    if (errorData?.error === 'INVALID_TOKEN') {
      return { valid: false, reason: 'INVALID_TOKEN' };
    }

    return { valid: false, reason: 'VALIDATION_ERROR' };
  }
};

export const resetPasswordRequest = async (token, password, confirmPassword) => {
  const response = await api.post(`/api/users/reset-password/${token}`,
    { password, confirmPassword }
  );
  return response.data;
}
