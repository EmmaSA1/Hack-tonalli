import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  xlmBalance: number;
  lessonsCompleted: number;
  walletAddress: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

const AUTH_KEY = "tonalli_auth";

async function persistAuth(token: string, user: User) {
  try {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify({ token, user }));
  } catch {}
}

async function clearAuth() {
  try {
    await SecureStore.deleteItemAsync(AUTH_KEY);
  } catch {}
}

async function loadAuth(): Promise<{ token: string; user: User } | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const saved = await loadAuth();
    if (saved?.token && saved?.user) {
      set({
        user: saved.user,
        token: saved.token,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login(email, password);
      const user: User = {
        id: data.user?.id ?? "u1",
        name: data.user?.name ?? email.split("@")[0],
        email,
        avatar: "😎",
        level: data.user?.level ?? 1,
        xp: data.user?.xp ?? 0,
        streak: data.user?.streak ?? 0,
        xlmBalance: data.user?.xlmBalance ?? 0,
        lessonsCompleted: data.user?.lessonsCompleted ?? 0,
        walletAddress: data.user?.walletAddress ?? "",
      };
      const token = data.token ?? "mock-token";
      await persistAuth(token, user);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authApi.register(name, email, password);
      const user: User = {
        id: data.user?.id ?? "u1",
        name,
        email,
        avatar: "😎",
        level: 1,
        xp: 0,
        streak: 0,
        xlmBalance: 0,
        lessonsCompleted: 0,
        walletAddress: data.user?.walletAddress ?? "",
      };
      const token = data.token ?? "mock-token";
      await persistAuth(token, user);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates: Partial<User>) => {
    const { user, token } = get();
    if (user) {
      const updated = { ...user, ...updates };
      set({ user: updated });
      if (token) persistAuth(token, updated);
    }
  },
}));
