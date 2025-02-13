import api from "../Api";

export const logout = async () => {
  try {
    const response = api.post('/api/users/logout');
    localStorage.removeItem("accessToken");
    localStorage.removeItem('userInfo')
    return response.data;
  } catch (error) {
    console.error("Logout failed:", error.response?.data || error.message);
    throw error;
  }
}