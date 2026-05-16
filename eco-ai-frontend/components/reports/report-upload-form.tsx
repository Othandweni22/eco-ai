"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/common/image-uploader"
import { LocationPicker } from "@/components/common/location-picker"
import { api } from "@/lib/api"
import type { Location } from "@/types"
import { toast } from "sonner"

interface ReportUploadFormProps {
  onSuccess?: (reportId: number) => void
}

export function ReportUploadForm({ onSuccess }: ReportUploadFormProps) {
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [reportId, setReportId] = useState<number | null>(null)

  const isValid = image && location

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image || !location) {
      toast.error("Missing required fields", {
        description: "Please upload an image and set a location",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("image", image)
      formData.append("latitude", location.latitude.toString())
      formData.append("longitude", location.longitude.toString())
      if (description.trim()) {
        formData.append("description", description.trim())
      }

      const report = await api.reports.create(formData)

      setIsSuccess(true)
      setReportId(report.id)
      toast.success("Report submitted!", {
        description: `Report #${report.id} is being processed`,
      })
      onSuccess?.(report.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit report"
      toast.error("Submission failed", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setImage(null)
    setLocation(null)
    setDescription("")
    setIsSuccess(false)
    setReportId(null)
  }

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Report Submitted Successfully!</h2>
              <p className="text-muted-foreground mt-1">
                Your report #{reportId} has been received and is being processed by our AI system.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4 w-full max-w-sm">
              <p className="text-sm font-medium">Tracking ID</p>
              <p className="text-2xl font-mono font-bold mt-1">#{reportId}</p>
              <p className="text-xs text-muted-foreground mt-2">Estimated processing time: 2-5 minutes</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => router.push("/reports")}>View My Reports</Button>
              <Button variant="outline" onClick={handleReset}>
                Submit Another
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Report Illegal Dumping</CardTitle>
        <CardDescription>
          Help keep our community clean by reporting illegal dumping. Upload a photo and mark the location.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>
              Photo of dumping site <span className="text-destructive">*</span>
            </Label>
            <ImageUploader onImageSelected={setImage} onImageRemoved={() => setImage(null)} disabled={isSubmitting} />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>
              Location <span className="text-destructive">*</span>
            </Label>
            <LocationPicker onLocationChange={setLocation} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what you see (e.g., type of waste, size of dump site, any hazards...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Providing details helps officers prioritize and respond more effectively.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By submitting, you confirm this is a genuine report of illegal dumping.
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
