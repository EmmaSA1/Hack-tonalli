import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS } from "../../src/constants/colors";
import { useLanguageStore } from "../../src/store/languageStore";
import { LANG_LABELS, Lang } from "../../src/i18n/translations";

export default function LoginScreen() {
  const [email, setEmail] = useState("demo@tonalli.xyz");
  const [password, setPassword] = useState("demo1234");
  const { login, isLoading } = useAuthStore();
  const { tr, lang, setLang } = useLanguageStore();
  const [showLangModal, setShowLangModal] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", tr("auth.emailPasswordRequired"));
      return;
    }
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", tr("auth.invalidCredentials"));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌅</Text>
          <Text style={styles.brand}>Tonalli</Text>
          <Text style={styles.tagline}>{tr("auth.tagline")}</Text>
        </View>

        {/* Character greeting */}
        <View style={styles.charContainer}>
          <Text style={styles.charEmoji}>🎺</Text>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {tr("auth.welcomeBack")}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>{tr("auth.login")}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tr("auth.email")}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
              placeholder="tu@email.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tr("auth.password")}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
              placeholder="••••••••"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>{tr("auth.enter")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.demoBtnText}>{tr("auth.tryDemo")}</Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{tr("auth.newToTonalli")}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.registerLink}>{tr("auth.createAccount")}</Text>
          </TouchableOpacity>
        </View>

        {/* Language selector */}
        <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangModal(true)} activeOpacity={0.7}>
          <Text style={styles.langBtnText}>
            {lang === "es" ? "🇲🇽" : lang === "en" ? "🇺🇸" : "🌽"} {LANG_LABELS[lang]}
          </Text>
        </TouchableOpacity>

        {/* Blockchain badge */}
        <View style={styles.stellarBadge}>
          <Text style={styles.stellarText}>{tr("profile.poweredBy")}</Text>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tr("language.title")}</Text>
            {(["es", "en", "nah"] as Lang[]).map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.langOption, lang === l && styles.langOptionActive]}
                onPress={() => { setLang(l); setShowLangModal(false); }}
                activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>
                  {l === "es" ? "🇲🇽" : l === "en" ? "🇺🇸" : "🌽"}
                </Text>
                <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                  {LANG_LABELS[l]}
                </Text>
                {lang === l && (
                  <View style={styles.langCurrentBadge}>
                    <Text style={styles.langCurrentText}>{tr("language.current")}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 64 },
  brand: {
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -1,
    marginTop: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  charContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
    gap: 12,
  },
  charEmoji: { fontSize: 48, marginTop: 4 },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  bubbleText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  form: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  demoBtn: { alignItems: "center", marginTop: 12 },
  demoBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  stellarBadge: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stellarText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  langBtn: {
    alignSelf: "center",
    backgroundColor: COLORS.card,
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 14,
  },
  langOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  langFlag: { fontSize: 28 },
  langText: { color: COLORS.text, fontSize: 16, fontWeight: "600", flex: 1 },
  langTextActive: { color: COLORS.primary, fontWeight: "800" },
  langCurrentBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langCurrentText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
