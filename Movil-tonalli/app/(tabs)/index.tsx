import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import { COLORS } from "../../src/constants/colors";
import { LESSONS } from "../../src/data/mockData";
import XPBar from "../../src/components/XPBar";
import StatCard from "../../src/components/StatCard";
import { useLanguageStore } from "../../src/store/languageStore";
import { getLessonsForLang } from "../../src/data/lessonTranslations";

const XP_PER_LEVEL = 1000;

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { totalXP, currentStreak, lessonsProgress } = useProgressStore();
  const { tr, lang } = useLanguageStore();
  const translatedLessons = getLessonsForLang(lang, LESSONS);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = React.useState(false);
  const completedCount = Object.keys(lessonsProgress).length;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const effectiveXP = totalXP + (user?.xp ?? 0);
  const xpInLevel = effectiveXP % XP_PER_LEVEL;
  const level = Math.floor(effectiveXP / XP_PER_LEVEL) + 1;
  const effectiveStreak = currentStreak || (user?.streak ?? 0);

  // Find next available lesson
  const nextLesson = (() => {
    for (const moduleId of Object.keys(translatedLessons)) {
      for (const lesson of translatedLessons[moduleId]) {
        if (!lessonsProgress[lesson.id]?.completed && !lesson.locked) return lesson;
      }
    }
    return null;
  })();

  const ACHIEVEMENTS = (() => {
    const list: { emoji: string; title: string; desc: string; date: string }[] = [];
    if (completedCount >= 1) list.push({ emoji: "🚀", title: tr("achievement.firstLesson"), desc: tr("achievement.firstLessonDesc"), date: tr("achievement.unlocked") });
    if (completedCount >= 3) list.push({ emoji: "🔗", title: tr("achievement.blockchainBasic"), desc: tr("achievement.blockchainBasicDesc"), date: tr("achievement.unlocked") });
    if (completedCount >= 5) list.push({ emoji: "⭐", title: tr("achievement.blockchainMaster"), desc: tr("achievement.blockchainMasterDesc"), date: tr("achievement.unlocked") });
    if (effectiveStreak >= 5) list.push({ emoji: "🔥", title: tr("achievement.streakTitle", { streak: effectiveStreak }), desc: tr("achievement.streakDesc", { streak: effectiveStreak }), date: tr("achievement.unlocked") });
    // Show locked achievements if few unlocked
    if (list.length < 3) {
      if (completedCount < 1) list.push({ emoji: "🔒", title: tr("achievement.firstLesson"), desc: tr("achievement.complete1"), date: tr("achievement.locked") });
      if (completedCount < 3) list.push({ emoji: "🔒", title: tr("achievement.blockchainBasic"), desc: tr("achievement.complete3"), date: tr("achievement.locked") });
      if (completedCount < 5) list.push({ emoji: "🔒", title: tr("achievement.blockchainMaster"), desc: tr("achievement.complete5"), date: tr("achievement.locked") });
    }
    return list.slice(0, 4);
  })();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require("../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.greeting}>{(() => {
                const h = new Date().getHours();
                if (h < 12) return tr("home.goodMorning");
                if (h < 18) return tr("home.goodAfternoon");
                return tr("home.goodEvening");
              })()}</Text>
              <Text style={styles.userName}>{user?.name?.split(" ")[0] ?? "Explorador"} 👋</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNum}>{effectiveStreak}</Text>
          </View>
        </View>

        {/* Chima greeting */}
        <View style={styles.chimaCard}>
          <Text style={styles.chimaEmoji}>🎺</Text>
          <View style={styles.chimaContent}>
            <Text style={styles.chimaName}>{tr("home.chimaSays")}</Text>
            <Text style={styles.chimaMsg}>
              {effectiveStreak > 0
                ? `${tr("home.chimaStreak", { streak: effectiveStreak })} ${nextLesson ? tr("home.chimaToday", { lesson: nextLesson.title }) : tr("home.chimaComplete")}`
                : tr("home.chimaWelcome")}
            </Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr("home.progress")}</Text>
          <View style={styles.xpCard}>
            <XPBar current={xpInLevel} max={XP_PER_LEVEL} level={level} />
            <Text style={styles.xpSubtext}>
              {tr("home.xpToNext", { xp: XP_PER_LEVEL - xpInLevel })}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr("home.stats")}</Text>
          <View style={styles.statsGrid}>
            <StatCard emoji="⚡" label={tr("home.xpTotal")} value={effectiveXP.toLocaleString()} color={COLORS.primary} />
            <StatCard emoji="🔥" label={tr("home.streak")} value={`${effectiveStreak}`} color="#FF4757" />
            <StatCard emoji="📚" label={tr("home.lessons")} value={completedCount} color={COLORS.success} />
            <StatCard emoji="💫" label="XLM" value={(user?.xlmBalance ?? 0).toFixed(1)} color={COLORS.accent} />
          </View>
        </View>

        {/* Daily Lesson CTA */}
        {nextLesson && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tr("home.nextLesson")}</Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.dailyCard}
                onPress={() => router.push(`/lesson/${nextLesson.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.dailyLeft}>
                  <Text style={styles.dailyEmoji}>{nextLesson.emoji}</Text>
                  <View>
                    <Text style={styles.dailyBadge}>{tr("home.next")} · +{nextLesson.xpReward} XP</Text>
                    <Text style={styles.dailyTitle}>{nextLesson.title}</Text>
                    <Text style={styles.dailyMeta}>{nextLesson.duration} · Módulo {nextLesson.moduleId.replace("m", "")}</Text>
                  </View>
                </View>
                <View style={styles.dailyArrow}>
                  <Text style={styles.arrowText}>▶</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Recent Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tr("home.achievements")}</Text>
          <View style={styles.achievementsList}>
            {ACHIEVEMENTS.map((a, i) => (
              <View key={i} style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                </View>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{a.desc}</Text>
                </View>
                <Text style={styles.achievementDate}>{a.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Xollo reminder */}
        <View style={[styles.xolloCard, { marginBottom: 24 }]}>
          <Text style={{ fontSize: 36 }}>🐕</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.xolloTitle}>{tr("home.xolloReminder")}</Text>
            <Text style={styles.xolloMsg}>
              {completedCount === 0
                ? tr("home.xolloStart")
                : tr("home.xolloContinue", { count: completedCount })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  greeting: { color: COLORS.textSecondary, fontSize: 14 },
  userName: { color: COLORS.text, fontSize: 26, fontWeight: "800" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.danger + "40",
  },
  streakEmoji: { fontSize: 18 },
  streakNum: { color: COLORS.danger, fontSize: 18, fontWeight: "800" },
  chimaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  chimaEmoji: { fontSize: 44 },
  chimaContent: { flex: 1 },
  chimaName: { color: COLORS.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  chimaMsg: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  xpCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  xpSubtext: { color: COLORS.textSecondary, fontSize: 12, textAlign: "right" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dailyCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  dailyLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  dailyEmoji: { fontSize: 40 },
  dailyBadge: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  dailyTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 2 },
  dailyMeta: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  dailyArrow: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { color: "#fff", fontSize: 14 },
  achievementsList: { gap: 12 },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementContent: { flex: 1 },
  achievementTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  achievementDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  achievementDate: { color: COLORS.textMuted, fontSize: 11 },
  xolloCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
  },
  xolloTitle: { color: COLORS.success, fontSize: 12, fontWeight: "700", marginBottom: 2 },
  xolloMsg: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
});
