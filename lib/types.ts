// Types matching the PostgreSQL DDL schema

export interface BatchControl {
  batch_id: number
  batch_uuid: string
  batch_name: string
  start_time: string
  end_time: string | null
  status: "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL" | "STOPPED"
  total_queries: number
  successful_queries: number
  failed_queries: number
  total_rows_affected: number
  pipeline_type: string
  triggered_by: string
}

export interface Configuration {
  config_key: string
  config_value: string
  config_description: string
  config_type: string
  is_active: boolean
  modified_date: string
}

export interface ExecutionLog {
  execution_log_id: number
  batch_uuid: string
  site_id: string
  execution_stage: number
  execution_group: string
  target_table: string
  target_table_count: number
  start_time: string
  end_time: string | null
  status: "RUNNING" | "SUCCESS" | "FAILED"
  error_message: string | null
  execution_duration_seconds: number | null
  talend_job_name: string
  executed_by: string
}

export interface QueryRepository {
  query_id: number
  query_name: string
  query_description: string | null
  sql_statement: string
  execution_stage: number
  execution_group: string
  is_active: boolean
  drops_records: boolean
  target_table: string | null
  created_date: string
  modified_date: string
  created_by: string | null
  remediation_hint: string | null
  severity: "ERROR" | "WARN" | "INFO" | null
  effective_from: string | null
  effective_to: string | null
  dependency_query_ids: number[] // IDs of rules this rule depends on (empty = independent)
}

export interface NonComplianceActivity {
  non_compliance_id: number
  compliance_code: string
  compliance_name: string
  compliance_description: string | null
  recommended_action: string | null
}

export interface NonComplianceQueryMap {
  non_compliance_id: number
  query_id: number
}

export interface SiteRepositoryMapping {
  site_query_id_mapping_id: number
  site_id: string
  query_id: number
  execution_stage: number
  execution_group: string
  is_active: boolean
}

export interface SiteRepositoryResult {
  results_id: number
  batch_uuid: string
  site_id: string
  query_id: number
  execution_stage: number
  execution_group: string
  record_key: string
  is_violated: boolean
  violation_details: string | null
  last_updated_dttm: string
}

// View type matching v_etl_site_results_with_actions
export interface SiteResultWithActions extends SiteRepositoryResult {
  query_name: string
  severity: "ERROR" | "WARN" | "INFO" | null
  compliance_codes: string | null
  compliance_names: string | null
  recommended_actions: string | null
}
