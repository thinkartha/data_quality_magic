import type {
  BatchControl,
  Configuration,
  ExecutionLog,
  QueryRepository,
  NonComplianceActivity,
  NonComplianceQueryMap,
  SiteRepositoryMapping,
  SiteRepositoryResult,
  SiteResultWithActions,
} from "./types"

// ========== SEED DATA ==========

export let batchControls: BatchControl[] = [
  {
    batch_id: 1,
    batch_uuid: "BATCH-UUID-0001",
    batch_name: "Seed Batch Run",
    start_time: "2025-06-15T08:00:00Z",
    end_time: "2025-06-15T08:12:34Z",
    status: "SUCCESS",
    total_queries: 8,
    successful_queries: 7,
    failed_queries: 1,
    total_rows_affected: 150,
    pipeline_type: "SILVER_TO_GOLD",
    triggered_by: "seed-script",
  },
  {
    batch_id: 2,
    batch_uuid: "BATCH-UUID-0002",
    batch_name: "Nightly DQ Run",
    start_time: "2025-06-16T02:00:00Z",
    end_time: "2025-06-16T02:08:45Z",
    status: "SUCCESS",
    total_queries: 8,
    successful_queries: 8,
    failed_queries: 0,
    total_rows_affected: 120,
    pipeline_type: "SILVER_TO_GOLD",
    triggered_by: "scheduler",
  },
  {
    batch_id: 3,
    batch_uuid: "BATCH-UUID-0003",
    batch_name: "Ad-Hoc Reprocessing",
    start_time: "2025-06-17T14:30:00Z",
    end_time: "2025-06-17T14:42:18Z",
    status: "PARTIAL",
    total_queries: 8,
    successful_queries: 6,
    failed_queries: 2,
    total_rows_affected: 95,
    pipeline_type: "SILVER_TO_GOLD",
    triggered_by: "admin-user",
  },
  {
    batch_id: 4,
    batch_uuid: "BATCH-UUID-0004",
    batch_name: "Weekly Full Scan",
    start_time: "2025-06-18T06:00:00Z",
    end_time: null,
    status: "RUNNING",
    total_queries: 8,
    successful_queries: 3,
    failed_queries: 0,
    total_rows_affected: 45,
    pipeline_type: "SILVER_TO_GOLD",
    triggered_by: "scheduler",
  },
  {
    batch_id: 5,
    batch_uuid: "BATCH-UUID-0005",
    batch_name: "Emergency Hotfix Batch",
    start_time: "2025-06-14T22:15:00Z",
    end_time: "2025-06-14T22:18:02Z",
    status: "FAILED",
    total_queries: 4,
    successful_queries: 1,
    failed_queries: 3,
    total_rows_affected: 12,
    pipeline_type: "SILVER_TO_GOLD",
    triggered_by: "ops-team",
  },
]

export let configurations: Configuration[] = [
  { config_key: "DEFAULT_TIMEZONE", config_value: "UTC", config_description: "Default timezone for ETL timestamps", config_type: "SYSTEM", is_active: true, modified_date: "2025-06-01T00:00:00Z" },
  { config_key: "MAX_RETRY", config_value: "3", config_description: "Maximum retry count for failed steps", config_type: "RUNTIME", is_active: true, modified_date: "2025-06-01T00:00:00Z" },
  { config_key: "BATCH_TIMEOUT_SECONDS", config_value: "3600", config_description: "Max batch execution time before timeout", config_type: "RUNTIME", is_active: true, modified_date: "2025-06-10T00:00:00Z" },
  { config_key: "NOTIFICATION_EMAIL", config_value: "dq-alerts@company.com", config_description: "Email for DQ failure notifications", config_type: "NOTIFICATION", is_active: true, modified_date: "2025-06-05T00:00:00Z" },
  { config_key: "LOG_RETENTION_DAYS", config_value: "90", config_description: "Days to retain execution logs", config_type: "SYSTEM", is_active: true, modified_date: "2025-06-01T00:00:00Z" },
]

