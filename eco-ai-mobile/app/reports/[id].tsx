/**
 * Report detail. Equivalent of app/reports/[id]/page.tsx on web.
 *
 * Expo Router dynamic params live in the filename — `[id].tsx` — and
 * are read via `useLocalSearchParams()`. The route is `/reports/123`.
 */
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          Report #{id}
        </Text>
        <Text className="text-muted-foreground">
          TODO: fetch with `api.reports.getById(Number(id))` and render
          detail UI from app/reports/[id]/page.tsx.
        </Text>
      </View>
    </SafeAreaView>
  );
}
