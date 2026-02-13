"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  batchControls,
  queryRepository,
  executionLogs,
  getViolationStats,
  getViolationsByGroup,
  getViolationsBySite,
  getViolationsBySeverity,
  getComplianceSummary,
} from "@/lib/data-store"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const CHART_COLORS = {
  violated: "#f97316",
  clean: "#404040",
  error: "#ef4444",
  warn: "#f97316",
  info: "#737373",
}

export default function CommandCenterPage() {
  const stats = getViolationStats()
  const byGroup = getViolationsByGroup()
  const bySite = getViolationsBySite()
  const bySeverity = getViolationsBySeverity()
  const compliance = getComplianceSummary()
  const recentBatches = [...batchControls].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
  )
  const recentLogs = [...executionLogs]
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 8)

  const activeRules = queryRepository.filter((q) => q.is_active).length
  const totalRules = queryRepository.length
  const groups = [...new Set(queryRepository.map((q) => q.execution_group))]

  const pieData = bySeverity.map((s) => ({
    name: s.severity,
    value: s.violated,
  }))

  const getBatchStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-neutral-700 text-white"
      case "RUNNING":
        return "bg-orange-500/20 text-orange-500"
      case "FAILED":
        return "bg-red-500/20 text-red-500"
      case "PARTIAL":
        return "bg-orange-500/20 text-orange-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getLogStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-neutral-700 text-white"
      case "RUNNING":
        return "bg-orange-500/20 text-orange-500"
      case "FAILED":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">TOTAL RECORDS SCANNED</p>
            <p className="text-3xl font-bold text-white font-mono mt-1">{stats.total.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1">Across all batches and sites</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">VIOLATIONS DETECTED</p>
            <p className="text-3xl font-bold text-orange-500 font-mono mt-1">{stats.violated.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-1">{stats.violationRate.toFixed(1)}% violation rate</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">ACTIVE DQ RULES</p>
            <p className="text-3xl font-bold text-white font-mono mt-1">
              {activeRules}/{totalRules}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {groups.length} execution groups: {groups.join(", ")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">BATCH RUNS</p>
            <p className="text-3xl font-bold text-white font-mono mt-1">{batchControls.length}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {batchControls.filter((b) => b.status === "RUNNING").length} currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Violations by Group */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-neutral-300 tracking-wider">
              VIOLATIONS BY EXECUTION GROUP
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byGroup} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis type="number" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                  <YAxis dataKey="group" type="category" tick={{ fill: "#a3a3a3", fontSize: 10 }} width={50} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="violated" fill={CHART_COLORS.violated} name="Violated" stackId="a" />
                  <Bar dataKey="clean" fill={CHART_COLORS.clean} name="Clean" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Violations by Severity Pie */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-neutral-300 tracking-wider">
              VIOLATIONS BY SEVERITY
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "ERROR"
                            ? CHART_COLORS.error
                            : entry.name === "WARN"
                              ? CHART_COLORS.warn
                              : CHART_COLORS.info
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: 11,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, color: "#a3a3a3" }}
                    formatter={(value) => <span className="text-neutral-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Summary */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-neutral-300 tracking-wider">COMPLIANCE SUMMARY</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-2">
              {compliance.slice(0, 3).map((c) => (
                <div key={c.compliance_code} className="p-2.5 bg-neutral-800 rounded">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-white font-mono">{c.compliance_code}</span>
                    <span
                      className={`text-xs font-mono font-bold ${Number(c.compliance_rate) >= 80 ? "text-white" : Number(c.compliance_rate) >= 60 ? "text-orange-500" : "text-red-500"}`}
                    >
                      {c.compliance_rate}%
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-1.5">{c.compliance_name}</p>
                  <div className="w-full bg-neutral-700 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${Number(c.compliance_rate) >= 80 ? "bg-white" : Number(c.compliance_rate) >= 60 ? "bg-orange-500" : "bg-red-500"}`}
                      style={{ width: `${c.compliance_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations by Site + Recent Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Violations by Site */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-neutral-300 tracking-wider">
              VIOLATIONS BY SITE
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySite} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="site" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#a3a3a3", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="violated" fill={CHART_COLORS.violated} name="Violated" stackId="a" />
                  <Bar dataKey="clean" fill={CHART_COLORS.clean} name="Clean" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Batches */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-neutral-300 tracking-wider">RECENT BATCH RUNS</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentBatches.map((batch) => (
                <div
                  key={batch.batch_uuid}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-mono truncate">{batch.batch_uuid}</div>
                    <div className="text-xs text-neutral-500 truncate">{batch.batch_name}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge className={getBatchStatusStyle(batch.status)}>{batch.status}</Badge>
                    <span className="text-xs text-neutral-500 font-mono whitespace-nowrap">
                      {formatDate(batch.start_time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Execution Logs */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium text-neutral-300 tracking-wider">
            RECENT EXECUTION LOG
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.execution_log_id}
                className="text-xs border-l-2 border-orange-500 pl-3 p-2 hover:bg-neutral-800 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 font-mono">
                      {formatDateTime(log.start_time)}
                    </span>
                    <Badge className={getLogStatusStyle(log.status)}>{log.status}</Badge>
                  </div>
                  <span className="text-neutral-500 font-mono">
                    {log.execution_duration_seconds != null ? `${log.execution_duration_seconds}s` : "--"}
                  </span>
                </div>
                <div className="text-white mt-1">
                  <span className="text-orange-500 font-mono">[{log.execution_group}-S{log.execution_stage}]</span>{" "}
                  <span className="text-neutral-300">{log.talend_job_name}</span>{" "}
                  <span className="text-neutral-500">site:{log.site_id}</span>{" "}
                  <span className="text-neutral-500">rows:{log.target_table_count}</span>
                  {log.error_message && (
                    <span className="text-red-400 ml-2">-- {log.error_message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
