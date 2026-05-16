"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { UserRole } from "@/types"
import { api } from "@/lib/api"
import useSWR from "swr"
import { toast } from "sonner"
import { Settings, Bell, Zap, Map, Save, RotateCcw, CheckCircle, AlertCircle, Cpu } from "lucide-react"

// Settings that are stored locally (no backend endpoint for these yet)
const STORAGE_KEY = "eco_admin_settings"

const defaultSettings = {
  // General
  siteName: "Illegal Dumping Reporting System",
  siteDescription: "Community-driven environmental protection platform",
  contactEmail: "admin@example.com",
  timezone: "Africa/Harare",
  // Notifications (frontend preference only)
  notifyOnNewReport: true,
  notifyOnStatusChange: true,
  notifyOnCaseAssignment: true,
  // Map
  defaultMapLat: "-19.5",
  defaultMapLng: "29.8",
  defaultZoom: "12",
  clusteringEnabled: true,
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login")
      else if (user?.role !== UserRole.ADMIN) router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, user, router])

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) })
    } catch {}
  }, [])

  // Fetch live AI model info from backend
  const { data: modelInfo } = useSWR(
    isAuthenticated && user?.role === UserRole.ADMIN ? "model-info" : null,
    () => api.admin.getModelInfo(),
    { revalidateOnFocus: false }
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    localStorage.removeItem(STORAGE_KEY)
    toast.info("Settings reset to defaults")
  }

  const set = (key: keyof typeof defaultSettings, value: any) =>
    setSettings(s => ({ ...s, [key]: value }))

  if (authLoading || user?.role !== UserRole.ADMIN) return null

  return (
    <AppLayout showSidebar>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" /><span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" /><span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Cpu className="h-4 w-4" /><span className="hidden sm:inline">AI Model</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" /><span className="hidden sm:inline">Map</span>
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />General Settings</CardTitle>
                <CardDescription>Basic system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" value={settings.siteName}
                      onChange={e => set("siteName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" value={settings.contactEmail}
                      onChange={e => set("contactEmail", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea id="siteDescription" value={settings.siteDescription}
                    onChange={e => set("siteDescription", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={v => set("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Harare">Africa/Harare (CAT)</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Preferences</CardTitle>
                <CardDescription>
                  These control which WebSocket events trigger in-app notifications.
                  Real-time notifications are delivered via the WebSocket connection when reports are submitted and analysed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "notifyOnNewReport",      label: "New Report Submitted",  desc: "Alert when a citizen submits a new report" },
                  { key: "notifyOnStatusChange",   label: "Report Status Change",  desc: "Alert when a report status is updated" },
                  { key: "notifyOnCaseAssignment", label: "Case Assignment",       desc: "Alert when a case is assigned to an officer" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={settings[key as keyof typeof defaultSettings] as boolean}
                      onCheckedChange={v => set(key as keyof typeof defaultSettings, v)}
                    />
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    WebSocket connection delivers real-time alerts for high-priority cases (score ≥ 70).
                    These are sent automatically by the backend — no configuration required.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Model — live data from backend */}
          <TabsContent value="ai">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />AI Model Status</CardTitle>
                  <CardDescription>Live information from the running model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modelInfo ? (
                    <>
                      <div className="flex items-center gap-2">
                        {modelInfo.status === "loaded"
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <AlertCircle className="h-5 w-5 text-red-500" />}
                        <span className="font-medium">
                          {modelInfo.status === "loaded" ? "Model loaded and ready" : "Model not loaded"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Model file</p>
                          <p className="text-sm font-mono font-medium truncate">{modelInfo.model_file || "—"}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Device</p>
                          <p className="text-sm font-medium uppercase">{modelInfo.device || "—"}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Number of classes</p>
                          <p className="text-sm font-medium">{modelInfo.num_classes ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground mb-1">Confidence threshold</p>
                          <p className="text-sm font-medium">
                            {modelInfo.conf_threshold != null
                              ? `${(modelInfo.conf_threshold * 100).toFixed(0)}%`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {modelInfo.classes && (
                        <div>
                          <p className="text-sm font-medium mb-2">Detected classes</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.values(modelInfo.classes as Record<string, string>).map(cls => (
                              <Badge key={cls} variant="secondary" className="text-xs">
                                {cls}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading model info...</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Confidence Threshold</CardTitle>
                  <CardDescription>
                    Current threshold: <code className="bg-muted px-1 rounded">CONF_THRESHOLD = 0.70</code> in{" "}
                    <code className="bg-muted px-1 rounded">app/services/ai_service.py</code>.
                    Lower values detect more items but increase false positives. Recommended range: 0.05–0.15 for field photos.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          {/* Map */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" />Map Settings</CardTitle>
                <CardDescription>Default map view when users open the map page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Default Latitude</Label>
                    <Input value={settings.defaultMapLat}
                      onChange={e => set("defaultMapLat", e.target.value)}
                      placeholder="-19.5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Longitude</Label>
                    <Input value={settings.defaultMapLng}
                      onChange={e => set("defaultMapLng", e.target.value)}
                      placeholder="29.8" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Zoom</Label>
                    <Select value={settings.defaultZoom} onValueChange={v => set("defaultZoom", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[8,9,10,11,12,13,14,15].map(z => (
                          <SelectItem key={z} value={String(z)}>
                            {z} — {z < 10 ? "Regional" : z < 13 ? "City" : "Neighbourhood"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Marker Clustering</p>
                    <p className="text-sm text-muted-foreground">Group nearby markers into clusters</p>
                  </div>
                  <Switch checked={settings.clusteringEnabled}
                    onCheckedChange={v => set("clusteringEnabled", v)} />
                </div>

                <p className="text-xs text-muted-foreground border-t pt-4">
                  These preferences are stored locally in your browser. To change the map default for all users,
                  update the <code className="bg-muted px-1 rounded">center</code> prop in{" "}
                  <code className="bg-muted px-1 rounded">components/map/map-container.tsx</code>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
