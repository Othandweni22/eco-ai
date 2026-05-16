"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { AppLayout } from "@/components/layout/app-layout"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { MapControls } from "@/components/map/map-controls"
import { MapSidebar } from "@/components/map/map-sidebar"
import { api } from "@/lib/api"
import type { Report } from "@/types"
import { PriorityLevel, ReportStatus, UserRole } from "@/types"
import useSWR from "swr"
import { useAuthContext } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { subDays, subMonths, isAfter } from "date-fns"

const MapContainer = dynamic(
  () => import("@/components/map/map-container").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <LoadingSpinner text="Loading map..." />
      </div>
    ),
  }
)

// Derive priority string from priority_score
function getReportPriority(report: Report): string {
  const score = report.analysis?.priority_score
  if (score === undefined) return "unknown"
  if (score >= 80) return "critical"
  if (score >= 60) return "high"
  if (score >= 40) return "medium"
  return "low"
}

export default function MapPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()

  const [showHeatmap,    setShowHeatmap]    = useState(false)
  const [showClusters,   setShowClusters]   = useState(true)
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter,   setStatusFilter]   = useState("all")
  const [dateRange,      setDateRange]      = useState("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login")
      else if (user?.role === UserRole.CITIZEN) router.push("/reports")
    }
  }, [authLoading, isAuthenticated, user, router])

  const { data: reports, isLoading: reportsLoading } = useSWR(
    isAuthenticated && user?.role !== UserRole.CITIZEN ? "map-reports" : null,
    () => api.reports.getAll({ limit: 500 }),
    { refreshInterval: 30_000 }  // auto-refresh every 30s
  )

  const filteredReports = useMemo(() => {
    if (!reports) return []

    return reports.filter((report) => {
      // Priority filter — derived from priority_score
      if (priorityFilter !== "all") {
        const p = getReportPriority(report)
        if (p !== priorityFilter) return false
      }

      // Status filter — matches ReportStatus enum values
      if (statusFilter !== "all" && report.status !== statusFilter) return false

      // Date range filter — uses report_date
      if (dateRange !== "all") {
        const reportDate = new Date(report.report_date)
        const now        = new Date()
        switch (dateRange) {
          case "today":   if (!isAfter(reportDate, subDays(now, 1)))    return false; break
          case "week":    if (!isAfter(reportDate, subDays(now, 7)))    return false; break
          case "month":   if (!isAfter(reportDate, subMonths(now, 1)))  return false; break
          case "quarter": if (!isAfter(reportDate, subMonths(now, 3)))  return false; break
        }
      }

      return true
    })
  }, [reports, priorityFilter, statusFilter, dateRange])

  if (authLoading || user?.role === UserRole.CITIZEN) return null

  return (
    <AppLayout showFooter={false} showSidebar={true}>
      <div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Map View</h1>
          <p className="text-muted-foreground">
            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} displayed
            {reports && filteredReports.length !== reports.length && ` (${reports.length} total)`}
          </p>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-lg border">
          {reportsLoading && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-background/80">
              <LoadingSpinner text="Loading reports..." />
            </div>
          )}

          <MapContainer
            reports={filteredReports}
            showHeatmap={showHeatmap}
            showClusters={showClusters}
            onReportSelect={setSelectedReport}
            selectedReportId={selectedReport?.id}
          />

          <MapControls
            showHeatmap={showHeatmap}
            onHeatmapChange={setShowHeatmap}
            showClusters={showClusters}
            onClustersChange={setShowClusters}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <MapSidebar
            reports={filteredReports}
            selectedReport={selectedReport}
            onReportSelect={setSelectedReport}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>
    </AppLayout>
  )
}
