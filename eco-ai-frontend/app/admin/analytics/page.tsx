"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useAuthContext } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { UserRole } from "@/types"
import { api } from "@/lib/api"
import useSWR from "swr"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts"
import {
  BarChart3, FileText, Briefcase, Cpu, Target,
  Clock, TrendingUp, AlertTriangle, Package, MapPin,
} from "lucide-react"

// ── colour maps ────────────────────────────────────────────────────────────
const PRIORITY_COLOURS: Record<string, string> = {
  critical: "#dc2626",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
  monitor:  "#3b82f6",
}

const STATUS_COLOURS: Record<string, string> = {
  pending:    "#6b7280",
  processing: "#3b82f6",
  analyzed:   "#22c55e",
  rejected:   "#ef4444",
}

const WASTE_COLOURS: Record<string, string> = {
  plastic_waste:       "#3b82f6",
  garbage_bags:        "#6366f1",
  organic_waste:       "#22c55e",
  hazardous_materials: "#ef4444",
  metal_scrap:         "#f97316",
  construction_waste:  "#a78bfa",
  electronics:         "#dc2626",
  tires:               "#78716c",
  furniture:           "#eab308",
  clothing_textiles:   "#ec4899",
  green_waste:         "#84cc16",
  mattress:            "#f59e0b",
  vehicle_part:        "#0ea5e9",
  pallets:             "#10b981",
  appliances:          "#8b5cf6",
}

