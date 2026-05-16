"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Map,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuthContext } from "@/contexts/auth-context"
import { UserRole } from "@/types"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface SidebarItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.OFFICER, UserRole.ADMIN],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    roles: [UserRole.CITIZEN, UserRole.OFFICER, UserRole.ADMIN],
  },
  {
    label: "Cases",
    href: "/cases",
    icon: Briefcase,
    roles: [UserRole.OFFICER, UserRole.ADMIN],
  },
  {
    label: "Map",
    href: "/map",
    icon: Map,
    roles: [UserRole.OFFICER, UserRole.ADMIN],
  },
]

const adminItems: SidebarItem[] = [
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: [UserRole.ADMIN],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: [UserRole.ADMIN],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuthContext()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = sidebarItems.filter((item) => user && item.roles.includes(user.role))

  const filteredAdminItems = adminItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex flex-col flex-1 py-4">
        {/* Main Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center px-2",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Admin Section */}
        {filteredAdminItems.length > 0 && (
          <>
            <Separator className="my-4 mx-3" />
            {!collapsed && (
              <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Admin</p>
            )}
            <nav className="flex flex-col gap-1 px-3">
              {filteredAdminItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        collapsed && "justify-center px-2",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full", collapsed ? "justify-center" : "justify-end")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
