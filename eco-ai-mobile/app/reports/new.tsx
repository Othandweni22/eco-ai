/**
 * New report screen. Equivalent of app/reports/new/page.tsx.
 *
 * Web → native swap notes for this screen specifically:
 *   - <input type="file"> → `expo-image-picker` (already in package.json).
 *     Use `launchCameraAsync` or `launchImageLibraryAsync`.
 *   - `navigator.geolocation` → `expo-location`. Ask permission, then
 *     `getCurrentPositionAsync`.
 *   - EXIF parsing → `exifr` works in JS env, but image picker already
 *     returns `exif` when you pass `exif: true`. Prefer that.
 *   - Upload: build a FormData with
 *       formData.append("image", { uri, name, type } as any)
 *     and POST via `api.reports.create(formData)`.
 */
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewReportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          New report
        </Text>
        <Text className="text-muted-foreground">
          TODO: image-picker + location capture + description. See header comment.
        </Text>
      </View>
    </SafeAreaView>
  );
}
