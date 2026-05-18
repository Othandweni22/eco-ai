/**
 * Expo SDK 54 + Reanimated 4 + NativeWind v4 babel config.
 *
 * IMPORTANT: Do NOT add `react-native-reanimated/plugin` or
 * `react-native-worklets/plugin` manually here. As of SDK 54 / Reanimated 4,
 * `babel-preset-expo` includes the worklets plugin internally. Adding it
 * again causes a "Duplicate plugin/preset detected" error.
 *
 * `nativewind/babel` adds the className → style transform.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
