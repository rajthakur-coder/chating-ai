import axios from "axios";
import { ToasterUtils } from "@/components/ui/toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Connection Refused / Server Down Error
    if (!error.response) {
      console.error("Backend Server is Offline / Connection Refused");
      if (typeof window !== "undefined") {
        ToasterUtils.error("Backend server connection failed. Please check if your server is running.");
      }
    }

    // 2. 401 Unauthorized / Token Expired Error
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request - Redirecting to Login");
      if (typeof window !== "undefined") {
        const redirectUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${redirectUrl}`;
        // Old external auth flow, keep this for easy rollback after testing:
        // const authUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001";
        // window.location.href = `${authUrl}/login?redirect=${redirectUrl}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
