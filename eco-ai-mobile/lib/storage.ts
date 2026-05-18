/**
 * Storage helpers — replacement for the web `localStorage` calls in the
 * original project.
 *
 * The web app stored both the JWT and the user object in `localStorage`.
 * On native we split that:
 *   - access_token  → expo-secure-store (encrypted on iOS Keychain / Android Keystore)
 *   - user profile  → AsyncStorage (plain JSON, fine to be unencrypted)
 *
 * Keep this module the single source of truth for token storage. Anywhere
 * the old code called `localStorage.getItem("access_token")` should call
 * `tokenStorage.get()` instead.
 */
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/types";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export const userStorage = {
  async get(): Promise<User | null> {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  async set(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },
};
