import { api } from "../Api";

export const validateResetToken = async (token) => {
  try {
    const response = await api.get(`/api/users/reset-password/${token}/validate`);
  return response.data.valid; // return a boolean indicating validity
  // return { valid: response.data.valid }; returning as object if needed
  } catch (error) {
    return false; // return false on error
  }
};

export const resetPasswordRequest = async (token, password, confirmPassword) => {
  const response = await api.post(`/api/users/reset-password/${token}`,
    { password, confirmPassword }
  );
  return response.data;
}