export let queryRepository: QueryRepository[] = [
  {
    query_id: 1, query_name: "DQ-1 Missing TurnInDateTime", query_description: "Records missing TurnInDateTime",
    sql_statement: "SELECT * FROM gold.orders WHERE turnindatetime IS NULL",
    execution_stage: 1, execution_group: "DQ", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Provide TurnInDateTime", severity: "ERROR",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [],
  },
  {
    query_id: 2, query_name: "DQ-2 Invalid Status", query_description: "Status not in allowed list",
    sql_statement: "SELECT * FROM gold.orders WHERE status NOT IN ('OPEN','CLOSED','PENDING')",
    execution_stage: 2, execution_group: "DQ", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Correct status value", severity: "ERROR",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [1],
  },
  {
    query_id: 3, query_name: "DQ-3 Late Disposition Date", query_description: "Disposition date older than 365 days",
    sql_statement: "SELECT * FROM gold.orders WHERE disposition_date < CURRENT_DATE - INTERVAL '365 days'",
    execution_stage: 3, execution_group: "DQ", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Set a recent disposition date", severity: "WARN",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [1, 2],
  },
  {
    query_id: 4, query_name: "DQ-4 Duplicate Natural Key", query_description: "Duplicate values for business key",
    sql_statement: "SELECT natural_key, COUNT(*) FROM gold.orders GROUP BY natural_key HAVING COUNT(*)>1",
    execution_stage: 4, execution_group: "DQ", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Deduplicate business key", severity: "ERROR",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [],
  },
  {
    query_id: 5, query_name: "RI-1 Orphan Customer", query_description: "Orders referencing missing customer",
    sql_statement: "SELECT o.* FROM gold.orders o LEFT JOIN gold.customers c ON o.customer_id=c.customer_id WHERE c.customer_id IS NULL",
    execution_stage: 1, execution_group: "RI", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Fix customer reference", severity: "ERROR",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [1, 2],
  },
  {
    query_id: 6, query_name: "RI-2 Orphan Product", query_description: "Orders referencing missing product",
    sql_statement: "SELECT o.* FROM gold.orders o LEFT JOIN gold.products p ON o.product_id=p.product_id WHERE p.product_id IS NULL",
    execution_stage: 2, execution_group: "RI", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Fix product reference", severity: "ERROR",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [5],
  },
  {
    query_id: 7, query_name: "SEC-1 PII Masking Check", query_description: "Ensure PII fields are masked",
    sql_statement: "SELECT * FROM gold.customers WHERE ssn ~ '^[0-9]{3}-[0-9]{2}-[0-9]{4}$'",
    execution_stage: 1, execution_group: "SEC", is_active: true, drops_records: false,
    target_table: "gold.customers", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Mask SSN column", severity: "WARN",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [],
  },
  {
    query_id: 8, query_name: "METRIC-1 Row Count Drift", query_description: "Row count deviates from expected threshold",
    sql_statement: "SELECT COUNT(*) FROM gold.orders",
    execution_stage: 1, execution_group: "METRIC", is_active: true, drops_records: false,
    target_table: "gold.orders", created_date: "2025-05-15T00:00:00Z", modified_date: "2025-06-01T00:00:00Z",
    created_by: "seed", remediation_hint: "Investigate upstream load", severity: "INFO",
    effective_from: "2025-05-15T00:00:00Z", effective_to: null,
    dependency_query_ids: [],
  },
]

// ========== CRUD FUNCTIONS FOR QUERY REPOSITORY ==========

let nextQueryId = 9

export function addRule(rule: Omit<QueryRepository, "query_id" | "created_date" | "modified_date">): QueryRepository {
  const newRule: QueryRepository = {
    ...rule,
    query_id: nextQueryId++,
    created_date: new Date().toISOString(),
    modified_date: new Date().toISOString(),
  }
  queryRepository = [...queryRepository, newRule]
  return newRule
}

