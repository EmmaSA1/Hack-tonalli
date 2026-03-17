import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Change to your backend URL
// For physical device on same WiFi: http://192.168.X.X:3001
// For emulator: http://10.0.2.2:3001 (Android) or http://localhost:3001 (iOS)
const BASE_URL = "http://localhost:3001";

// Set to false to connect to the real backend
const USE_MOCK = true;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auto-attach JWT token from store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-logout on 401
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 1000));
      return {
        token: "mock-token-" + Date.now(),
        user: {
          id: "u1",
          email,
          name: email.split("@")[0],
          level: 1,
          xp: 0,
          streak: 0,
          xlmBalance: 0,
          lessonsCompleted: 0,
          walletAddress: "",
        },
      };
    }
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data;
  },

  register: async (name: string, email: string, password: string) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 1200));
      return {
        token: "mock-token-" + Date.now(),
        user: {
          id: "u-" + Date.now(),
          email,
          name,
          level: 1,
          xp: 0,
          streak: 0,
          xlmBalance: 0,
          lessonsCompleted: 0,
          walletAddress: "",
        },
      };
    }
    const res = await apiClient.post("/auth/register", { name, email, password });
    return res.data;
  },
};

// Lessons endpoints
export const lessonsApi = {
  getModules: async () => {
    if (USE_MOCK) {
      const { MODULES } = await import("../data/mockData");
      return MODULES;
    }
    const res = await apiClient.get("/lessons/modules");
    return res.data;
  },

  getLessons: async (moduleId: string) => {
    if (USE_MOCK) {
      const { LESSONS } = await import("../data/mockData");
      return LESSONS[moduleId] || [];
    }
    const res = await apiClient.get(`/lessons/${moduleId}`);
    return res.data;
  },

  completeLesson: async (lessonId: string, score: number) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        xpAwarded: 100,
        xlmAwarded: score === 100 ? 0.55 : 0.5,
        nftMinted: score === 100,
      };
    }
    const res = await apiClient.post(`/lessons/${lessonId}/complete`, { score });
    return res.data;
  },
};

// Quiz endpoints
export const quizApi = {
  getQuiz: async (lessonId: string) => {
    if (USE_MOCK) {
      const { QUIZZES } = await import("../data/mockData");
      return QUIZZES[lessonId] || null;
    }
    const res = await apiClient.get(`/quiz/${lessonId}`);
    return res.data;
  },
};

// Profile endpoints
export const profileApi = {
  getCertificates: async () => {
    if (USE_MOCK) {
      const { CERTIFICATES } = await import("../data/mockData");
      return CERTIFICATES;
    }
    const res = await apiClient.get("/profile/certificates");
    return res.data;
  },

  getLeaderboard: async () => {
    if (USE_MOCK) {
      const { LEADERBOARD } = await import("../data/mockData");
      return LEADERBOARD;
    }
    const res = await apiClient.get("/leaderboard");
    return res.data;
  },
};

export default apiClient;
