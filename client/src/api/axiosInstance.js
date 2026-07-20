import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly auth cookies automatically
  headers: {
    // Lightweight CSRF defense pairing with server/src/app.js - a
    // cross-site form post can't set custom headers like this one.
    "X-Requested-With": "rag-chat-app",
  },
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePending(error) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes("/api/auth/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => axiosInstance(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post("/api/auth/refresh");
        resolvePending(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        resolvePending(refreshError);
        // Refresh failed too - the session is genuinely over.
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
