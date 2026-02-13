"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Database, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface SignupPageProps {
  onNavigate: (page: "landing" | "login") => void
  onSignupSuccess: () => void
}

export default function SignupPage({ onNavigate, onSignupSuccess }: SignupPageProps) {
  const { signup } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fullName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError("All fields are required")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setTimeout(() => {
      const result = signup(username, password, fullName, email)
      if (result.success) {
        onSignupSuccess()
      } else {
        setError(result.error || "Signup failed")
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

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-sm text-neutral-400 mt-2">
              Set up your DQ Engine access
            </p>
          </div>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 tracking-wider">FULL NAME</Label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 tracking-wider">EMAIL</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 tracking-wider">USERNAME</Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
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
                      placeholder="Min. 6 characters"
                      className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20 pr-10"
                      autoComplete="new-password"
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

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400 tracking-wider">CONFIRM PASSWORD</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:ring-orange-500/20"
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 text-white hover:bg-orange-600 py-5"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-neutral-800 text-center">
                <p className="text-sm text-neutral-400">
                  Already have an account?{" "}
                  <button
                    onClick={() => onNavigate("login")}
                    className="text-orange-500 hover:text-orange-400 font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
