"use client"

import type { ReactNode } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"
import { useAuthContext } from "@/contexts/auth-context"
import { UserRole } from "@/types"

interface AppLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showFooter?: boolean
}

export function AppLayout({ children, showSidebar = true, showFooter = true }: AppLayoutProps) {
  const { user, isAuthenticated } = useAuthContext()

  // Only show sidebar for officers and admins
  const shouldShowSidebar =
    showSidebar && isAuthenticated && user && [UserRole.OFFICER, UserRole.ADMIN].includes(user.role)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {shouldShowSidebar && <Sidebar />}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
      {showFooter && <Footer />}
    </div>
  )
}
