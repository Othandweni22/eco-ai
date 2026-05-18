/**
 * Root index. The actual redirect logic lives in _layout.tsx; this file
 * just gives Expo Router a screen to mount initially. It will be replaced
 * by the layout's redirect within a tick.
 */
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/dashboard" />;
}
