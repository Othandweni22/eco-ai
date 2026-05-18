/**
 * Profile tab. Acts as the entry point for the Admin section (gated by role).
 * Port app/profile/page.tsx content into the upper section.
 */
import { View, Text, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/auth-context";

export default function ProfileScreen() {
  const { user, logout, isAdmin } = useAuthContext();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{user?.full_name ?? "Anonymous"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-muted-foreground">{user?.email}</Text>
            <Text className="text-muted-foreground mt-1 capitalize">
              Role: {user?.role}
            </Text>
          </CardContent>
        </Card>

        {isAdmin() && (
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="gap-2">
                <Link href="/admin/users" className="text-primary">
                  <Text className="text-primary">→ Manage users</Text>
                </Link>
                <Link href="/admin/analytics" className="text-primary">
                  <Text className="text-primary">→ Analytics</Text>
                </Link>
                <Link href="/admin/settings" className="text-primary">
                  <Text className="text-primary">→ Settings</Text>
                </Link>
              </View>
            </CardContent>
          </Card>
        )}

        <Button variant="destructive" onPress={() => logout()}>
          Sign out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