function fmt(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

// ── stat tile ──────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, icon: Icon, colour = "bg-primary/10 text-primary" }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; colour?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colour}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── main page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [days, setDays] = useState("30")

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login")
      else if (user?.role !== UserRole.ADMIN) router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, user, router])

  // Basic analytics (totals, status breakdown, hotspots)
  const { data: basic, isLoading: basicLoading } = useSWR(
    isAuthenticated && user?.role === UserRole.ADMIN ? "analytics-basic" : null,
    () => api.analytics.get(),
    { refreshInterval: 60_000 }
  )

  // Detailed analytics (AI metrics, waste distribution, period filters)
  const { data: detailed, isLoading: detailedLoading } = useSWR(
    isAuthenticated && user?.role === UserRole.ADMIN ? ["analytics-detailed", days] : null,
    () => api.analytics.getDetailed(Number(days)),
    { refreshInterval: 60_000 }
  )

  if (authLoading || user?.role !== UserRole.ADMIN) return null

  const ai = detailed?.ai_performance ?? {}

  // Charts data
  const statusData = basic?.reports_by_status
    ? Object.entries(basic.reports_by_status).map(([name, value]) => ({
        name: fmt(name), value: Number(value), colour: STATUS_COLOURS[name] ?? "#6b7280",
      }))
    : []

  const priorityData = basic?.cases_by_priority
    ? Object.entries(basic.cases_by_priority)
        .filter(([, v]) => Number(v) > 0)
        .map(([name, value]) => ({
          name: fmt(name), value: Number(value),
          colour: PRIORITY_COLOURS[name] ?? "#6b7280",
        }))
    : []

  const wasteData = ai.waste_type_distribution
    ? Object.entries(ai.waste_type_distribution)
        .map(([key, count]) => ({ name: fmt(key), raw: key, value: Number(count) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12)
    : []

  const priorityDistData = ai.priority_distribution
    ? Object.entries(ai.priority_distribution)
        .filter(([, v]) => Number(v) > 0)
        .map(([name, value]) => ({
          name: fmt(name), value: Number(value),
          colour: PRIORITY_COLOURS[name] ?? "#6b7280",
        }))
    : []

  const isLoading = basicLoading || detailedLoading

  return (
    <AppLayout showSidebar>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />Analytics
            </h1>
            <p className="text-muted-foreground">System-wide statistics and AI performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Period:</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Overview stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total Reports"    value={basic?.total_reports ?? "—"}
            icon={FileText}    colour="bg-blue-500/10 text-blue-500" />
          <StatTile label="Total Cases"
            value={basic?.cases_by_priority
              ? Object.values(basic.cases_by_priority).reduce((s, v) => s + Number(v), 0)
              : "—"}
            icon={Briefcase}   colour="bg-purple-500/10 text-purple-500" />
          <StatTile label="High/Critical Cases"
            value={(basic?.cases_by_priority?.high ?? 0) + (basic?.cases_by_priority?.critical ?? 0)}
            icon={AlertTriangle} colour="bg-red-500/10 text-red-500"
            sub="Require attention" />
          <StatTile label="Avg Response Time"
            value={basic?.avg_response_time ? `${Math.round(basic.avg_response_time)}h` : "N/A"}
            icon={Clock}       colour="bg-green-500/10 text-green-500" />
        </div>

        {/* ── AI performance stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Reports Processed (AI)"
            value={ai.total_processed ?? "—"}
            icon={Cpu}    colour="bg-indigo-500/10 text-indigo-500"
            sub={`Last ${days} days`} />
          <StatTile label="Detection Rate"
            value={ai.detection_rate != null ? `${ai.detection_rate}%` : "—"}
            icon={TrendingUp} colour="bg-teal-500/10 text-teal-500" />
          <StatTile label="Avg Confidence"
            value={ai.avg_confidence != null ? `${(ai.avg_confidence * 100).toFixed(1)}%` : "—"}
            icon={Target}  colour="bg-orange-500/10 text-orange-500" />
          <StatTile label="Avg Processing Time"
            value={ai.avg_processing_time != null ? `${ai.avg_processing_time.toFixed(2)}s` : "—"}
            icon={Clock}   colour="bg-cyan-500/10 text-cyan-500" />
        </div>

        {/* ── Charts row 1 ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Reports by status */}
          <Card>
            <CardHeader>
              <CardTitle>Reports by Status</CardTitle>
              <CardDescription>All time breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[260px] bg-muted animate-pulse rounded" />
              ) : statusData.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusData.map(e => <Cell key={e.name} fill={e.colour} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cases by priority */}
          <Card>
            <CardHeader>
              <CardTitle>Cases by Priority</CardTitle>
              <CardDescription>All time breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[260px] bg-muted animate-pulse rounded" />
              ) : priorityData.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">No case data</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {priorityData.map(e => <Cell key={e.name} fill={e.colour} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Charts row 2 ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Waste type distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Waste Types Detected</CardTitle>
              <CardDescription>Top categories — last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[320px] bg-muted animate-pulse rounded" />
              ) : wasteData.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">
                  No detection data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={wasteData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => [`${v} reports`, "Count"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {wasteData.map(e => <Cell key={e.raw} fill={WASTE_COLOURS[e.raw] || "#6b7280"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* AI priority distribution in period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />AI Priority Distribution</CardTitle>
              <CardDescription>Scored reports — last {days} days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-7 bg-muted animate-pulse rounded" />)}
                </div>
              ) : priorityDistData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                  No data for this period
                </div>
              ) : (
                <>
                  {/* stacked bar */}
                  {(() => {
                    const total = priorityDistData.reduce((s, d) => s + d.value, 0)
                    return (
                      <div className="flex h-4 w-full rounded-full overflow-hidden gap-0.5 mb-4">
                        {priorityDistData.map(d => (
                          <div key={d.name} style={{ width: `${(d.value / total) * 100}%`, background: d.colour }}
                            title={`${d.name}: ${d.value}`} className="transition-all" />
                        ))}
                      </div>
                    )
                  })()}

                  {/* breakdown rows */}
                  <div className="space-y-3">
                    {priorityDistData.map(d => {
                      const total = priorityDistData.reduce((s, e) => s + e.value, 0)
                      const pct   = total > 0 ? Math.round((d.value / total) * 100) : 0
                      return (
                        <div key={d.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.colour }} />
                              <span>{d.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>{d.value} reports</span>
                              <span className="text-xs">({pct}%)</span>
                            </div>
                          </div>
                          <Progress value={pct} className="h-1.5"
                            style={{ "--progress-fill": d.colour } as any} />
                        </div>
                      )
                    })}
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total reports in period</span>
                    <span className="font-medium">{ai.total_processed ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>With detections</span>
                    <span className="font-medium">{ai.reports_with_detections ?? 0}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Hotspots ── */}
        {basic?.top_hotspots && basic.top_hotspots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />Top Dump Site Hotspots
              </CardTitle>
              <CardDescription>Locations with the most reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {basic.top_hotspots.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">
                        {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}
                      </p>
                      <p className="text-xs text-muted-foreground">{h.incident_count} incidents</p>
                    </div>
                    <Badge variant="secondary">{h.incident_count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  )
}
