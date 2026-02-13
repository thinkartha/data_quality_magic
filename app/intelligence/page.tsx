"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Download,
  AlertTriangle,
  Shield,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Link2,
} from "lucide-react"
import {
  batchControls,
  getSiteResultsWithActions,
  getComplianceSummary,
  getViolationsByBatch,
  nonComplianceActivities as getNcActivities,
  queryRepository,
  addNonComplianceActivity,
  updateNonComplianceActivity,
  deleteNonComplianceActivity,
  getLinkedQueryIds,
} from "@/lib/data-store"
import { formatDateTime } from "@/lib/utils"
import type { NonComplianceActivity, SiteResultWithActions } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

type NcFormData = {
  compliance_code: string
  compliance_name: string
  compliance_description: string
  recommended_action: string
  linked_query_ids: number[]
}

const emptyForm: NcFormData = {
  compliance_code: "",
  compliance_name: "",
  compliance_description: "",
  recommended_action: "",
  linked_query_ids: [],
}

export default function ComplianceResultsPage() {
  const [batchFilter, setBatchFilter] = useState<string>("ALL")
  const [siteFilter, setSiteFilter] = useState<string>("ALL")
  const [groupFilter, setGroupFilter] = useState<string>("ALL")
  const [severityFilter, setSeverityFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedResult, setSelectedResult] = useState<SiteResultWithActions | null>(null)

  // NC Activity CRUD state
  const [showNcDialog, setShowNcDialog] = useState(false)
  const [editingNc, setEditingNc] = useState<NonComplianceActivity | null>(null)
  const [ncForm, setNcForm] = useState<NcFormData>(emptyForm)
  const [deleteNcId, setDeleteNcId] = useState<number | null>(null)
  const [, forceUpdate] = useState(0)

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  const siteIds = ["12340", "12341", "12342", "12343", "12344", "12345"]
  const groups = [...new Set(queryRepository.map((q) => q.execution_group))]
  const severities = ["ERROR", "WARN", "INFO"]

  const ncActivities = getNcActivities

  const results = useMemo(() => {
    const filters: { batch_uuid?: string; site_id?: string; execution_group?: string; severity?: string } = {}
    if (batchFilter !== "ALL") filters.batch_uuid = batchFilter
    if (siteFilter !== "ALL") filters.site_id = siteFilter
    if (groupFilter !== "ALL") filters.execution_group = groupFilter
    if (severityFilter !== "ALL") filters.severity = severityFilter
    return getSiteResultsWithActions(filters)
  }, [batchFilter, siteFilter, groupFilter, severityFilter])

  const filteredResults = results.filter((r) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      r.record_key.toLowerCase().includes(term) ||
      r.query_name.toLowerCase().includes(term) ||
      r.violation_details?.toLowerCase().includes(term) ||
      r.compliance_codes?.toLowerCase().includes(term)
    )
  })

  const violatedResults = filteredResults.filter((r) => r.is_violated)
  const cleanResults = filteredResults.filter((r) => !r.is_violated)

  const compliance = getComplianceSummary()
  const byBatch = getViolationsByBatch()

  const radarData = compliance.map((c) => ({
    subject: c.compliance_code,
    compliance: Number(c.compliance_rate),
    fullMark: 100,
  }))

  const getSeverityStyle = (severity: string | null) => {
    switch (severity) {
      case "ERROR":
        return "bg-red-500/20 text-red-500"
      case "WARN":
        return "bg-orange-500/20 text-orange-500"
      case "INFO":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  // NC CRUD handlers
  const openCreateNc = () => {
    setEditingNc(null)
    setNcForm(emptyForm)
    setShowNcDialog(true)
  }

  const openEditNc = (nc: NonComplianceActivity) => {
    setEditingNc(nc)
    setNcForm({
      compliance_code: nc.compliance_code,
      compliance_name: nc.compliance_name,
      compliance_description: nc.compliance_description ?? "",
      recommended_action: nc.recommended_action ?? "",
      linked_query_ids: getLinkedQueryIds(nc.non_compliance_id),
    })
    setShowNcDialog(true)
  }

  const handleSaveNc = () => {
    if (!ncForm.compliance_code.trim() || !ncForm.compliance_name.trim()) return

    if (editingNc) {
      updateNonComplianceActivity(
        editingNc.non_compliance_id,
        {
          compliance_code: ncForm.compliance_code.trim(),
          compliance_name: ncForm.compliance_name.trim(),
          compliance_description: ncForm.compliance_description.trim() || null,
          recommended_action: ncForm.recommended_action.trim() || null,
        },
        ncForm.linked_query_ids
      )
    } else {
      addNonComplianceActivity(
        {
          compliance_code: ncForm.compliance_code.trim(),
          compliance_name: ncForm.compliance_name.trim(),
          compliance_description: ncForm.compliance_description.trim() || null,
          recommended_action: ncForm.recommended_action.trim() || null,
        },
        ncForm.linked_query_ids
      )
    }

    setShowNcDialog(false)
    setEditingNc(null)
    setNcForm(emptyForm)
    refresh()
  }

  const handleDeleteNc = () => {
    if (deleteNcId === null) return
    deleteNonComplianceActivity(deleteNcId)
    setDeleteNcId(null)
    refresh()
  }

  const toggleQueryLink = (queryId: number) => {
    setNcForm((prev) => ({
      ...prev,
      linked_query_ids: prev.linked_query_ids.includes(queryId)
        ? prev.linked_query_ids.filter((id) => id !== queryId)
        : [...prev.linked_query_ids, queryId],
    }))
  }

  const deleteTarget = ncActivities.find((a) => a.non_compliance_id === deleteNcId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">COMPLIANCE & RESULTS</h1>
          <p className="text-sm text-neutral-400">
            Non-compliance activity tracking and DQ result analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">TOTAL RESULTS</p>
            <p className="text-2xl font-bold text-white font-mono">{filteredResults.length}</p>
            <p className="text-xs text-neutral-500">In selected filters</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">VIOLATIONS</p>
            <p className="text-2xl font-bold text-orange-500 font-mono">{violatedResults.length}</p>
            <p className="text-xs text-neutral-500">
              {filteredResults.length > 0
                ? ((violatedResults.length / filteredResults.length) * 100).toFixed(1)
                : "0"}
              % violation rate
            </p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">CLEAN RECORDS</p>
            <p className="text-2xl font-bold text-white font-mono">{cleanResults.length}</p>
            <p className="text-xs text-neutral-500">Passed all checks</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">COMPLIANCE CODES</p>
            <p className="text-2xl font-bold text-white font-mono">{ncActivities.length}</p>
            <p className="text-xs text-neutral-500">Active compliance rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Violations by Batch */}
        <Card className="lg:col-span-7 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              VIOLATIONS BY BATCH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byBatch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="batch_name"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: "#a3a3a3", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="violated" fill="#f97316" name="Violated" stackId="a" />
                  <Bar dataKey="clean" fill="#404040" name="Clean" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Radar */}
        <Card className="lg:col-span-5 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              COMPLIANCE RADAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#404040" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#737373", fontSize: 10 }}
                  />
                  <Radar
                    name="Compliance %"
                    dataKey="compliance"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Non-Compliance Activities -- CRUD */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            NON-COMPLIANCE ACTIVITY CODES
          </CardTitle>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={openCreateNc}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Code
          </Button>
        </CardHeader>
        <CardContent>
          {ncActivities.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No compliance codes defined. Click "New Code" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {compliance.map((c) => {
                const linkedQIds = getLinkedQueryIds(c.non_compliance_id)
                return (
                  <div
                    key={c.non_compliance_id}
                    className="p-4 bg-neutral-800 rounded border border-neutral-700 group relative"
                  >
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditNc(c)
                        }}
                        className="p-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteNcId(c.non_compliance_id)
                        }}
                        className="p-1.5 rounded bg-neutral-700 hover:bg-red-600 text-neutral-300 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2 pr-16">
                      <Badge className="bg-orange-500/10 text-orange-400 font-mono">
                        {c.compliance_code}
                      </Badge>
                      <span
                        className={`text-sm font-mono font-bold ${
                          Number(c.compliance_rate) >= 80
                            ? "text-white"
                            : Number(c.compliance_rate) >= 60
                              ? "text-orange-500"
                              : "text-red-500"
                        }`}
                      >
                        {c.compliance_rate}%
                      </span>
                    </div>
                    <h3 className="text-sm text-white mb-1">{c.compliance_name}</h3>
                    <p className="text-xs text-neutral-400 mb-2">{c.compliance_description}</p>

                    {/* Linked Rules */}
                    {linkedQIds.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Link2 className="w-3 h-3 text-neutral-500" />
                        {linkedQIds.map((qId) => {
                          const rule = queryRepository.find((q) => q.query_id === qId)
                          return (
                            <Badge
                              key={qId}
                              className="bg-neutral-700 text-neutral-300 text-xs font-mono"
                            >
                              Q-{qId}
                              {rule ? ` ${rule.query_name.split(" ")[0]}` : ""}
                            </Badge>
                          )
                        })}
                      </div>
                    )}

                    <div className="w-full bg-neutral-700 rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full ${
                          Number(c.compliance_rate) >= 80
                            ? "bg-white"
                            : Number(c.compliance_rate) >= 60
                              ? "bg-orange-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${c.compliance_rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>{c.violated_records} violated</span>
                      <span>{c.clean_records} clean</span>
                      <span>{c.total_records} total</span>
                    </div>
                    <p className="text-xs text-orange-400 mt-2">{c.recommended_action}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
          />
        </div>
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-600 text-neutral-300 text-xs rounded px-3 py-2"
        >
          <option value="ALL">All Batches</option>
          {batchControls.map((b) => (
            <option key={b.batch_uuid} value={b.batch_uuid}>
              {b.batch_uuid}
            </option>
          ))}
        </select>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-600 text-neutral-300 text-xs rounded px-3 py-2"
        >
          <option value="ALL">All Sites</option>
          {siteIds.map((s) => (
            <option key={s} value={s}>
              Site {s}
            </option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-600 text-neutral-300 text-xs rounded px-3 py-2"
        >
          <option value="ALL">All Groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-600 text-neutral-300 text-xs rounded px-3 py-2"
        >
          <option value="ALL">All Severities</option>
          {severities.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Results Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            DQ RESULTS -- v_etl_site_results_with_actions ({filteredResults.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    RECORD KEY
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    BATCH
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    SITE
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    RULE
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    GROUP
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    SEVERITY
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    VIOLATED
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    COMPLIANCE
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.slice(0, 50).map((r) => (
                  <tr
                    key={r.results_id}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedResult(r)}
                  >
                    <td className="py-2 px-3 text-xs text-white font-mono">{r.record_key}</td>
                    <td className="py-2 px-3 text-xs text-neutral-400 font-mono">
                      {r.batch_uuid.slice(-4)}
                    </td>
                    <td className="py-2 px-3 text-xs text-neutral-300 font-mono">{r.site_id}</td>
                    <td className="py-2 px-3 text-xs text-neutral-300 max-w-36 truncate">
                      {r.query_name}
                    </td>
                    <td className="py-2 px-3">
                      <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">
                        {r.execution_group}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Badge className={getSeverityStyle(r.severity)}>{r.severity ?? "N/A"}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      {r.is_violated ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-500">YES</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-neutral-400">NO</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {r.compliance_codes?.split(", ").map((code) => (
                          <Badge key={code} className="bg-orange-500/10 text-orange-400 text-xs">
                            {code}
                          </Badge>
                        )) ?? <span className="text-xs text-neutral-500">--</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-orange-500 h-6 w-6"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredResults.length > 50 && (
              <p className="text-xs text-neutral-500 mt-3 text-center">
                Showing first 50 of {filteredResults.length} results. Apply filters to narrow down.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">
                  {selectedResult.record_key}
                </CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  Result #{selectedResult.results_id}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedResult(null)}
                className="text-neutral-400 hover:text-white"
              >
                X
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">BATCH UUID</p>
                  <p className="text-sm text-white font-mono">{selectedResult.batch_uuid}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">SITE ID</p>
                  <p className="text-sm text-white font-mono">{selectedResult.site_id}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">RULE</p>
                  <p className="text-sm text-white">{selectedResult.query_name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    EXECUTION GROUP / STAGE
                  </p>
                  <p className="text-sm text-white font-mono">
                    {selectedResult.execution_group} / Stage {selectedResult.execution_stage}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">SEVERITY</p>
                  <Badge className={getSeverityStyle(selectedResult.severity)}>
                    {selectedResult.severity ?? "N/A"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">VIOLATED</p>
                  <p
                    className={`text-sm font-bold ${selectedResult.is_violated ? "text-orange-500" : "text-white"}`}
                  >
                    {selectedResult.is_violated ? "YES" : "NO"}
                  </p>
                </div>
              </div>

              {selectedResult.violation_details && (
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">VIOLATION DETAILS</p>
                  <div className="bg-neutral-950 border border-neutral-700 rounded p-3">
                    <p className="text-sm text-orange-400 font-mono">
                      {selectedResult.violation_details}
                    </p>
                  </div>
                </div>
              )}

              {selectedResult.compliance_codes && (
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">COMPLIANCE CODES</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.compliance_codes.split(", ").map((code) => (
                      <Badge key={code} className="bg-orange-500/10 text-orange-400">
                        {code}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-300 mt-2">
                    {selectedResult.compliance_names}
                  </p>
                </div>
              )}

              {selectedResult.recommended_actions && (
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">
                    RECOMMENDED ACTIONS
                  </p>
                  <p className="text-sm text-orange-400">
                    {selectedResult.recommended_actions}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">LAST UPDATED</p>
                <p className="text-sm text-neutral-300 font-mono">
                  {formatDateTime(selectedResult.last_updated_dttm)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NC Activity Create/Edit Dialog */}
      <Dialog open={showNcDialog} onOpenChange={setShowNcDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white tracking-wider">
              {editingNc ? "EDIT COMPLIANCE CODE" : "NEW COMPLIANCE CODE"}
            </DialogTitle>
            <p className="text-sm text-neutral-400">
              {editingNc
                ? `Editing ${editingNc.compliance_code}`
                : "Define a new non-compliance activity code and link it to DQ rules."}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">CODE *</Label>
                <Input
                  placeholder="e.g. CC006"
                  value={ncForm.compliance_code}
                  onChange={(e) => setNcForm({ ...ncForm, compliance_code: e.target.value })}
                  className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">NAME *</Label>
                <Input
                  placeholder="e.g. Timeliness Check"
                  value={ncForm.compliance_name}
                  onChange={(e) => setNcForm({ ...ncForm, compliance_name: e.target.value })}
                  className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">DESCRIPTION</Label>
              <Textarea
                placeholder="Describe what this compliance code checks..."
                value={ncForm.compliance_description}
                onChange={(e) =>
                  setNcForm({ ...ncForm, compliance_description: e.target.value })
                }
                rows={2}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">RECOMMENDED ACTION</Label>
              <Textarea
                placeholder="What should be done to remediate violations..."
                value={ncForm.recommended_action}
                onChange={(e) =>
                  setNcForm({ ...ncForm, recommended_action: e.target.value })
                }
                rows={2}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 resize-none"
              />
            </div>

            {/* Linked Rules */}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">
                LINKED DQ RULES (click to toggle)
              </Label>
              <div className="bg-neutral-950 border border-neutral-700 rounded p-3 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {queryRepository.map((q) => {
                    const isLinked = ncForm.linked_query_ids.includes(q.query_id)
                    return (
                      <button
                        key={q.query_id}
                        onClick={() => toggleQueryLink(q.query_id)}
                        className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors border ${
                          isLinked
                            ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                            : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500"
                        }`}
                      >
                        Q-{q.query_id} {q.query_name.split(" ").slice(0, 2).join(" ")}
                      </button>
                    )
                  })}
                </div>
                {ncForm.linked_query_ids.length > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    {ncForm.linked_query_ids.length} rule(s) linked
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNcDialog(false)
                setEditingNc(null)
                setNcForm(emptyForm)
              }}
              className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSaveNc}
              disabled={!ncForm.compliance_code.trim() || !ncForm.compliance_name.trim()}
            >
              {editingNc ? "Save Changes" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteNcId !== null} onOpenChange={(open) => !open && setDeleteNcId(null)}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Compliance Code</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to delete{" "}
              <span className="text-orange-400 font-mono">
                {deleteTarget?.compliance_code}
              </span>{" "}
              ({deleteTarget?.compliance_name})? This will remove all linked rule mappings. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteNc}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
