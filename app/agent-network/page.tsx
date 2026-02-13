"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Code,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Pencil,
  Trash2,
  Link2,
  LinkIcon,
  X,
} from "lucide-react"
import {
  queryRepository,
  nonComplianceQueryMap,
  nonComplianceActivities,
  addRule,
  updateRule,
  deleteRule,
  getRuleDependencies,
  getRuleDependents,
} from "@/lib/data-store"
import { formatDate } from "@/lib/utils"
import type { QueryRepository } from "@/lib/types"

type FormMode = "create" | "edit" | null

interface RuleFormData {
  query_name: string
  query_description: string
  sql_statement: string
  execution_stage: number
  execution_group: string
  is_active: boolean
  drops_records: boolean
  target_table: string
  severity: "ERROR" | "WARN" | "INFO"
  remediation_hint: string
  created_by: string
  effective_from: string
  effective_to: string
  dependency_query_ids: number[]
}

const emptyForm: RuleFormData = {
  query_name: "",
  query_description: "",
  sql_statement: "",
  execution_stage: 1,
  execution_group: "DQ",
  is_active: true,
  drops_records: false,
  target_table: "",
  severity: "ERROR",
  remediation_hint: "",
  created_by: "",
  effective_from: "",
  effective_to: "",
  dependency_query_ids: [],
}

