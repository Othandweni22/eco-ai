"use client"

import type { AnalyticsData } from "@/types"
import { StatCard } from "@/components/common/stat-card"
import { FileText, Briefcase, Clock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface StatsCardsProps {
  analytics: AnalyticsData | undefined
  isLoading?: boolean
}

export function StatsCards({ analytics, isLoading }: StatsCardsProps) {
  const router = useRouter()

  const stats = [
    {
      title: "Total Reports",
      value: analytics?.total_reports ?? 0,
      icon: FileText,
      description: "All time submissions",
      trend: { value: 12, isPositive: true },
      onClick: () => router.push("/reports"),
    },
    {
      title: "Pending Processing",
      value: (analytics?.reports_by_status?.pending ?? 0) + (analytics?.reports_by_status?.processing ?? 0),
      icon: Clock,
      description: "Awaiting analysis",
      onClick: () => router.push("/reports?status=pending"),
    },
    {
      title: "High Priority Cases",
      value: (analytics?.cases_by_priority?.high ?? 0) + (analytics?.cases_by_priority?.critical ?? 0),
      icon: Briefcase,
      description: "Require attention",
      trend: { value: 5, isPositive: false },
      onClick: () => router.push("/cases?priority=high"),
    },
    {
      title: "Avg Response Time",
      value: analytics?.avg_response_time ? `${Math.round(analytics.avg_response_time)}h` : "N/A",
      icon: CheckCircle,
      description: "From report to assignment",
      trend: { value: 8, isPositive: true },
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
