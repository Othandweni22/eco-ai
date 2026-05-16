import type { User, Report, Case, AnalyticsData, HeatmapPoint, UserRole, AuthResponse } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token")
    }
    return null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = { ...options.headers }

    if (token) {
      ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }
    if (!(options.body instanceof FormData)) {
      ;(headers as Record<string, string>)["Content-Type"] = "application/json"
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers })

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
      throw new Error("Unauthorized")
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "An error occurred" }))
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  auth = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const formData = new FormData()
      formData.append("username", email)
      formData.append("password", password)
      const response = await this.request<AuthResponse>("/auth/login", { method: "POST", body: formData })
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", response.access_token)
        if (response.user) localStorage.setItem("user", JSON.stringify(response.user))
      }
      return response
    },
    register: async (userData: { email: string; password: string; full_name?: string; role: UserRole }): Promise<AuthResponse> => {
      return this.request<AuthResponse>("/auth/register/users", { method: "POST", body: JSON.stringify(userData) })
    },
    getCurrentUser: async (): Promise<User> => {
      return this.request<User>("/auth/me")
    },
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    },
  }

  reports = {
    create: async (formData: FormData): Promise<Report> => {
      return this.request<Report>("/reports", { method: "POST", body: formData })
    },
    getAll: async (params?: { skip?: number; limit?: number; status?: string }): Promise<Report[]> => {
      const searchParams = new URLSearchParams()
      if (params?.skip) searchParams.set("skip", params.skip.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      if (params?.status) searchParams.set("status", params.status)
      const query = searchParams.toString()
      return this.request<Report[]>(`/reports${query ? `?${query}` : ""}`)
    },
    getById: async (id: number): Promise<Report> => {
      return this.request<Report>(`/reports/${id}`)
    },
    getNearby: async (lat: number, lng: number, radius = 5): Promise<Report[]> => {
      return this.request<Report[]>(`/reports/nearby?latitude=${lat}&longitude=${lng}&radius_km=${radius}`)
    },
    delete: async (id: number): Promise<void> => {
      return this.request<void>(`/admin/reports/${id}`, { method: "DELETE" })
    },
  }

  cases = {
    getAll: async (params?: { skip?: number; limit?: number; status?: string; priority_level?: string; assigned_officer_id?: number }): Promise<Case[]> => {
      const searchParams = new URLSearchParams()
      if (params?.skip) searchParams.set("skip", params.skip.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      if (params?.status) searchParams.set("status", params.status)
      if (params?.priority_level) searchParams.set("priority_level", params.priority_level)
      if (params?.assigned_officer_id) searchParams.set("assigned_officer_id", params.assigned_officer_id.toString())
      const query = searchParams.toString()
      return this.request<Case[]>(`/admin/cases${query ? `?${query}` : ""}`)
    },
    getById: async (id: number): Promise<Case> => {
      return this.request<Case>(`/admin/cases/${id}`)
    },
    update: async (id: number, data: Partial<Case>): Promise<Case> => {
      return this.request<Case>(`/admin/cases/${id}`, { method: "PUT", body: JSON.stringify(data) })
    },
    getUnprocessedReports: async (): Promise<Report[]> => {
      return this.request<Report[]>("/admin/reports/unprocessed")
    },
  }

  analytics = {
    get: async (): Promise<AnalyticsData> => {
      return this.request<AnalyticsData>("/admin/analytics")
    },
    getDetailed: async (days = 30): Promise<any> => {
      return this.request<any>(`/admin/analytics/detailed?days=${days}`)
    },
    getHeatmap: async (): Promise<HeatmapPoint[]> => {
      return this.request<HeatmapPoint[]>("/admin/heatmap")
    },
    getAreaStats: async (lat: number, lng: number, radius = 5) => {
      return this.request<{ report_count: number; recent_reports: number }>(
        `/public/stats/area?latitude=${lat}&longitude=${lng}&radius_km=${radius}`
      )
    },
  }

  // Admin namespace — user management + AI model info
  admin = {
    getUsers: async (): Promise<User[]> => {
      return this.request<User[]>("/admin/users")
    },
    getOfficers: async (): Promise<User[]> => {
      return this.request<User[]>("/admin/users?role=officer")
    },
    createUser: async (data: { email: string; full_name: string; role: UserRole; password: string }): Promise<User> => {
      return this.request<User>("/admin/users", { method: "POST", body: JSON.stringify(data) })
    },
    updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
      return this.request<User>(`/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) })
    },
    updateUser: async (userId: number, data: Partial<User>): Promise<User> => {
      return this.request<User>(`/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(data) })
    },
    deleteUser: async (userId: number): Promise<void> => {
      return this.request<void>(`/admin/users/${userId}`, { method: "DELETE" })
    },
    toggleUserActive: async (userId: number, isActive: boolean): Promise<User> => {
      return this.request<User>(`/admin/users/${userId}/active`, { method: "PATCH", body: JSON.stringify({ is_active: isActive }) })
    },
    getModelInfo: async (): Promise<any> => {
      return this.request<any>("/ai/model/info")
    },
  }

  // Legacy alias so old code calling api.users.* still works
  users = {
    getAll: async (): Promise<User[]> => this.admin.getUsers(),
    getOfficers: async (): Promise<User[]> => this.admin.getOfficers(),
  }
}

export const api = new ApiClient(API_BASE_URL)
