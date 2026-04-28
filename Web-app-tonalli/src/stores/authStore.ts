import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types';
import { mockUser, MOCK_MODE } from '../data/mockData';
import { apiService } from '../services/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          if (MOCK_MODE) {
            await new Promise((r) => setTimeout(r, 800));
            set({ user: mockUser, token: 'mock-token-123', refreshToken: null, isAuthenticated: true, isLoading: false });
            return;
          }
          const data = await apiService.login(email, password);
          set({ user: data.user, token: data.token, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (username: string, email: string, password: string, city: string, dateOfBirth?: string) => {
        set({ isLoading: true });
        try {
          if (MOCK_MODE) {
            await new Promise((r) => setTimeout(r, 1000));
            const newUser: User = { ...mockUser, username, email, city, xp: 0, level: 1, streak: 0, xlmEarned: 0, lessonsCompleted: 0, nftCertificates: [], plan: 'free' as const };
            set({ user: newUser, token: 'mock-token-new', refreshToken: null, isAuthenticated: true, isLoading: false });
            return;
          }
          const data = await apiService.register(username, email, password, city, dateOfBirth);
          set({ user: data.user, token: data.token, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await apiService.logout(refreshToken);
          } catch {
            // best effort
          }
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'tonalli-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
