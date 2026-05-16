"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PriorityBadge } from "@/components/common/priority-badge"
import { StatusBadge } from "@/components/common/status-badge"
import type { Report } from "@/types"
import { PriorityLevel, ReportStatus } from "@/types"
import { Search, MapPin, Clock, ChevronRight, X, ExternalLink, Package } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface MapSidebarProps {
  reports: Report[]
  selectedReport: Report | null
  onReportSelect: (report: Report | null) => void
  isOpen: boolean
  onToggle: () => void
}

// Derive priority level from analysis.priority_score
function getPriorityLevel(report: Report): PriorityLevel {
  const score = report.analysis?.priority_score
  if (score === undefined) return PriorityLevel.LOW
  if (score >= 80) return PriorityLevel.CRITICAL
  if (score >= 60) return PriorityLevel.HIGH
  if (score >= 40) return PriorityLevel.MEDIUM
  return PriorityLevel.LOW
}

export function MapSidebar({ reports, selectedReport, onReportSelect, isOpen, onToggle }: MapSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReports = reports.filter((report) => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    // Search by report id, description, detected item labels, or coordinates
    if (`report #${report.id}`.includes(q)) return true
    if (report.description?.toLowerCase().includes(q)) return true
    if (`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`.includes(q)) return true
    if (report.analysis?.detected_items?.some(item => item.label.toLowerCase().includes(q))) return true
    if (report.analysis?.waste_types &&
        Object.keys(report.analysis.waste_types).some(k => k.replace(/_/g, " ").includes(q))) return true
    return false
  })

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-4 z-[1000] h-10 w-10 bg-background shadow-lg"
        onClick={onToggle}
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
      </Button>
    )
  }

  return (
    <Card className="absolute right-4 top-4 z-[1000] h-[calc(100%-2rem)] w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Reports
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredReports.length})
            </span>
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {selectedReport ? (
          /* ── Selected report detail view ── */
          <div className="p-4">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2 h-8" onClick={() => onReportSelect(null)}>
              <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
              Back to list
            </Button>

            <div className="space-y-4">
              {selectedReport.image_url && (
                <img
                  src={selectedReport.image_url}
                  alt={`Report #${selectedReport.id}`}
                  className="h-40 w-full rounded-lg object-cover"
                />
              )}

              <div>
                <h3 className="mb-1 font-semibold text-sm">Report #{selectedReport.id}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <PriorityBadge level={getPriorityLevel(selectedReport)} score={selectedReport.analysis?.priority_score} />
                  <StatusBadge status={selectedReport.status} type="report" />
                </div>
              </div>

              {/* Detected items summary */}
              {selectedReport.analysis && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Package className="h-3.5 w-3.5" />
                    Detected waste
                  </div>

                  {selectedReport.analysis.detected_items && selectedReport.analysis.detected_items.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedReport.analysis.detected_items.map(item => (
                        <span key={item.class_name} className="text-xs bg-background rounded px-1.5 py-0.5 border">
                          {item.label}{item.count > 1 ? ` ×${item.count}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : selectedReport.analysis.waste_types && Object.keys(selectedReport.analysis.waste_types).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(selectedReport.analysis.waste_types)
                        .sort(([,a],[,b]) => b - a)
                        .map(([type]) => (
                          <span key={type} className="text-xs bg-background rounded px-1.5 py-0.5 border">
                            {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No waste detected</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Priority score: {selectedReport.analysis.priority_score}/100
                    {" · "}
                    {selectedReport.analysis.confidence_scores?.detection_count ?? 0} objects
                  </p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono text-xs">
                    {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(selectedReport.report_date), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
              )}

              <Link href={`/reports/${selectedReport.id}`} className="block">
                <Button className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Button>
              </Link>
            </div>
          </div>

        ) : (
          /* ── Report list ── */
          <ScrollArea className="h-[calc(100%-8rem)]">
            <div className="space-y-2 p-4 pt-0">
              {filteredReports.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {reports.length === 0 ? "No reports yet" : "No reports match your search"}
                </div>
              ) : (
                filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => onReportSelect(report)}
                    className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="font-medium text-sm">Report #{report.id}</span>
                      <PriorityBadge
                        level={getPriorityLevel(report)}
                        score={report.analysis?.priority_score}
                        size="sm"
                      />
                    </div>

                    {/* Show detected item labels if available */}
                    {report.analysis?.detected_items && report.analysis.detected_items.length > 0 ? (
                      <p className="mb-1.5 text-xs text-muted-foreground line-clamp-1">
                        {report.analysis.detected_items
                          .slice(0, 3)
                          .map(i => i.label)
                          .join(", ")}
                        {report.analysis.detected_items.length > 3 && ` +${report.analysis.detected_items.length - 3} more`}
                      </p>
                    ) : report.analysis?.waste_types && Object.keys(report.analysis.waste_types).length > 0 ? (
                      <p className="mb-1.5 text-xs text-muted-foreground line-clamp-1">
                        {Object.keys(report.analysis.waste_types)
                          .slice(0, 3)
                          .map(k => k.replace(/_/g, " "))
                          .join(", ")}
                      </p>
                    ) : null}

                    <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <StatusBadge status={report.status} type="report" size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.report_date), { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
