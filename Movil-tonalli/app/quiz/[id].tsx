import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import { QUIZZES } from "../../src/data/mockData";
import { useProgressStore } from "../../src/store/progressStore";
import { useAuthStore } from "../../src/store/authStore";
import { useLanguageStore } from "../../src/store/languageStore";
import { getQuizzesForLang } from "../../src/data/quizTranslations";

type AnswerState = "idle" | "correct" | "wrong";

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tr, lang } = useLanguageStore();
  const translatedQuizzes = getQuizzesForLang(lang, QUIZZES);
  const quiz = translatedQuizzes[id ?? ""];
  const { completeLesson } = useProgressStore();
  const { updateUser, user } = useAuthStore();

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [finished, setFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const question = quiz?.questions[currentQ];

  const animateProgress = useCallback((toValue: number) => {
    Animated.timing(progressAnim, {
      toValue,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const shakeWrong = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswer = (idx: number) => {
    if (answerState !== "idle") return;

    setSelectedIdx(idx);
    const isCorrect = idx === question.correctIndex;

    if (isCorrect) {
      setAnswerState("correct");
      setCorrectCount((c) => c + 1);
    } else {
      setAnswerState("wrong");
      shakeWrong();
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setGameOver(true);
      }
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (gameOver) return;
    if (currentQ + 1 < quiz.questions.length) {
      setCurrentQ((q) => q + 1);
      setSelectedIdx(null);
      setAnswerState("idle");
      setShowExplanation(false);
      animateProgress((currentQ + 1) / quiz.questions.length);
    } else {
      // Quiz finished — correctCount already includes current answer via handleAnswer
      const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
      const xpGained = completeLesson(id ?? "", finalScore, 100);
      if (user && xpGained > 0) {
        updateUser({
          xp: (user.xp ?? 0) + xpGained,
          lessonsCompleted: (user.lessonsCompleted ?? 0) + 1,
          xlmBalance: (user.xlmBalance ?? 0) + (finalScore === 100 ? 0.55 : 0.5),
        });
      }
      setFinished(true);
    }
  };

  const getOptionStyle = (idx: number) => {
    if (answerState === "idle") return styles.option;
    if (idx === question.correctIndex) return [styles.option, styles.optionCorrect];
    if (idx === selectedIdx && answerState === "wrong") return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  };

  const getOptionTextStyle = (idx: number) => {
    if (answerState === "idle") return styles.optionText;
    if (idx === question.correctIndex) return [styles.optionText, styles.optionTextCorrect];
    if (idx === selectedIdx && answerState === "wrong") return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, styles.optionTextDimmed];
  };

  // Game Over screen
  if (gameOver) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scoreContainer}>
          <Text style={styles.scoreEmoji}>💔</Text>
          <Text style={styles.scoreTitle}>{tr("quiz.noLives")}</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scorePercent}>0</Text>
            <Text style={styles.scoreSubtitle}>{tr("quiz.noLivesMsg")}</Text>
          </View>

          <View style={styles.chimaBubble}>
            <Text style={{ fontSize: 40 }}>🎺</Text>
            <View style={styles.bubbleBox}>
              <Text style={styles.bubbleName}>{tr("home.chimaSays")}</Text>
              <Text style={styles.bubbleMsg}>
                {tr("quiz.chimaDontGiveUp")}
              </Text>
            </View>
          </View>

          <View style={styles.scoreActions}>
            <TouchableOpacity
              style={styles.nextLessonBtn}
              onPress={() => {
                setCurrentQ(0);
                setSelectedIdx(null);
                setAnswerState("idle");
                setCorrectCount(0);
                setLives(3);
                setGameOver(false);
                setShowExplanation(false);
                setFinished(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.nextLessonBtnText}>{tr("quiz.retry")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Text style={styles.homeBtnText}>{tr("quiz.goHome")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Score screen
  if (finished) {
    const total = quiz.questions.length;
    const score = Math.round((correctCount / total) * 100);
    const isPerfect = score === 100;
    const isGood = score >= 70;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scoreContainer}>
          <Text style={styles.scoreEmoji}>{isPerfect ? "🏆" : isGood ? "⭐" : "📚"}</Text>
          <Text style={styles.scoreTitle}>
            {isPerfect ? tr("quiz.perfect") : isGood ? tr("quiz.wellDone") : tr("quiz.keepTrying")}
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scorePercent}>{score}%</Text>
            <Text style={styles.scoreSubtitle}>{correctCount}/{total} {tr("quiz.correctAnswers")}</Text>
          </View>

          {/* NFT Badge if perfect */}
          {isPerfect && (
            <View style={styles.nftBadge}>
              <Text style={{ fontSize: 48 }}>🏅</Text>
              <Text style={styles.nftTitle}>{tr("quiz.nftBadge")}</Text>
              <Text style={styles.nftSub}>{tr("quiz.nftMint")}</Text>
            </View>
          )}

          {/* XP Reward */}
          <View style={styles.rewardCard}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>⚡</Text>
              <Text style={styles.rewardLabel}>{tr("quiz.xpEarned")}</Text>
              <Text style={[styles.rewardValue, { color: COLORS.primary }]}>+100</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>💫</Text>
              <Text style={styles.rewardLabel}>{tr("quiz.xlmEarned")}</Text>
              <Text style={[styles.rewardValue, { color: COLORS.accent }]}>+0.5</Text>
            </View>
          </View>

          {/* Chima feedback */}
          <View style={styles.chimaBubble}>
            <Text style={{ fontSize: 40 }}>🎺</Text>
            <View style={styles.bubbleBox}>
              <Text style={styles.bubbleName}>{tr("home.chimaSays")}</Text>
              <Text style={styles.bubbleMsg}>
                {isPerfect
                  ? tr("quiz.chimaPerfect")
                  : isGood
                  ? tr("quiz.chimaGood")
                  : tr("quiz.chimaBad")}
              </Text>
            </View>
          </View>

          <View style={styles.scoreActions}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Text style={styles.homeBtnText}>{tr("quiz.goHome")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.nextLessonBtn}
              onPress={() => router.replace("/(tabs)/learn")}
              activeOpacity={0.8}
            >
              <Text style={styles.nextLessonBtnText}>{tr("quiz.nextLesson")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{tr("quiz.notAvailable")}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: COLORS.primary, marginTop: 12 }}>{tr("quiz.back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((currentQ) / quiz.questions.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{currentQ + 1}/{quiz.questions.length}</Text>
        </View>
        <View style={styles.heartContainer}>
          <Text style={styles.heartText}>{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</Text>
        </View>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {quiz.questions.map((_: any, i: number) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentQ && styles.dotDone,
              i === currentQ && styles.dotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>{tr("quiz.question")} {currentQ + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Chima hint */}
        {answerState === "idle" && (
          <View style={styles.hintRow}>
            <Text style={{ fontSize: 28 }}>🎺</Text>
            <Text style={styles.hintText}>{tr("quiz.chooseAnswer")}</Text>
          </View>
        )}

        {/* Options */}
        <Animated.View style={[styles.optionsContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {question.options.map((option: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={getOptionStyle(idx)}
              onPress={() => handleAnswer(idx)}
              activeOpacity={0.8}
              disabled={answerState !== "idle"}
            >
              <View style={styles.optionLetter}>
                <Text style={styles.optionLetterText}>
                  {answerState !== "idle" && idx === question.correctIndex
                    ? "✓"
                    : answerState !== "idle" && idx === selectedIdx && answerState === "wrong"
                    ? "✗"
                    : String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={getOptionTextStyle(idx)}>{option}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Explanation */}
        {showExplanation && (
          <View style={[styles.explanationCard, answerState === "correct" ? styles.explanationCorrect : styles.explanationWrong]}>
            <Text style={styles.explanationTitle}>
              {answerState === "correct" ? tr("quiz.correct") : tr("quiz.incorrect")}
            </Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Next button */}
      {answerState !== "idle" && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {currentQ + 1 < quiz.questions.length ? tr("quiz.next") : tr("quiz.seeResults")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
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
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 99 },
  progressLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  heartContainer: {},
  heartText: { fontSize: 12 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dot: {
    height: 6,
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  dotDone: { backgroundColor: COLORS.success },
  dotCurrent: { backgroundColor: COLORS.primary },
  quizContent: { paddingHorizontal: 20 },
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  questionText: { color: COLORS.text, fontSize: 20, fontWeight: "700", lineHeight: 28 },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  hintText: { color: COLORS.textSecondary, fontSize: 14 },
  optionsContainer: { gap: 12, marginBottom: 20 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionCorrect: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "15",
  },
  optionWrong: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "15",
  },
  optionDimmed: { opacity: 0.4 },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionLetterText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "700" },
  optionText: { color: COLORS.text, fontSize: 15, flex: 1, lineHeight: 22 },
  optionTextCorrect: { color: COLORS.success, fontWeight: "700" },
  optionTextWrong: { color: COLORS.error, fontWeight: "700" },
  optionTextDimmed: { color: COLORS.textMuted },
  explanationCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  explanationCorrect: {
    backgroundColor: COLORS.success + "15",
    borderColor: COLORS.success + "50",
  },
  explanationWrong: {
    backgroundColor: COLORS.error + "15",
    borderColor: COLORS.error + "50",
  },
  explanationTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  explanationText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextBtn: {
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
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  // Score screen
  scoreContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
  },
  scoreEmoji: { fontSize: 80, marginBottom: 16 },
  scoreTitle: { color: COLORS.text, fontSize: 32, fontWeight: "800", marginBottom: 24 },
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scorePercent: { color: COLORS.primary, fontSize: 64, fontWeight: "800" },
  scoreSubtitle: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
  nftBadge: {
    backgroundColor: COLORS.accent + "15",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + "40",
    gap: 8,
  },
  nftTitle: { color: COLORS.accent, fontSize: 18, fontWeight: "800" },
  nftSub: { color: COLORS.textSecondary, fontSize: 13 },
  rewardCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rewardItem: { flex: 1, alignItems: "center", gap: 4 },
  rewardEmoji: { fontSize: 28 },
  rewardLabel: { color: COLORS.textSecondary, fontSize: 12 },
  rewardValue: { fontSize: 22, fontWeight: "800" },
  rewardDivider: { width: 1, backgroundColor: COLORS.border },
  chimaBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
    width: "100%",
  },
  bubbleBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  bubbleName: { color: COLORS.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  bubbleMsg: { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  scoreActions: { width: "100%", gap: 12 },
  homeBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  homeBtnText: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  nextLessonBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nextLessonBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
