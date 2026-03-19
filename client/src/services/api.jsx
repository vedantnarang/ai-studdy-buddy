import axios from "axios";

// Using VITE_API_URL for Next.js backend, falling back to local Express/Next dev server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// Request Interceptor: add the JWT token to headers if it exists
api.interceptors.request.use(
  (config) => {
    // Modify this if token is stored differently (e.g. cookies are handled by withCredentials)
    const token = localStorage.getItem("token"); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and optionally redirect to login
      localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;