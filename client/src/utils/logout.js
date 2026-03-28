import { api } from "../api/apiClient";

export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout');
    localStorage.removeItem("accessToken");
    localStorage.removeItem('userInfo')
    return response.data;
  } catch (error) {
    console.error("Logout failed:", error.response?.data || error.message);
    throw error;
  }
}