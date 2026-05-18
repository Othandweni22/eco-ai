/**
 * Root layout. Equivalent of the original app/layout.tsx + a routing guard.
 *
 * Responsibilities:
 *   - Mount AuthProvider (so any screen can call useAuthContext()).
 *   - While auth is hydrating from storage, show a splash/loading view.
 *   - Once hydrated, redirect:
 *       • signed out → (auth) group
 *       • signed in  → (tabs) group
 *
 * Why we do auth-driven redirection here, in the ROOT _layout, instead of
 * each screen: it's the Expo Router idiom and avoids login-screen flicker.
 */
import "@/global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuthContext } from "@/contexts/auth-context";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reports/[id]" options={{ headerShown: true, title: "Report" }} />
      <Stack.Screen name="reports/new" options={{ headerShown: true, title: "New Report" }} />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
