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
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS } from "../../src/constants/colors";
import { useLanguageStore } from "../../src/store/languageStore";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading } = useAuthStore();
  const { tr } = useLanguageStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", tr("auth.allFieldsRequired"));
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", tr("auth.passwordMin"));
      return;
    }
    try {
      await register(name, email, password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", tr("auth.registerFailed"));
    }
  };

  const perks = [
    tr("auth.perk1"),
    tr("auth.perk2"),
    tr("auth.perk3"),
    tr("auth.perk4"),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{tr("auth.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{tr("auth.createAccountTitle")}</Text>
          <Text style={styles.subtitle}>{tr("auth.joinThousands")}</Text>
        </View>

        {/* Xollo welcome */}
        <View style={styles.charContainer}>
          <Text style={styles.charEmoji}>🐕</Text>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {tr("auth.xolloWelcome")}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tr("auth.name")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={tr("auth.namePlaceholder")}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tr("auth.email")}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{tr("auth.password")}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={tr("auth.passwordPlaceholder")}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Perks */}
          <View style={styles.perks}>
            {perks.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>{tr("auth.startFree")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{tr("auth.haveAccount")}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>{tr("auth.loginLink")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 28 },
  backBtn: { marginBottom: 16 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  charContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 12,
  },
  charEmoji: { fontSize: 44 },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
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
  perks: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  perkRow: {},
  perkText: { color: COLORS.textSecondary, fontSize: 13 },
  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
});
