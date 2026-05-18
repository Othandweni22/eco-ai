/**
 * Map screen — the trickiest single port in this app.
 *
 * Leaflet (web) → does NOT run on React Native. Pick one:
 *   - react-native-maps (recommended for app stores; uses Google Maps on
 *     Android and Apple Maps on iOS). Heatmap support is community-maintained
 *     and limited.
 *   - @rnmapbox/maps (best for heatmaps + clustering; requires a Mapbox
 *     account and a paid plan past free tier).
 *
 * Until you wire one up, this screen is a placeholder. Your heatmap data
 * source is unchanged: `api.analytics.getHeatmap()` → HeatmapPoint[].
 */
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">Map</Text>
        <Text className="text-muted-foreground text-center">
          Install `react-native-maps` (or `@rnmapbox/maps`) and render
          markers + heatmap from `api.analytics.getHeatmap()`.
        </Text>
      </View>
    </SafeAreaView>
  );
}
