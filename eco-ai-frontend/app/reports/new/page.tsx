"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ReportUploadForm } from "@/components/reports/report-upload-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NewReportPage() {
  return (
    <AppLayout showFooter={false}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Report</h1>
            <p className="text-muted-foreground">Submit a new illegal dumping report</p>
          </div>
        </div>
        <ReportUploadForm />
      </div>
    </AppLayout>
  )
}