export function updateRule(queryId: number, updates: Partial<Omit<QueryRepository, "query_id" | "created_date">>): QueryRepository | null {
  const index = queryRepository.findIndex((q) => q.query_id === queryId)
  if (index === -1) return null
  const updated = { ...queryRepository[index], ...updates, modified_date: new Date().toISOString() }
  queryRepository = queryRepository.map((q) => (q.query_id === queryId ? updated : q))
  return updated
}

export function deleteRule(queryId: number): boolean {
  const before = queryRepository.length
  queryRepository = queryRepository.filter((q) => q.query_id !== queryId)
  // Also remove dependency references to deleted rule from other rules
  queryRepository = queryRepository.map((q) => ({
    ...q,
    dependency_query_ids: q.dependency_query_ids.filter((id) => id !== queryId),
  }))
  return queryRepository.length < before
}

export function getRuleDependencies(queryId: number): QueryRepository[] {
  const rule = queryRepository.find((q) => q.query_id === queryId)
  if (!rule) return []
  return queryRepository.filter((q) => rule.dependency_query_ids.includes(q.query_id))
}

export function getRuleDependents(queryId: number): QueryRepository[] {
  return queryRepository.filter((q) => q.dependency_query_ids.includes(queryId))
}

export let nonComplianceActivities: NonComplianceActivity[] = [
  { non_compliance_id: 1, compliance_code: "CC001", compliance_name: "Data Completeness & Validity", compliance_description: "Key fields must be present and valid", recommended_action: "Populate missing fields / correct invalid values" },
  { non_compliance_id: 2, compliance_code: "CC002", compliance_name: "Referential Integrity", compliance_description: "References must point to valid dimension/master rows", recommended_action: "Fix foreign key references" },
  { non_compliance_id: 3, compliance_code: "CC003", compliance_name: "Duplicate Prevention", compliance_description: "Business keys must be unique", recommended_action: "Deduplicate and enforce uniqueness" },
  { non_compliance_id: 4, compliance_code: "CC004", compliance_name: "PII Protection", compliance_description: "PII must be masked or tokenized", recommended_action: "Mask PII fields" },
  { non_compliance_id: 5, compliance_code: "CC005", compliance_name: "Metric Drift", compliance_description: "Unexpected metric drift must be investigated", recommended_action: "Investigate upstream load/source changes" },
]

export let nonComplianceQueryMap: NonComplianceQueryMap[] = [
  // CC001 -> DQ-1, DQ-2, DQ-3
  { non_compliance_id: 1, query_id: 1 },
  { non_compliance_id: 1, query_id: 2 },
  { non_compliance_id: 1, query_id: 3 },
  // CC002 -> RI-1, RI-2
  { non_compliance_id: 2, query_id: 5 },
  { non_compliance_id: 2, query_id: 6 },
  // CC003 -> DQ-3, DQ-4
  { non_compliance_id: 3, query_id: 3 },
  { non_compliance_id: 3, query_id: 4 },
  // CC004 -> SEC-1
  { non_compliance_id: 4, query_id: 7 },
  // CC005 -> METRIC-1
  { non_compliance_id: 5, query_id: 8 },
]

const siteIds = ["12340", "12341", "12342", "12343", "12344", "12345"]

// Generate site repository mappings: all sites x all queries
let mappingId = 0
export let siteRepositoryMappings: SiteRepositoryMapping[] = siteIds.flatMap((siteId) =>
  queryRepository.map((q) => ({
    site_query_id_mapping_id: ++mappingId,
    site_id: siteId,
    query_id: q.query_id,
    execution_stage: q.execution_stage,
    execution_group: q.execution_group,
    is_active: true,
  })),
)