export default function RulesRepositoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [groupFilter, setGroupFilter] = useState<string>("ALL")
  const [severityFilter, setSeverityFilter] = useState<string>("ALL")
  const [selectedRule, setSelectedRule] = useState<QueryRepository | null>(null)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [formData, setFormData] = useState<RuleFormData>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QueryRepository | null>(null)
  const [, setRefresh] = useState(0)

  const forceRefresh = useCallback(() => setRefresh((n) => n + 1), [])

  const rules = queryRepository
  const groups = [...new Set(rules.map((q) => q.execution_group))]
  const severities = ["ERROR", "WARN", "INFO"]

  const filteredRules = rules.filter((q) => {
    if (groupFilter !== "ALL" && q.execution_group !== groupFilter) return false
    if (severityFilter !== "ALL" && q.severity !== severityFilter) return false
    if (
      searchTerm &&
      !q.query_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !q.query_description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false
    return true
  })

  const getSeverityStyle = (severity: string | null) => {
    switch (severity) {
      case "ERROR":
        return "bg-red-500/20 text-red-400"
      case "WARN":
        return "bg-orange-500/20 text-orange-400"
      case "INFO":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getSeverityIcon = (severity: string | null) => {
    switch (severity) {
      case "ERROR":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
      case "WARN":
        return <Shield className="w-3.5 h-3.5 text-orange-400" />
      case "INFO":
        return <Info className="w-3.5 h-3.5 text-neutral-400" />
      default:
        return null
    }
  }

  const getComplianceForQuery = (queryId: number) => {
    const ncIds = nonComplianceQueryMap.filter((m) => m.query_id === queryId).map((m) => m.non_compliance_id)
    return nonComplianceActivities.filter((nc) => ncIds.includes(nc.non_compliance_id))
  }

  const getDependencyNames = (depIds: number[]) => {
    return depIds
      .map((id) => rules.find((r) => r.query_id === id))
      .filter(Boolean) as QueryRepository[]
  }

  const activeCount = rules.filter((q) => q.is_active).length
  const errorCount = rules.filter((q) => q.severity === "ERROR").length
  const warnCount = rules.filter((q) => q.severity === "WARN").length

  // Open create dialog
  const handleNewRule = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setFormMode("create")
  }

  // Open edit dialog
  const handleEditRule = (rule: QueryRepository, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setFormData({
      query_name: rule.query_name,
      query_description: rule.query_description ?? "",
      sql_statement: rule.sql_statement,
      execution_stage: rule.execution_stage,
      execution_group: rule.execution_group,
      is_active: rule.is_active,
      drops_records: rule.drops_records,
      target_table: rule.target_table ?? "",
      severity: (rule.severity ?? "ERROR") as "ERROR" | "WARN" | "INFO",
      remediation_hint: rule.remediation_hint ?? "",
      created_by: rule.created_by ?? "",
      effective_from: rule.effective_from ? rule.effective_from.split("T")[0] : "",
      effective_to: rule.effective_to ? rule.effective_to.split("T")[0] : "",
      dependency_query_ids: [...rule.dependency_query_ids],
    })
    setEditingId(rule.query_id)
    setFormMode("edit")
  }

  // Submit form
  const handleSubmit = () => {
    if (!formData.query_name.trim() || !formData.sql_statement.trim()) return

    const rulePayload = {
      query_name: formData.query_name,
      query_description: formData.query_description || null,
      sql_statement: formData.sql_statement,
      execution_stage: formData.execution_stage,
      execution_group: formData.execution_group,
      is_active: formData.is_active,
      drops_records: formData.drops_records,
      target_table: formData.target_table || null,
      severity: formData.severity,
      remediation_hint: formData.remediation_hint || null,
      created_by: formData.created_by || null,
      effective_from: formData.effective_from ? `${formData.effective_from}T00:00:00Z` : null,
      effective_to: formData.effective_to ? `${formData.effective_to}T00:00:00Z` : null,
      dependency_query_ids: formData.dependency_query_ids,
    }

    if (formMode === "create") {
      addRule(rulePayload)
    } else if (formMode === "edit" && editingId !== null) {
      updateRule(editingId, rulePayload)
      if (selectedRule?.query_id === editingId) {
        setSelectedRule(rules.find((r) => r.query_id === editingId) ?? null)
      }
    }

    setFormMode(null)
    setEditingId(null)
    forceRefresh()
  }

  // Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteRule(deleteTarget.query_id)
    if (selectedRule?.query_id === deleteTarget.query_id) setSelectedRule(null)
    setDeleteTarget(null)
    forceRefresh()
  }

  const toggleDependency = (depId: number) => {
    setFormData((prev) => {
      const has = prev.dependency_query_ids.includes(depId)
      return {
        ...prev,
        dependency_query_ids: has
          ? prev.dependency_query_ids.filter((id) => id !== depId)
          : [...prev.dependency_query_ids, depId],
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DQ RULES REPOSITORY</h1>
          <p className="text-sm text-neutral-400">
            Data Quality rules, SQL definitions, dependencies, and compliance mappings
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleNewRule}>
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Stats + Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search rules by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">TOTAL RULES</p>
            <p className="text-2xl font-bold text-white font-mono">{rules.length}</p>
            <p className="text-xs text-neutral-500">{activeCount} active</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">ERROR RULES</p>
            <p className="text-2xl font-bold text-red-400 font-mono">{errorCount}</p>
            <p className="text-xs text-neutral-500">Critical severity</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 tracking-wider">WARN RULES</p>
            <p className="text-2xl font-bold text-orange-400 font-mono">{warnCount}</p>
            <p className="text-xs text-neutral-500">Warning severity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-neutral-500 self-center mr-2">GROUP:</span>
        <button
          type="button"
          onClick={() => setGroupFilter("ALL")}
          className={`px-3 py-1 rounded text-xs font-mono transition-colors ${groupFilter === "ALL" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
        >
          ALL
        </button>
        {groups.map((g) => (
          <button
            type="button"
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${groupFilter === g ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
          >
            {g}
          </button>
        ))}
        <span className="text-xs text-neutral-500 self-center ml-4 mr-2">SEVERITY:</span>
        <button
          type="button"
          onClick={() => setSeverityFilter("ALL")}
          className={`px-3 py-1 rounded text-xs font-mono transition-colors ${severityFilter === "ALL" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
        >
          ALL
        </button>
        {severities.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${severityFilter === s ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            QUERY REPOSITORY ({filteredRules.length} rules)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RULE NAME</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">GROUP</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STAGE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">SEVERITY</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TARGET</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DEPENDS ON</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule, index) => {
                  const deps = getDependencyNames(rule.dependency_query_ids)
                  return (
                    <tr
                      key={rule.query_id}
                      className={`border-b border-neutral-800 hover:bg-neutral-800/60 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-900/50"}`}
                      onClick={() => setSelectedRule(rule)}
                    >
                      <td className="py-3 px-4 text-sm text-neutral-400 font-mono">Q-{rule.query_id}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-white">{rule.query_name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5 max-w-xs truncate">
                          {rule.query_description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">
                          {rule.execution_group}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-mono">{rule.execution_stage}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {getSeverityIcon(rule.severity)}
                          <Badge className={getSeverityStyle(rule.severity)}>{rule.severity ?? "N/A"}</Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-neutral-400 font-mono">{rule.target_table}</td>
                      <td className="py-3 px-4">
                        {deps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {deps.map((d) => (
                              <Badge key={d.query_id} className="bg-cyan-500/10 text-cyan-400 text-xs font-mono">
                                <Link2 className="w-2.5 h-2.5 mr-1" />
                                Q-{d.query_id}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-600 italic">Independent</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${rule.is_active ? "bg-emerald-400" : "bg-neutral-600"}`} />
                          <span className="text-xs text-neutral-300">{rule.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleEditRule(rule, e)}
                            className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-orange-400 transition-colors"
                            title="Edit rule"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(rule)
                            }}
                            className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredRules.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      No rules match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rule Detail Modal */}
      {selectedRule && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRule(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setSelectedRule(null) }}
          role="dialog"
          aria-modal="true"
          aria-label="Rule details"
        >
          <Card
            className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  {selectedRule.query_name}
                </CardTitle>
                <p className="text-sm text-neutral-400 font-mono">Q-{selectedRule.query_id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => {
                    handleEditRule(selectedRule)
                    setSelectedRule(null)
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300 bg-transparent"
                  onClick={() => {
                    setDeleteTarget(selectedRule)
                    setSelectedRule(null)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRule(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">RULE DETAILS</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Execution Group:</span>
                        <Badge className="bg-neutral-800 text-neutral-300 font-mono">{selectedRule.execution_group}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Stage:</span>
                        <span className="text-white font-mono">{selectedRule.execution_stage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Severity:</span>
                        <Badge className={getSeverityStyle(selectedRule.severity)}>{selectedRule.severity ?? "N/A"}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Target Table:</span>
                        <span className="text-white font-mono">{selectedRule.target_table}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Active:</span>
                        <span className={selectedRule.is_active ? "text-emerald-400" : "text-neutral-500"}>
                          {selectedRule.is_active ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Drops Records:</span>
                        <span className="text-white">{selectedRule.drops_records ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Created By:</span>
                        <span className="text-white">{selectedRule.created_by}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIPTION</h3>
                    <p className="text-sm text-neutral-300">{selectedRule.query_description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">REMEDIATION HINT</h3>
                    <p className="text-sm text-orange-400">{selectedRule.remediation_hint}</p>
                  </div>

                  {/* Dependencies Section */}
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      <LinkIcon className="w-3.5 h-3.5 inline mr-1.5" />
                      RULE DEPENDENCIES
                    </h3>
                    {selectedRule.dependency_query_ids.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-neutral-500 mb-2">This rule depends on:</p>
                        {getDependencyNames(selectedRule.dependency_query_ids).map((dep) => (
                          <div key={dep.query_id} className="p-2.5 bg-neutral-800 rounded flex items-center gap-3">
                            <Badge className="bg-cyan-500/10 text-cyan-400 text-xs font-mono shrink-0">
                              Q-{dep.query_id}
                            </Badge>
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{dep.query_name}</p>
                              <p className="text-xs text-neutral-500">{dep.execution_group} / Stage {dep.execution_stage}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">Independent rule - no dependencies</p>
                    )}
                    {getRuleDependents(selectedRule.query_id).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-neutral-500 mb-2">Rules that depend on this:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {getRuleDependents(selectedRule.query_id).map((dep) => (
                            <Badge key={dep.query_id} className="bg-amber-500/10 text-amber-400 text-xs font-mono">
                              Q-{dep.query_id} {dep.query_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">SQL STATEMENT</h3>
                    <div className="bg-neutral-950 border border-neutral-700 rounded p-4 font-mono text-xs text-orange-400 overflow-x-auto">
                      <div className="flex items-center gap-2 mb-2 text-neutral-500">
                        <Code className="w-3 h-3" />
                        <span>query</span>
                      </div>
                      <pre className="whitespace-pre-wrap">{selectedRule.sql_statement}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">COMPLIANCE MAPPINGS</h3>
                    <div className="space-y-2">
                      {getComplianceForQuery(selectedRule.query_id).length > 0 ? (
                        getComplianceForQuery(selectedRule.query_id).map((c) => (
                          <div key={c.compliance_code} className="p-3 bg-neutral-800 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-orange-500/10 text-orange-400 text-xs">{c.compliance_code}</Badge>
                              <span className="text-xs text-white">{c.compliance_name}</span>
                            </div>
                            <p className="text-xs text-neutral-400">{c.compliance_description}</p>
                            <p className="text-xs text-orange-400 mt-1">{c.recommended_action}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500">No compliance mappings</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">EFFECTIVE PERIOD</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">From:</span>
                        <span className="text-white font-mono">
                    {selectedRule.effective_from
                      ? formatDate(selectedRule.effective_from)
                      : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">To:</span>
                        <span className="text-white font-mono">
                    {selectedRule.effective_to
                      ? formatDate(selectedRule.effective_to)
                      : "No end date"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formMode !== null} onOpenChange={(open) => { if (!open) setFormMode(null) }}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-wider text-white">
              {formMode === "create" ? "CREATE NEW RULE" : "EDIT RULE"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {formMode === "create"
                ? "Define a new data quality rule with SQL, severity, and dependency configuration."
                : `Editing rule Q-${editingId}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Row 1: Name + Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-name">RULE NAME *</label>
                <Input
                  id="rule-name"
                  value={formData.query_name}
                  onChange={(e) => setFormData((f) => ({ ...f, query_name: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                  placeholder="e.g. DQ-9 Missing Email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-group">EXECUTION GROUP</label>
                <Select
                  value={formData.execution_group}
                  onValueChange={(v) => setFormData((f) => ({ ...f, execution_group: v }))}
                >
                  <SelectTrigger id="rule-group" className="bg-neutral-800 border-neutral-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="DQ" className="text-white">DQ - Data Quality</SelectItem>
                    <SelectItem value="RI" className="text-white">RI - Referential Integrity</SelectItem>
                    <SelectItem value="SEC" className="text-white">SEC - Security</SelectItem>
                    <SelectItem value="METRIC" className="text-white">METRIC - Metrics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-desc">DESCRIPTION</label>
              <Textarea
                id="rule-desc"
                value={formData.query_description}
                onChange={(e) => setFormData((f) => ({ ...f, query_description: e.target.value }))}
                className="bg-neutral-800 border-neutral-600 text-white min-h-[60px]"
                placeholder="What does this rule check?"
              />
            </div>

            {/* Row 3: SQL */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-sql">SQL STATEMENT *</label>
              <Textarea
                id="rule-sql"
                value={formData.sql_statement}
                onChange={(e) => setFormData((f) => ({ ...f, sql_statement: e.target.value }))}
                className="bg-neutral-950 border-neutral-600 text-orange-400 font-mono min-h-[100px]"
                placeholder="SELECT * FROM ..."
              />
            </div>

            {/* Row 4: Stage + Severity + Target */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-stage">EXECUTION STAGE</label>
                <Input
                  id="rule-stage"
                  type="number"
                  min={1}
                  value={formData.execution_stage}
                  onChange={(e) => setFormData((f) => ({ ...f, execution_stage: Number.parseInt(e.target.value) || 1 }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-severity">SEVERITY</label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData((f) => ({ ...f, severity: v as "ERROR" | "WARN" | "INFO" }))}
                >
                  <SelectTrigger id="rule-severity" className="bg-neutral-800 border-neutral-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="ERROR" className="text-red-400">ERROR - Critical</SelectItem>
                    <SelectItem value="WARN" className="text-orange-400">WARN - Warning</SelectItem>
                    <SelectItem value="INFO" className="text-neutral-300">INFO - Informational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-target">TARGET TABLE</label>
                <Input
                  id="rule-target"
                  value={formData.target_table}
                  onChange={(e) => setFormData((f) => ({ ...f, target_table: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                  placeholder="e.g. gold.orders"
                />
              </div>
            </div>

            {/* Row 5: Remediation + Created By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-hint">REMEDIATION HINT</label>
                <Input
                  id="rule-hint"
                  value={formData.remediation_hint}
                  onChange={(e) => setFormData((f) => ({ ...f, remediation_hint: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                  placeholder="How to fix violations"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-author">CREATED BY</label>
                <Input
                  id="rule-author"
                  value={formData.created_by}
                  onChange={(e) => setFormData((f) => ({ ...f, created_by: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                  placeholder="Author name"
                />
              </div>
            </div>

            {/* Row 6: Toggles */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-neutral-300">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.drops_records}
                  onChange={(e) => setFormData((f) => ({ ...f, drops_records: e.target.checked }))}
                  className="rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-neutral-300">Drops Records</span>
              </label>
            </div>

            {/* Row 7: Effective dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-from">EFFECTIVE FROM</label>
                <Input
                  id="rule-from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData((f) => ({ ...f, effective_from: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 tracking-wider" htmlFor="rule-to">EFFECTIVE TO</label>
                <Input
                  id="rule-to"
                  type="date"
                  value={formData.effective_to}
                  onChange={(e) => setFormData((f) => ({ ...f, effective_to: e.target.value }))}
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
            </div>

            {/* Row 8: Dependencies */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                RULE DEPENDENCIES
              </label>
              <p className="text-xs text-neutral-500">
                Select rules that must run before this rule. Leave empty for an independent rule.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-neutral-800/50 rounded border border-neutral-700">
                {rules
                  .filter((r) => r.query_id !== editingId)
                  .map((r) => {
                    const isSelected = formData.dependency_query_ids.includes(r.query_id)
                    return (
                      <button
                        key={r.query_id}
                        type="button"
                        onClick={() => toggleDependency(r.query_id)}
                        className={`flex items-center gap-2 p-2 rounded text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300"
                            : "bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-cyan-400 bg-cyan-500/20" : "border-neutral-600"
                        }`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-cyan-400" />}
                        </div>
                        <span className="font-mono shrink-0">Q-{r.query_id}</span>
                        <span className="truncate">{r.query_name}</span>
                      </button>
                    )
                  })}
              </div>
              {formData.dependency_query_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formData.dependency_query_ids.map((depId) => {
                    const dep = rules.find((r) => r.query_id === depId)
                    return (
                      <Badge key={depId} className="bg-cyan-500/10 text-cyan-400 text-xs font-mono gap-1">
                        Q-{depId} {dep?.query_name}
                        <button type="button" onClick={() => toggleDependency(depId)} className="hover:text-white ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setFormMode(null)}
              className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.query_name.trim() || !formData.sql_statement.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40"
            >
              {formMode === "create" ? "Create Rule" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Rule</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to delete{" "}
              <span className="text-white font-mono font-medium">
                Q-{deleteTarget?.query_id} {deleteTarget?.query_name}
              </span>
              ? This action cannot be undone.
              {deleteTarget && getRuleDependents(deleteTarget.query_id).length > 0 && (
                <span className="block mt-2 text-amber-400">
                  Warning: {getRuleDependents(deleteTarget.query_id).length} other rule(s) depend on this rule.
                  Their dependency references will be removed.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
