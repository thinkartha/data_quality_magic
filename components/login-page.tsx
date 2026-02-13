"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Database, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface LoginPageProps {
  onNavigate: (page: "landing" | "signup") => void
  onLoginSuccess: () => void
}

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password")
      return
    }
    setLoading(true)
    // Simulate a short delay
    setTimeout(() => {
      const result = login(username, password)
      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.error || "Login failed")
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <Database className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wider text-white">DQ ENGINE</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="text-sm text-neutral-400 mt-2">
              Access your Data Quality command center
            </p>
          </div>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 tracking-wider">USERNAME</Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 tracking-wider">PASSWORD</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 text-white hover:bg-orange-600 py-5"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-neutral-800 text-center">
                <p className="text-sm text-neutral-400">
                  {"Don't have an account? "}
                  <button
                    onClick={() => onNavigate("signup")}
                    className="text-orange-500 hover:text-orange-400 font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              <div className="mt-4 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                <p className="text-[10px] text-neutral-500 tracking-wider mb-1">DEFAULT CREDENTIALS</p>
                <p className="text-xs text-neutral-300 font-mono">admin / admin123</p>
                <p className="text-xs text-neutral-300 font-mono">analyst / analyst123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
