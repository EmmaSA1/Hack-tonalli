import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import { MODULES, LESSONS } from "../../src/data/mockData";
import { useProgressStore } from "../../src/store/progressStore";

export default function LearnScreen() {
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");
  const { isLessonCompleted } = useProgressStore();

  const getModuleProgress = (moduleId: string) => {
    const lessons = LESSONS[moduleId] ?? [];
    const completed = lessons.filter((l: any) => isLessonCompleted(l.id)).length;
    return { completed, total: lessons.length, percent: lessons.length ? completed / lessons.length : 0 };
  };

  // A module is unlocked if: it's the first module, OR the previous module has >= 60% completion
  const isModuleUnlocked = (modIndex: number) => {
    if (modIndex === 0) return true;
    const prevModule = MODULES[modIndex - 1];
    const prevProgress = getModuleProgress(prevModule.id);
    return prevProgress.percent >= 0.6;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Aprender</Text>
        <Text style={styles.subtitle}>Tu camino al dominio Web3</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overall progress */}
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>🗺️ Tu Ruta de Aprendizaje</Text>
          <View style={styles.overallStats}>
            <View style={styles.overallStat}>
              <Text style={styles.overallNum}>4</Text>
              <Text style={styles.overallLabel}>Módulos</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={styles.overallNum}>24</Text>
              <Text style={styles.overallLabel}>Lecciones</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={[styles.overallNum, { color: COLORS.accent }]}>2400</Text>
              <Text style={styles.overallLabel}>XP Total</Text>
            </View>
          </View>
        </View>

        {/* Modules */}
        <View style={styles.modulesContainer}>
          {MODULES.map((mod, modIndex) => {
            const progress = getModuleProgress(mod.id);
            const isExpanded = expandedModule === mod.id;
            const lessons = LESSONS[mod.id] ?? [];
            const unlocked = isModuleUnlocked(modIndex);
            const locked = !unlocked;

            return (
              <View key={mod.id} style={[styles.moduleWrapper, locked && styles.moduleWrapperLocked]}>
                {/* Module Header */}
                <TouchableOpacity
                  style={[styles.moduleHeader, { borderColor: locked ? COLORS.border : mod.color + "50" }]}
                  onPress={() => !locked && setExpandedModule(isExpanded ? null : mod.id)}
                  activeOpacity={locked ? 1 : 0.85}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: locked ? COLORS.cardAlt : mod.color + "20" }]}>
                    <Text style={{ fontSize: 28 }}>{locked ? "🔒" : mod.emoji}</Text>
                  </View>
                  <View style={styles.moduleInfo}>
                    <View style={styles.moduleTitleRow}>
                      <Text style={[styles.moduleTitle, locked && styles.textMuted]}>
                        {mod.title}
                      </Text>
                      {locked && (
                        <View style={styles.lockedBadge}>
                          <Text style={styles.lockedBadgeText}>Bloqueado</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.moduleDesc}>{mod.description}</Text>
                    <View style={styles.moduleFooter}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress.percent * 100}%`, backgroundColor: mod.color }]} />
                      </View>
                      <Text style={styles.progressText}>{progress.completed}/{progress.total}</Text>
                    </View>
                  </View>
                  {!locked && (
                    <Text style={[styles.chevron, { color: mod.color }]}>
                      {isExpanded ? "▼" : "▶"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Lessons List */}
                {isExpanded && !locked && (
                  <View style={styles.lessonsContainer}>
                    {lessons.map((lesson, idx) => {
                      const completed = isLessonCompleted(lesson.id);
                      // A lesson is available if all previous lessons in the module are completed
                      const previousAllCompleted = lessons.slice(0, idx).every((l: any) => isLessonCompleted(l.id));
                      const isLocked = !completed && !previousAllCompleted;

                      return (
                        <TouchableOpacity
                          key={lesson.id}
                          style={[
                            styles.lessonItem,
                            completed && styles.lessonCompleted,
                            isLocked && styles.lessonLocked,
                          ]}
                          onPress={() => !isLocked && router.push(`/lesson/${lesson.id}`)}
                          activeOpacity={isLocked ? 1 : 0.7}
                        >
                          <View style={[styles.lessonNum, completed && { backgroundColor: COLORS.success }]}>
                            {completed ? (
                              <Text style={{ fontSize: 14 }}>✓</Text>
                            ) : (
                              <Text style={styles.lessonNumText}>{idx + 1}</Text>
                            )}
                          </View>
                          <Text style={{ fontSize: 24 }}>{isLocked ? "🔒" : lesson.emoji}</Text>
                          <View style={styles.lessonContent}>
                            <Text style={[styles.lessonTitle, isLocked && styles.textMuted]}>
                              {lesson.title}
                            </Text>
                            <View style={styles.lessonMeta}>
                              <Text style={styles.lessonMetaText}>⏱ {lesson.duration}</Text>
                              <Text style={styles.lessonMetaText}>⚡ +{lesson.xpReward} XP</Text>
                            </View>
                          </View>
                          {completed && <Text style={styles.completedBadge}>✅</Text>}
                          {!completed && !isLocked && <Text style={styles.goArrow}>→</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  overallCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overallTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 16 },
  overallStats: { flexDirection: "row", justifyContent: "space-around" },
  overallStat: { alignItems: "center" },
  overallNum: { color: COLORS.primary, fontSize: 28, fontWeight: "800" },
  overallLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  overallDivider: { width: 1, backgroundColor: COLORS.border },
  modulesContainer: { paddingHorizontal: 20, gap: 16 },
  moduleWrapper: { borderRadius: 20, overflow: "hidden" },
  moduleWrapperLocked: { opacity: 0.6 },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  moduleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  moduleInfo: { flex: 1, gap: 4 },
  moduleTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moduleTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  textMuted: { color: COLORS.textMuted },
  lockedBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lockedBadgeText: { color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },
  moduleDesc: { color: COLORS.textSecondary, fontSize: 12 },
  moduleFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 99 },
  progressText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "600" },
  chevron: { fontSize: 12 },
  lessonsContainer: {
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -8,
    paddingTop: 16,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lessonCompleted: { borderColor: COLORS.success + "40" },
  lessonLocked: { opacity: 0.5 },
  lessonNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lessonNumText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700" },
  lessonContent: { flex: 1 },
  lessonTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  lessonMeta: { flexDirection: "row", gap: 10, marginTop: 2 },
  lessonMetaText: { color: COLORS.textMuted, fontSize: 11 },
  completedBadge: { fontSize: 18 },
  goArrow: { color: COLORS.primary, fontSize: 18, fontWeight: "700" },
});
