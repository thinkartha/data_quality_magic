"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Square,
  Ban,
} from "lucide-react"
import {
  batchControls as getBatchControls,
  executionLogs,
  triggerBatch,
  completeBatch,
  stopBatch,
  queryRepository,
} from "@/lib/data-store"
import { formatDateTime } from "@/lib/utils"
import type { BatchControl } from "@/lib/types"

export default function BatchControlPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
  const [showTriggerDialog, setShowTriggerDialog] = useState(false)
  const [triggerForm, setTriggerForm] = useState({
    batch_name: "",
    pipeline_type: "SILVER_TO_GOLD",
    run_with: "STORED_PROCEDURE" as string,
    triggered_by: "manual-user",
  })
  const [simulatingBatch, setSimulatingBatch] = useState<string | null>(null)
  const simulationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, forceUpdate] = useState(0)

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  const batches = getBatchControls
  const statuses = ["SUCCESS", "RUNNING", "FAILED", "PARTIAL", "STOPPED"]

  const filteredBatches = batches
    .filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false
      if (
        searchTerm &&
        !b.batch_uuid.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !b.batch_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false
      return true
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-neutral-700 text-white"
      case "RUNNING":
        return "bg-orange-500/20 text-orange-500"
      case "FAILED":
        return "bg-red-500/20 text-red-500"
      case "PARTIAL":
        return "bg-orange-500/20 text-orange-400"
      case "STOPPED":
        return "bg-yellow-500/20 text-yellow-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-white" />
      case "RUNNING":
        return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "PARTIAL":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case "STOPPED":
        return <Ban className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-neutral-400" />
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

  const getBatchLogs = (batchUuid: string) =>
    executionLogs
      .filter((l) => l.batch_uuid === batchUuid)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const successCount = batches.filter((b) => b.status === "SUCCESS").length
  const runningCount = batches.filter((b) => b.status === "RUNNING").length
  const failedCount = batches.filter((b) => b.status === "FAILED" || b.status === "PARTIAL").length
  const stoppedCount = batches.filter((b) => b.status === "STOPPED").length

  const handleTriggerBatch = () => {
    if (!triggerForm.batch_name.trim()) return

    const newBatch = triggerBatch(
      triggerForm.batch_name.trim(),
      triggerForm.pipeline_type,
      triggerForm.triggered_by.trim() || "manual-user"
    )

    setShowTriggerDialog(false)
    setTriggerForm({ batch_name: "", pipeline_type: "SILVER_TO_GOLD", run_with: "STORED_PROCEDURE", triggered_by: "manual-user" })
    setSimulatingBatch(newBatch.batch_uuid)
    setExpandedBatch(null)
    refresh()

    // Simulate batch completion after a delay
    const timer = setTimeout(() => {
      const outcomes: ("SUCCESS" | "FAILED" | "PARTIAL")[] = ["SUCCESS", "SUCCESS", "SUCCESS", "PARTIAL", "FAILED"]
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]
      completeBatch(newBatch.batch_uuid, outcome)
      setSimulatingBatch(null)
      simulationTimerRef.current = null
      refresh()
    }, 3000)
    simulationTimerRef.current = timer
  }

  const handleStopBatch = (batchUuid: string) => {
    // If this is the currently simulating batch, cancel the timer
    if (simulatingBatch === batchUuid && simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current)
      simulationTimerRef.current = null
      setSimulatingBatch(null)
    }
    stopBatch(batchUuid)
    refresh()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">BATCH CONTROL & EXECUTION</h1>
          <p className="text-sm text-neutral-400">ETL batch runs and execution log tracking</p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => setShowTriggerDialog(true)}
        >
          <Play className="w-4 h-4 mr-2" />
          Trigger Batch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">TOTAL BATCHES</p>
            <p className="text-2xl font-bold text-white font-mono">{batches.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">SUCCESSFUL</p>
            <p className="text-2xl font-bold text-white font-mono">{successCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">RUNNING</p>
            <p className="text-2xl font-bold text-orange-500 font-mono">{runningCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">FAILED / PARTIAL</p>
            <p className="text-2xl font-bold text-red-500 font-mono">{failedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">STOPPED</p>
            <p className="text-2xl font-bold text-yellow-500 font-mono">{stoppedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search batch UUID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              statusFilter === "ALL"
                ? "bg-orange-500 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            ALL
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                statusFilter === s
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Batch List with Expandable Logs */}
      <div className="space-y-3">
        {filteredBatches.map((batch) => {
          const logs = getBatchLogs(batch.batch_uuid)
          const isExpanded = expandedBatch === batch.batch_uuid
          const isSimulating = simulatingBatch === batch.batch_uuid

          return (
            <Card
              key={batch.batch_uuid}
              className={`bg-neutral-900 border-neutral-700 ${
                isSimulating ? "ring-1 ring-orange-500/50" : ""
              }`}
            >
              <CardContent className="p-0">
                {/* Batch Header Row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => setExpandedBatch(isExpanded ? null : batch.batch_uuid)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {getStatusIcon(batch.status)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-white font-mono">{batch.batch_uuid}</span>
                        <Badge className={getStatusStyle(batch.status)}>{batch.status}</Badge>
                        {isSimulating && (
                          <span className="text-xs text-orange-400 animate-pulse">Executing...</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">{batch.batch_name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {batch.status === "RUNNING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-7 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStopBatch(batch.batch_uuid)
                        }}
                      >
                        <Square className="w-3 h-3 mr-1.5 fill-current" />
                        Stop
                      </Button>
                    )}
                    <div className="hidden md:flex items-center gap-6 text-xs text-neutral-400">
                      <div className="text-center">
                        <div className="text-white font-mono">{batch.total_queries}</div>
                        <div>queries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-mono">{batch.successful_queries}</div>
                        <div>success</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-mono ${batch.failed_queries > 0 ? "text-red-500" : "text-white"}`}
                        >
                          {batch.failed_queries}
                        </div>
                        <div>failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-mono">{batch.total_rows_affected}</div>
                        <div>rows</div>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono whitespace-nowrap">
                      {formatDateTime(batch.start_time)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Execution Logs */}
                {isExpanded && (
                  <div className="border-t border-neutral-700 bg-neutral-950 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs text-neutral-400 tracking-wider">
                        EXECUTION LOGS ({logs.length} entries)
                      </h4>
                      <div className="text-xs text-neutral-500">
                        Triggered by:{" "}
                        <span className="text-orange-400 font-mono">{batch.triggered_by}</span> |
                        Pipeline:{" "}
                        <span className="text-neutral-300 font-mono">{batch.pipeline_type}</span>
                      </div>
                    </div>

                    {logs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-neutral-800">
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                LOG ID
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                SITE
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                GROUP
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                STAGE
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                JOB NAME
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                TARGET
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                ROWS
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                STATUS
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                DURATION
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 tracking-wider">
                                ERROR
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log) => (
                              <tr
                                key={log.execution_log_id}
                                className="border-b border-neutral-800/50 hover:bg-neutral-900 transition-colors"
                              >
                                <td className="py-2 px-3 text-xs text-neutral-400 font-mono">
                                  {log.execution_log_id}
                                </td>
                                <td className="py-2 px-3 text-xs text-white font-mono">{log.site_id}</td>
                                <td className="py-2 px-3">
                                  <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">
                                    {log.execution_group}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-xs text-white font-mono">
                                  {log.execution_stage}
                                </td>
                                <td className="py-2 px-3 text-xs text-neutral-300">
                                  {log.talend_job_name}
                                </td>
                                <td className="py-2 px-3 text-xs text-neutral-400 font-mono">
                                  {log.target_table}
                                </td>
                                <td className="py-2 px-3 text-xs text-white font-mono">
                                  {log.target_table_count}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge className={getLogStatusStyle(log.status)}>{log.status}</Badge>
                                </td>
                                <td className="py-2 px-3 text-xs text-neutral-400 font-mono">
                                  {log.execution_duration_seconds != null
                                    ? `${log.execution_duration_seconds}s`
                                    : "--"}
                                </td>
                                <td className="py-2 px-3 text-xs text-red-400 max-w-xs truncate">
                                  {log.error_message ?? "--"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">
                        {isSimulating
                          ? "Batch is currently executing. Logs will appear once complete."
                          : "No execution logs for this batch"}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredBatches.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-sm">
            No batches match the current filters.
          </div>
        )}
      </div>

      {/* Trigger Batch Dialog */}
      <Dialog open={showTriggerDialog} onOpenChange={setShowTriggerDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white tracking-wider">
              TRIGGER NEW BATCH
            </DialogTitle>
            <p className="text-sm text-neutral-400">
              Configure and launch a new DQ batch run against{" "}
              {queryRepository.filter((q) => q.is_active).length} active rules.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">BATCH NAME *</Label>
              <Input
                placeholder="e.g. Nightly DQ Run, Ad-Hoc Reprocessing"
                value={triggerForm.batch_name}
                onChange={(e) => setTriggerForm({ ...triggerForm, batch_name: e.target.value })}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">PIPELINE TYPE</Label>
              <Select
                value={triggerForm.pipeline_type}
                onValueChange={(v) => setTriggerForm({ ...triggerForm, pipeline_type: v })}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  <SelectItem value="SILVER_TO_GOLD" className="text-neutral-200">
                    SILVER_TO_GOLD
                  </SelectItem>
                  <SelectItem value="BRONZE_TO_SILVER" className="text-neutral-200">
                    BRONZE_TO_SILVER
                  </SelectItem>
                  <SelectItem value="RAW_TO_BRONZE" className="text-neutral-200">
                    RAW_TO_BRONZE
                  </SelectItem>
                  <SelectItem value="FULL_PIPELINE" className="text-neutral-200">
                    FULL_PIPELINE
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">RUN WITH</Label>
              <Select
                value={triggerForm.run_with}
                onValueChange={(v) => setTriggerForm({ ...triggerForm, run_with: v })}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  <SelectItem value="STORED_PROCEDURE" className="text-neutral-200">
                    Stored Procedure
                  </SelectItem>
                  <SelectItem value="TALEND" className="text-neutral-200">
                    Talend
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">TRIGGERED BY</Label>
              <Input
                placeholder="manual-user"
                value={triggerForm.triggered_by}
                onChange={(e) => setTriggerForm({ ...triggerForm, triggered_by: e.target.value })}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
              />
            </div>

            <div className="bg-neutral-950 border border-neutral-700 rounded p-3 space-y-1">
              <p className="text-xs text-neutral-400 tracking-wider">BATCH PREVIEW</p>
              <p className="text-xs text-neutral-300">
                Active Rules:{" "}
                <span className="text-orange-400 font-mono">
                  {queryRepository.filter((q) => q.is_active).length}
                </span>
              </p>
              <p className="text-xs text-neutral-300">
                Groups:{" "}
                <span className="text-orange-400 font-mono">
                  {[...new Set(queryRepository.filter((q) => q.is_active).map((q) => q.execution_group))].join(
                    ", "
                  )}
                </span>
              </p>
              <p className="text-xs text-neutral-300">
                Pipeline:{" "}
                <span className="text-orange-400 font-mono">{triggerForm.pipeline_type}</span>
              </p>
              <p className="text-xs text-neutral-300">
                Execution:{" "}
                <span className="text-orange-400 font-mono">
                  {triggerForm.run_with === "TALEND" ? "Talend" : "Stored Procedure"}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTriggerDialog(false)}
              className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleTriggerBatch}
              disabled={!triggerForm.batch_name.trim()}
            >
              <Play className="w-4 h-4 mr-2" />
              Launch Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
