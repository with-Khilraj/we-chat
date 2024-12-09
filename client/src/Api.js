import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // send cookies with requests
});

// Function to clear storage and redirect to login

// Intercept requests to refresh token if access token expires
api.interceptors.request.use(async, (config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response);
    return response;
  },
  async (error) => {
    console.log("API Error:", error.response);
    if (
      error.response?.status === 403 &&
      error.response.data.error === "Unauthorized"
    ) {
      try {
        const refreshResponse = await axios.post(
          "http://localhost:5000/api/refresh",
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.accessToken;
        console.log(newAccessToken);

        // store the new access token and retry the original request with the new access token
        error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
        // return api.request(error.config);
        return axios(error.config);  // updated
      } catch (refreshError) {
        console.error("Failed to refresh token:",refreshError);
        // Handle logout or redirect to the login page
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
