/**
 * Admin Users screen. Placeholder for app/admin/users/page.tsx port.
 * Data: api.admin.getUsers(), api.admin.updateUserRole(...), etc.
 */
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminUsersScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Users</Text>
        <Text className="text-muted-foreground">
          TODO: list, create, edit, deactivate users.
        </Text>
      </View>
    </SafeAreaView>
  );
}