// Generate execution logs for multiple batches
export const executionLogs: ExecutionLog[] = [
  // BATCH-UUID-0001 logs
  { execution_log_id: 1, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 1, execution_group: "DQ", target_table: "gold.orders", target_table_count: 23, start_time: "2025-06-15T08:00:05Z", end_time: "2025-06-15T08:00:17Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 12, talend_job_name: "DQ-1 Missing TurnInDateTime", executed_by: "seed-script" },
  { execution_log_id: 2, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 2, execution_group: "DQ", target_table: "gold.orders", target_table_count: 8, start_time: "2025-06-15T08:00:18Z", end_time: "2025-06-15T08:00:25Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 7, talend_job_name: "DQ-2 Invalid Status", executed_by: "seed-script" },
  { execution_log_id: 3, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 3, execution_group: "DQ", target_table: "gold.orders", target_table_count: 5, start_time: "2025-06-15T08:00:26Z", end_time: "2025-06-15T08:00:30Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 4, talend_job_name: "DQ-3 Late Disposition Date", executed_by: "seed-script" },
  { execution_log_id: 4, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 4, execution_group: "DQ", target_table: "gold.orders", target_table_count: 2, start_time: "2025-06-15T08:00:31Z", end_time: "2025-06-15T08:00:35Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 4, talend_job_name: "DQ-4 Duplicate Natural Key", executed_by: "seed-script" },
  { execution_log_id: 5, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 1, execution_group: "RI", target_table: "gold.orders", target_table_count: 15, start_time: "2025-06-15T08:00:36Z", end_time: "2025-06-15T08:00:47Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 11, talend_job_name: "RI-1 Orphan Customer", executed_by: "seed-script" },
  { execution_log_id: 6, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 2, execution_group: "RI", target_table: "gold.orders", target_table_count: 3, start_time: "2025-06-15T08:00:48Z", end_time: "2025-06-15T08:00:55Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 7, talend_job_name: "RI-2 Orphan Product", executed_by: "seed-script" },
  { execution_log_id: 7, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 1, execution_group: "SEC", target_table: "gold.customers", target_table_count: 12, start_time: "2025-06-15T08:00:56Z", end_time: "2025-06-15T08:01:03Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 7, talend_job_name: "SEC-1 PII Masking Check", executed_by: "seed-script" },
  { execution_log_id: 8, batch_uuid: "BATCH-UUID-0001", site_id: "12340", execution_stage: 1, execution_group: "METRIC", target_table: "gold.orders", target_table_count: 1000, start_time: "2025-06-15T08:01:04Z", end_time: null, status: "FAILED", error_message: "Row count 1000 exceeds threshold deviation of 15%", execution_duration_seconds: 2, talend_job_name: "METRIC-1 Row Count Drift", executed_by: "seed-script" },
  // BATCH-UUID-0001 site 12341
  { execution_log_id: 9, batch_uuid: "BATCH-UUID-0001", site_id: "12341", execution_stage: 1, execution_group: "DQ", target_table: "gold.orders", target_table_count: 18, start_time: "2025-06-15T08:01:10Z", end_time: "2025-06-15T08:01:21Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 11, talend_job_name: "DQ-1 Missing TurnInDateTime", executed_by: "seed-script" },
  { execution_log_id: 10, batch_uuid: "BATCH-UUID-0001", site_id: "12341", execution_stage: 2, execution_group: "DQ", target_table: "gold.orders", target_table_count: 5, start_time: "2025-06-15T08:01:22Z", end_time: "2025-06-15T08:01:28Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 6, talend_job_name: "DQ-2 Invalid Status", executed_by: "seed-script" },
  // BATCH-UUID-0002 logs
  { execution_log_id: 11, batch_uuid: "BATCH-UUID-0002", site_id: "12342", execution_stage: 1, execution_group: "DQ", target_table: "gold.orders", target_table_count: 10, start_time: "2025-06-16T02:00:05Z", end_time: "2025-06-16T02:00:12Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 7, talend_job_name: "DQ-1 Missing TurnInDateTime", executed_by: "scheduler" },
  { execution_log_id: 12, batch_uuid: "BATCH-UUID-0002", site_id: "12342", execution_stage: 2, execution_group: "DQ", target_table: "gold.orders", target_table_count: 3, start_time: "2025-06-16T02:00:13Z", end_time: "2025-06-16T02:00:18Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 5, talend_job_name: "DQ-2 Invalid Status", executed_by: "scheduler" },
  { execution_log_id: 13, batch_uuid: "BATCH-UUID-0002", site_id: "12343", execution_stage: 1, execution_group: "RI", target_table: "gold.orders", target_table_count: 7, start_time: "2025-06-16T02:00:19Z", end_time: "2025-06-16T02:00:28Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 9, talend_job_name: "RI-1 Orphan Customer", executed_by: "scheduler" },
  // BATCH-UUID-0003 logs
  { execution_log_id: 14, batch_uuid: "BATCH-UUID-0003", site_id: "12344", execution_stage: 1, execution_group: "DQ", target_table: "gold.orders", target_table_count: 30, start_time: "2025-06-17T14:30:05Z", end_time: "2025-06-17T14:30:20Z", status: "SUCCESS", error_message: null, execution_duration_seconds: 15, talend_job_name: "DQ-1 Missing TurnInDateTime", executed_by: "admin-user" },
  { execution_log_id: 15, batch_uuid: "BATCH-UUID-0003", site_id: "12344", execution_stage: 2, execution_group: "DQ", target_table: "gold.orders", target_table_count: 0, start_time: "2025-06-17T14:30:21Z", end_time: null, status: "FAILED", error_message: "Connection timeout to gold schema", execution_duration_seconds: 30, talend_job_name: "DQ-2 Invalid Status", executed_by: "admin-user" },
  { execution_log_id: 16, batch_uuid: "BATCH-UUID-0003", site_id: "12345", execution_stage: 1, execution_group: "SEC", target_table: "gold.customers", target_table_count: 0, start_time: "2025-06-17T14:35:00Z", end_time: null, status: "FAILED", error_message: "Permission denied on gold.customers", execution_duration_seconds: 1, talend_job_name: "SEC-1 PII Masking Check", executed_by: "admin-user" },
]

// Generate site repository results from seed data pattern
const pickedQueries = [1, 2, 3, 4, 5] // DQ-1..4 + RI-1
let resultId = 0
export const siteRepositoryResults: SiteRepositoryResult[] = siteIds.flatMap((siteId) =>
  pickedQueries.flatMap((qId) => {
    const q = queryRepository.find((r) => r.query_id === qId)!
    return Array.from({ length: 5 }, (_, gs) => ({
      results_id: ++resultId,
      batch_uuid: "BATCH-UUID-0001",
      site_id: siteId,
      query_id: qId,
      execution_stage: q.execution_stage,
      execution_group: q.execution_group,
      record_key: `REC-${siteId}-${qId}-${gs + 1}`,
      is_violated: (gs + 1) % 3 !== 0,
      violation_details: (gs + 1) % 3 !== 0 ? `Violation from rule: ${q.query_name}` : null,
      last_updated_dttm: "2025-06-15T08:12:00Z",
    }))
  }),
)

// Add more results for BATCH-UUID-0002 and 0003
const batch2Queries = [1, 2, 5]
batch2Queries.forEach((qId) => {
  const q = queryRepository.find((r) => r.query_id === qId)!
  ;["12342", "12343"].forEach((siteId) => {
    for (let gs = 1; gs <= 3; gs++) {
      siteRepositoryResults.push({
        results_id: ++resultId,
        batch_uuid: "BATCH-UUID-0002",
        site_id: siteId,
        query_id: qId,
        execution_stage: q.execution_stage,
        execution_group: q.execution_group,
        record_key: `REC-${siteId}-${qId}-B2-${gs}`,
        is_violated: gs % 2 !== 0,
        violation_details: gs % 2 !== 0 ? `Violation from rule: ${q.query_name}` : null,
        last_updated_dttm: "2025-06-16T02:08:00Z",
      })
    }
  })
})

const batch3Queries = [1, 3, 4]
batch3Queries.forEach((qId) => {
  const q = queryRepository.find((r) => r.query_id === qId)!
  ;["12344", "12345"].forEach((siteId) => {
    for (let gs = 1; gs <= 4; gs++) {
      siteRepositoryResults.push({
        results_id: ++resultId,
        batch_uuid: "BATCH-UUID-0003",
        site_id: siteId,
        query_id: qId,
        execution_stage: q.execution_stage,
        execution_group: q.execution_group,
        record_key: `REC-${siteId}-${qId}-B3-${gs}`,
        is_violated: gs <= 3,
        violation_details: gs <= 3 ? `Violation from rule: ${q.query_name}` : null,
        last_updated_dttm: "2025-06-17T14:42:00Z",
      })
    }
  })
})

// ========== VIEW: v_etl_site_results_with_actions ==========

export function getSiteResultsWithActions(filters?: {
  batch_uuid?: string
  site_id?: string
  execution_group?: string
  severity?: string
}): SiteResultWithActions[] {
  return siteRepositoryResults
    .filter((r) => {
      if (filters?.batch_uuid && r.batch_uuid !== filters.batch_uuid) return false
      if (filters?.site_id && r.site_id !== filters.site_id) return false
      if (filters?.execution_group && r.execution_group !== filters.execution_group) return false
      return true
    })
    .map((r) => {
      const q = queryRepository.find((qr) => qr.query_id === r.query_id)
      const mappedNcIds = nonComplianceQueryMap.filter((m) => m.query_id === r.query_id).map((m) => m.non_compliance_id)
      const ncActivities = nonComplianceActivities.filter((n) => mappedNcIds.includes(n.non_compliance_id))

      const result: SiteResultWithActions = {
        ...r,
        query_name: q?.query_name ?? "Unknown",
        severity: q?.severity ?? null,
        compliance_codes: ncActivities.map((n) => n.compliance_code).join(", ") || null,
        compliance_names: ncActivities.map((n) => n.compliance_name).join(", ") || null,
        recommended_actions: ncActivities.map((n) => n.recommended_action).join(" | ") || null,
      }

      if (filters?.severity && result.severity !== filters.severity) return null
      return result
    })
    .filter(Boolean) as SiteResultWithActions[]
}

// ========== ANALYTICS HELPERS ==========

export function getViolationStats() {
  const total = siteRepositoryResults.length
  const violated = siteRepositoryResults.filter((r) => r.is_violated).length
  const clean = total - violated
  return { total, violated, clean, violationRate: total > 0 ? (violated / total) * 100 : 0 }
}

export function getViolationsByGroup() {
  const groups: Record<string, { total: number; violated: number }> = {}
  for (const r of siteRepositoryResults) {
    if (!groups[r.execution_group]) groups[r.execution_group] = { total: 0, violated: 0 }
    groups[r.execution_group].total++
    if (r.is_violated) groups[r.execution_group].violated++
  }
  return Object.entries(groups).map(([group, stats]) => ({
    group,
    total: stats.total,
    violated: stats.violated,
    clean: stats.total - stats.violated,
    rate: stats.total > 0 ? ((stats.violated / stats.total) * 100).toFixed(1) : "0",
  }))
}

export function getViolationsBySite() {
  const sites: Record<string, { total: number; violated: number }> = {}
  for (const r of siteRepositoryResults) {
    if (!sites[r.site_id]) sites[r.site_id] = { total: 0, violated: 0 }
    sites[r.site_id].total++
    if (r.is_violated) sites[r.site_id].violated++
  }
  return Object.entries(sites).map(([site, stats]) => ({
    site,
    total: stats.total,
    violated: stats.violated,
    clean: stats.total - stats.violated,
    rate: stats.total > 0 ? ((stats.violated / stats.total) * 100).toFixed(1) : "0",
  }))
}

export function getViolationsByBatch() {
  const batches: Record<string, { total: number; violated: number }> = {}
  for (const r of siteRepositoryResults) {
    if (!batches[r.batch_uuid]) batches[r.batch_uuid] = { total: 0, violated: 0 }
    batches[r.batch_uuid].total++
    if (r.is_violated) batches[r.batch_uuid].violated++
  }
  return Object.entries(batches).map(([batchUuid, stats]) => {
    const batch = batchControls.find((b) => b.batch_uuid === batchUuid)
    return {
      batch_uuid: batchUuid,
      batch_name: batch?.batch_name ?? batchUuid,
      total: stats.total,
      violated: stats.violated,
      clean: stats.total - stats.violated,
      rate: stats.total > 0 ? ((stats.violated / stats.total) * 100).toFixed(1) : "0",
    }
  })
}

export function getViolationsBySeverity() {
  const severities: Record<string, { total: number; violated: number }> = {}
  for (const r of siteRepositoryResults) {
    const q = queryRepository.find((qr) => qr.query_id === r.query_id)
    const sev = q?.severity ?? "UNKNOWN"
    if (!severities[sev]) severities[sev] = { total: 0, violated: 0 }
    severities[sev].total++
    if (r.is_violated) severities[sev].violated++
  }
  return Object.entries(severities).map(([severity, stats]) => ({
    severity,
    total: stats.total,
    violated: stats.violated,
    clean: stats.total - stats.violated,
  }))
}

export function getComplianceSummary() {
  return nonComplianceActivities.map((nc) => {
    const queryIds = nonComplianceQueryMap.filter((m) => m.non_compliance_id === nc.non_compliance_id).map((m) => m.query_id)
    const results = siteRepositoryResults.filter((r) => queryIds.includes(r.query_id))
    const violated = results.filter((r) => r.is_violated).length
    return {
      ...nc,
      total_records: results.length,
      violated_records: violated,
      clean_records: results.length - violated,
      compliance_rate: results.length > 0 ? (((results.length - violated) / results.length) * 100).toFixed(1) : "100",
    }
  })
}

// ========== CRUD FUNCTIONS FOR BATCH CONTROL ==========

let nextBatchId = 6

export function triggerBatch(batchName: string, pipelineType: string, triggeredBy: string): BatchControl {
  const newBatch: BatchControl = {
    batch_id: nextBatchId++,
    batch_uuid: `BATCH-UUID-${String(nextBatchId - 1).padStart(4, "0")}`,
    batch_name: batchName,
    start_time: new Date().toISOString(),
    end_time: null,
    status: "RUNNING",
    total_queries: queryRepository.filter((q) => q.is_active).length,
    successful_queries: 0,
    failed_queries: 0,
    total_rows_affected: 0,
    pipeline_type: pipelineType,
    triggered_by: triggeredBy,
  }
  batchControls = [newBatch, ...batchControls]
  return newBatch
}

export function completeBatch(batchUuid: string, status: "SUCCESS" | "FAILED" | "PARTIAL"): BatchControl | null {
  const index = batchControls.findIndex((b) => b.batch_uuid === batchUuid)
  if (index === -1) return null
  const totalActive = queryRepository.filter((q) => q.is_active).length
  const failed = status === "FAILED" ? totalActive : status === "PARTIAL" ? Math.floor(totalActive * 0.3) : 0
  const successful = totalActive - failed
  const updated: BatchControl = {
    ...batchControls[index],
    end_time: new Date().toISOString(),
    status,
    successful_queries: successful,
    failed_queries: failed,
    total_rows_affected: Math.floor(Math.random() * 200) + 20,
  }
  batchControls = batchControls.map((b) => (b.batch_uuid === batchUuid ? updated : b))
  return updated
}

export function stopBatch(batchUuid: string): BatchControl | null {
  const index = batchControls.findIndex((b) => b.batch_uuid === batchUuid)
  if (index === -1) return null
  if (batchControls[index].status !== "RUNNING") return null
  const updated: BatchControl = {
    ...batchControls[index],
    end_time: new Date().toISOString(),
    status: "STOPPED",
  }
  batchControls = batchControls.map((b) => (b.batch_uuid === batchUuid ? updated : b))
  return updated
}

// ========== CRUD FUNCTIONS FOR NON-COMPLIANCE ACTIVITIES ==========

let nextNonComplianceId = 6

export function addNonComplianceActivity(
  activity: Omit<NonComplianceActivity, "non_compliance_id">,
  linkedQueryIds?: number[]
): NonComplianceActivity {
  const newActivity: NonComplianceActivity = {
    ...activity,
    non_compliance_id: nextNonComplianceId++,
  }
  nonComplianceActivities = [...nonComplianceActivities, newActivity]
  if (linkedQueryIds && linkedQueryIds.length > 0) {
    for (const qId of linkedQueryIds) {
      nonComplianceQueryMap = [
        ...nonComplianceQueryMap,
        { non_compliance_id: newActivity.non_compliance_id, query_id: qId },
      ]
    }
  }
  return newActivity
}

export function updateNonComplianceActivity(
  nonComplianceId: number,
  updates: Partial<Omit<NonComplianceActivity, "non_compliance_id">>,
  linkedQueryIds?: number[]
): NonComplianceActivity | null {
  const index = nonComplianceActivities.findIndex((a) => a.non_compliance_id === nonComplianceId)
  if (index === -1) return null
  const updated = { ...nonComplianceActivities[index], ...updates }
  nonComplianceActivities = nonComplianceActivities.map((a) =>
    a.non_compliance_id === nonComplianceId ? updated : a
  )
  if (linkedQueryIds !== undefined) {
    nonComplianceQueryMap = nonComplianceQueryMap.filter((m) => m.non_compliance_id !== nonComplianceId)
    for (const qId of linkedQueryIds) {
      nonComplianceQueryMap = [
        ...nonComplianceQueryMap,
        { non_compliance_id: nonComplianceId, query_id: qId },
      ]
    }
  }
  return updated
}

export function deleteNonComplianceActivity(nonComplianceId: number): boolean {
  const before = nonComplianceActivities.length
  nonComplianceActivities = nonComplianceActivities.filter((a) => a.non_compliance_id !== nonComplianceId)
  nonComplianceQueryMap = nonComplianceQueryMap.filter((m) => m.non_compliance_id !== nonComplianceId)
  return nonComplianceActivities.length < before
}

export function getLinkedQueryIds(nonComplianceId: number): number[] {
  return nonComplianceQueryMap.filter((m) => m.non_compliance_id === nonComplianceId).map((m) => m.query_id)
}

// ========== CRUD FUNCTIONS FOR SITE REPOSITORY MAPPINGS ==========

let nextMappingId = siteRepositoryMappings.length + 1

export function addSiteMapping(mapping: Omit<SiteRepositoryMapping, "site_query_id_mapping_id">): SiteRepositoryMapping {
  const newMapping: SiteRepositoryMapping = {
    ...mapping,
    site_query_id_mapping_id: nextMappingId++,
  }
  siteRepositoryMappings = [...siteRepositoryMappings, newMapping]
  return newMapping
}

export function updateSiteMapping(
  mappingId: number,
  updates: Partial<Omit<SiteRepositoryMapping, "site_query_id_mapping_id">>,
): SiteRepositoryMapping | null {
  const index = siteRepositoryMappings.findIndex((m) => m.site_query_id_mapping_id === mappingId)
  if (index === -1) return null
  const updated = { ...siteRepositoryMappings[index], ...updates }
  siteRepositoryMappings = siteRepositoryMappings.map((m) =>
    m.site_query_id_mapping_id === mappingId ? updated : m,
  )
  return updated
}

export function deleteSiteMapping(mappingId: number): boolean {
  const before = siteRepositoryMappings.length
  siteRepositoryMappings = siteRepositoryMappings.filter((m) => m.site_query_id_mapping_id !== mappingId)
  return siteRepositoryMappings.length < before
}

// ========== CRUD FUNCTIONS FOR CONFIGURATIONS ==========

export function addConfiguration(config: Configuration): Configuration {
  configurations = [...configurations, config]
  return config
}

export function updateConfiguration(
  configKey: string,
  updates: Partial<Omit<Configuration, "config_key">>,
): Configuration | null {
  const index = configurations.findIndex((c) => c.config_key === configKey)
  if (index === -1) return null
  const updated = { ...configurations[index], ...updates, modified_date: new Date().toISOString() }
  configurations = configurations.map((c) => (c.config_key === configKey ? updated : c))
  return updated
}

export function deleteConfiguration(configKey: string): boolean {
  const before = configurations.length
  configurations = configurations.filter((c) => c.config_key !== configKey)
  return configurations.length < before
}
