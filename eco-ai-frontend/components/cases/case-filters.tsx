"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CASE_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants"
import { Filter, X, LayoutGrid, List, Calendar } from "lucide-react"

interface CaseFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  priorityFilter: string
  onPriorityChange: (value: string) => void
  viewMode: "kanban" | "table" | "calendar"
  onViewModeChange: (mode: "kanban" | "table" | "calendar") => void
}

export function CaseFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  viewMode,
  onViewModeChange,
}: CaseFiltersProps) {
  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || searchQuery

  const clearFilters = () => {
    onSearchChange("")
    onStatusChange("all")
    onPriorityChange("all")
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap gap-3">
        <Input
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-64"
        />

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={viewMode === "kanban" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("kanban")}
          title="Kanban View"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "table" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("table")}
          title="Table View"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "calendar" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("calendar")}
          title="Calendar View"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
