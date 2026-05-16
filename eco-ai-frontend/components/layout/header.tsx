"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Menu, MapPin, FileText, LayoutDashboard, Briefcase, Map, LogOut, User, Plus, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuthContext } from "@/contexts/auth-context"
import { UserRole, type WebSocketMessage } from "@/types"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { formatDistanceToNow } from "date-fns"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [UserRole.OFFICER, UserRole.ADMIN] },
  { label: "Reports",   href: "/reports",   icon: FileText,       roles: [UserRole.CITIZEN, UserRole.OFFICER, UserRole.ADMIN] },
  { label: "Cases",     href: "/cases",     icon: Briefcase,      roles: [UserRole.OFFICER, UserRole.ADMIN] },
  { label: "Map",       href: "/map",       icon: Map,            roles: [UserRole.OFFICER, UserRole.ADMIN] },
]

interface Notification {
  id: string
  title: string
  body: string
  timestamp: Date
  read: boolean
  type: string
}

function buildNotification(msg: WebSocketMessage): Notification {
  const titles: Record<string, string> = {
    high_priority_case: "⚠️ High priority case",
    NEW_REPORT:         "New report submitted",
    REPORT_ANALYZED:    "Report analysed",
    CASE_UPDATED:       "Case updated",
    CASE_ASSIGNED:      "Case assigned to you",
    CLEANUP_SCHEDULED:  "Cleanup scheduled",
  }
  const bodies: Record<string, (d: any) => string> = {
    high_priority_case: d => `Case #${d.case_id} — priority score ${d.priority_score} (${d.priority_level})`,
    NEW_REPORT:         d => `Report #${d.report_id} submitted`,
    REPORT_ANALYZED:    d => `Report #${d.report_id} analysed`,
    CASE_UPDATED:       d => `Case #${d.case_id} status changed`,
    CASE_ASSIGNED:      d => `Case #${d.case_id} assigned`,
    CLEANUP_SCHEDULED:  d => `Cleanup for case #${d.case_id} scheduled`,
  }
  return {
    id:        `${msg.type}-${Date.now()}`,
    title:     titles[msg.type] || msg.type,
    body:      bodies[msg.type]?.(msg.data) ?? JSON.stringify(msg.data).slice(0, 80),
    timestamp: new Date(msg.timestamp),
    read:      false,
    type:      msg.type,
  }
}

export function Header() {
  const { user, logout, isAuthenticated } = useAuthContext()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications]   = useState<Notification[]>([])
  const [notifOpen, setNotifOpen]           = useState(false)

  const unread = notifications.filter(n => !n.read).length

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    setNotifications(prev => [buildNotification(msg), ...prev].slice(0, 20))
  }, [])

  const { isConnected } = useWebSocket({
    onMessage: handleMessage,
    autoReconnect: true,
  })

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role))

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden font-semibold text-lg md:inline-block">DumpWatch</span>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {filteredNavItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm"
                    className={cn("gap-2", isActive && "bg-secondary font-medium")}>
                    <Icon className="h-4 w-4" />{item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Quick report for citizens */}
          {user?.role === UserRole.CITIZEN && (
            <Link href="/reports/new" className="hidden sm:block">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />Report Dumping
              </Button>
            </Link>
          )}

          {/* Notifications — real WebSocket data */}
          {isAuthenticated && (
            <DropdownMenu open={notifOpen} onOpenChange={open => { setNotifOpen(open); if (open) markAllRead() }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <Badge variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unread > 9 ? "9+" : unread}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <span className={cn("text-xs font-normal", isConnected ? "text-green-500" : "text-muted-foreground")}>
                    {isConnected ? "● Live" : "○ Connecting..."}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet.
                      <br />
                      <span className="text-xs">New reports and high-priority cases will appear here.</span>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 p-3">
                        <p className={cn("text-sm font-medium", !n.read && "text-primary")}>{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                        </p>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-xs text-muted-foreground"
                      onClick={() => setNotifications([])}>
                      Clear all
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User menu */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="w-fit mt-1 capitalize">{user.role}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/register"><Button size="sm">Get Started</Button></Link>
            </div>
          )}

          {/* Mobile menu */}
          {isAuthenticated && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-2 mt-6">
                  {filteredNavItems.map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant={isActive ? "secondary" : "ghost"}
                          className={cn("w-full justify-start gap-3", isActive && "bg-secondary font-medium")}>
                          <Icon className="h-5 w-5" />{item.label}
                        </Button>
                      </Link>
                    )
                  })}
                  {user?.role === UserRole.CITIZEN && (
                    <Link href="/reports/new" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start gap-3 mt-4">
                        <Plus className="h-5 w-5" />Report Dumping
                      </Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
