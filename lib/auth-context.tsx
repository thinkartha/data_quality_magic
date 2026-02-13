"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface User {
  username: string
  fullName: string
  role: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => { success: boolean; error?: string }
  signup: (username: string, password: string, fullName: string, email: string) => { success: boolean; error?: string }
  logout: () => void
  notifications: Notification[]
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  type: "info" | "warning" | "error" | "success"
  read: boolean
}

// Hardcoded users + dynamic signup store
const INITIAL_USERS: { username: string; password: string; fullName: string; role: string; email: string }[] = [
  { username: "admin", password: "admin123", fullName: "DQ Admin", role: "Administrator", email: "admin@dqengine.io" },
  { username: "analyst", password: "analyst123", fullName: "Data Analyst", role: "Analyst", email: "analyst@dqengine.io" },
]

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Batch BATCH-UUID-0003 Completed",
    message: "DQ Nightly Run finished with status SUCCESS. 8 rules evaluated, 0 failures.",
    timestamp: "2025-06-18T09:15:00Z",
    type: "success",
    read: false,
  },
  {
    id: "n2",
    title: "New Rule Added",
    message: 'Rule "DQ-4 Duplicate Natural Key" was added to the repository by seed.',
    timestamp: "2025-06-17T14:30:00Z",
    type: "info",
    read: false,
  },
  {
    id: "n3",
    title: "High Violation Rate Detected",
    message: "Site SITE-003 exceeded 40% violation rate in the latest batch run.",
    timestamp: "2025-06-17T11:00:00Z",
    type: "warning",
    read: false,
  },
  {
    id: "n4",
    title: "Batch BATCH-UUID-0004 Failed",
    message: "Partial failure detected: 2 of 8 queries failed. Check execution logs.",
    timestamp: "2025-06-16T22:45:00Z",
    type: "error",
    read: true,
  },
  {
    id: "n5",
    title: "System Maintenance",
    message: "Scheduled maintenance window on June 20 from 02:00-04:00 UTC.",
    timestamp: "2025-06-15T08:00:00Z",
    type: "info",
    read: true,
  },
]

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState(INITIAL_USERS)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)

  const login = useCallback(
    (username: string, password: string) => {
      const found = users.find((u) => u.username === username && u.password === password)
      if (found) {
        setUser({ username: found.username, fullName: found.fullName, role: found.role, email: found.email })
        return { success: true }
      }
      return { success: false, error: "Invalid username or password" }
    },
    [users],
  )

  const signup = useCallback(
    (username: string, password: string, fullName: string, email: string) => {
      if (users.find((u) => u.username === username)) {
        return { success: false, error: "Username already taken" }
      }
      const newUser = { username, password, fullName, role: "Analyst", email }
      setUsers((prev) => [...prev, newUser])
      setUser({ username, fullName, role: "Analyst", email })
      return { success: true }
    },
    [users],
  )

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, signup, logout, notifications, markNotificationRead, clearNotifications }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
