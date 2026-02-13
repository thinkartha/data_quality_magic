"use client"

import { Button } from "@/components/ui/button"
import {
  ShieldCheck,
  Database,
  BarChart3,
  Zap,
  ArrowRight,
  BookOpen,
  Play,
  Settings,
} from "lucide-react"

interface LandingPageProps {
  onNavigate: (page: "login" | "signup") => void
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wider">DQ ENGINE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-neutral-300 hover:text-white"
              onClick={() => onNavigate("login")}
            >
              Sign In
            </Button>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => onNavigate("signup")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <p className="text-orange-500 font-mono text-sm tracking-widest mb-4">
              DATA QUALITY RULES ENGINE
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight text-balance">
              Define. Execute. Monitor.{" "}
              <span className="text-orange-500">Data Quality</span> at Scale.
            </h1>
            <p className="mt-6 text-lg text-neutral-400 leading-relaxed max-w-2xl">
              Build and manage data quality rules, apply them to any data table, trigger batch 
              executions via Talend or stored procedures, and analyze compliance results -- all 
              from a single command center.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button
                className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-6 text-base"
                onClick={() => onNavigate("signup")}
              >
                Start here
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-neutral-600 text-neutral-300 hover:text-white hover:border-neutral-400 px-8 py-6 text-base"
                onClick={() => onNavigate("login")}
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 border border-neutral-800 rounded-lg bg-neutral-900/50 p-1">
            <div className="border border-neutral-800 rounded bg-neutral-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-orange-500/60" />
                <div className="w-3 h-3 rounded-full bg-neutral-600" />
                <span className="text-xs text-neutral-500 ml-3 font-mono">dq-engine / dashboard</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "RECORDS SCANNED", value: "2,400", color: "text-white" },
                  { label: "VIOLATIONS", value: "187", color: "text-orange-500" },
                  { label: "ACTIVE RULES", value: "8/8", color: "text-white" },
                  { label: "BATCH RUNS", value: "5", color: "text-white" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-neutral-800 border border-neutral-700 rounded p-3">
                    <p className="text-[10px] text-neutral-500 tracking-wider">{stat.label}</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-neutral-800 border border-neutral-700 rounded p-3 h-24 flex items-end gap-1">
                  {[60, 35, 80, 45, 70, 25, 90, 55].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                      <div className="bg-orange-500/80 rounded-t" style={{ height: `${h * 0.6}%` }} />
                      <div className="bg-neutral-600 rounded-b" style={{ height: `${(100 - h) * 0.6}%` }} />
                    </div>
                  ))}
                </div>
                <div className="bg-neutral-800 border border-neutral-700 rounded p-3 h-24">
                  <div className="w-16 h-16 mx-auto mt-1 rounded-full border-4 border-orange-500 border-t-neutral-700 border-r-neutral-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="border-y border-neutral-800 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-800">
            {[
              { value: "8+", label: "Rule Types Supported" },
              { value: "4", label: "Execution Groups" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "<3s", label: "Batch Trigger Time" },
            ].map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <p className="text-2xl md:text-3xl font-bold text-white font-mono">{s.value}</p>
                <p className="text-xs text-neutral-500 mt-1 tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-mono text-sm tracking-widest mb-3">CAPABILITIES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">
              Everything You Need for Data Quality
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Rules Repository",
                desc: "Define SQL-based DQ, RI, SEC, and METRIC rules with severity levels, dependencies, and execution stages.",
              },
              {
                icon: Play,
                title: "Batch Execution",
                desc: "Trigger batch runs via Talend or stored procedures with real-time status tracking and auto-completion.",
              },
              {
                icon: ShieldCheck,
                title: "Compliance Tracking",
                desc: "Map non-compliance activity codes to rules and monitor compliance rates across all data tables.",
              },
              {
                icon: BarChart3,
                title: "Results Analytics",
                desc: "Visualize violations by group, site, and severity. Drill into individual batch results.",
              },
              {
                icon: Settings,
                title: "Site Mapping",
                desc: "Configure site-to-rule mappings and manage ETL system settings from a central configuration panel.",
              },
              {
                icon: Zap,
                title: "Execution Logs",
                desc: "Full audit trail with per-step logs, durations, row counts, and error messages for every batch run.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group p-6 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-orange-500/30 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-500 font-mono text-sm tracking-widest mb-3">WORKFLOW</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Define Rules", desc: "Create SQL-based quality rules with severity, groups, and dependencies." },
              { step: "02", title: "Map Sites", desc: "Associate rules with target sites and configure execution parameters." },
              { step: "03", title: "Trigger Batch", desc: "Launch via Talend or stored procedure. Monitor real-time progress." },
              { step: "04", title: "Analyze Results", desc: "Review violations, compliance rates, and drill into detailed logs." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <span className="text-5xl font-bold text-neutral-800 font-mono">{s.step}</span>
                <h3 className="text-lg font-semibold text-white mt-3">{s.title}</h3>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">
            Ready to take control of your data quality?
          </h2>
          <p className="mt-4 text-neutral-400">
            Get started in seconds. No credit card required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-6 text-base"
              onClick={() => onNavigate("signup")}
            >
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-neutral-600 font-mono">
            Default credentials: admin / admin123
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <Database className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-neutral-500">DQ Engine</span>
          </div>
          <p className="text-xs text-neutral-600">Data Quality Rules Engine</p>
        </div>
      </footer>
    </div>
  )
}
