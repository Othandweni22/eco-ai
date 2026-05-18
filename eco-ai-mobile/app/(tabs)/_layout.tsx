/**
 * Authenticated tab bar. Equivalent of the web Sidebar nav.
 *
 * Tabs shown:
 *   - Dashboard  (always)
 *   - Reports    (always)
 *   - Map        (always)
 *   - Cases      (officers and admins only)
 *   - Profile    (always)
 *
 * Admin sub-section (Users, Analytics, Settings) lives under app/admin/
 * and is reached from within the Profile or Dashboard screens via Link,
 * not as a top-level tab — same pattern as your web sidebar's nested admin items.
 */
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  FileText,
  Map as MapIcon,
  Briefcase,
  User as UserIcon,
} from "lucide-react-native";
import { useAuthContext } from "@/contexts/auth-context";

export default function TabsLayout() {
  const { isOfficerOrAdmin } = useAuthContext();
  const canSeeCases = isOfficerOrAdmin();

  return (
    <Tabs
      screenOptions={{
        // Wire tab colors to the theme tokens.
        // NOTE: Tabs accept hex/rgb but not Tailwind class names, so we hard-code
        // here. If you change the primary color in global.css, update this too,
        // or read it from a theme hook.
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: "Cases",
          // Hide this tab from citizens. `href: null` is Expo Router's
          // idiomatic "don't render this in the tab bar".
          href: canSeeCases ? "/(tabs)/cases" : null,
          tabBarIcon: ({ color, size }) => (
            <Briefcase color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
