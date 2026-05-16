"use client"

import { useState } from "react"
import type { Case, User, DetectedItem } from "@/types"
import { CaseStatus } from "@/types"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, MapPin, DollarSign, UserIcon, FileText,
  Loader2, Clock, CheckCircle, Package, AlertTriangle,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { CASE_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface CaseDetailModalProps {
  caseItem: Case | null
  officers: User[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
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

export function CaseDetailModal({ caseItem, officers, open, onOpenChange, onUpdate }: CaseDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving,  setIsSaving]  = useState(false)
  const [editData,  setEditData]  = useState<Partial<Case>>({})

  if (!caseItem) return null

  const handleEdit = () => {
    setEditData({
      status:                 caseItem.status,
      assigned_officer_id:    caseItem.assigned_officer_id,
      scheduled_date:         caseItem.scheduled_date,
      estimated_cleanup_cost: caseItem.estimated_cleanup_cost,
      notes:                  caseItem.notes,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.cases.update(caseItem.id, editData)
      toast.success("Case updated successfully")
      setIsEditing(false)
      onUpdate()
    } catch {
      toast.error("Failed to update case")
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickStatus = async (newStatus: CaseStatus) => {
    try {
      await api.cases.update(caseItem.id, { status: newStatus })
      toast.success(`Case marked as ${CASE_STATUS_LABELS[newStatus]}`)
      onUpdate()
    } catch {
      toast.error("Failed to update status")
    }
  }

  const detectedItems = caseItem.report?.analysis?.detected_items
  const wasteTypes    = caseItem.report?.analysis?.waste_types
  const confScores    = caseItem.report?.analysis?.confidence_scores

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle>Case #{caseItem.id}</DialogTitle>
            <PriorityBadge level={caseItem.priority_level} />
            <StatusBadge status={caseItem.status} type="case" />
          </div>
          <DialogDescription>
            Created {format(new Date(caseItem.created_at), "PPP")}
            {caseItem.updated_at && (
              <span className="ml-2">
                · Updated {formatDistanceToNow(new Date(caseItem.updated_at), { addSuffix: true })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">

          {/* ── Left: Case management ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={editData.status}
                        onValueChange={v => setEditData({ ...editData, status: v as CaseStatus })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CASE_STATUS_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Assigned Officer</Label>
                      <Select
                        value={editData.assigned_officer_id?.toString() ?? "unassigned"}
                        onValueChange={v => setEditData({
                          ...editData,
                          assigned_officer_id: v === "unassigned" ? null : Number(v),
                        })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {officers.map(o => (
                            <SelectItem key={o.id} value={o.id.toString()}>
                              {o.full_name || o.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Scheduled Date</Label>
                      <Input type="date"
                        value={editData.scheduled_date?.toString().split("T")[0] ?? ""}
                        onChange={e => setEditData({ ...editData, scheduled_date: e.target.value || null })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Cleanup Cost ($)</Label>
                      <Input type="number" placeholder="0.00"
                        value={editData.estimated_cleanup_cost ?? ""}
                        onChange={e => setEditData({
                          ...editData,
                          estimated_cleanup_cost: e.target.value ? Number(e.target.value) : null,
                        })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea placeholder="Add notes about this case..."
                        value={editData.notes ?? ""}
                        onChange={e => setEditData({ ...editData, notes: e.target.value || null })}
                        rows={4} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned to:</span>
                      <span className="font-medium">
                        {caseItem.assigned_officer
                          ? caseItem.assigned_officer.full_name || caseItem.assigned_officer.email
                          : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="font-medium">
                        {caseItem.scheduled_date
                          ? format(new Date(caseItem.scheduled_date), "PPP")
                          : "Not scheduled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Est. Cost:</span>
                      <span className="font-medium">
                        {caseItem.estimated_cleanup_cost
                          ? `$${caseItem.estimated_cleanup_cost.toLocaleString()}`
                          : "Not estimated"}
                      </span>
                    </div>
                    {caseItem.notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Notes:</p>
                          <p className="text-sm bg-muted p-3 rounded-lg">{caseItem.notes}</p>
                        </div>
                      </>
                    )}
                    <Separator />
                    {/* Timeline */}
                    <div>
                      <p className="text-sm font-medium mb-3">Timeline</p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                            <FileText className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Case Created</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(caseItem.created_at), "PPP 'at' p")}
                            </p>
                          </div>
                        </div>
                        {caseItem.scheduled_date && (
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                              <Clock className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Cleanup Scheduled</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(caseItem.scheduled_date), "PPP")}
                              </p>
                            </div>
                          </div>
                        )}
                        {caseItem.completed_date && (
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Completed</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(caseItem.completed_date), "PPP 'at' p")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            {!isEditing && caseItem.status !== CaseStatus.COMPLETED && caseItem.status !== CaseStatus.CANCELLED && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap gap-2">
                  {caseItem.status === CaseStatus.NEW && (
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(CaseStatus.ASSIGNED)}>
                      Mark Assigned
                    </Button>
                  )}
                  {caseItem.status === CaseStatus.ASSIGNED && (
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(CaseStatus.IN_PROGRESS)}>
                      Start Progress
                    </Button>
                  )}
                  {caseItem.status === CaseStatus.IN_PROGRESS && (
                    <Button size="sm" onClick={() => handleQuickStatus(CaseStatus.COMPLETED)}>
                      Mark Completed
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleQuickStatus(CaseStatus.CANCELLED)}>
                    Cancel Case
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right: Report info ── */}
          <div className="space-y-4">
            {caseItem.report && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">
                    Associated Report #{caseItem.report.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={caseItem.report.image_url || "/placeholder.svg"}
                      alt={`Report #${caseItem.report.id}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {caseItem.report.latitude.toFixed(6)}, {caseItem.report.longitude.toFixed(6)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <StatusBadge status={caseItem.report.status} type="report" />
                  </div>

                  {caseItem.report.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description:</p>
                      <p className="text-sm bg-muted p-3 rounded-lg">{caseItem.report.description}</p>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {caseItem.report.analysis && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">AI Analysis</p>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Priority Score</span>
                          <span className="font-bold">{caseItem.report.analysis.priority_score}/100</span>
                        </div>
                        <Progress value={caseItem.report.analysis.priority_score} className="h-1.5" />

                        {/* Detected items — new format */}
                        {detectedItems && detectedItems.length > 0 ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Package className="h-3 w-3" />Detected items
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {detectedItems.map((item: DetectedItem) => (
                                <span key={item.class_name}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColour(item.category)}`}>
                                  {item.label}
                                  {item.count > 1 && <span className="opacity-70">×{item.count}</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : wasteTypes && Object.keys(wasteTypes).length > 0 ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Detected waste types</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(wasteTypes)
                                .sort(([,a],[,b]) => (b as number) - (a as number))
                                .map(([type, score]) => (
                                  <span key={type}
                                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                                    {type.replace(/_/g, " ")} — {((score as number)*100).toFixed(0)}%
                                  </span>
                                ))}
                            </div>
                          </div>
                        ) : null}

                        {/* Confidence */}
                        {confScores && (
                          <div className="text-xs text-muted-foreground">
                            Confidence: {Math.round((confScores.overall as number ?? 0) * 100)}%
                            {" · "}
                            {confScores.detection_count ?? 0} object{(confScores.detection_count as number) !== 1 ? "s" : ""} detected
                          </div>
                        )}

                        {/* Risk factors */}
                        {caseItem.report.analysis.risk_factors.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />Risk factors
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {caseItem.report.analysis.risk_factors.map((f, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {f.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditData({}) }} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={handleEdit}>Edit Case</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
