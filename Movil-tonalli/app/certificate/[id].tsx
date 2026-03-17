import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import { CERTIFICATES } from "../../src/data/mockData";
import { useLanguageStore } from "../../src/store/languageStore";

export default function CertificateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cert = CERTIFICATES.find((c) => c.id === id);
  const { tr } = useLanguageStore();

  if (!cert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{tr("cert.notFound")}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: COLORS.primary, marginTop: 12 }}>{tr("cert.back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: tr("cert.shareText", { title: cert.title, hash: cert.nftHash }),
      });
    } catch {}
  };

  const handleViewOnChain = () => {
    Alert.alert(
      tr("cert.viewOnChain"),
      tr("cert.chainMsg", { hash: cert.nftHash }),
      [{ text: tr("cert.understood") }]
    );
  };

  const RARITY_COLORS: Record<string, string> = {
    Common: "#888888",
    Rare: COLORS.primary,
    Epic: "#9B59B6",
    Legendary: COLORS.accent,
  };

  const rarityColor = RARITY_COLORS[cert.rarity] ?? COLORS.primary;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr("cert.title")}</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareBtn}>{tr("cert.share")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* NFT Card */}
        <View style={[styles.nftCard, { borderColor: cert.color + "80" }]}>
          {/* Glow effect */}
          <View style={[styles.glow, { backgroundColor: cert.color + "30" }]} />

          <View style={styles.nftBadgeRow}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + "20", borderColor: rarityColor + "60" }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {cert.rarity === "Rare" ? "💎" : cert.rarity === "Legendary" ? "🌟" : "✨"} {cert.rarity}
              </Text>
            </View>
            <View style={styles.nftTag}>
              <Text style={styles.nftTagText}>NFT</Text>
            </View>
          </View>

          <View style={[styles.certEmojiWrap, { backgroundColor: cert.color + "20" }]}>
            <Text style={styles.certEmoji}>{cert.emoji}</Text>
          </View>

          <Text style={[styles.certTitle, { color: cert.color }]}>{cert.title}</Text>
          <Text style={styles.certDesc}>{cert.description}</Text>

          <View style={styles.certDivider} />

          <View style={styles.certMeta}>
            <View style={styles.certMetaItem}>
              <Text style={styles.certMetaLabel}>{tr("cert.xpAwarded")}</Text>
              <Text style={[styles.certMetaValue, { color: COLORS.primary }]}>+{cert.xpAwarded}</Text>
            </View>
            <View style={styles.certMetaItem}>
              <Text style={styles.certMetaLabel}>{tr("cert.xlmAwarded")}</Text>
              <Text style={[styles.certMetaValue, { color: COLORS.accent }]}>+{cert.xlmAwarded} XLM</Text>
            </View>
            <View style={styles.certMetaItem}>
              <Text style={styles.certMetaLabel}>{tr("cert.date")}</Text>
              <Text style={styles.certMetaValue}>{cert.dateEarned}</Text>
            </View>
          </View>
        </View>

        {/* Blockchain Details */}
        <View style={styles.blockchainSection}>
          <Text style={styles.sectionTitle}>{tr("cert.blockchainData")}</Text>
          <View style={styles.blockchainCard}>
            <View style={styles.blockRow}>
              <Text style={styles.blockLabel}>{tr("cert.network")}</Text>
              <Text style={styles.blockValue}>Stellar Mainnet</Text>
            </View>
            <View style={styles.blockDivider} />
            <View style={styles.blockRow}>
              <Text style={styles.blockLabel}>{tr("cert.nftHash")}</Text>
              <Text style={styles.blockValueMono}>{cert.nftHash}</Text>
            </View>
            <View style={styles.blockDivider} />
            <View style={styles.blockRow}>
              <Text style={styles.blockLabel}>{tr("cert.standard")}</Text>
              <Text style={styles.blockValue}>Stellar NFT (SEP-39)</Text>
            </View>
            <View style={styles.blockDivider} />
            <View style={styles.blockRow}>
              <Text style={styles.blockLabel}>{tr("cert.status")}</Text>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>{tr("cert.confirmed")}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.viewChainBtn} onPress={handleViewOnChain} activeOpacity={0.8}>
            <Text style={styles.viewChainBtnText}>{tr("cert.viewExplorer")}</Text>
          </TouchableOpacity>
        </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>{tr("cert.shareTitle")}</Text>
          <TouchableOpacity style={styles.shareCard} onPress={handleShare} activeOpacity={0.85}>
            <View>
              <Text style={styles.shareCardTitle}>{tr("cert.showOff")}</Text>
              <Text style={styles.shareCardSub}>
                {tr("cert.shareMsg", { title: cert.title })}
              </Text>
            </View>
            <Text style={{ fontSize: 32 }}>📤</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: COLORS.text, fontSize: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  shareBtn: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
  nftCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
    gap: 12,
  },
  glow: {
    position: "absolute",
    top: -40,
    left: -40,
    right: -40,
    height: 150,
    borderRadius: 999,
  },
  nftBadgeRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  rarityBadge: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  rarityText: { fontSize: 12, fontWeight: "700" },
  nftTag: {
    backgroundColor: COLORS.background,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nftTagText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700" },
  certEmojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  certEmoji: { fontSize: 56 },
  certTitle: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  certDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20 },
  certDivider: { width: "100%", height: 1, backgroundColor: COLORS.border },
  certMeta: { width: "100%", gap: 10 },
  certMetaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  certMetaLabel: { color: COLORS.textSecondary, fontSize: 14 },
  certMetaValue: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  blockchainSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  blockchainCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  blockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  blockDivider: { height: 1, backgroundColor: COLORS.border },
  blockLabel: { color: COLORS.textSecondary, fontSize: 13 },
  blockValue: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  blockValueMono: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: "monospace",
    maxWidth: "60%",
  },
  confirmedBadge: {
    backgroundColor: COLORS.success + "20",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confirmedText: { color: COLORS.success, fontSize: 12, fontWeight: "700" },
  viewChainBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewChainBtnText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  shareSection: { paddingHorizontal: 20, marginBottom: 24 },
  shareCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    justifyContent: "space-between",
  },
  shareCardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 4 },
  shareCardSub: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, maxWidth: "85%" },
});
