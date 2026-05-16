"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Upload, X, Camera, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/constants"

interface ImageUploaderProps {
  onImageSelected: (file: File) => void
  onImageRemoved?: () => void
  maxSize?: number
  allowedTypes?: string[]
  previewUrl?: string
  className?: string
  disabled?: boolean
}

export function ImageUploader({
  onImageSelected,
  onImageRemoved,
  maxSize = MAX_FILE_SIZE,
  allowedTypes = ALLOWED_FILE_TYPES,
  previewUrl: initialPreviewUrl,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return "Invalid file type. Please upload a JPG, PNG, or WebP image."
      }
      if (file.size > maxSize) {
        return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
      }
      return null
    },
    [allowedTypes, maxSize],
  )

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onImageSelected(file)
    },
    [validateFile, onImageSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile, disabled],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const handleRemove = useCallback(() => {
    setPreviewUrl(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    onImageRemoved?.()
  }, [onImageRemoved])

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          isDragging && "border-primary bg-primary/5",
          !isDragging && !error && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          error && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          previewUrl && "border-solid border-muted",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={allowedTypes.join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative w-full h-full min-h-[200px]">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="h-full w-full rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{isDragging ? "Drop image here" : "Drag & drop or click to upload"}</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP (max {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={disabled}>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  // Mobile camera capture
                  if (inputRef.current) {
                    inputRef.current.capture = "environment"
                    inputRef.current.click()
                  }
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
