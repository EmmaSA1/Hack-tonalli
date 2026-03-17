import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import { LESSONS } from "../../src/data/mockData";
import { useProgressStore } from "../../src/store/progressStore";

function getLessonById(id: string) {
  for (const moduleId in LESSONS) {
    const found = LESSONS[moduleId].find((l: any) => l.id === id);
    if (found) return found;
  }
  return null;
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLessonById(id ?? "");
  const scrollRef = useRef<ScrollView>(null);
  const { isLessonCompleted } = useProgressStore();

  // Calculate reading progress based on content blocks
  const totalBlocks = lesson?.content?.length ?? 1;

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Lección no encontrada</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: COLORS.primary }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleContinue = () => {
    router.push(`/quiz/${lesson.id}`);
  };

  const renderContent = (block: any, i: number) => {
    switch (block.type) {
      case "text":
        return (
          <Text key={i} style={styles.contentText}>
            {block.text}
          </Text>
        );
      case "highlight":
        return (
          <View key={i} style={styles.highlightBlock}>
            <Text style={styles.highlightIcon}>💡</Text>
            <Text style={styles.highlightText}>{block.text}</Text>
          </View>
        );
      case "bullets":
        return (
          <View key={i} style={styles.bulletsBlock}>
            {block.items.map((item: string, j: number) => (
              <View key={j} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "60%" }]} />
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+{lesson.xpReward} XP</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Lesson title */}
        <View style={styles.titleSection}>
          <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>⏱ {lesson.duration}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>⚡ +{lesson.xpReward} XP</Text>
            </View>
          </View>
        </View>

        {/* Chima intro bubble */}
        <View style={styles.chimaBubble}>
          <Text style={styles.chimaEmoji}>🎺</Text>
          <View style={styles.bubbleBox}>
            <Text style={styles.bubbleName}>Chima dice:</Text>
            <Text style={styles.bubbleMsg}>
              ¡Hola! Hoy vamos a aprender sobre "{lesson.title}". Es un concepto fundamental en el mundo blockchain. ¡Vamos! 🚀
            </Text>
          </View>
        </View>

        {/* Content blocks */}
        <View style={styles.contentContainer}>
          {lesson.content.map((block: any, i: number) => renderContent(block, i))}
        </View>

        {/* Key takeaways */}
        <View style={styles.takeawaysCard}>
          <Text style={styles.takeawaysTitle}>🎯 Puntos Clave</Text>
          <Text style={styles.takeawaysText}>
            Ahora que entiendes {lesson.title.toLowerCase()}, estás listo para el quiz. ¡Demuestra lo que aprendiste!
          </Text>
        </View>

        {/* Alli challenge */}
        <View style={styles.alliCard}>
          <Text style={{ fontSize: 32 }}>🎸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alliTitle}>Alli te reta:</Text>
            <Text style={styles.alliMsg}>
              ¿Puedes obtener 100% en el quiz? ¡Yo lo hice en 2 intentos! 😏
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>¡Tomar el Quiz! 🎯</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { color: COLORS.text, fontSize: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 99,
  },
  xpBadge: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  titleSection: { alignItems: "center", marginBottom: 24 },
  lessonEmoji: { fontSize: 64, marginBottom: 12 },
  lessonTitle: { color: COLORS.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  metaBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaText: { color: COLORS.textSecondary, fontSize: 13 },
  chimaBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  chimaEmoji: { fontSize: 44, marginTop: 4 },
  bubbleBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  bubbleName: { color: COLORS.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  bubbleMsg: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  contentContainer: { gap: 20, marginBottom: 24 },
  contentText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 26,
  },
  highlightBlock: {
    flexDirection: "row",
    backgroundColor: COLORS.primary + "15",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    alignItems: "flex-start",
  },
  highlightIcon: { fontSize: 20 },
  highlightText: { flex: 1, color: COLORS.text, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  bulletsBlock: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    flexShrink: 0,
  },
  bulletText: { color: COLORS.text, fontSize: 15, flex: 1 },
  takeawaysCard: {
    backgroundColor: COLORS.success + "15",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
  },
  takeawaysTitle: { color: COLORS.success, fontSize: 16, fontWeight: "800", marginBottom: 8 },
  takeawaysText: { color: COLORS.text, fontSize: 14, lineHeight: 22 },
  alliCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + "30",
  },
  alliTitle: { color: COLORS.accent, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  alliMsg: { color: COLORS.text, fontSize: 13, lineHeight: 18, marginTop: 2 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  continueBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
