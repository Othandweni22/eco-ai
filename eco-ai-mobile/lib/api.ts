/**
 * API client — same public shape as the original `lib/api.ts` so that
 * screen code calling `api.auth.login(...)`, `api.reports.getAll()`, etc.
 * can be ported across without touching call sites.
 *
 * Differences from the web version:
 *   - Token is read from expo-secure-store (async) instead of localStorage (sync).
 *   - On 401 we don't `window.location.href = "/login"`. Instead we clear
 *     storage and the auth hook will react and the root router will redirect.
 *   - Uploads use the RN-style `{ uri, name, type }` object instead of File.
 */
import Constants from "expo-constants";
import type {
  User,
  Report,
  Case,
  AnalyticsData,
  HeatmapPoint,
  UserRole,
  AuthResponse,
} from "@/types";
import { tokenStorage, userStorage } from "@/lib/storage";

// Configure your API base URL through app.json `extra` OR an env var.
// EXPO_PUBLIC_* vars are inlined at build time.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as any)?.apiUrl ??
  "http://localhost:8000/api/v1";

class ApiClient {
  constructor(private baseUrl: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await tokenStorage.get();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear local session. The auth hook polls/reacts to this on next read.
      await tokenStorage.clear();
      await userStorage.clear();
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "An error occurred" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    // 204 No Content guard
    if (response.status === 204) return undefined as T;
    return response.json();
  }

  auth = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      // FastAPI's OAuth2 password flow expects form-encoded body.
      const formData = new FormData();
      // @ts-expect-error RN FormData typing
      formData.append("username", email);
      // @ts-expect-error RN FormData typing
      formData.append("password", password);

      const response = await this.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: formData as any,
      });
      await tokenStorage.set(response.access_token);
      if (response.user) await userStorage.set(response.user);
      return response;
    },

    register: async (data: {
      email: string;
      password: string;
      full_name?: string;
      role: UserRole;
    }): Promise<AuthResponse> => {
      return this.request<AuthResponse>("/auth/register/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getCurrentUser: async (): Promise<User> => this.request<User>("/auth/me"),

    logout: async (): Promise<void> => {
      await tokenStorage.clear();
      await userStorage.clear();
    },
  };

  reports = {
    create: async (formData: FormData): Promise<Report> =>
      this.request<Report>("/reports", { method: "POST", body: formData as any }),

    getAll: async (params?: {
      skip?: number;
      limit?: number;
      status?: string;
    }): Promise<Report[]> => {
      const search = new URLSearchParams();
      if (params?.skip) search.set("skip", String(params.skip));
      if (params?.limit) search.set("limit", String(params.limit));
      if (params?.status) search.set("status", params.status);
      const q = search.toString();
      return this.request<Report[]>(`/reports${q ? `?${q}` : ""}`);
    },

    getById: async (id: number): Promise<Report> =>
      this.request<Report>(`/reports/${id}`),

    getNearby: async (lat: number, lng: number, radius = 5): Promise<Report[]> =>
      this.request<Report[]>(
        `/reports/nearby?latitude=${lat}&longitude=${lng}&radius_km=${radius}`,
      ),

    delete: async (id: number): Promise<void> =>
      this.request<void>(`/admin/reports/${id}`, { method: "DELETE" }),
  };

  cases = {
    getAll: async (params?: {
      skip?: number;
      limit?: number;
      status?: string;
      priority_level?: string;
      assigned_officer_id?: number;
    }): Promise<Case[]> => {
      const search = new URLSearchParams();
      if (params?.skip) search.set("skip", String(params.skip));
      if (params?.limit) search.set("limit", String(params.limit));
      if (params?.status) search.set("status", params.status);
      if (params?.priority_level)
        search.set("priority_level", params.priority_level);
      if (params?.assigned_officer_id)
        search.set("assigned_officer_id", String(params.assigned_officer_id));
      const q = search.toString();
      return this.request<Case[]>(`/admin/cases${q ? `?${q}` : ""}`);
    },

    getById: async (id: number): Promise<Case> =>
      this.request<Case>(`/admin/cases/${id}`),

    update: async (id: number, data: Partial<Case>): Promise<Case> =>
      this.request<Case>(`/admin/cases/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    getUnprocessedReports: async (): Promise<Report[]> =>
      this.request<Report[]>("/admin/reports/unprocessed"),
  };

  analytics = {
    get: async (): Promise<AnalyticsData> =>
      this.request<AnalyticsData>("/admin/analytics"),

    getDetailed: async (days = 30) =>
      this.request<any>(`/admin/analytics/detailed?days=${days}`),

    getHeatmap: async (): Promise<HeatmapPoint[]> =>
      this.request<HeatmapPoint[]>("/admin/heatmap"),

    getAreaStats: async (lat: number, lng: number, radius = 5) =>
      this.request<{ report_count: number; recent_reports: number }>(
        `/public/stats/area?latitude=${lat}&longitude=${lng}&radius_km=${radius}`,
      ),
  };

  admin = {
    getUsers: async (): Promise<User[]> => this.request<User[]>("/admin/users"),
    getOfficers: async (): Promise<User[]> =>
      this.request<User[]>("/admin/users?role=officer"),
    createUser: async (data: {
      email: string;
      full_name: string;
      role: UserRole;
      password: string;
    }): Promise<User> =>
      this.request<User>("/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateUserRole: async (userId: number, role: UserRole): Promise<User> =>
      this.request<User>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    updateUser: async (userId: number, data: Partial<User>): Promise<User> =>
      this.request<User>(`/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteUser: async (userId: number): Promise<void> =>
      this.request<void>(`/admin/users/${userId}`, { method: "DELETE" }),
    toggleUserActive: async (
      userId: number,
      isActive: boolean,
    ): Promise<User> =>
      this.request<User>(`/admin/users/${userId}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      }),
    getModelInfo: async () => this.request<any>("/ai/model/info"),
  };

  users = {
    getAll: async (): Promise<User[]> => this.admin.getUsers(),
    getOfficers: async (): Promise<User[]> => this.admin.getOfficers(),
  };
}

export const api = new ApiClient(API_BASE_URL);
