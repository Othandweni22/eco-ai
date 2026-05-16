import type React from "react"
import { cn } from "@/lib/utils"
import { PriorityLevel } from "@/types"
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants"

interface PriorityBadgeProps {
  level: PriorityLevel
  score?: number
  variant?: "solid" | "outline" | "dot"
  showLabel?: boolean
  className?: string
}

// Define SVG icons directly to avoid import issues
const CriticalIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.206 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const HighIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MediumIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LowIcon = () => (
  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const priorityIcons: Record<PriorityLevel, React.ComponentType> = {
  [PriorityLevel.CRITICAL]: CriticalIcon,
  [PriorityLevel.HIGH]: HighIcon,
  [PriorityLevel.MEDIUM]: MediumIcon,
  [PriorityLevel.LOW]: LowIcon,
}

const outlineColors: Record<PriorityLevel, string> = {
  [PriorityLevel.CRITICAL]: "border-red-600 text-red-600 bg-red-50",
  [PriorityLevel.HIGH]: "border-orange-500 text-orange-600 bg-orange-50",
  [PriorityLevel.MEDIUM]: "border-yellow-500 text-yellow-600 bg-yellow-50",
  [PriorityLevel.LOW]: "border-green-500 text-green-600 bg-green-50",
}

const dotColors: Record<PriorityLevel, string> = {
  [PriorityLevel.CRITICAL]: "bg-red-600",
  [PriorityLevel.HIGH]: "bg-orange-500",
  [PriorityLevel.MEDIUM]: "bg-yellow-500",
  [PriorityLevel.LOW]: "bg-green-500",
}

export function PriorityBadge({ 
  level, 
  score, 
  variant = "solid", 
  showLabel = true, 
  className 
}: PriorityBadgeProps) {
  const Icon = priorityIcons[level]

  if (variant === "dot") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("h-2.5 w-2.5 rounded-full", dotColors[level])} />
        {showLabel && <span className="text-sm font-medium">{PRIORITY_LABELS[level]}</span>}
        {score !== undefined && <span className="text-xs text-muted-foreground font-mono">({score})</span>}
      </div>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "solid" && PRIORITY_COLORS[level],
        variant === "outline" && cn("border", outlineColors[level]),
        className,
      )}
    >
      {Icon && <Icon />}
      {showLabel && PRIORITY_LABELS[level]}
      {score !== undefined && <span className="font-mono">({score})</span>}
    </span>
  )
}