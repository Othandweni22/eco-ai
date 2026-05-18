# Illegal Dumping System — Mobile (Expo)

React Native port of the original Next.js frontend. This is a **skeleton**:
routing, theme tokens, auth, and the API client are ready. The screens
themselves are stubs you'll port from the web app.

## What's in the box

```
eco-ai-mobile/
├── app/                          Expo Router file-based routes
│   ├── _layout.tsx               Root: providers + auth-driven redirect
│   ├── index.tsx                 Redirect to /(tabs)/dashboard
│   ├── (auth)/                   Unauthenticated group
│   │   ├── _layout.tsx
│   │   ├── login.tsx             Functional — talks to api.auth.login
│   │   └── register.tsx          Placeholder
│   ├── (tabs)/                   Authenticated tab shell
│   │   ├── _layout.tsx           Bottom tabs, role-gated `Cases`
│   │   ├── dashboard.tsx         Placeholder
│   │   ├── reports.tsx           Placeholder
│   │   ├── map.tsx               Placeholder (see Maps section)
│   │   ├── cases.tsx             Placeholder
│   │   └── profile.tsx           Functional — shows user, admin links, sign out
│   ├── reports/
│   │   ├── [id].tsx              Dynamic detail route
│   │   └── new.tsx               Placeholder (see capture notes inline)
│   └── admin/
│       ├── _layout.tsx           Stack + admin role gate
│       ├── users.tsx
│       ├── analytics.tsx
│       └── settings.tsx
├── components/ui/                NativeWind primitives
│   ├── button.tsx                CVA variants — matches shadcn API
│   ├── card.tsx                  Card / Header / Title / Content / Footer
│   └── input.tsx                 Wrapped TextInput
├── contexts/auth-context.tsx     Drop-in port
├── hooks/use-auth.ts             Ported — async storage hydration
├── lib/
│   ├── api.ts                    Same public shape as the web client
│   ├── storage.ts                expo-secure-store + AsyncStorage helpers
│   └── utils.ts                  cn() — unchanged
├── types/index.ts                Direct port
├── global.css                    Theme tokens (HSL approximations of oklch)
├── tailwind.config.js            NativeWind preset + your color tokens
├── babel.config.js               nativewind + reanimated
├── metro.config.js               withNativeWind wrapping
├── app.json                      Expo config (permissions, plugins)
├── eas.json                      Build profiles: development/preview/production
└── tsconfig.json                 "@/*" path alias preserved
```

## Versions used

