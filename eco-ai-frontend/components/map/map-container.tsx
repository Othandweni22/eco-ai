"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster"
import "leaflet.heat"
import type { Report } from "@/types"
import { PriorityLevel } from "@/types"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

// Derive priority from analysis.priority_score
function getReportPriority(report: Report): string {
  const score = report.analysis?.priority_score
  if (score === undefined) return "low"
  if (score >= 80) return "critical"
  if (score >= 60) return "high"
  if (score >= 40) return "medium"
  return "low"
}

const createPriorityIcon = (priority: string) => {
  const colors: Record<string, string> = {
    critical: "#dc2626",
    high:     "#ea580c",
    medium:   "#ca8a04",
    low:      "#16a34a",
  }
  const color = colors[priority] || "#6b7280"

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

interface MapContainerProps {
  reports: Report[]
  showHeatmap?: boolean
  showClusters?: boolean
  center?: [number, number]
  zoom?: number
  onReportSelect?: (report: Report) => void
  selectedReportId?: number
}

export function MapContainer({
  reports,
  showHeatmap = false,
  showClusters = true,
  center = [-19.5, 29.8],   // Zimbabwe default — change to your area
  zoom = 12,
  onReportSelect,
  selectedReportId,
}: MapContainerProps) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef     = useRef<L.MarkerClusterGroup | null>(null)
  const heatLayerRef   = useRef<L.HeatLayer | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, { center, zoom, zoomControl: false })
    L.control.zoom({ position: "topright" }).addTo(map)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const cls = count >= 100 ? "large" : count >= 10 ? "medium" : "small"
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${cls}`,
          iconSize: L.point(40, 40),
        })
      },
    })

    map.addLayer(markers)
    markersRef.current     = markers
    mapInstanceRef.current = map
    setIsMapReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markersRef.current     = null
      setIsMapReady(false)
    }
  }, [])

  // Update markers when reports change
  useEffect(() => {
    if (!isMapReady || !markersRef.current || !mapInstanceRef.current) return

    const markers = markersRef.current
    markers.clearLayers()

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return

      const priority = getReportPriority(report)
      const marker   = L.marker([report.latitude, report.longitude], {
        icon: createPriorityIcon(priority),
      })

      // Build detected items summary for popup
      let wasteHtml = ""
      if (report.analysis?.detected_items && report.analysis.detected_items.length > 0) {
        const items = report.analysis.detected_items.slice(0, 4)
        wasteHtml = `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${items.map(i => `<span style="font-size:10px;background:#f3f4f6;border-radius:9999px;padding:2px 6px;">${i.label}${i.count > 1 ? ` ×${i.count}` : ""}</span>`).join("")}
          ${report.analysis.detected_items.length > 4 ? `<span style="font-size:10px;color:#9ca3af;">+${report.analysis.detected_items.length - 4} more</span>` : ""}
        </div>`
      } else if (report.analysis?.waste_types) {
        const types = Object.keys(report.analysis.waste_types).slice(0, 3)
        wasteHtml = `<p style="font-size:11px;color:#6b7280;margin:0 0 8px 0;">${types.map(t => t.replace(/_/g," ")).join(", ")}</p>`
      }

      const priorityColors: Record<string, { bg: string; text: string }> = {
        critical: { bg: "#fef2f2", text: "#dc2626" },
        high:     { bg: "#fff7ed", text: "#ea580c" },
        medium:   { bg: "#fefce8", text: "#ca8a04" },
        low:      { bg: "#f0fdf4", text: "#16a34a" },
      }
      const pc = priorityColors[priority] || priorityColors.low

      const statusColors: Record<string, { bg: string; text: string }> = {
        analyzed:   { bg: "#f0fdf4", text: "#16a34a" },
        processing: { bg: "#eff6ff", text: "#2563eb" },
        pending:    { bg: "#f9fafb", text: "#6b7280" },
        rejected:   { bg: "#fef2f2", text: "#dc2626" },
      }
      const sc = statusColors[report.status] || statusColors.pending

      const popupContent = document.createElement("div")
      popupContent.innerHTML = `
        <div style="min-width:240px;font-family:system-ui,sans-serif;">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#1f2937;">
            Report #${report.id}
          </div>
          ${report.image_url ? `<img src="${report.image_url}" alt="Report" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ""}
          <div style="display:flex;gap:6px;margin-bottom:8px;">
            <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:${pc.bg};color:${pc.text};">${priority.toUpperCase()}</span>
            <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:${sc.bg};color:${sc.text};">${report.status.replace("_"," ").toUpperCase()}</span>
            ${report.analysis ? `<span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:#f3f4f6;color:#374151;">${report.analysis.priority_score}/100</span>` : ""}
          </div>
          ${wasteHtml}
          ${report.description ? `<p style="font-size:11px;color:#6b7280;margin:0 0 8px 0;line-height:1.4;">${report.description.substring(0,100)}${report.description.length > 100 ? "..." : ""}</p>` : ""}
          <div style="font-size:11px;color:#9ca3af;margin-bottom:8px;">
            ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}
          </div>
          <button
            onclick="window.dispatchEvent(new CustomEvent('selectReport',{detail:${report.id}}))"
            style="width:100%;padding:7px 12px;background:#2563eb;color:white;border:none;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;"
          >View Details</button>
        </div>
      `

      marker.bindPopup(popupContent, { maxWidth: 280, className: "custom-popup" })
      marker.on("click", () => onReportSelect?.(report))
      markers.addLayer(marker)
    })

    // Fly to selected report
    if (selectedReportId) {
      const sel = reports.find(r => r.id === selectedReportId)
      if (sel?.latitude && sel?.longitude) {
        mapInstanceRef.current.flyTo([sel.latitude, sel.longitude], 16, { duration: 1 })
      }
    }
  }, [reports, isMapReady, onReportSelect, selectedReportId])

  // Heatmap layer
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return

    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (showHeatmap && reports.length > 0) {
      const heatData = reports
        .filter(r => r.latitude && r.longitude)
        .map(r => {
          const score    = r.analysis?.priority_score ?? 30
          const intensity = score >= 80 ? 1.0 : score >= 60 ? 0.75 : score >= 40 ? 0.5 : 0.25
          return [r.latitude, r.longitude, intensity] as [number, number, number]
        })

      const heatLayer = (L as any).heatLayer(heatData, {
        radius: 25, blur: 15, maxZoom: 17,
        gradient: { 0.2: "#22c55e", 0.4: "#eab308", 0.6: "#f97316", 0.8: "#ef4444", 1.0: "#dc2626" },
      })
      heatLayer.addTo(mapInstanceRef.current)
      heatLayerRef.current = heatLayer
    }
  }, [showHeatmap, reports, isMapReady])

  // Cluster visibility toggle
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markersRef.current) return
    if (showClusters) {
      if (!mapInstanceRef.current.hasLayer(markersRef.current))
        mapInstanceRef.current.addLayer(markersRef.current)
    } else {
      if (mapInstanceRef.current.hasLayer(markersRef.current))
        mapInstanceRef.current.removeLayer(markersRef.current)
    }
  }, [showClusters, isMapReady])

  // Popup button → select report
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const report = reports.find(r => r.id === e.detail)
      if (report && onReportSelect) onReportSelect(report)
    }
    window.addEventListener("selectReport", handler as EventListener)
    return () => window.removeEventListener("selectReport", handler as EventListener)
  }, [reports, onReportSelect])

  return (
    <>
      <style jsx global>{`
        .marker-cluster { background: rgba(37,99,235,0.2); border-radius:50%; }
        .marker-cluster div { width:30px;height:30px;margin:5px;background:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center; }
        .marker-cluster span { color:white;font-size:12px;font-weight:600; }
        .marker-cluster-small { background:rgba(34,197,94,0.3); }
        .marker-cluster-small div { background:#22c55e; }
        .marker-cluster-medium { background:rgba(234,179,8,0.3); }
        .marker-cluster-medium div { background:#eab308; }
        .marker-cluster-large { background:rgba(239,68,68,0.3); }
        .marker-cluster-large div { background:#ef4444; }
        .custom-popup .leaflet-popup-content-wrapper { border-radius:12px;padding:0; }
        .custom-popup .leaflet-popup-content { margin:12px; }
        .custom-popup .leaflet-popup-tip { background:white; }
        .custom-marker { background:transparent;border:none; }
      `}</style>
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </>
  )
}
