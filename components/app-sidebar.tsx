"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { RecruitLogo } from "@/components/recruit-logo"
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

export function AppSidebar() {
  const { user, setUser } = useUser()
  const pathname = usePathname()
  const handleLogout = () => {
  localStorage.removeItem("recruitai-user")
  setUser(null as any)
  window.location.href = "/"
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 border-r border-sidebar-border bg-sidebar flex flex-col z-40 hidden md:flex">
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <Link href="/dashboard">
          <RecruitLogo className="sidebar" />
         </Link>
      </div>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {user?.name?.trim()?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">{user?.name ?? "Guest"}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
            <button onClick={handleLogout}
             className="mt-1 text-xs text-muted-foreground hover:text-sidebar-foreground text-left">
             Logout
           </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
