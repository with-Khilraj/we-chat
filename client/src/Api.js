import axios from "axios";

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,  // send cookies with requests
});

// Intercept requests to refresh token if access token expires
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response);
    return response;
  },
  async (error) => {
    console.log("API Error:", error.response)
    if (error.response?.status === 403 && error.response.data.error === 'Token expired' ) {
      try {
        const refreshResponse = await axios.post('http://localhost:5000/api/refresh', {}, { withCredentials: true });
        const newAccessToken  = refreshResponse.data.accessToken;
        console.log(newAccessToken);

        // Retry the original request with the new access token
        error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        console.error(refreshError);
        return Promise.reject(refreshError);
      }
    } 
    return Promise.reject(error);
  }
);


export default api;