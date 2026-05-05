import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { View, ActivityIndicator, Text, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";
import { useProgressStore } from "../src/store/progressStore";
import { useLanguageStore } from "../src/store/languageStore";
import { COLORS } from "../src/constants/colors";
import PostHog from 'posthog-react-native'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const authHydrated = useAuthStore((s) => s.isHydrated);
  const progressHydrated = useProgressStore((s) => s.isHydrated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateProgress = useProgressStore((s) => s.hydrate);
  const hydrateLang = useLanguageStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAuth();
    hydrateProgress();
    hydrateLang();
    // Initialize PostHog
    PostHog.configure({
      apiKey: 'your-project-api-key',
      host: 'your-posthog-host'
    });
  }, []);

  if (!fontsLoaded || !authHydrated || !progressHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Image source={require("../assets/logo.png")} style={{ width: 80, height: 80 }} resizeMode="contain" />
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>Loading Tonalli...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="lesson/[id]" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen name="quiz/[id]" options={{ headerShown: false, presentation: "fullScreenModal" }} />
          <Stack.Screen name="certificate/[id]" options={{ headerShown: false, presentation: "modal" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
