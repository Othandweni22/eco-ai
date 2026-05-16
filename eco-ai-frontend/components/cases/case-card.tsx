"use client"

import type { Case } from "@/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Calendar, DollarSign, Eye, User } from "lucide-react"
import { format } from "date-fns"

interface CaseCardProps {
  caseItem: Case
  onView?: (caseItem: Case) => void
  isDragging?: boolean
}

export function CaseCard({ caseItem, onView, isDragging }: CaseCardProps) {
  return (
    <Card className={`transition-all ${isDragging ? "opacity-50 rotate-3 shadow-lg" : "hover:shadow-md"}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Case #{caseItem.id}</span>
            <PriorityBadge level={caseItem.priority_level} showLabel={false} />
          </div>
          <StatusBadge status={caseItem.status} type="case" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {/* Report Image Preview */}
        {caseItem.report && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={
                caseItem.report.thumbnail_url ||
                caseItem.report.image_url ||
                "/placeholder.svg?height=120&width=200&query=dumping site" ||
                "/placeholder.svg"
              }
              alt={`Case #${caseItem.id}`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Location */}
        {caseItem.report && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate font-mono text-xs">
              {caseItem.report.latitude.toFixed(4)}, {caseItem.report.longitude.toFixed(4)}
            </span>
          </div>
        )}

        {/* Assigned Officer */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          {caseItem.assigned_officer ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {caseItem.assigned_officer.full_name?.[0] || caseItem.assigned_officer.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{caseItem.assigned_officer.full_name || caseItem.assigned_officer.email}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </div>

        {/* Scheduled Date */}
        {caseItem.scheduled_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Scheduled: {format(new Date(caseItem.scheduled_date), "MMM d, yyyy")}</span>
          </div>
        )}

        {/* Estimated Cost */}
        {caseItem.estimated_cleanup_cost && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>${caseItem.estimated_cleanup_cost.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => onView?.(caseItem)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
