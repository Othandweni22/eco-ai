"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ReportList } from "@/components/reports/report-list"

export default function ReportsPage() {
  return (
    <AppLayout showFooter={false}>
      <ReportList />
    </AppLayout>
  )
}
