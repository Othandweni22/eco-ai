"use client"

import type { Case } from "@/types"
import { DataTable } from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"

interface CaseTableProps {
  cases: Case[]
  onViewCase: (caseItem: Case) => void
  isLoading?: boolean
}

export function CaseTable({ cases, onViewCase, isLoading }: CaseTableProps) {
  const columns = [
    {
      key: "id",
      header: "Case ID",
      cell: (caseItem: Case) => <span className="font-mono font-medium">#{caseItem.id}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (caseItem: Case) => <PriorityBadge level={caseItem.priority_level} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (caseItem: Case) => <StatusBadge status={caseItem.status} type="case" />,
    },
    {
      key: "location",
      header: "Location",
      cell: (caseItem: Case) =>
        caseItem.report ? (
          <span className="font-mono text-xs">
            {caseItem.report.latitude.toFixed(4)}, {caseItem.report.longitude.toFixed(4)}
          </span>
        ) : (
          "-"
        ),
      className: "hidden md:table-cell",
    },
    {
      key: "officer",
      header: "Assigned To",
      cell: (caseItem: Case) =>
        caseItem.assigned_officer ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {caseItem.assigned_officer.full_name?.[0] || caseItem.assigned_officer.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[120px]">
              {caseItem.assigned_officer.full_name || caseItem.assigned_officer.email}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
      className: "hidden lg:table-cell",
    },
    {
      key: "scheduled",
      header: "Scheduled",
      cell: (caseItem: Case) =>
        caseItem.scheduled_date ? (
          <span>{format(new Date(caseItem.scheduled_date), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-muted-foreground">Not scheduled</span>
        ),
      className: "hidden xl:table-cell",
    },
    {
      key: "cost",
      header: "Est. Cost",
      cell: (caseItem: Case) =>
        caseItem.estimated_cleanup_cost ? (
          <span className="font-mono">${caseItem.estimated_cleanup_cost.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      className: "hidden xl:table-cell",
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={cases}
      onRowClick={onViewCase}
      isLoading={isLoading}
      emptyMessage="No cases found"
    />
  )
}
