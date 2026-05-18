// Direct port from the original Next.js project's types/index.ts.
// TypeScript types carry over identically.

export enum UserRole {
  CITIZEN = "citizen",
  OFFICER = "officer",
  ADMIN = "admin",
}

export enum ReportStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  ANALYZED = "analyzed",
  REJECTED = "rejected",
}

export enum CaseStatus {
  NEW = "new",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface DetectedItem {
  label: string;
  class_name: string;
  category: string;
  confidence: number;
  count: number;
  bbox: number[];
}

export interface AnalysisResult {
  waste_types: Record<string, number>;
  confidence_scores: {
    overall: number;
    waste_present: number;
    detection_count: number;
  };
  priority_score: number;
  risk_factors: string[];
  ai_model_version: string;
  processing_time: number;
  detected_items?: DetectedItem[];
}

export interface Report {
  id: number;
  user_id: number;
  image_url: string;
  thumbnail_url: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  report_date: string;
  status: ReportStatus;
  user?: User;
  analysis?: AnalysisResult;
}

export interface Case {
  id: number;
  report_id: number;
  assigned_officer_id: number | null;
  priority_level: PriorityLevel;
  estimated_cleanup_cost: number | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: CaseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  report?: Report;
  assigned_officer?: User;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  priority_level: PriorityLevel;
}

export interface AnalyticsData {
  total_reports: number;
  reports_by_status: Record<string, number>;
  cases_by_priority: Record<string, number>;
  avg_response_time: number | null;
  top_hotspots: Array<{
    latitude: number;
    longitude: number;
    incident_count: number;
  }>;
}

export interface Location {
  latitude: number;
  longitude: number;
}

// NOTE: On RN, image uploads use { uri, name, type } instead of a `File`.
export interface UploadReportData {
  image: { uri: string; name: string; type: string };
  latitude: number;
  longitude: number;
  description?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WebSocketMessage {
  type:
    | "NEW_REPORT"
    | "REPORT_ANALYZED"
    | "CASE_UPDATED"
    | "CASE_ASSIGNED"
    | "CLEANUP_SCHEDULED";
  data: Record<string, unknown>;
  timestamp: string;
}
