"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Plus, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportCard } from "./report-card"
import { ReportDetailModal } from "./report-detail-modal"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { DataTable } from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { api } from "@/lib/api"
import { type Report, ReportStatus } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ReportListProps {
  showUploadButton?: boolean
}

export function ReportList({ showUploadButton = true }: ReportListProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const {
    data: reports,
    error,
    isLoading,
    mutate,
  } = useSWR(
    ["reports", statusFilter],
    () => api.reports.getAll({ status: statusFilter === "all" ? undefined : statusFilter }),
    { refreshInterval: 30000 },
  )

  const filteredReports = reports?.filter((report) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      report.id.toString().includes(query) ||
      report.description?.toLowerCase().includes(query) ||
      report.latitude.toString().includes(query) ||
      report.longitude.toString().includes(query)
    )
  })

  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setIsDetailOpen(true)
  }

  const handleDeleteReport = async (report: Report) => {
    if (!confirm(`Are you sure you want to delete Report #${report.id}?`)) return

    try {
      await api.reports.delete(report.id)
      toast.success("Report deleted")
      mutate()
    } catch (err) {
      toast.error("Failed to delete report")
    }
  }

  const tableColumns = [
    {
      key: "id",
      header: "ID",
      cell: (report: Report) => <span className="font-mono">#{report.id}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (report: Report) => <StatusBadge status={report.status} type="report" />,
    },
    {
      key: "location",
      header: "Location",
      cell: (report: Report) => (
        <span className="font-mono text-xs">
          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (report: Report) => formatDistanceToNow(new Date(report.report_date), { addSuffix: true }),
    },
    {
      key: "description",
      header: "Description",
      cell: (report: Report) => <span className="line-clamp-1 max-w-[200px]">{report.description || "-"}</span>,
      className: "hidden md:table-cell",
    },
  ]

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Error loading reports"
        description="Failed to load reports. Please try again."
        action={{ label: "Retry", onClick: () => mutate() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground">Track and manage your dumping reports</p>
        </div>
        {showUploadButton && (
          <Link href="/reports/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={ReportStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ReportStatus.PROCESSING}>Processing</SelectItem>
              <SelectItem value={ReportStatus.ANALYZED}>Analyzed</SelectItem>
              <SelectItem value={ReportStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner text="Loading reports..." />
      ) : !filteredReports?.length ? (
        <EmptyState
          icon={FileText}
          title="No reports found"
          description={
            statusFilter !== "all" ? "No reports match the selected filter." : "You haven't submitted any reports yet."
          }
          action={showUploadButton ? { label: "Submit Report", onClick: () => router.push("/reports/new") } : undefined}
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} onView={handleViewReport} onDelete={handleDeleteReport} />
          ))}
        </div>
      ) : (
        <DataTable columns={tableColumns} data={filteredReports} onRowClick={handleViewReport} />
      )}

      {/* Detail Modal */}
      <ReportDetailModal report={selectedReport} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
    </div>
  )
}