- **Expo SDK 54** (React Native 0.81, React 19.1)
- **NativeWind 4.2** + **Tailwind CSS 3.4** (NOT Tailwind 4 — that's for the unreleased NativeWind v5)
- **Reanimated 4** with **react-native-worklets** (peer dep, included)
- New Architecture is **enabled** in `app.json` (`newArchEnabled: true`)

A few compatibility gotchas that bit lots of people on this combo and are
already handled in this skeleton:

1. **Don't add `react-native-reanimated/plugin` to `babel.config.js`.**
   Reanimated 4 ships the worklets plugin internally inside
   `babel-preset-expo`. Adding it again throws "Duplicate plugin/preset
   detected". The babel config here is already minimal — leave it alone.
2. **Don't upgrade Tailwind to v4.** NativeWind 4.x requires Tailwind 3.4.x.
3. **Don't pin `lightningcss`** unless you hit deserialization errors — and if
   you do, pin it to a specific version in `package.json` per the NativeWind docs.

## Setup

```bash
# 1. Install
npm install
# or, if you prefer: pnpm install / yarn / bun install

# 2. Configure your API URL
cp .env.example .env
# edit .env → EXPO_PUBLIC_API_URL=https://your-api.example.com/api/v1

# 3. Drop in real icons (the build will fail without these)
# Required files (sizes are recommendations — Expo will resize):
#   assets/images/icon.png            1024x1024
#   assets/images/adaptive-icon.png   1024x1024 (Android adaptive foreground)
#   assets/images/splash.png          ~1284x2778
#   assets/images/favicon.png         48x48

# 4. Run on a simulator / device
npx expo start
# press i (iOS sim), a (Android), or scan QR with Expo Go
```

> **Note on Expo Go vs dev clients**: this project uses `expo-secure-store`
> and (when you add it) `react-native-maps`, both of which need native code.
> They work in **Expo Go** for development, but if you add a library Expo Go
> doesn't bundle (e.g. Mapbox), switch to a custom dev client built via EAS
> (`npm run build:dev`).

## Porting your web screens — quick mapping

| Web (Next.js) | Mobile (this project) |
|---|---|
| `app/page.tsx`, `app/layout.tsx` | `app/_layout.tsx` + `app/index.tsx` |
| `app/login/page.tsx` | `app/(auth)/login.tsx` |
| `app/register/page.tsx` | `app/(auth)/register.tsx` |
| `app/dashboard/page.tsx` | `app/(tabs)/dashboard.tsx` |
| `app/reports/page.tsx` | `app/(tabs)/reports.tsx` |
| `app/reports/[id]/page.tsx` | `app/reports/[id].tsx` |
| `app/reports/new/page.tsx` | `app/reports/new.tsx` |
| `app/cases/page.tsx` | `app/(tabs)/cases.tsx` |
| `app/map/page.tsx` | `app/(tabs)/map.tsx` |
| `app/profile/page.tsx` | `app/(tabs)/profile.tsx` |
| `app/admin/users/page.tsx` | `app/admin/users.tsx` |
| `app/admin/analytics/page.tsx` | `app/admin/analytics.tsx` |
| `app/admin/settings/page.tsx` | `app/admin/settings.tsx` |

| Web idiom | Native equivalent |
|---|---|
| `<div>` / `<span>` | `<View>` / `<Text>` |
| `<button onClick={...}>` | `<Pressable onPress={...}>` (or our `<Button>`) |
| `<input>` | `<TextInput>` (or our `<Input>`) |
| `<a href>` / `<Link>` (next) | `<Link href>` from `expo-router` |
| `useRouter()` (next) | `useRouter()` from `expo-router` |
| `usePathname()` (next) | `useSegments()` / `usePathname()` from `expo-router` |
| `localStorage.*` | `tokenStorage` / `userStorage` in `lib/storage.ts` |
| `<img src>` / `next/image` | `<Image>` from `expo-image` |
| `.map(x => ...)` over a list | `FlatList` (for perf) |
| CSS `position: fixed` | use `react-native-safe-area-context` + absolute positioning |

## Things you'll need to swap library-by-library

These are the unavoidable rewrites — RN doesn't run web code for any of them:

- **Radix UI components (your `components/ui/*`)** — replace with
  [`react-native-reusables`](https://rnr-docs.vercel.app/), which is the RN
  port of shadcn/ui. Same component names, similar API. Alternatively, hand-roll
  using Pressable + animations.
- **Leaflet + leaflet.heat + leaflet.markercluster** — use
  [`react-native-maps`](https://github.com/react-native-maps/react-native-maps)
  for markers, [`react-native-maps-heatmap`](https://www.npmjs.com/package/react-native-maps-heatmap)
  for heat, and supercluster for clustering. For richer heatmap and vector tiles,
  switch to [`@rnmapbox/maps`](https://github.com/rnmapbox/maps).
- **Recharts** — [`victory-native`](https://commerce.nearform.com/open-source/victory-native/)
  (closest API) or [`react-native-gifted-charts`](https://gifted-charts.web.app/).
- **react-hook-form** — works as-is on RN; integrates with `<Controller>` to wrap
  `<TextInput>`.
- **Sonner toasts** — swap for [`burnt`](https://github.com/nandorojo/burnt) (native
  toasts/alerts) or [`react-native-toast-message`](https://github.com/calintamas/react-native-toast-message).
- **SWR** — works on RN. Or switch to TanStack Query, which has slightly better
  RN ergonomics (focus-based refetching aware of `AppState`).
- **`exifr`** — works in JS, but `expo-image-picker` returns EXIF directly when
  you pass `{ exif: true }`. Use that.
- **`<input type="file">`** — `expo-image-picker` (`launchCameraAsync` /
  `launchImageLibraryAsync`).
- **`navigator.geolocation`** — `expo-location` (`getCurrentPositionAsync`).
- **`useWebSocket` hook** — native `WebSocket` works on RN; the hook should
  mostly port directly. Watch out for `AppState` — backgrounded apps may close
  sockets and you'll want to reconnect on foreground.
- **`next/image`** — `expo-image` (`<Image source={{ uri }} contentFit="cover"/>`).
- **`next-themes` (dark mode)** — use `useColorScheme()` from `react-native` plus
  the `dark:` NativeWind variant (already configured here).
- **Fonts (`next/font/google`)** — `expo-font` + `useFonts()`. Download the TTFs
  into `assets/fonts/` and register them in the root layout.

## Packaging with Expo / EAS — the full path

EAS Build is the recommended way to ship Expo apps. It builds your iOS and
Android binaries in the cloud so you don't need a Mac for iOS or wrestle
with local Android SDK installs.

### One-time setup

```bash
# 1. Install the EAS CLI (globally or via npx)
npm install -g eas-cli

# 2. Log in (free Expo account)
eas login

# 3. Link this project to an EAS project. This writes the projectId into app.json.
eas init
# When prompted, this replaces "REPLACE_WITH_EAS_PROJECT_ID" in app.json.
```

### Pick your build flow

There are three common flows. Pick based on what you need:

**A. "I just want to test on my own phone right now."**
```bash
# Run the dev server and scan the QR with Expo Go on your phone.
npx expo start
```
Works for most things in this skeleton. Stops working once you add a library
that needs custom native code (Mapbox, in-app purchases, etc.). At that point
move to flow B.

**B. "I want a build I can install on my device (or share with a tester)."**
```bash
# First build: this provisions credentials interactively.
npm run build:dev          # development client, internal distribution
# or:
npm run build:preview      # production-like, no dev tools, internal distribution
```
After the build finishes, EAS shows a URL with installable artifacts (an
`.apk` for Android, a TestFlight-ready `.ipa` for iOS, or both). Scan the QR
in the EAS dashboard or send the URL to a tester.

**C. "I want to publish to the App Store / Play Store."**
```bash
# Build the production binaries
npm run build:production

# Submit them
eas submit -p ios --latest
eas submit -p android --latest
```
For this you'll need:

- **iOS**: an Apple Developer Program membership ($99/year), an App Store
  Connect record for the app (bundle id = `ios.bundleIdentifier` in `app.json`),
  and the values in `eas.json` → `submit.production.ios` filled in.
- **Android**: a Google Play Developer account ($25 one-time), a Play Console
  app record (package = `android.package` in `app.json`), and a service account
  JSON saved as `play-store-credentials.json` in the project root (this is
  gitignored).

### Updating the app

Two kinds of updates exist:

1. **JS-only changes (most of your day-to-day work)** — push an Expo Update.
   Users get the new JS bundle on next app launch, no store review.
   ```bash
   npx expo install expo-updates       # if not already added
   eas update --branch production --message "Fix dashboard layout"
   ```
   Requires `expo-updates` configured. Not in the default install for this
   skeleton — add when you're ready to ship.

2. **Native changes (added a new native module, changed permissions, changed
   `app.json` plugins, bumped the SDK)** — you must rebuild and resubmit:
   ```bash
   npm run build:production
   eas submit -p ios --latest && eas submit -p android --latest
   ```

### Before your first production build

Tidy up these placeholders in `app.json`:

- `expo.name` — user-visible name on the home screen
- `expo.ios.bundleIdentifier` — `com.yourcompany.ecoaimobile`
- `expo.android.package` — same convention; must be unique on the Play Store
- `expo.icon`, `expo.android.adaptiveIcon`, `expo.splash` — drop in real assets
- `expo.extra.eas.projectId` — written by `eas init`

And in `eas.json`:

- Replace API URLs in `build.preview.env` and `build.production.env`
- Fill in Apple / Play credentials in `submit.production`

## Build sanity check

Before your first build, validate everything compiles:
```bash
npm install
npx expo-doctor              # checks SDK version, plugin compatibility
npx tsc --noEmit             # type-checks without emitting JS
```

## What I deliberately didn't do

Honesty section, so you know what to expect:

- **No screen content was ported.** The skeleton's tab/screen files are stubs
  with TODO comments. Doing the screens properly is your next several days of
  work — each one needs library swaps (charts, maps, forms, lists, modals).
- **shadcn/ui — only 3 primitives are scaffolded** (Button, Input, Card).
  The other 54 components in `components/ui/` need to be either installed from
  `react-native-reusables` or hand-built. Most aren't needed on every screen,
  so add as you go.
- **Theme colors are HSL approximations of your `oklch()` originals.** They'll
  look very close but not pixel-identical. Tune in `global.css` if it matters.
- **No web target.** This is mobile-first. Expo Router does support web, and
  the config here allows it, but the dependency picks (react-native-maps,
  expo-secure-store, etc.) won't all work on the web target without shims.
  If you want web parity, keep the Next.js app for web and use this only for
  iOS/Android.

Happy porting.
