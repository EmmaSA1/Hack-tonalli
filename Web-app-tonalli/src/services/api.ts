import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('tonalli-auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tonalli-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Normalize backend user shape to frontend User type
function normalizeUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.displayName || u.username,
    city: u.city || 'Ciudad de México',
    xp: u.xp || 0,
    totalXp: u.totalXp || u.xp || 0,
    level: Math.floor((u.totalXp || u.xp || 0) / 1000) + 1,
    streak: u.currentStreak || 0,
    walletAddress: u.walletAddress || u.stellarPublicKey || '',
    character: u.character || 'chima',
    xlmEarned: u.xlmEarned || 0,
    lessonsCompleted: u.lessonsCompleted || 0,
    nftCertificates: u.nftCertificates || [],
    role: (u.role as 'admin' | 'user') || 'user',
  };
}

export const apiService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    // backend returns access_token, normalize to token
    return { token: res.data.access_token, user: normalizeUser(res.data.user) };
  },

  register: async (username: string, email: string, password: string, city: string) => {
    const res = await api.post('/auth/register', { username, email, password, city });
    return { token: res.data.access_token, user: normalizeUser(res.data.user) };
  },

  getProfile: async () => {
    const res = await api.get('/users/me');
    return normalizeUser(res.data);
  },

  getModules: async () => {
    const res = await api.get('/lessons/modules');
    return res.data;
  },

  getLessons: async () => {
    const res = await api.get('/lessons');
    return res.data;
  },

  getLesson: async (lessonId: string) => {
    const res = await api.get(`/lessons/${lessonId}`);
    return res.data;
  },

  getQuiz: async (lessonId: string) => {
    const res = await api.get(`/lessons/${lessonId}/quiz`);
    return res.data;
  },

  submitQuiz: async (lessonId: string, answers: { questionId: string; selectedIndex: number }[]) => {
    const res = await api.post(`/lessons/${lessonId}/quiz/submit`, { answers });
    return res.data;
  },

  getLeaderboard: async () => {
    const res = await api.get('/rankings');
    return res.data;
  },

  getCertificates: async () => {
    const res = await api.get('/progress/certificates');
    return res.data;
  },

  // ── Chapters ─────────────────────────────────────────────────────────────

  /** User: get published chapters */
  getChapters: async () => {
    const res = await api.get('/chapters');
    return res.data;
  },

  /** User/Admin: get single chapter */
  getChapter: async (id: string) => {
    const res = await api.get(`/chapters/${id}`);
    return res.data;
  },

  /** Admin: get all chapters (including unpublished) */
  adminGetChapters: async () => {
    const res = await api.get('/chapters/admin/all');
    return res.data;
  },

  /** Admin: create chapter */
  adminCreateChapter: async (data: Partial<{ title: string; description: string; content: string; moduleTag: string; order: number; published: boolean; estimatedMinutes: number; xpReward: number }>) => {
    const res = await api.post('/chapters', data);
    return res.data;
  },

  /** Admin: update chapter */
  adminUpdateChapter: async (id: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/chapters/${id}`, data);
    return res.data;
  },

  /** Admin: toggle publish */
  adminTogglePublish: async (id: string) => {
    const res = await api.patch(`/chapters/${id}/publish`);
    return res.data;
  },

  /** Admin: delete chapter */
  adminDeleteChapter: async (id: string) => {
    await api.delete(`/chapters/${id}`);
  },
};

export default api;
