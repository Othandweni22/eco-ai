"use client"

import type { Case } from "@/types"
import { CaseStatus } from "@/types"
import { CaseCard } from "./case-card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { CASE_STATUS_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface CaseKanbanProps {
  cases: Case[]
  onViewCase: (caseItem: Case) => void
  onStatusChange?: (caseItem: Case, newStatus: CaseStatus) => void
}

const statusColumns: CaseStatus[] = [CaseStatus.NEW, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS, CaseStatus.COMPLETED]

const statusColors: Record<CaseStatus, string> = {
  [CaseStatus.NEW]: "border-t-blue-500",
  [CaseStatus.ASSIGNED]: "border-t-yellow-500",
  [CaseStatus.IN_PROGRESS]: "border-t-orange-500",
  [CaseStatus.COMPLETED]: "border-t-green-500",
  [CaseStatus.CANCELLED]: "border-t-red-500",
}

export function CaseKanban({ cases, onViewCase, onStatusChange }: CaseKanbanProps) {
  const getCasesByStatus = (status: CaseStatus) => {
    return cases.filter((c) => c.status === status)
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {statusColumns.map((status) => {
          const columnCases = getCasesByStatus(status)
          return (
            <div key={status} className="w-80 shrink-0">
              {/* Column Header */}
              <div className={cn("rounded-t-lg border-t-4 bg-muted/50 p-3", statusColors[status])}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{CASE_STATUS_LABELS[status]}</h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {columnCases.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="min-h-[500px] rounded-b-lg border border-t-0 bg-muted/20 p-2">
                <div className="space-y-3">
                  {columnCases.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                      No cases
                    </div>
                  ) : (
                    columnCases.map((caseItem) => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} onView={onViewCase} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
