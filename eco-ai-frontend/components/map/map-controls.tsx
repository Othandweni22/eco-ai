"use client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Layers, Filter, Flame, Grid3X3 } from "lucide-react"

interface MapControlsProps {
  showHeatmap: boolean
  onHeatmapChange: (show: boolean) => void
  showClusters: boolean
  onClustersChange: (show: boolean) => void
  priorityFilter: string
  onPriorityFilterChange: (priority: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  dateRange: string
  onDateRangeChange: (range: string) => void
}

export function MapControls({
  showHeatmap, onHeatmapChange,
  showClusters, onClustersChange,
  priorityFilter, onPriorityFilterChange,
  statusFilter, onStatusFilterChange,
  dateRange, onDateRangeChange,
}: MapControlsProps) {
  return (
    <Card className="absolute left-4 top-4 z-[1000] w-72 shadow-lg">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Map Controls</h3>
        </div>

        <div className="space-y-4">
          {/* Layer toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <Label htmlFor="heatmap" className="text-sm">Heatmap</Label>
              </div>
              <Switch id="heatmap" checked={showHeatmap} onCheckedChange={onHeatmapChange} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-blue-500" />
                <Label htmlFor="clusters" className="text-sm">Clusters</Label>
              </div>
              <Switch id="clusters" checked={showClusters} onCheckedChange={onClustersChange} />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>

            <div className="space-y-3">
              {/* Priority */}
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Priority</Label>
                <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical (80–100)</SelectItem>
                    <SelectItem value="high">High (60–79)</SelectItem>
                    <SelectItem value="medium">Medium (40–59)</SelectItem>
                    <SelectItem value="low">Low (0–39)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="analyzed">Analyzed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Time Range</Label>
                <Select value={dateRange} onValueChange={onDateRangeChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="border-t pt-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Priority Legend</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-600" /><span>Critical</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-orange-500" /><span>High</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-yellow-500" /><span>Medium</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-green-500" /><span>Low</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}