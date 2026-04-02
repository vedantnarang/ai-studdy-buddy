import axios from "axios";

// Using VITE_API_URL for Next.js backend, falling back to local Express/Next dev server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Ensures HttpOnly cookies are sent with every request
});

// Response Interceptor: handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // No localStorage cleanup needed — the server clears the cookie on logout
    return Promise.reject(error);
  }
);

export default api;