import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../src/constants/colors";
import { LEADERBOARD } from "../../src/data/mockData";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import { useLanguageStore } from "../../src/store/languageStore";

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const { totalXP, currentStreak } = useProgressStore();
  const { tr } = useLanguageStore();

  // Replace "Tú" entry with real user data
  const effectiveXP = totalXP + (user?.xp ?? 0);
  const effectiveStreak = currentStreak || (user?.streak ?? 0);
  const leaderboard = LEADERBOARD.map((entry) => {
    if ((entry as any).isCurrentUser) {
      return {
        ...entry,
        name: user?.name ?? "Tú",
        xp: effectiveXP > 0 ? effectiveXP : entry.xp,
        streak: effectiveStreak > 0 ? effectiveStreak : entry.streak,
      };
    }
    return entry;
  }).sort((a, b) => b.xp - a.xp).map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tr("leaderboard.title")}</Text>
          <Text style={styles.subtitle}>{tr("leaderboard.week")}</Text>
        </View>

        {/* Alli challenger */}
        <View style={styles.alliCard}>
          <Text style={{ fontSize: 40 }}>🎸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alliName}>{tr("leaderboard.alliChallenges")}</Text>
            <Text style={styles.alliMsg}>
              {tr("leaderboard.alliMsg")}
            </Text>
          </View>
        </View>

        {/* Top 3 Podium */}
        <View style={styles.podium}>
          {/* 2nd place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <Text style={styles.podiumAvatar}>{top3[1]?.avatar}</Text>
            <View style={[styles.podiumBlock, { height: 70, backgroundColor: "#A0A0A0" }]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.name.split(" ")[0]}</Text>
            <Text style={styles.podiumXP}>{(top3[1]?.xp / 1000).toFixed(1)}k</Text>
          </View>

          {/* 1st place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <Text style={{ fontSize: 24 }}>👑</Text>
            <Text style={styles.podiumAvatar}>{top3[0]?.avatar}</Text>
            <View style={[styles.podiumBlock, { height: 90, backgroundColor: COLORS.accent }]}>
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[0]?.name.split(" ")[0]}</Text>
            <Text style={styles.podiumXP}>{(top3[0]?.xp / 1000).toFixed(1)}k XP</Text>
          </View>

          {/* 3rd place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <Text style={styles.podiumAvatar}>{top3[2]?.avatar}</Text>
            <View style={[styles.podiumBlock, { height: 56, backgroundColor: "#CD7F32" }]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.name.split(" ")[0]}</Text>
            <Text style={styles.podiumXP}>{(top3[2]?.xp / 1000).toFixed(1)}k</Text>
          </View>
        </View>

        {/* Rest of leaderboard */}
        <View style={styles.listContainer}>
          {rest.map((entry) => (
            <View
              key={entry.rank}
              style={[
                styles.entryItem,
                (entry as any).isCurrentUser && styles.entryCurrentUser,
              ]}
            >
              <Text style={styles.entryRank}>#{entry.rank}</Text>
              <View style={styles.entryAvatar}>
                <Text style={{ fontSize: 24 }}>{entry.avatar}</Text>
              </View>
              <View style={styles.entryInfo}>
                <View style={styles.entryNameRow}>
                  <Text style={[styles.entryName, (entry as any).isCurrentUser && { color: COLORS.primary }]}>
                    {entry.name}
                  </Text>
                  {(entry as any).isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>{tr("leaderboard.you")}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryMetaText}>🔥 {entry.streak}d</Text>
                  <Text style={styles.entryMetaText}>⚡ {entry.xp.toLocaleString()} XP</Text>
                </View>
              </View>
              {entry.badge ? (
                <Text style={{ fontSize: 22 }}>{entry.badge}</Text>
              ) : (
                <Text style={styles.entryXP}>{(entry.xp / 1000).toFixed(1)}k</Text>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  alliCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + "40",
  },
  alliName: { color: COLORS.accent, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  alliMsg: { color: COLORS.text, fontSize: 13, lineHeight: 18, marginTop: 2 },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
  },
  podiumFirst: { marginBottom: 0 },
  podiumSecond: { marginBottom: 0 },
  podiumThird: { marginBottom: 0 },
  podiumAvatar: { fontSize: 32, marginBottom: 4 },
  podiumBlock: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRank: { color: "#fff", fontSize: 20, fontWeight: "800" },
  podiumName: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 4 },
  podiumXP: { color: COLORS.textSecondary, fontSize: 11 },
  listContainer: { paddingHorizontal: 20, gap: 10 },
  entryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryCurrentUser: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  entryRank: { color: COLORS.textMuted, fontSize: 14, fontWeight: "700", width: 28 },
  entryAvatar: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  entryInfo: { flex: 1 },
  entryNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  entryName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  youBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  youBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  entryMeta: { flexDirection: "row", gap: 10, marginTop: 2 },
  entryMetaText: { color: COLORS.textMuted, fontSize: 11 },
  entryXP: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
});
