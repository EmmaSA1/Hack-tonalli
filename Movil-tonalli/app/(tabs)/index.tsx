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

const XP_PER_LEVEL = 1000;

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { totalXP, currentStreak, lessonsProgress } = useProgressStore();
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

  const effectiveXP = totalXP || (user?.xp ?? 0);
  const xpInLevel = effectiveXP % XP_PER_LEVEL;
  const level = Math.floor(effectiveXP / XP_PER_LEVEL) + 1;
  const effectiveStreak = currentStreak || (user?.streak ?? 0);

  // Find next available lesson
  const nextLesson = (() => {
    for (const moduleId of Object.keys(LESSONS)) {
      for (const lesson of LESSONS[moduleId]) {
        if (!lessonsProgress[lesson.id]?.completed && !lesson.locked) return lesson;
      }
    }
    return null;
  })();

  const ACHIEVEMENTS = (() => {
    const list: { emoji: string; title: string; desc: string; date: string }[] = [];
    if (completedCount >= 1) list.push({ emoji: "🚀", title: "Primera Lección", desc: "¡Completaste tu primera lección!", date: "Desbloqueado" });
    if (completedCount >= 3) list.push({ emoji: "🔗", title: "Blockchain Básico", desc: "3 lecciones completadas", date: "Desbloqueado" });
    if (completedCount >= 5) list.push({ emoji: "⭐", title: "Maestro Blockchain", desc: "¡Módulo 1 completado!", date: "Desbloqueado" });
    if (effectiveStreak >= 5) list.push({ emoji: "🔥", title: `Racha de ${effectiveStreak}`, desc: `¡${effectiveStreak} lecciones seguidas!`, date: "Activo" });
    // Show locked achievements if few unlocked
    if (list.length < 3) {
      if (completedCount < 1) list.push({ emoji: "🔒", title: "Primera Lección", desc: "Completa tu primera lección", date: "Bloqueado" });
      if (completedCount < 3) list.push({ emoji: "🔒", title: "Blockchain Básico", desc: "Completa 3 lecciones", date: "Bloqueado" });
      if (completedCount < 5) list.push({ emoji: "🔒", title: "Maestro Blockchain", desc: "Completa 5 lecciones", date: "Bloqueado" });
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
                if (h < 12) return "Buenos días,";
                if (h < 18) return "Buenas tardes,";
                return "Buenas noches,";
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
            <Text style={styles.chimaName}>Chima dice:</Text>
            <Text style={styles.chimaMsg}>
              {effectiveStreak > 0
                ? `¡Excelente racha! Tienes ${effectiveStreak} lecciones completadas. ${nextLesson ? `¡Hoy aprendemos sobre ${nextLesson.title}!` : "¡Completaste todo!"}`
                : "¡Bienvenido a Tonalli! Comienza tu primera lección y empieza a ganar XLM."}
            </Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu Progreso</Text>
          <View style={styles.xpCard}>
            <XPBar current={xpInLevel} max={XP_PER_LEVEL} level={level} />
            <Text style={styles.xpSubtext}>
              {XP_PER_LEVEL - xpInLevel} XP para el siguiente nivel
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <StatCard emoji="⚡" label="XP Total" value={effectiveXP.toLocaleString()} color={COLORS.primary} />
            <StatCard emoji="🔥" label="Racha" value={`${effectiveStreak}`} color="#FF4757" />
            <StatCard emoji="📚" label="Lecciones" value={completedCount} color={COLORS.success} />
            <StatCard emoji="💫" label="XLM" value={(user?.xlmBalance ?? 0).toFixed(1)} color={COLORS.accent} />
          </View>
        </View>

        {/* Daily Lesson CTA */}
        {nextLesson && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Siguiente Lección</Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.dailyCard}
                onPress={() => router.push(`/lesson/${nextLesson.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.dailyLeft}>
                  <Text style={styles.dailyEmoji}>{nextLesson.emoji}</Text>
                  <View>
                    <Text style={styles.dailyBadge}>SIGUIENTE · +{nextLesson.xpReward} XP</Text>
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
          <Text style={styles.sectionTitle}>Logros Recientes</Text>
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
            <Text style={styles.xolloTitle}>Xollo te recuerda:</Text>
            <Text style={styles.xolloMsg}>
              {completedCount === 0
                ? "¡Comienza tu aventura! Tu primera lección te espera. ¡Gana XP y XLM! 🚀"
                : `¡No pares! Llevas ${completedCount} lecciones. ¡Sigue aprendiendo para ganar más XLM! 🔥`}
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
