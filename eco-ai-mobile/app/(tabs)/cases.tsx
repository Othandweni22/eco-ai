/**
 * Cases tab (officer/admin only — gated in _layout.tsx).
 * Placeholder for porting app/cases/page.tsx.
 */
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CasesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Cases</Text>
        <Text className="text-muted-foreground">
          TODO: port app/cases/page.tsx. Data: `api.cases.getAll(...)`.
        </Text>
      </View>
    </SafeAreaView>
  );
}
