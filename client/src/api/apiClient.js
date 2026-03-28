import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicApi = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});


// Request interceptor: Tokens are now handled by httpOnly cookies via withCredentials
// No manual attachment of Authorization headers is required.
api.interceptors.request.use((config) => {
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: Handle token refresh on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized indicates the accessToken cookie has expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Silent refresh: the browser automatically sends the refreshToken cookie
        await axios.post(
          "http://localhost:5000/api/users/refresh",
          {},
          { withCredentials: true }
        );

        // Retry the original request (browser will now use the new accessToken cookie)
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Session expired. Clearing auth hint...");
        localStorage.removeItem('userInfo');
        
        // Redirect to login if on a protected route
        const publicPages = ['/', '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
        const isPublicPage = publicPages.some(page => window.location.pathname === page || window.location.pathname.startsWith(page + '/'));
        
        if (!isPublicPage) {
           window.location.href = '/login'; 
        }
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


