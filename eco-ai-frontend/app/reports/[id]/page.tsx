"use client"

import { use } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { api } from "@/lib/api"
import useSWR from "swr"
import { FileText, ArrowLeft, Package, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { PriorityLevel, type DetectedItem } from "@/types"

function getCategoryColour(category: string): string {
  if (["hazardous_materials", "electronics", "tires", "vehicle_part"].includes(category))
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  if (["metal_scrap", "appliances", "construction_waste"].includes(category))
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
  if (["plastic_waste", "garbage_bags"].includes(category))
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
  return "bg-muted text-muted-foreground"
}

function formatRiskFactor(f: string): string {
  const m: Record<string, string> = {
    hazardous_materials_present: "Hazardous materials present",
    large_volume:                "Large volume of waste",
    moderate_volume:             "Moderate volume of waste",
    mixed_waste_types:           "Mixed waste types",
    construction_dumping:        "Construction waste dumping",
    appliance_dumping:           "Appliance dumping",
    furniture_dumping:           "Furniture dumping",
    illegal_dumping_detected:    "Illegal dumping detected",
    no_waste_detected:           "No waste detected",
    ai_analysis_failed:          "AI analysis failed",
  }
  return m[f] ?? f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params)
  const reportId  = Number.parseInt(id, 10)
  const { data: report, error, isLoading } = useSWR(
    ["report", reportId],
    () => api.reports.getById(reportId)
  )

  const priorityLevel =
    report?.analysis?.priority_score !== undefined
      ? report.analysis.priority_score >= 80 ? PriorityLevel.CRITICAL
      : report.analysis.priority_score >= 60 ? PriorityLevel.HIGH
      : report.analysis.priority_score >= 40 ? PriorityLevel.MEDIUM
      : PriorityLevel.LOW
      : undefined

  if (isLoading) {
    return <AppLayout showFooter={false}><LoadingSpinner text="Loading report..." fullPage /></AppLayout>
  }
  if (error || !report) {
    return (
      <AppLayout showFooter={false}>
        <EmptyState icon={FileText} title="Report not found"
          description="The report doesn't exist or you don't have access."
          action={{ label: "Back to Reports", onClick: () => window.history.back() }} />
      </AppLayout>
    )
  }

  const detectedItems = report.analysis?.detected_items
  const wasteTypes    = report.analysis?.waste_types
  const confScores    = report.analysis?.confidence_scores

  return (
    <AppLayout showFooter={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">Report #{report.id}</h1>
              <StatusBadge status={report.status} type="report" />
            </div>
            <p className="text-muted-foreground">
              Submitted {format(new Date(report.report_date), "PPP 'at' p")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                  <img src={report.image_url || "/placeholder.svg"}
                    alt={`Report #${report.id}`} className="h-full w-full object-cover" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48 w-full overflow-hidden rounded-lg bg-muted">
                  <img src="/map-location.png" alt="Location map" className="h-full w-full object-cover" />
                </div>
                <p className="mt-3 text-sm font-mono text-muted-foreground">
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(report.report_date), "PPP")}</span>
                </div>
                {report.user && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Reported by:</span>
                    <span>{report.user.full_name || report.user.email}</span>
                  </div>
                )}
                {report.description && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">Description:</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{report.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {report.analysis && (
              <Card>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">AI Analysis</CardTitle>
                    {priorityLevel && <PriorityBadge level={priorityLevel} />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">

                  {/* Priority */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Priority Score</span>
                      <span className="text-sm font-bold">{report.analysis.priority_score}/100</span>
                    </div>
                    <Progress value={report.analysis.priority_score} className="h-2" />
                  </div>

                  <Separator />

                  {/* Detected items — new reports */}
                  {detectedItems && detectedItems.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />Detected Items
                      </p>
                      <div className="space-y-2">
                        {detectedItems.map((item: DetectedItem) => (
                          <div key={item.class_name} className="flex items-center justify-between text-sm">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColour(item.category)}`}>
                              {item.label}
                            </span>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              {item.count > 1 && <span className="text-xs">×{item.count}</span>}
                              <span className="text-xs tabular-nums">{Math.round(item.confidence * 100)}% conf</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : wasteTypes && Object.keys(wasteTypes).length > 0 ? (
                    <div>
                      <p className="text-sm font-medium mb-3">Detected Waste Types</p>
                      <div className="space-y-2">
                        {Object.entries(wasteTypes)
                          .sort(([,a],[,b]) => (b as number) - (a as number))
                          .map(([type, score]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{type.replace(/_/g, " ")}</span>
                              <span className="text-muted-foreground tabular-nums">
                                {((score as number) * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No waste detected</p>
                  )}

                  <Separator />

                  {/* Confidence scores */}
                  <div>
                    <p className="text-sm font-medium mb-3">Detection Confidence</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Overall</span>
                          <span className="text-muted-foreground tabular-nums">
                            {Math.round((confScores?.overall ?? 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(confScores?.overall ?? 0) * 100} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Waste present</span>
                          <span className="text-muted-foreground tabular-nums">
                            {Math.round((confScores?.waste_present ?? 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(confScores?.waste_present ?? 0) * 100} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Detection count</span>
                        <span className="text-muted-foreground tabular-nums">
                          {confScores?.detection_count ?? 0} object{(confScores?.detection_count ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk factors */}
                  {report.analysis.risk_factors.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />Risk Factors
                        </p>
                        <ul className="space-y-2">
                          {report.analysis.risk_factors.map((f, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                                f === "hazardous_materials_present" ? "bg-red-500" : "bg-destructive"
                              }`} />
                              {formatRiskFactor(f)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Processed in {report.analysis.processing_time?.toFixed(2) ?? "—"}s</span>
                    </div>
                    <span className="truncate max-w-[180px]" title={report.analysis.ai_model_version}>
                      Model: {report.analysis.ai_model_version}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
