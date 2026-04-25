import axios from 'axios';

export interface QuestionFormItem {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

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
    externalWalletAddress: u.externalWalletAddress || null,
    walletType: u.walletType || 'custodial',
    character: u.character || 'chima',
    xlmEarned: u.xlmEarned || 0,
    lessonsCompleted: u.lessonsCompleted || 0,
    nftCertificates: u.nftCertificates || [],
    role: (u.role as 'admin' | 'user') || 'user',
    plan: u.plan || 'free',
    isFirstLogin: u.isFirstLogin ?? true,
    companion: u.companion || null,
    avatarType: u.avatarType || null,
  };
}

export const apiService = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return { token: res.data.access_token, user: normalizeUser(res.data.user) };
  },

  register: async (username: string, email: string, password: string, city: string, dateOfBirth?: string) => {
    const res = await api.post('/auth/register', { username, email, password, city, dateOfBirth });
    return { token: res.data.access_token, user: normalizeUser(res.data.user) };
  },

  getProfile: async () => {
    const res = await api.get('/users/me');
    return normalizeUser(res.data);
  },

  // ── Legacy lessons (backward compat) ────────────────────────────────────
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

  // ── Chapters (new system) ───────────────────────────────────────────────
  getChapters: async () => {
    const res = await api.get('/chapters');
    return res.data;
  },

  getChapter: async (id: string) => {
    const res = await api.get(`/chapters/${id}`);
    return res.data;
  },

  getChapterWithProgress: async (id: string) => {
    const res = await api.get(`/chapters/${id}/progress`);
    return res.data;
  },

  getChapterCompletion: async (id: string) => {
    const res = await api.get(`/chapters/${id}/completion`);
    return res.data;
  },

  getModuleContent: async (moduleId: string) => {
    const res = await api.get(`/chapters/modules/${moduleId}/content`);
    return res.data;
  },

  completeInfoModule: async (moduleId: string) => {
    const res = await api.post(`/chapters/modules/${moduleId}/complete-info`);
    return res.data;
  },

  updateVideoProgress: async (moduleId: string, percent: number) => {
    const res = await api.post(`/chapters/modules/${moduleId}/video-progress`, { percent });
    return res.data;
  },

  getChapterQuiz: async (moduleId: string) => {
    const res = await api.get(`/chapters/modules/${moduleId}/quiz`);
    return res.data;
  },

  submitChapterQuiz: async (moduleId: string, answers: { questionId: string; selectedIndex: number }[]) => {
    const res = await api.post(`/chapters/modules/${moduleId}/quiz/submit`, { answers });
    return res.data;
  },

  reportQuizAbandon: async (moduleId: string, reason: string) => {
    const res = await api.post(`/chapters/modules/${moduleId}/quiz/abandon`, { reason });
    return res.data;
  },

  unlockFinalExam: async (chapterId: string) => {
    const res = await api.post(`/chapters/${chapterId}/unlock-exam`);
    return res.data;
  },

  // ── Admin chapters ──────────────────────────────────────────────────────
  adminGetChapters: async () => {
    const res = await api.get('/chapters/admin/all');
    return res.data;
  },

  adminCreateChapter: async (data: Record<string, unknown>) => {
    const res = await api.post('/chapters', data);
    return res.data;
  },

  adminUpdateChapter: async (id: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/chapters/${id}`, data);
    return res.data;
  },

  adminUpdateModule: async (moduleId: string, data: Record<string, unknown>) => {
    const res = await api.patch(`/chapters/modules/${moduleId}`, data);
    return res.data;
  },

  adminTogglePublish: async (id: string) => {
    const res = await api.patch(`/chapters/${id}/publish`);
    return res.data;
  },

  adminReleaseThisWeek: async (id: string) => {
    const res = await api.patch(`/chapters/${id}/release`);
    return res.data;
  },

  adminSetReleaseWeek: async (id: string, week: string) => {
    const res = await api.patch(`/chapters/${id}/release-week`, { week });
    return res.data;
  },

  adminDeleteChapter: async (id: string) => {
    await api.delete(`/chapters/${id}`);
  },

  adminGetModuleQuestions: async (moduleId: string) => {
    const res = await api.get(`/chapters/modules/${moduleId}/questions`);
    return res.data;
  },

  adminReplaceModuleQuestions: async (moduleId: string, questions: QuestionFormItem[]) => {
    const res = await api.put(`/chapters/modules/${moduleId}/questions`, { questions });
    return res.data;
  },

  adminGetMetrics: async () => {
    const res = await api.get('/chapters/admin/metrics');
    return res.data;
  },

  adminReorderChapters: async (orders: { id: string; order: number }[]) => {
    const res = await api.patch('/chapters/admin/reorder', { orders });
    return res.data;
  },

  adminGetUsers: async (page = 1, limit = 50, search = '') => {
    const res = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    return res.data;
  },

  // ── Leaderboard / Podium ────────────────────────────────────────────────
  getLeaderboard: async () => {
    const res = await api.get('/podium/global');
    return res.data;
  },

  getWeeklyPodium: async () => {
    const res = await api.get('/podium/weekly');
    return res.data;
  },

  getCityLeaderboard: async (city: string) => {
    const res = await api.get(`/podium/city?city=${encodeURIComponent(city)}`);
    return res.data;
  },

  // ── Podium NFTs ────────────────────────────────────────────────────────
  getPodiumNfts: async () => {
    const res = await api.get('/podium/nfts');
    return res.data;
  },

  // Demo: simulate podium distribution
  demoPodiumDistribute: async () => {
    const res = await api.post('/podium/demo-distribute');
    return res.data;
  },

  // ── Reward History (on-chain) ────────────────────────────────────────
  getRewardHistory: async () => {
    const res = await api.get('/users/me/rewards/history');
    return res.data;
  },

  getTotalRewards: async () => {
    const res = await api.get('/users/me/rewards/total');
    return res.data;
  },

  // ── Certificates (ACTA) ─────────────────────────────────────────────────
  getCertificates: async () => {
    const res = await api.get('/certificates');
    return res.data;
  },

  issueCertificate: async (data: {
    chapterId: string;
    chapterTitle: string;
    examScore: number;
  }) => {
    const res = await api.post('/certificates/issue', data);
    return res.data;
  },

  storeCertificate: async (data: {
    chapterId: string;
    chapterTitle: string;
    actaVcId: string;
    txHash: string;
    examScore: number;
    type: 'official' | 'achievement';
  }) => {
    const res = await api.post('/certificates/store', data);
    return res.data;
  },

  verifyCertificate: async (vcId: string) => {
    const res = await api.get(`/certificates/verify?vcId=${encodeURIComponent(vcId)}`);
    return res.data;
  },

  setupUser: async (companion: string, avatarType: string) => {
    const res = await api.patch('/users/me/setup', { companion, avatarType });
    return res.data;
  },

  upgradePlan: async (plan: 'free' | 'pro' | 'max') => {
    const res = await api.patch('/users/me/upgrade', { plan });
    return res.data;
  },

  // ── Wallet ──────────────────────────────────────────────────────────────
  getWalletBalance: async () => {
    const res = await api.get('/users/me/wallet/balance');
    return res.data;
  },

  connectWallet: async (address: string) => {
    const res = await api.post('/users/me/wallet/connect', { address });
    return res.data;
  },

  disconnectWallet: async () => {
    const res = await api.post('/users/me/wallet/disconnect');
    return res.data;
  },

  withdrawToExternal: async (amount: string) => {
    const res = await api.post('/users/me/wallet/withdraw', { amount });
    return res.data;
  },

  exportSecretKey: async (password: string) => {
    const res = await api.post('/users/me/wallet/export-secret', { password });
    return res.data;
  },

  // ── Legacy ──────────────────────────────────────────────────────────────
  getRankings: async () => {
    const res = await api.get('/rankings');
    return res.data;
  },
};

export default api;
