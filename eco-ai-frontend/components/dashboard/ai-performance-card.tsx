"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, Target, Clock, TrendingUp } from "lucide-react"

interface AiPerformanceCardProps {
  detailed: any
  isLoading?: boolean
}

export function AiPerformanceCard({ detailed, isLoading }: AiPerformanceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />AI Performance</CardTitle>
          <CardDescription>Model detection metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ai = detailed?.ai_performance
  if (!ai) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />AI Performance</CardTitle>
          <CardDescription>Model detection metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
            No AI data available for this period
          </div>
        </CardContent>
      </Card>
    )
  }

  const metrics = [
    {
      label: "Reports processed",
      value: ai.total_processed ?? 0,
      display: String(ai.total_processed ?? 0),
      icon: Target,
      progress: null,
    },
    {
      label: "Detection rate",
      value: ai.detection_rate ?? 0,
      display: `${ai.detection_rate ?? 0}%`,
      icon: TrendingUp,
      progress: ai.detection_rate ?? 0,
    },
    {
      label: "Avg confidence",
      value: (ai.avg_confidence ?? 0) * 100,
      display: `${((ai.avg_confidence ?? 0) * 100).toFixed(1)}%`,
      icon: Target,
      progress: (ai.avg_confidence ?? 0) * 100,
    },
    {
      label: "Avg processing time",
      value: ai.avg_processing_time ?? 0,
      display: `${(ai.avg_processing_time ?? 0).toFixed(2)}s`,
      icon: Clock,
      progress: null,
    },
  ]

  const priorityDist = ai.priority_distribution ?? {}
  const totalPriority = Object.values(priorityDist).reduce((s: number, v: any) => s + Number(v), 0)

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500",
    high:     "bg-orange-500",
    medium:   "bg-yellow-500",
    low:      "bg-green-500",
    monitor:  "bg-blue-500",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />AI Performance</CardTitle>
        <CardDescription>
          Model detection metrics — last {detailed?.analysis_period_days ?? 30} days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ label, display, icon: Icon, progress }) => (
            <div key={label} className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{display}</p>
              {progress !== null && (
                <Progress value={progress} className="h-1 mt-1" />
              )}
            </div>
          ))}
        </div>

        {totalPriority > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Priority distribution</p>
            <div className="flex h-3 w-full rounded-full overflow-hidden gap-0.5">
              {Object.entries(priorityDist).map(([level, count]) => {
                const pct = totalPriority > 0 ? (Number(count) / totalPriority) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={level}
                    className={`${priorityColors[level] || "bg-gray-400"} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${level}: ${count} (${pct.toFixed(0)}%)`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(priorityDist).map(([level, count]) => (
                Number(count) > 0 && (
                  <div key={level} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className={`h-2 w-2 rounded-full ${priorityColors[level] || "bg-gray-400"}`} />
                    <span className="capitalize">{level}: {String(count)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
