import type React from "react"
import { cn } from "@/lib/utils"
import { ReportStatus, CaseStatus } from "@/types"
import { REPORT_STATUS_COLORS, CASE_STATUS_COLORS, REPORT_STATUS_LABELS, CASE_STATUS_LABELS } from "@/lib/constants"
import { Clock, Loader2, CheckCircle2, XCircle, CircleDot, UserCheck, Play, Ban } from "lucide-react"

interface StatusBadgeProps {
  status: ReportStatus | CaseStatus
  type?: "report" | "case"
  showIcon?: boolean
  className?: string
}

const reportStatusIcons: Record<ReportStatus, React.ElementType> = {
  [ReportStatus.PENDING]: Clock,
  [ReportStatus.PROCESSING]: Loader2,
  [ReportStatus.ANALYZED]: CheckCircle2,
  [ReportStatus.REJECTED]: XCircle,
}

const caseStatusIcons: Record<CaseStatus, React.ElementType> = {
  [CaseStatus.NEW]: CircleDot,
  [CaseStatus.ASSIGNED]: UserCheck,
  [CaseStatus.IN_PROGRESS]: Play,
  [CaseStatus.COMPLETED]: CheckCircle2,
  [CaseStatus.CANCELLED]: Ban,
}

export function StatusBadge({ status, type = "report", showIcon = true, className }: StatusBadgeProps) {
  const isReport = type === "report"
  const colors = isReport ? REPORT_STATUS_COLORS[status as ReportStatus] : CASE_STATUS_COLORS[status as CaseStatus]
  const label = isReport ? REPORT_STATUS_LABELS[status as ReportStatus] : CASE_STATUS_LABELS[status as CaseStatus]
  const Icon = isReport ? reportStatusIcons[status as ReportStatus] : caseStatusIcons[status as CaseStatus]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors,
        className,
      )}
    >
      {showIcon && <Icon className={cn("h-3 w-3", status === ReportStatus.PROCESSING && "animate-spin")} />}
      {label}
    </span>
  )
}
