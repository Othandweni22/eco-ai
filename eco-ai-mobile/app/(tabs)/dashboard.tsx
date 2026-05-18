/**
 * Dashboard tab. Placeholder — port app/dashboard/page.tsx here.
 * Recharts → use `victory-native` (recommended) or `react-native-gifted-charts`.
 */
import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/auth-context";

export default function DashboardScreen() {
  const { user } = useAuthContext();
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4">
      <Text className="text-2xl font-bold text-foreground">
        Hello{user?.full_name ? `, ${user.full_name}` : ""}
      </Text>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to your dashboard</CardTitle>
          <CardDescription>
            Port the metrics, charts, and recent activity from app/dashboard/page.tsx here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-muted-foreground">
            Tip: charts → victory-native; lists → FlatList with the same data shape your
            web hooks return.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-2">
            <Link href="/reports/new" className="text-primary">
              <Text className="text-primary">→ File a new report</Text>
            </Link>
            <Link href="/(tabs)/reports" className="text-primary">
              <Text className="text-primary">→ View all reports</Text>
            </Link>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
