"use client"

import type { AnalyticsData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface StatusChartProps {
  analytics: AnalyticsData | undefined
  isLoading?: boolean
}

const STATUS_COLORS = {
  pending: "#6b7280",
  processing: "#3b82f6",
  analyzed: "#8b5cf6",
  rejected: "#ef4444",
}

export function StatusChart({ analytics, isLoading }: StatusChartProps) {
  const data = analytics?.reports_by_status
    ? Object.entries(analytics.reports_by_status).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: value,
        fill: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || "#6b7280",
      }))
    : []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports by Status</CardTitle>
          <CardDescription>Current report status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-full w-full bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports by Status</CardTitle>
          <CardDescription>Current report status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No report data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports by Status</CardTitle>
        <CardDescription>Current report status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
