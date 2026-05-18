/**
 * Admin Settings screen. Placeholder.
 */
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminSettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Settings</Text>
        <Text className="text-muted-foreground">
          TODO: port app/admin/settings/page.tsx.
        </Text>
      </View>
    </SafeAreaView>
  );
}
