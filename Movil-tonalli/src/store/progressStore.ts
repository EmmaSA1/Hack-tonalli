import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score?: number;
  completedAt?: string;
}

interface ProgressState {
  lessonsProgress: Record<string, LessonProgress>;
  currentStreak: number;
  totalXP: number;
  isHydrated: boolean;
  completeLesson: (lessonId: string, score: number, xpReward: number) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  getLessonScore: (lessonId: string) => number | undefined;
  hydrate: () => Promise<void>;
  reset: () => void;
}

const PROGRESS_KEY = "tonalli_progress";

async function persistProgress(data: { lessonsProgress: Record<string, LessonProgress>; currentStreak: number; totalXP: number }) {
  try {
    await SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(data));
  } catch {}
}

async function loadProgress(): Promise<{ lessonsProgress: Record<string, LessonProgress>; currentStreak: number; totalXP: number } | null> {
  try {
    const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  lessonsProgress: {},
  currentStreak: 0,
  totalXP: 0,
  isHydrated: false,

  hydrate: async () => {
    const saved = await loadProgress();
    if (saved) {
      set({
        lessonsProgress: saved.lessonsProgress,
        currentStreak: saved.currentStreak,
        totalXP: saved.totalXP,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  completeLesson: (lessonId: string, score: number, xpReward: number) => {
    const { lessonsProgress, totalXP, currentStreak } = get();
    if (!lessonsProgress[lessonId]?.completed) {
      const updated = {
        lessonsProgress: {
          ...lessonsProgress,
          [lessonId]: {
            lessonId,
            completed: true,
            score,
            completedAt: new Date().toISOString(),
          },
        },
        totalXP: totalXP + xpReward,
        currentStreak: currentStreak + 1,
      };
      set(updated);
      persistProgress(updated);
    }
  },

  isLessonCompleted: (lessonId: string) => {
    return get().lessonsProgress[lessonId]?.completed ?? false;
  },

  getLessonScore: (lessonId: string) => {
    return get().lessonsProgress[lessonId]?.score;
  },

  reset: () => {
    const empty = { lessonsProgress: {}, currentStreak: 0, totalXP: 0 };
    set(empty);
    SecureStore.deleteItemAsync(PROGRESS_KEY).catch(() => {});
  },
}));
