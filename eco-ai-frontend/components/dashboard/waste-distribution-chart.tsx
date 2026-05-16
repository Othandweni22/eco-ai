"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Package } from "lucide-react"

interface WasteDistributionChartProps {
  detailed: any
  isLoading?: boolean
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

function formatLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export function WasteDistributionChart({ detailed, isLoading }: WasteDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Waste Types Detected</CardTitle>
          <CardDescription>Most common waste categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="h-48 w-full bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const dist = detailed?.ai_performance?.waste_type_distribution ?? {}
  const data = Object.entries(dist)
    .map(([key, count]) => ({ name: formatLabel(key), raw: key, value: Number(count) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Waste Types Detected</CardTitle>
          <CardDescription>Most common waste categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
            No detection data for this period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Waste Types Detected</CardTitle>
        <CardDescription>
          Top {data.length} categories — last {detailed?.analysis_period_days ?? 30} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => [`${v} reports`, "Count"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map(entry => (
                <Cell key={entry.raw} fill={WASTE_COLOURS[entry.raw] || "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
