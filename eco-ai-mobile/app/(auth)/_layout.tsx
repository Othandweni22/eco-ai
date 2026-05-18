// Layout for unauthenticated screens (login, register).
// Plain stack, no header — each screen designs its own.
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
