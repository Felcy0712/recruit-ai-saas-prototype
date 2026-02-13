"use client"

import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bell, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RecruitLogo } from "@/components/recruit-logo"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"

import {
  LayoutDashboard,
  Briefcase,
  Users,
  ListChecks,
  CalendarClock,
  BarChart3,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/roles", label: "Roles", icon: Briefcase },
  { href: "/dashboard/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/shortlist", label: "Shortlist", icon: ListChecks },
  { href: "/dashboard/scheduling", label: "Scheduling", icon: CalendarClock },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
   if (user === null) {
    setChecking(false)
    router.push("/")
   } else {
    setChecking(false)
   }
  }, [user, router])
  if (checking) {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Loading dashboard...
    </div>)}

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4">
        <RecruitLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-14">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-foreground/70 hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="md:ml-60">
        {/* Top bar */}
        <header className="hidden md:flex sticky top-0 z-30 h-14 items-center justify-end gap-3 border-b border-border bg-background/80 backdrop-blur-md px-6">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4 text-foreground" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
            <span className="sr-only">Notifications</span>
          </Button>
          <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {user?.name?.trim()?.[0]?.toUpperCase() ?? "?"}
          </div>
        </header>

        <main className="p-4 md:p-6 pt-18 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
