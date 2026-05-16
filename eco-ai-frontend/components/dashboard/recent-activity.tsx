"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, CheckCircle, UserCheck, Calendar, AlertTriangle, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useWebSocket } from "@/hooks/use-websocket"
import type { WebSocketMessage } from "@/types"

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: Date
  priority?: string
}

const activityConfig: Record<string, { icon: any; colour: string; title: string }> = {
  NEW_REPORT:        { icon: FileText,      colour: "bg-blue-500",   title: "New report submitted" },
  REPORT_ANALYZED:   { icon: Zap,           colour: "bg-purple-500", title: "Report analysed" },
  CASE_UPDATED:      { icon: CheckCircle,   colour: "bg-green-500",  title: "Case updated" },
  CASE_ASSIGNED:     { icon: UserCheck,     colour: "bg-yellow-500", title: "Case assigned" },
  CLEANUP_SCHEDULED: { icon: Calendar,      colour: "bg-orange-500", title: "Cleanup scheduled" },
  high_priority_case:{ icon: AlertTriangle, colour: "bg-red-500",    title: "⚠️ High priority case" },
}

function buildActivity(msg: WebSocketMessage): ActivityItem {
  const cfg = activityConfig[msg.type]
  const d   = msg.data as any
  const descriptions: Record<string, string> = {
    NEW_REPORT:         `Report #${d.report_id} submitted`,
    REPORT_ANALYZED:    `Report #${d.report_id} analysed`,
    CASE_UPDATED:       `Case #${d.case_id} status updated`,
    CASE_ASSIGNED:      `Case #${d.case_id} assigned to officer`,
    CLEANUP_SCHEDULED:  `Cleanup for case #${d.case_id} scheduled`,
    high_priority_case: `Case #${d.case_id} — score ${d.priority_score} (${d.priority_level})`,
  }
  return {
    id:          `${msg.type}-${Date.now()}-${Math.random()}`,
    type:        msg.type,
    title:       cfg?.title ?? msg.type,
    description: descriptions[msg.type] ?? JSON.stringify(d).slice(0, 60),
    timestamp:   new Date(msg.timestamp),
    priority:    d.priority_level,
  }
}

interface RecentActivityProps {
  isLoading?: boolean
}

export function RecentActivity({ isLoading }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    setActivities(prev => [buildActivity(msg), ...prev].slice(0, 50))
  }, [])

  const { isConnected } = useWebSocket({ onMessage: handleMessage, autoReconnect: true })

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Live updates from the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live updates from the system</CardDescription>
          </div>
          <span className={`text-xs font-medium ${isConnected ? "text-green-500" : "text-muted-foreground"}`}>
            {isConnected ? "● Live" : "○ Connecting..."}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Zap className="h-8 w-8 opacity-30" />
              <p className="text-sm">No activity yet.</p>
              <p className="text-xs">New reports and case updates will appear here in real time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => {
                const cfg  = activityConfig[activity.type]
                const Icon = cfg?.icon ?? FileText
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg?.colour ?? "bg-muted"}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.priority && (
                          <Badge variant="outline" className={
                            activity.priority === "critical" ? "border-red-500 text-red-500" :
                            activity.priority === "high"     ? "border-orange-500 text-orange-500" : ""
                          }>
                            {activity.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
