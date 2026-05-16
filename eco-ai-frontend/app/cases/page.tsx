"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { AppLayout } from "@/components/layout/app-layout"
import { CaseKanban } from "@/components/cases/case-kanban"
import { CaseTable } from "@/components/cases/case-table"
import { CaseCalendar } from "@/components/cases/case-calendar"
import { CaseFilters } from "@/components/cases/case-filters"
import { CaseDetailModal } from "@/components/cases/case-detail-modal"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { useAuthContext } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { type Case, type User, UserRole } from "@/types"
import { Briefcase } from "lucide-react"

export default function CasesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()

  const [viewMode,       setViewMode]       = useState<"kanban" | "table" | "calendar">("kanban")
  const [searchQuery,    setSearchQuery]    = useState("")
  const [statusFilter,   setStatusFilter]   = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedCase,   setSelectedCase]   = useState<Case | null>(null)
  const [isDetailOpen,   setIsDetailOpen]   = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login")
      else if (user?.role === UserRole.CITIZEN) router.push("/reports")
    }
  }, [authLoading, isAuthenticated, user, router])

  const { data: cases, isLoading, mutate } = useSWR(
    isAuthenticated && user?.role !== UserRole.CITIZEN
      ? ["cases", statusFilter, priorityFilter]
      : null,
    () => api.cases.getAll({
      status:         statusFilter   !== "all" ? statusFilter   : undefined,
      priority_level: priorityFilter !== "all" ? priorityFilter : undefined,
    }),
    { refreshInterval: 30_000 }
  )

  // Use admin.getOfficers (not users.getOfficers — same endpoint but correct namespace)
  const { data: officers } = useSWR<User[]>(
    isAuthenticated && user?.role !== UserRole.CITIZEN ? "officers" : null,
    () => api.admin.getOfficers()
  )

  const filteredCases = cases?.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.id.toString().includes(q) ||
      c.notes?.toLowerCase().includes(q) ||
      c.assigned_officer?.full_name?.toLowerCase().includes(q) ||
      c.assigned_officer?.email.toLowerCase().includes(q)
    )
  }) ?? []

  const handleViewCase = (caseItem: Case) => {
    setSelectedCase(caseItem)
    setIsDetailOpen(true)
  }

  if (authLoading || user?.role === UserRole.CITIZEN) return null

  return (
    <AppLayout showFooter={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Case Management</h1>
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : `${filteredCases.length} case${filteredCases.length !== 1 ? "s" : ""}`}
              {cases && filteredCases.length !== cases.length && ` of ${cases.length} total`}
            </p>
          </div>
        </div>

        <CaseFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {isLoading ? (
          <LoadingSpinner text="Loading cases..." />
        ) : filteredCases.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No cases found"
            description={
              statusFilter !== "all" || priorityFilter !== "all" || searchQuery
                ? "No cases match the selected filters. Try clearing the filters."
                : "No cases have been created yet. Cases are automatically created when reports are analysed with a priority score ≥ 30."
            }
          />
        ) : viewMode === "kanban" ? (
          <CaseKanban cases={filteredCases} onViewCase={handleViewCase} />
        ) : viewMode === "calendar" ? (
          <CaseCalendar cases={filteredCases} onViewCase={handleViewCase} />
        ) : (
          <CaseTable cases={filteredCases} onViewCase={handleViewCase} />
        )}

        <CaseDetailModal
          caseItem={selectedCase}
          officers={officers ?? []}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onUpdate={() => {
            mutate()
            setIsDetailOpen(false)
          }}
        />
      </div>
    </AppLayout>
  )
}
