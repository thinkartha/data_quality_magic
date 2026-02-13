"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Settings,
  Database,
  MapPin,
  Link2,
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  siteRepositoryMappings,
  queryRepository,
  configurations,
  addSiteMapping,
  updateSiteMapping,
  deleteSiteMapping,
  addConfiguration,
  updateConfiguration,
  deleteConfiguration,
} from "@/lib/data-store"
import { formatDate } from "@/lib/utils"
import type { SiteRepositoryMapping, Configuration } from "@/lib/types"

const GROUPS = ["DQ", "RI", "SEC", "METRIC"]

export default function SiteMappingPage() {
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"sites" | "config">("sites")
  const [, forceUpdate] = useState(0)

  // Mapping dialog state
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [editingMapping, setEditingMapping] = useState<SiteRepositoryMapping | null>(null)
  const [mappingForm, setMappingForm] = useState({
    site_id: "",
    query_id: 0,
    execution_stage: 1,
    execution_group: "DQ",
    is_active: true,
  })

  // Config dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null)
  const [configForm, setConfigForm] = useState({
    config_key: "",
    config_value: "",
    config_description: "",
    config_type: "SYSTEM",
    is_active: true,
  })

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "mapping"; id: number } | { type: "config"; key: string } | null>(null)

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  const siteIds = [...new Set(siteRepositoryMappings.map((m) => m.site_id))].sort()

  const getSiteMappings = (siteId: string) =>
    siteRepositoryMappings.filter((m) => m.site_id === siteId)

  const getSiteStats = (siteId: string) => {
    const mappings = getSiteMappings(siteId)
    const active = mappings.filter((m) => m.is_active).length
    const groups = [...new Set(mappings.map((m) => m.execution_group))]
    return { total: mappings.length, active, groups }
  }

  const filteredSites = siteIds.filter((s) =>
    searchTerm ? s.toLowerCase().includes(searchTerm.toLowerCase()) : true,
  )

  // ---- Mapping CRUD handlers ----
  const openNewMapping = () => {
    setEditingMapping(null)
    setMappingForm({
      site_id: selectedSite ?? "",
      query_id: queryRepository[0]?.query_id ?? 0,
      execution_stage: 1,
      execution_group: "DQ",
      is_active: true,
    })
    setMappingDialogOpen(true)
  }

  const openEditMapping = (m: SiteRepositoryMapping) => {
    setEditingMapping(m)
    setMappingForm({
      site_id: m.site_id,
      query_id: m.query_id,
      execution_stage: m.execution_stage,
      execution_group: m.execution_group,
      is_active: m.is_active,
    })
    setMappingDialogOpen(true)
  }

  const handleSaveMapping = () => {
    if (!mappingForm.site_id.trim()) return
    const rule = queryRepository.find((q) => q.query_id === mappingForm.query_id)
    if (editingMapping) {
      updateSiteMapping(editingMapping.site_query_id_mapping_id, {
        site_id: mappingForm.site_id.trim(),
        query_id: mappingForm.query_id,
        execution_stage: rule?.execution_stage ?? mappingForm.execution_stage,
        execution_group: rule?.execution_group ?? mappingForm.execution_group,
        is_active: mappingForm.is_active,
      })
    } else {
      addSiteMapping({
        site_id: mappingForm.site_id.trim(),
        query_id: mappingForm.query_id,
        execution_stage: rule?.execution_stage ?? mappingForm.execution_stage,
        execution_group: rule?.execution_group ?? mappingForm.execution_group,
        is_active: mappingForm.is_active,
      })
    }
    setMappingDialogOpen(false)
    refresh()
  }

  // ---- Config CRUD handlers ----
  const openNewConfig = () => {
    setEditingConfig(null)
    setConfigForm({
      config_key: "",
      config_value: "",
      config_description: "",
      config_type: "SYSTEM",
      is_active: true,
    })
    setConfigDialogOpen(true)
  }

  const openEditConfig = (c: Configuration) => {
    setEditingConfig(c)
    setConfigForm({
      config_key: c.config_key,
      config_value: c.config_value,
      config_description: c.config_description,
      config_type: c.config_type,
      is_active: c.is_active,
    })
    setConfigDialogOpen(true)
  }

  const handleSaveConfig = () => {
    if (!configForm.config_key.trim()) return
    if (editingConfig) {
      updateConfiguration(editingConfig.config_key, {
        config_value: configForm.config_value,
        config_description: configForm.config_description,
        config_type: configForm.config_type,
        is_active: configForm.is_active,
      })
    } else {
      addConfiguration({
        config_key: configForm.config_key.trim(),
        config_value: configForm.config_value,
        config_description: configForm.config_description,
        config_type: configForm.config_type,
        is_active: configForm.is_active,
        modified_date: new Date().toISOString(),
      })
    }
    setConfigDialogOpen(false)
    refresh()
  }

  // ---- Delete handler ----
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "mapping") {
      deleteSiteMapping(deleteTarget.id)
    } else {
      deleteConfiguration(deleteTarget.key)
    }
    setDeleteTarget(null)
    refresh()
  }

  // Update rule auto-fill when query changes in mapping form
  const handleQueryChange = (queryId: number) => {
    const rule = queryRepository.find((q) => q.query_id === queryId)
    setMappingForm({
      ...mappingForm,
      query_id: queryId,
      execution_stage: rule?.execution_stage ?? mappingForm.execution_stage,
      execution_group: rule?.execution_group ?? mappingForm.execution_group,
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SITE MAPPING & CONFIGURATION</h1>
          <p className="text-sm text-neutral-400">
            Site-to-rule mappings and ETL configuration management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={openNewMapping}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Mapping
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              setActiveTab("config")
              openNewConfig()
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("sites")}
          className={`px-4 py-2 rounded text-sm font-medium tracking-wider transition-colors ${
            activeTab === "sites"
              ? "bg-orange-500 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            SITE MAPPINGS
          </div>
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded text-sm font-medium tracking-wider transition-colors ${
            activeTab === "config"
              ? "bg-orange-500 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            ETL CONFIGURATION
          </div>
        </button>
      </div>

      {activeTab === "sites" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL SITES</p>
                <p className="text-2xl font-bold text-white font-mono">{siteIds.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL MAPPINGS</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {siteRepositoryMappings.length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE MAPPINGS</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {siteRepositoryMappings.filter((m) => m.is_active).length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-400 tracking-wider">RULES MAPPED</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  {queryRepository.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search site ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>

          {/* Site Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSites.map((siteId) => {
              const stats = getSiteStats(siteId)
              const isSelected = selectedSite === siteId
              return (
                <Card
                  key={siteId}
                  className={`bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer ${
                    isSelected ? "border-orange-500" : ""
                  }`}
                  onClick={() => setSelectedSite(isSelected ? null : siteId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-orange-500" />
                        <div>
                          <CardTitle className="text-sm font-bold text-white tracking-wider font-mono">
                            SITE {siteId}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge className="bg-neutral-700 text-white">
                        {stats.active}/{stats.total} active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {stats.groups.map((g) => (
                        <Badge key={g} className="bg-neutral-800 text-neutral-300 text-xs font-mono">
                          {g}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center p-2 bg-neutral-800 rounded">
                        <div className="text-white font-mono font-bold">{stats.total}</div>
                        <div className="text-neutral-500">Rules</div>
                      </div>
                      <div className="text-center p-2 bg-neutral-800 rounded">
                        <div className="text-white font-mono font-bold">{stats.groups.length}</div>
                        <div className="text-neutral-500">Groups</div>
                      </div>
                      <div className="text-center p-2 bg-neutral-800 rounded">
                        <div className="text-white font-mono font-bold">{stats.active}</div>
                        <div className="text-neutral-500">Active</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Selected Site Detail */}
          {selectedSite && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                    SITE {selectedSite} -- RULE MAPPINGS
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      openNewMapping()
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">MAP ID</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">QUERY ID</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">RULE NAME</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">GROUP</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">STAGE</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">TARGET TABLE</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-neutral-400 tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSiteMappings(selectedSite).map((m) => {
                        const rule = queryRepository.find((q) => q.query_id === m.query_id)
                        return (
                          <tr
                            key={m.site_query_id_mapping_id}
                            className="border-b border-neutral-800/50 hover:bg-neutral-800 transition-colors group"
                          >
                            <td className="py-2 px-3 text-xs text-neutral-400 font-mono">{m.site_query_id_mapping_id}</td>
                            <td className="py-2 px-3 text-xs text-white font-mono">Q-{m.query_id}</td>
                            <td className="py-2 px-3 text-xs text-neutral-300">{rule?.query_name ?? "Unknown"}</td>
                            <td className="py-2 px-3">
                              <Badge className="bg-neutral-800 text-neutral-300 text-xs font-mono">{m.execution_group}</Badge>
                            </td>
                            <td className="py-2 px-3 text-xs text-white font-mono">{m.execution_stage}</td>
                            <td className="py-2 px-3 text-xs text-neutral-400 font-mono">{rule?.target_table ?? "--"}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                {m.is_active ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-white" />
                                    <span className="text-xs text-white">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-neutral-500" />
                                    <span className="text-xs text-neutral-500">Inactive</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-neutral-400 hover:text-orange-400 hover:bg-neutral-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditMapping(m)
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span className="sr-only">Edit mapping</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-neutral-400 hover:text-red-400 hover:bg-neutral-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteTarget({ type: "mapping", id: m.site_query_id_mapping_id })
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="sr-only">Delete mapping</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === "config" && (
        <>
          {/* Configuration Table */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  ETL CONFIGURATION (etl_configuration)
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs"
                  onClick={openNewConfig}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Config
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CONFIG KEY</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">VALUE</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DESCRIPTION</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TYPE</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">MODIFIED</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configurations.map((config, index) => (
                      <tr
                        key={config.config_key}
                        className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors group ${
                          index % 2 === 0 ? "bg-neutral-900" : ""
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-orange-400 font-mono">{config.config_key}</td>
                        <td className="py-3 px-4 text-sm text-white font-mono">{config.config_value}</td>
                        <td className="py-3 px-4 text-sm text-neutral-300">{config.config_description}</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-neutral-800 text-neutral-300 text-xs">{config.config_type}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {config.is_active ? (
                              <>
                                <div className="w-2 h-2 rounded-full bg-white" />
                                <span className="text-xs text-white">Active</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 rounded-full bg-neutral-600" />
                                <span className="text-xs text-neutral-500">Inactive</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-400 font-mono">
                          {formatDate(config.modified_date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-neutral-400 hover:text-orange-400 hover:bg-neutral-700"
                              onClick={() => openEditConfig(config)}
                            >
                              <Pencil className="w-3 h-3" />
                              <span className="sr-only">Edit config</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-neutral-400 hover:text-red-400 hover:bg-neutral-700"
                              onClick={() => setDeleteTarget({ type: "config", key: config.config_key })}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="sr-only">Delete config</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Schema Overview */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                ETL SCHEMA OVERVIEW
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  { table: "etl_batch_control", description: "Batch run lifecycle tracking", icon: <Database className="w-4 h-4" /> },
                  { table: "etl_execution_log", description: "Per-stage execution logs per batch", icon: <Settings className="w-4 h-4" /> },
                  { table: "etl_query_repository", description: "DQ rules, SQL, severity, group/stage", icon: <Link2 className="w-4 h-4" /> },
                  { table: "etl_non_compliance_activity", description: "Compliance codes and remediation actions", icon: <MapPin className="w-4 h-4" /> },
                  { table: "etl_non_compliance_query_map", description: "Many-to-many: compliance <> rules", icon: <Link2 className="w-4 h-4" /> },
                  { table: "etl_site_repository_mapping", description: "Site-to-rule active assignments", icon: <MapPin className="w-4 h-4" /> },
                  { table: "etl_site_repository_results", description: "Per-record violation results per batch", icon: <Database className="w-4 h-4" /> },
                  { table: "etl_configuration", description: "System and runtime config key-values", icon: <Settings className="w-4 h-4" /> },
                ].map((t) => (
                  <div
                    key={t.table}
                    className="p-4 bg-neutral-800 rounded border border-neutral-700 hover:border-orange-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2 text-orange-500">
                      {t.icon}
                      <span className="text-xs font-mono text-white">{t.table}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{t.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ========== ADD / EDIT MAPPING DIALOG ========== */}
      <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold tracking-wider text-orange-400">
              {editingMapping ? "EDIT MAPPING" : "NEW SITE-RULE MAPPING"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">SITE ID</Label>
              <Input
                value={mappingForm.site_id}
                onChange={(e) => setMappingForm({ ...mappingForm, site_id: e.target.value })}
                placeholder="e.g. 12340"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">RULE</Label>
              <Select
                value={String(mappingForm.query_id)}
                onValueChange={(v) => handleQueryChange(Number(v))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  {queryRepository.map((q) => (
                    <SelectItem key={q.query_id} value={String(q.query_id)} className="text-neutral-200">
                      Q-{q.query_id}: {q.query_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">GROUP</Label>
                <Select
                  value={mappingForm.execution_group}
                  onValueChange={(v) => setMappingForm({ ...mappingForm, execution_group: v })}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    {GROUPS.map((g) => (
                      <SelectItem key={g} value={g} className="text-neutral-200">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-neutral-400 tracking-wider">STAGE</Label>
                <Input
                  type="number"
                  min={1}
                  value={mappingForm.execution_stage}
                  onChange={(e) => setMappingForm({ ...mappingForm, execution_stage: Number(e.target.value) })}
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700">
              <Label className="text-xs text-neutral-300 tracking-wider">ACTIVE</Label>
              <Switch
                checked={mappingForm.is_active}
                onCheckedChange={(v) => setMappingForm({ ...mappingForm, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800"
              onClick={() => setMappingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSaveMapping}
              disabled={!mappingForm.site_id.trim()}
            >
              {editingMapping ? "Update Mapping" : "Create Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== ADD / EDIT CONFIG DIALOG ========== */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold tracking-wider text-orange-400">
              {editingConfig ? "EDIT CONFIGURATION" : "NEW CONFIGURATION"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">CONFIG KEY</Label>
              <Input
                value={configForm.config_key}
                onChange={(e) => setConfigForm({ ...configForm, config_key: e.target.value })}
                placeholder="e.g. MAX_RETRY"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 font-mono"
                disabled={!!editingConfig}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">VALUE</Label>
              <Input
                value={configForm.config_value}
                onChange={(e) => setConfigForm({ ...configForm, config_value: e.target.value })}
                placeholder="Config value"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">DESCRIPTION</Label>
              <Input
                value={configForm.config_description}
                onChange={(e) => setConfigForm({ ...configForm, config_description: e.target.value })}
                placeholder="What this config controls"
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-400 tracking-wider">TYPE</Label>
              <Select
                value={configForm.config_type}
                onValueChange={(v) => setConfigForm({ ...configForm, config_type: v })}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  <SelectItem value="SYSTEM" className="text-neutral-200">SYSTEM</SelectItem>
                  <SelectItem value="RUNTIME" className="text-neutral-200">RUNTIME</SelectItem>
                  <SelectItem value="NOTIFICATION" className="text-neutral-200">NOTIFICATION</SelectItem>
                  <SelectItem value="SECURITY" className="text-neutral-200">SECURITY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700">
              <Label className="text-xs text-neutral-300 tracking-wider">ACTIVE</Label>
              <Switch
                checked={configForm.is_active}
                onCheckedChange={(v) => setConfigForm({ ...configForm, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800"
              onClick={() => setConfigDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSaveConfig}
              disabled={!configForm.config_key.trim()}
            >
              {editingConfig ? "Update Config" : "Create Config"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DELETE CONFIRMATION ========== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 tracking-wider">CONFIRM DELETE</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              {deleteTarget?.type === "mapping"
                ? `This will permanently remove mapping #${deleteTarget.id} from the site. This action cannot be undone.`
                : deleteTarget?.type === "config"
                  ? `This will permanently remove the "${deleteTarget.key}" configuration key. This action cannot be undone.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
