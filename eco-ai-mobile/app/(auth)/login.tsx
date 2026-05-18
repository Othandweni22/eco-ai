/**
 * Login screen — equivalent of the web app/login/page.tsx.
 *
 * This is a FUNCTIONAL skeleton: enter email + password, hit the API,
 * the root layout redirects on success. The visual treatment is bare —
 * port your richer Login UI on top of this once it works end-to-end.
 */
import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/contexts/auth-context";

export default function LoginScreen() {
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Root layout effect will redirect to (tabs).
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-foreground">
            Welcome back
          </Text>
          <Text className="mb-8 text-muted-foreground">
            Sign in to continue reporting incidents.
          </Text>

          <View className="gap-3">
            <Input
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button onPress={onSubmit} loading={submitting} className="mt-2">
              Sign in
            </Button>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-muted-foreground">No account? </Text>
            <Link href="/(auth)/register">
              <Text className="text-primary font-medium">Register</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
