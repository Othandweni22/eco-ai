"use client"

import { useState, useEffect, useCallback } from "react"
import { MapPin, Crosshair, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Location } from "@/types"

interface LocationPickerProps {
  onLocationChange: (location: Location) => void
  initialLocation?: Location
  className?: string
}

export function LocationPicker({ onLocationChange, initialLocation, className }: LocationPickerProps) {
  const [location, setLocation] = useState<Location | null>(initialLocation || null)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualLat, setManualLat] = useState(initialLocation?.latitude.toString() || "")
  const [manualLng, setManualLng] = useState(initialLocation?.longitude.toString() || "")

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLocation(newLocation)
        setManualLat(newLocation.latitude.toString())
        setManualLng(newLocation.longitude.toString())
        onLocationChange(newLocation)
        setIsLocating(false)
      },
      (err) => {
        setError(err.message || "Unable to retrieve your location")
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [onLocationChange])

  // Auto-detect location on mount if no initial location
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation()
    }
  }, [initialLocation, getCurrentLocation])

  const handleManualSubmit = useCallback(() => {
    const lat = Number.parseFloat(manualLat)
    const lng = Number.parseFloat(manualLng)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Please enter valid coordinates")
      return
    }

    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90")
      return
    }

    if (lng < -180 || lng > 180) {
      setError("Longitude must be between -180 and 180")
      return
    }

    const newLocation = { latitude: lat, longitude: lng }
    setLocation(newLocation)
    setError(null)
    onLocationChange(newLocation)
    setManualMode(false)
  }, [manualLat, manualLng, onLocationChange])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Location Display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                {location ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No location set</p>
                )}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} disabled={isLocating}>
              {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
              {isLocating ? "Locating..." : "Detect Location"}
            </Button>
          </div>

          {/* Mini Map Preview */}
          {location && (
            <div className="mt-4 h-32 w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+3b82f6(${location.longitude},${location.latitude})/${location.longitude},${location.latitude},14,0/400x128@2x?access_token=pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2xhY2Vob2xkZXIifQ.placeholder`}
                alt="Location preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if mapbox fails
                  e.currentTarget.src = `/placeholder.svg?height=128&width=400&query=map location ${location.latitude} ${location.longitude}`
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setManualMode(!manualMode)}
        className="text-muted-foreground"
      >
        {manualMode ? "Hide manual entry" : "Enter coordinates manually"}
      </Button>

      {/* Manual Entry Form */}
      {manualMode && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 40.7128"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., -74.006"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
            </div>
            <Button type="button" onClick={handleManualSubmit} className="w-full">
              Set Location
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
