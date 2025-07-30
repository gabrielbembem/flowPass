import axios from "axios";
import { useLogout } from "../utils"; // Sua função de logout
import { showSessionExpiredAlert } from "../utils"; // Função para mostrar o alerta

const api = axios.create({
  baseURL: process.env.REACT_APP_API_FP_BE,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
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

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Trata especificamente token expirado
      if (error.response.data.code === "TOKEN_EXPIRED") {
        showSessionExpiredAlert();
        useLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
