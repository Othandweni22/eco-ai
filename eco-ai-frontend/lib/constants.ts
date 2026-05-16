import { PriorityLevel, ReportStatus, CaseStatus } from "@/types"

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  [PriorityLevel.CRITICAL]: "bg-red-600 text-white",
  [PriorityLevel.HIGH]: "bg-orange-500 text-white",
  [PriorityLevel.MEDIUM]: "bg-yellow-500 text-foreground",
  [PriorityLevel.LOW]: "bg-green-500 text-white",
}

export const PRIORITY_BORDER_COLORS: Record<PriorityLevel, string> = {
  [PriorityLevel.CRITICAL]: "border-red-600",
  [PriorityLevel.HIGH]: "border-orange-500",
  [PriorityLevel.MEDIUM]: "border-yellow-500",
  [PriorityLevel.LOW]: "border-green-500",
}

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "bg-muted text-muted-foreground",
  [ReportStatus.PROCESSING]: "bg-blue-500 text-white",
  [ReportStatus.ANALYZED]: "bg-purple-500 text-white",
  [ReportStatus.REJECTED]: "bg-red-500 text-white",
}

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  [CaseStatus.NEW]: "bg-blue-500 text-white",
  [CaseStatus.ASSIGNED]: "bg-yellow-500 text-foreground",
  [CaseStatus.IN_PROGRESS]: "bg-orange-500 text-white",
  [CaseStatus.COMPLETED]: "bg-green-500 text-white",
  [CaseStatus.CANCELLED]: "bg-red-500 text-white",
}

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  [PriorityLevel.CRITICAL]: "Critical",
  [PriorityLevel.HIGH]: "High",
  [PriorityLevel.MEDIUM]: "Medium",
  [PriorityLevel.LOW]: "Low",
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "Pending",
  [ReportStatus.PROCESSING]: "Processing",
  [ReportStatus.ANALYZED]: "Analyzed",
  [ReportStatus.REJECTED]: "Rejected",
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  [CaseStatus.NEW]: "New",
  [CaseStatus.ASSIGNED]: "Assigned",
  [CaseStatus.IN_PROGRESS]: "In Progress",
  [CaseStatus.COMPLETED]: "Completed",
  [CaseStatus.CANCELLED]: "Cancelled",
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const DEFAULT_MAP_CENTER = { lat: 40.7128, lng: -74.006 } // New York
export const DEFAULT_MAP_ZOOM = 12
