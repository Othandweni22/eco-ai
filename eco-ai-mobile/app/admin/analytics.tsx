/**
 * Admin Analytics screen. Placeholder.
 * Data: api.analytics.get(), api.analytics.getDetailed(days).
 * Charts: install `victory-native` to replace Recharts.
 */
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminAnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Analytics</Text>
        <Text className="text-muted-foreground">
          TODO: port app/admin/analytics/page.tsx. Recharts → victory-native.
        </Text>
      </View>
    </SafeAreaView>
  );
}
