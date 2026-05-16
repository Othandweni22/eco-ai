"use client"

import type { AnalyticsData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface HotspotsListProps {
  analytics: AnalyticsData | undefined
  isLoading?: boolean
}

export function HotspotsList({ analytics, isLoading }: HotspotsListProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Hotspots</CardTitle>
          <CardDescription>Areas with most incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hotspots = analytics?.top_hotspots ?? []

  if (hotspots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Hotspots</CardTitle>
          <CardDescription>Areas with most incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">No hotspot data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Top Hotspots</CardTitle>
          <CardDescription>Areas with most incidents</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/map")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View Map
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hotspots.map((hotspot, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium font-mono">
                  {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">{hotspot.incident_count} incidents reported</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
