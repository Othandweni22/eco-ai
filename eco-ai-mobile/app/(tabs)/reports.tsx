/**
 * Reports list tab. Placeholder.
 *
 * When porting: use FlatList (not .map over an array) for performance.
 * Data source is the same: `api.reports.getAll(...)` returns Report[].
 */
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";

export default function ReportsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4 gap-4">
        <Text className="text-2xl font-bold text-foreground">Reports</Text>
        <Text className="text-muted-foreground">
          TODO: port the list, filters, and detail navigation from
          app/reports/page.tsx.
        </Text>
        <Link href="/reports/new" asChild>
          <Button>New report</Button>
        </Link>
      </View>
    </SafeAreaView>
  );
}
