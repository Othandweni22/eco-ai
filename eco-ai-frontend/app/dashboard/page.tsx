"use client"

import { useState } from "react"
import useSWR from "swr"
import { AppLayout } from "@/components/layout/app-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PriorityChart } from "@/components/dashboard/priority-chart"
import { StatusChart } from "@/components/dashboard/status-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { HotspotsList } from "@/components/dashboard/hotspots-list"
import { WasteDistributionChart } from "@/components/dashboard/waste-distribution-chart"
import { AiPerformanceCard } from "@/components/dashboard/ai-performance-card"
import { api } from "@/lib/api"
import { useAuthContext } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [analysisDays, setAnalysisDays] = useState("30")

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login")
      else if (user?.role === UserRole.CITIZEN) router.push("/reports")
    }
  }, [authLoading, isAuthenticated, user, router])

  const { data: analytics, isLoading } = useSWR(
    isAuthenticated && user?.role !== UserRole.CITIZEN ? "analytics" : null,
    () => api.analytics.get(),
    { refreshInterval: 60_000 }
  )

  const { data: detailed, isLoading: detailedLoading } = useSWR(
    isAuthenticated && user?.role !== UserRole.CITIZEN ? ["analytics-detailed", analysisDays] : null,
    () => api.analytics.getDetailed(Number(analysisDays)),
    { refreshInterval: 60_000 }
  )

  if (authLoading || user?.role === UserRole.CITIZEN) return null

  return (
    <AppLayout showFooter={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.full_name || user?.email}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Analysis period:</Label>
            <Select value={analysisDays} onValueChange={setAnalysisDays}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards analytics={analytics} isLoading={isLoading} />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PriorityChart analytics={analytics} isLoading={isLoading} />
          <StatusChart analytics={analytics} isLoading={isLoading} />
        </div>

        {/* AI Performance + Waste Distribution */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AiPerformanceCard detailed={detailed} isLoading={detailedLoading} />
          <WasteDistributionChart detailed={detailed} isLoading={detailedLoading} />
        </div>

        {/* Activity and Hotspots */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity isLoading={isLoading} />
          <HotspotsList analytics={analytics} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  )
}
