"use client"

import type { Case } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PriorityBadge } from "@/components/common/priority-badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { cn } from "@/lib/utils"

interface CaseCalendarProps {
  cases: Case[]
  onViewCase: (caseItem: Case) => void
}

export function CaseCalendar({ cases, onViewCase }: CaseCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getCasesForDay = (day: Date) => {
    return cases.filter((c) => c.scheduled_date && isSameDay(new Date(c.scheduled_date), day))
  }

  const today = new Date()

  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {days.map((day) => {
            const dayCases = getCasesForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, today)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] bg-background p-2",
                  !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayCases.slice(0, 3).map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => onViewCase(caseItem)}
                      className="w-full text-left text-xs p-1 rounded bg-muted hover:bg-accent truncate flex items-center gap-1"
                    >
                      <PriorityBadge level={caseItem.priority_level} showLabel={false} variant="dot" />
                      <span className="truncate">#{caseItem.id}</span>
                    </button>
                  ))}
                  {dayCases.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">+{dayCases.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
