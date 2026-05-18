/**
 * Register screen placeholder — port your full app/register/page.tsx logic
 * here. The auth hook exposes `register({ email, password, full_name, role })`
 * matching the original API.
 */
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="mb-2 text-3xl font-bold text-foreground">
          Create account
        </Text>
        <Text className="mb-8 text-muted-foreground">
          TODO: port the registration form from the web app.
        </Text>

        <Link href="/(auth)/login" asChild>
          <Button variant="outline">Back to sign in</Button>
        </Link>
      </View>
    </SafeAreaView>
  );
}
