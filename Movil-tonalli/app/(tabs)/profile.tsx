import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import { COLORS } from "../../src/constants/colors";
import { CERTIFICATES } from "../../src/data/mockData";
import XPBar from "../../src/components/XPBar";

const XP_PER_LEVEL = 1000;

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { totalXP, currentStreak, lessonsProgress } = useProgressStore();
  const effectiveXP = totalXP || (user?.xp ?? 0);
  const xpInLevel = effectiveXP % XP_PER_LEVEL;
  const level = Math.floor(effectiveXP / XP_PER_LEVEL) + 1;
  const completedCount = Object.keys(lessonsProgress).length;

  const resetProgress = useProgressStore((s) => s.reset);

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => {
        logout();
        resetProgress();
        router.replace("/(auth)/login");
      }},
    ]);
  };

  const SETTINGS = [
    { emoji: "🔔", label: "Notificaciones", action: () => {} },
    { emoji: "🌐", label: "Idioma", action: () => {} },
    { emoji: "👛", label: "Mi Wallet Stellar", action: () => {} },
    { emoji: "🔒", label: "Privacidad", action: () => {} },
    { emoji: "❓", label: "Ayuda & Soporte", action: () => {} },
    { emoji: "⭐", label: "Calificar la App", action: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
            <Text style={styles.settingsBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarEmoji}>{user?.avatar ?? "😎"}</Text>
            </View>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.userName}>{user?.name ?? "Explorador"}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>⚡ Nivel {level} · Explorer</Text>
            </View>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <XPBar current={xpInLevel} max={XP_PER_LEVEL} level={level} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { emoji: "⚡", label: "XP Total", value: effectiveXP.toLocaleString(), color: COLORS.primary },
            { emoji: "🔥", label: "Racha", value: `${currentStreak || (user?.streak ?? 0)}`, color: "#FF4757" },
            { emoji: "📚", label: "Lecciones", value: completedCount, color: COLORS.success },
            { emoji: "💫", label: "XLM Ganados", value: `${(user?.xlmBalance ?? 0).toFixed(1)} XLM`, color: COLORS.accent },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { borderColor: stat.color + "30" }]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Stellar Wallet */}
        <View style={styles.walletSection}>
          <Text style={styles.sectionTitle}>⭐ Mi Wallet Stellar</Text>
          <View style={styles.walletCard}>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Dirección</Text>
              <TouchableOpacity>
                <Text style={styles.walletCopy}>Copiar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.walletAddress} numberOfLines={1}>
              {user?.walletAddress ?? "GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
            </Text>
            <View style={styles.walletBalance}>
              <View>
                <Text style={styles.walletBalanceLabel}>Balance XLM</Text>
                <Text style={styles.walletBalanceValue}>{user?.xlmBalance ?? 15.5} XLM</Text>
              </View>
              <View style={styles.stellarBadge}>
                <Text style={styles.stellarBadgeText}>Stellar Network</Text>
              </View>
            </View>
          </View>
        </View>

        {/* NFT Certificates */}
        <View style={styles.certSection}>
          <Text style={styles.sectionTitle}>🏆 Mis Certificados NFT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CERTIFICATES.map((cert) => (
              <TouchableOpacity
                key={cert.id}
                style={[styles.certCard, { borderColor: cert.color + "60" }]}
                onPress={() => router.push(`/certificate/${cert.id}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.certIconWrap, { backgroundColor: cert.color + "20" }]}>
                  <Text style={{ fontSize: 36 }}>{cert.emoji}</Text>
                </View>
                <Text style={[styles.certTitle, { color: cert.color }]}>{cert.title}</Text>
                <View style={styles.certRarity}>
                  <Text style={[styles.certRarityText, { color: cert.color }]}>{cert.rarity}</Text>
                </View>
                <Text style={styles.certXlm}>+{cert.xlmAwarded} XLM</Text>
                <Text style={styles.certDate}>{cert.dateEarned}</Text>
              </TouchableOpacity>
            ))}
            {/* Locked placeholder */}
            <View style={[styles.certCard, styles.certLocked]}>
              <View style={styles.certIconWrap}>
                <Text style={{ fontSize: 36 }}>🔒</Text>
              </View>
              <Text style={styles.certLockedText}>DeFi Master</Text>
              <Text style={styles.certLockedSub}>Completa el módulo 3</Text>
            </View>
          </ScrollView>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
          <View style={styles.settingsList}>
            {SETTINGS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.settingItem, i < SETTINGS.length - 1 && styles.settingItemBorder]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <Text style={styles.settingEmoji}>{item.emoji}</Text>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>🌅 Tonalli v1.0.0 · Hackathon 2025</Text>
          <Text style={styles.appInfoSub}>Powered by Stellar Blockchain ⭐</Text>
        </View>

        <View style={{ height: 24 }} />
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
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800" },
  settingsBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  settingsBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 99,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 40 },
  avatarInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  userEmail: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  levelBadge: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  levelText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  xpSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, textAlign: "center" },
  walletSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent + "40",
    gap: 10,
  },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  walletCopy: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  walletAddress: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "monospace",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  walletBalance: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  walletBalanceLabel: { color: COLORS.textSecondary, fontSize: 12 },
  walletBalanceValue: { color: COLORS.accent, fontSize: 22, fontWeight: "800" },
  stellarBadge: {
    backgroundColor: COLORS.accent + "20",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stellarBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: "700" },
  certSection: { marginBottom: 24 },
  certSectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: 12, paddingHorizontal: 20 },
  certCard: {
    width: 150,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginLeft: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  certLocked: { borderColor: COLORS.border, opacity: 0.5, marginRight: 20 },
  certIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  certTitle: { fontSize: 13, fontWeight: "800", textAlign: "center" },
  certRarity: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  certRarityText: { fontSize: 11, fontWeight: "600" },
  certXlm: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
  certDate: { color: COLORS.textMuted, fontSize: 11 },
  certLockedText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "700", textAlign: "center" },
  certLockedSub: { color: COLORS.textMuted, fontSize: 11, textAlign: "center" },
  settingsSection: { paddingHorizontal: 20, marginBottom: 24 },
  settingsList: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingEmoji: { fontSize: 20, width: 28 },
  settingLabel: { flex: 1, color: COLORS.text, fontSize: 15 },
  settingArrow: { color: COLORS.textMuted, fontSize: 22 },
  appInfo: { alignItems: "center", gap: 4 },
  appInfoText: { color: COLORS.textMuted, fontSize: 12 },
  appInfoSub: { color: COLORS.textMuted, fontSize: 11 },
});
