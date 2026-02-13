"use client"

import { useState, useCallback, useEffect } from "react"
import {
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  Play,
  ShieldCheck,
  Settings,
  Bell,
  RefreshCw,
  LogOut,
  User,
  X,
  Check,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { batchControls, queryRepository, getViolationStats } from "@/lib/data-store"
import { formatDateTime } from "@/lib/utils"
import { AuthProvider, useAuth, type Notification } from "@/lib/auth-context"
import CommandCenterPage from "./command-center/page"
import RulesRepositoryPage from "./agent-network/page"
import BatchControlPage from "./operations/page"
import ComplianceResultsPage from "./intelligence/page"
import SiteMappingPage from "./systems/page"
import LandingPage from "@/components/landing-page"
import LoginPage from "@/components/login-page"
import SignupPage from "@/components/signup-page"

type AppPage = "landing" | "login" | "signup" | "dashboard"

function AppRouter() {
  const { isAuthenticated, user, logout, notifications, markNotificationRead, clearNotifications } = useAuth()
  const [currentPage, setCurrentPage] = useState<AppPage>("landing")
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [, forceUpdate] = useState(0)

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent SSR/client mismatch by rendering a shell until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm tracking-wider">INITIALIZING DQ ENGINE</p>
        </div>
      </div>
    )
  }

  // If authenticated and on auth pages, go to dashboard
  const page = isAuthenticated ? "dashboard" : currentPage === "dashboard" ? "landing" : currentPage

  if (page === "landing") {
    return <LandingPage onNavigate={(p) => setCurrentPage(p)} />
  }
  if (page === "login") {
    return (
      <LoginPage
        onNavigate={(p) => setCurrentPage(p)}
        onLoginSuccess={() => setCurrentPage("dashboard")}
      />
    )
  }
  if (page === "signup") {
    return (
      <SignupPage
        onNavigate={(p) => setCurrentPage(p)}
        onSignupSuccess={() => setCurrentPage("dashboard")}
      />
    )
  }

  // Dashboard
  const stats = getViolationStats()
  const runningBatches = batchControls.filter((b) => b.status === "RUNNING").length
  const unreadCount = notifications.filter((n) => !n.read).length

  const getSectionLabel = () => {
    switch (activeSection) {
      case "overview": return "DASHBOARD"
      case "rules": return "RULES REPOSITORY"
      case "batches": return "BATCH CONTROL"
      case "compliance": return "COMPLIANCE & RESULTS"
      case "settings": return "SITE MAPPING & CONFIG"
      default: return "DASHBOARD"
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
      case "error": return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      default: return <Info className="w-4 h-4 text-neutral-400 flex-shrink-0" />
    }
  }

  const handleLogout = () => {
    logout()
    setCurrentPage("landing")
    setActiveSection("overview")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">DQ ENGINE</h1>
              <p className="text-neutral-500 text-xs">Data Quality Command</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "overview", icon: LayoutDashboard, label: "DASHBOARD" },
              { id: "rules", icon: BookOpen, label: "RULES REPOSITORY" },
              { id: "batches", icon: Play, label: "BATCH CONTROL" },
              { id: "compliance", icon: ShieldCheck, label: "COMPLIANCE" },
              { id: "settings", icon: Settings, label: "SITE MAPPING" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${runningBatches > 0 ? "bg-orange-500 animate-pulse" : "bg-white"}`} />
                <span className="text-xs text-white">
                  {runningBatches > 0 ? "BATCH RUNNING" : "SYSTEM IDLE"}
                </span>
              </div>
              <div className="text-xs text-neutral-500 space-y-0.5">
                <div>RULES: {queryRepository.length} ACTIVE</div>
                <div>VIOLATIONS: {stats.violated} / {stats.total}</div>
                <div>RATE: {stats.violationRate.toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <div className="h-14 bg-neutral-900 border-b border-neutral-700 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              DQ ENGINE / <span className="text-orange-500">{getSectionLabel()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 hidden md:inline">
              {stats.violated} violations
            </span>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500 relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 bg-neutral-900 border-neutral-700" align="end">
                <div className="flex items-center justify-between p-3 border-b border-neutral-800">
                  <h3 className="text-sm font-medium text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-orange-500 hover:text-orange-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-neutral-500">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`w-full text-left p-3 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors ${
                          !n.read ? "bg-neutral-800/30" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-medium truncate ${n.read ? "text-neutral-400" : "text-white"}`}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-neutral-600 mt-1 font-mono">
                              {formatDateTime(n.timestamp)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-orange-500"
              onClick={refresh}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-neutral-300 hover:text-white px-2">
                  <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium hidden md:inline">{user?.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-neutral-900 border-neutral-700 w-56" align="end">
                <div className="px-3 py-2 border-b border-neutral-800">
                  <p className="text-sm text-white font-medium">{user?.fullName}</p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                  <Badge className="mt-1 bg-neutral-800 text-neutral-300 text-[10px]">{user?.role}</Badge>
                </div>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "overview" && <CommandCenterPage />}
          {activeSection === "rules" && <RulesRepositoryPage />}
          {activeSection === "batches" && <BatchControlPage />}
          {activeSection === "compliance" && <ComplianceResultsPage />}
          {activeSection === "settings" && <SiteMappingPage />}
        </div>
      </div>
    </div>
  )
}

export default function DQDashboard() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
