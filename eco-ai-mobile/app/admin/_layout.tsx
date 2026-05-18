/**
 * Admin section layout. Renders as a stack so each screen gets a back button.
 * Access control: this is gated visually in Profile (entry hidden for non-admins),
 * but the route is reachable directly via deep link. For real safety, add an
 * admin check here that redirects non-admins to /(tabs)/dashboard.
 */
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuthContext } from "@/contexts/auth-context";

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isLoading, isAdmin, router]);

  return (
    <Stack>
      <Stack.Screen name="users" options={{ title: "Users" }} />
      <Stack.Screen name="analytics" options={{ title: "Analytics" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}
