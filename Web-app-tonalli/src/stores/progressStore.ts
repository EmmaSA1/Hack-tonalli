import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import type { ProgressState, Lesson, Module } from '../types';

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      currentLesson: null,
      modules: [],
      dailyStreak: 0,
      lastActivity: null,

      markLessonComplete: (lessonId: string) => {
        const completed = get().completedLessons;
        if (!completed.includes(lessonId)) {
          set({ completedLessons: [...completed, lessonId], lastActivity: new Date().toISOString() });
        }
      },

      setCurrentLesson: (lesson: Lesson | null) => set({ currentLesson: lesson }),

      loadModules: async () => {
        try {
          // Fetch lessons from real API
          const lessons = await apiService.getLessons();

          // Group lessons by module
          const moduleMap = new Map<string, { name: string; lessons: any[] }>();
          for (const lesson of lessons) {
            if (!moduleMap.has(lesson.moduleId)) {
              moduleMap.set(lesson.moduleId, { name: lesson.moduleName, lessons: [] });
            }
            moduleMap.get(lesson.moduleId)!.lessons.push(lesson);
          }

          // Build modules
          const MODULE_ICONS: Record<string, { icon: string; color: string }> = {
            'mod-intro-blockchain': { icon: '\u26D3\uFE0F', color: '#FF6B35' },
            'mod-stellar': { icon: '\u2B50', color: '#FFD700' },
            'mod-wallets': { icon: '\uD83D\uDC5B', color: '#9B59B6' },
            'mod-defi': { icon: '\uD83C\uDFE6', color: '#00C896' },
            'mod-nfts': { icon: '\uD83C\uDFA8', color: '#E74C3C' },
          };

          const completed = get().completedLessons;
          let prevModuleCompleted = true;

          const modules: Module[] = Array.from(moduleMap.entries()).map(([moduleId, data], modIndex) => {
            const meta = MODULE_ICONS[moduleId] || { icon: '\uD83D\uDCDA', color: '#2E8B3F' };

            // Sort lessons by order
            data.lessons.sort((a: any, b: any) => a.order - b.order);

            let prevLessonCompleted = prevModuleCompleted;
            const moduleLessons: Lesson[] = data.lessons.map((l: any, _i: number) => {
              const isCompleted = l.completed || completed.includes(l.id);
              const isAvailable = prevLessonCompleted && !isCompleted;
              const status = isCompleted ? 'completed' : isAvailable ? 'available' : 'locked';

              prevLessonCompleted = isCompleted;

              return {
                id: l.id,
                moduleId: l.moduleId,
                title: l.title,
                description: l.description || '',
                xpReward: l.xpReward || 50,
                xlmReward: parseFloat(l.xlmReward) || 0.5,
                order: l.order,
                type: 'lesson' as const,
                status,
                estimatedMinutes: 5,
                content: [],
                character: l.character,
                characterDialogue: l.characterDialogue,
              };
            });

            const allCompleted = moduleLessons.every((l) => l.status === 'completed');
            const moduleStatus = allCompleted ? 'completed' : prevModuleCompleted ? 'available' : 'locked';
            prevModuleCompleted = allCompleted;

            return {
              id: moduleId,
              title: data.name,
              description: '',
              icon: meta.icon,
              color: meta.color,
              order: modIndex + 1,
              status: moduleStatus,
              xpRequired: modIndex * 200,
              lessons: moduleLessons,
            };
          });

          set({ modules });
        } catch (err) {
          console.error('Failed to load modules:', err);
        }
      },
    }),
    {
      name: 'tonalli-progress',
      partialize: (state) => ({
        completedLessons: state.completedLessons,
        dailyStreak: state.dailyStreak,
        lastActivity: state.lastActivity,
      }),
    },
  ),
);
