"use client"

import type { Report, DetectedItem } from "@/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { MapPin, Calendar, Eye, Trash2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { PriorityLevel } from "@/types"

interface ReportCardProps {
  report: Report
  onView?: (report: Report) => void
  onDelete?: (report: Report) => void
  showActions?: boolean
}

function getCategoryColour(category: string): string {
  if (["hazardous_materials", "electronics", "tires", "vehicle_part"].includes(category))
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  if (["metal_scrap", "appliances", "construction_waste"].includes(category))
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
  if (["plastic_waste", "garbage_bags"].includes(category))
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
  return "bg-muted text-muted-foreground"
}

export function ReportCard({ report, onView, onDelete, showActions = true }: ReportCardProps) {
  const priorityLevel =
    report.analysis?.priority_score !== undefined
      ? report.analysis.priority_score >= 80
        ? PriorityLevel.CRITICAL
        : report.analysis.priority_score >= 60
          ? PriorityLevel.HIGH
          : report.analysis.priority_score >= 40
            ? PriorityLevel.MEDIUM
            : PriorityLevel.LOW
      : undefined

  const detectedItems = report.analysis?.detected_items
  const wasteTypes    = report.analysis?.waste_types

  const hasHazardous = detectedItems
    ? detectedItems.some((item: DetectedItem) =>
        ["hazardous_materials", "electronics", "tires", "vehicle_part"].includes(item.category)
      )
    : wasteTypes
      ? Object.keys(wasteTypes).some(k =>
          ["hazardous_materials", "electronics", "tires", "vehicle_part"].includes(k)
        )
      : false

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={report.thumbnail_url || report.image_url || "/placeholder.svg?height=200&width=400&query=dumping site"}
          alt={`Report #${report.id}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <StatusBadge status={report.status} type="report" />
        </div>
        {priorityLevel && (
          <div className="absolute top-2 right-2">
            <PriorityBadge level={priorityLevel} score={report.analysis?.priority_score} />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Report ID + hazardous warning */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Report #{report.id}</span>
            {hasHazardous && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle className="h-3 w-3" />
                Hazardous
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate font-mono text-xs">
              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDistanceToNow(new Date(report.report_date), { addSuffix: true })}</span>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
          )}

          {/* Analysis Summary */}
          {report.analysis && (
            <div className="pt-2 border-t space-y-2">

              {/* detected_items path — new reports */}
              {detectedItems && detectedItems.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Detected items ({detectedItems.length} type{detectedItems.length !== 1 ? "s" : ""}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detectedItems.map((item: DetectedItem) => (
                      <span
                        key={item.class_name}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColour(item.category)}`}
                      >
                        {item.label}
                        {item.count > 1 && <span className="opacity-70">×{item.count}</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confidence: {Math.round((report.analysis.confidence_scores?.overall ?? 0) * 100)}%
                    {" · "}
                    {report.analysis.confidence_scores?.detection_count ?? 0} detection
                    {(report.analysis.confidence_scores?.detection_count ?? 0) !== 1 ? "s" : ""}
                  </p>
                </>

              ) : wasteTypes && Object.keys(wasteTypes).length > 0 ? (
                /* waste_types fallback — older reports */
                <>
                  <p className="text-xs text-muted-foreground">Detected waste types:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(wasteTypes)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([type, score]) => (
                        <span
                          key={type}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColour(type)}`}
                        >
                          {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          <span className="opacity-70 ml-1">
                            {((score as number) * 100).toFixed(0)}%
                          </span>
                        </span>
                      ))}
                  </div>
                </>

              ) : (
                <p className="text-xs text-muted-foreground italic">No waste detected</p>
              )}

            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onView?.(report)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onDelete(report)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
