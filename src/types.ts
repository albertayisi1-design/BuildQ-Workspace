export type CorporateRole = 'admin' | 'pm' | 'engineer' | 'finance';

export type UserRole =
  | 'admin'
  | 'pm'
  | 'project_manager'
  | 'engineer'
  | 'engineers'
  | 'finance'
  | 'site_supervisor'
  | 'cost_estimator'
  | 'safety_officer';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  department?: string;
  created_at?: string;
  created_by?: string;
  phone?: string;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  payment_terms?: string;
  created_at?: string;
  created_by?: string;
  notes?: string;
}

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Closed';

export type ProjectType =
  | 'Residential'
  | 'Commercial'
  | 'Office Renovation'
  | 'Retail'
  | 'Industrial'
  | 'Institutional'
  | 'Other';

export type CostCategory = 'Labour' | 'Materials' | 'Subcontractor' | 'Equipment' | 'Other';
export type CostType = CostCategory;

export type DeliveryMethod = 'Design-Bid-Build' | 'Design-Build' | 'Construction Management';

export type ActivityStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export type HealthStatus = 'GREEN' | 'AMBER' | 'RED' | 'GREY';

export interface Project {
  id: string;
  project_number: string;
  name: string;
  client_id: string;
  type: ProjectType;
  building_type: string;
  location: string;
  floor_area: number; // in m²
  floors: number;
  contract_value: number; // CAD
  approved_budget: number; // CAD
  start_date: string;
  planned_completion: string;
  actual_completion?: string;
  project_manager: string;
  description: string;
  status: ProjectStatus;
  // Calculated / dynamic fields
  actual_cost?: number;
  forecast_remaining?: number;
  progress?: number; // 0 - 100%
  created_at: string;
}

export interface WBSItem {
  id: string;
  project_id: string;
  parent_id?: string | null; // For hierarchical Phase -> Activity
  is_phase: boolean;
  phase_code?: string;
  wbs_code: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  planned_cost: number;
  actual_cost: number;
  progress: number; // 0 - 100%
  status: ActivityStatus;
}

export interface CostRecord {
  id: string;
  project_id: string;
  wbs_id: string;
  category: CostCategory;
  description: string;
  amount: number;
  date: string;
  payee: string;
  reference: string;
  supplier_contractor?: string;
  invoice_number?: string;
  cost_type?: string;
  notes?: string;
  attachment?: string;
  created_at: string;
}

export type Cost = CostRecord;

export type DocumentCategory =
  | 'Blueprint'
  | 'Contract'
  | 'Permit'
  | 'Specification'
  | 'Safety & Compliance'
  | 'Other';

export type DocumentStatus = 'Approved' | 'Under Review' | 'Draft' | 'Active' | 'Expired';

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  file_name: string;
  category: DocumentCategory;
  file_size: number; // in bytes
  file_type: string; // e.g. 'application/pdf', 'image/png', etc.
  version: string; // e.g. 'Rev C', 'v1.0'
  status: DocumentStatus;
  uploaded_by: string;
  uploaded_by_uid?: string;
  uploaded_at: string; // ISO string
  description?: string;
  issuing_authority?: string;
  expiry_date?: string;
  file_data?: string; // Data URL or preview string
  tags?: string[];
}

export type SiteReportFlag = 'normal' | 'delay' | 'critical';

export interface AlertRecipientRecord {
  name: string;
  email: string;
  role: string;
  sent_at: string;
}

export interface SiteReportPhoto {
  id: string;
  site_report_id: string;
  file_url: string;
  caption: string;
}

export interface SiteReport {
  id: string;
  project_id: string;
  date: string;
  supervisor: string;
  weather: 'Clear' | 'Sunny' | 'Overcast' | 'Rain' | 'Snow' | 'Windy' | string;
  activities: string; // Activities completed
  workers: number; // Workers on site
  materials: string; // Materials used/received
  issues: string; // Issues / Delays
  safety_notes: string; // Safety notes
  progress: number; // Overall progress reported
  work_completed?: string;
  materials_delivered?: string;
  workers_count?: number;
  comments?: string;
  delays_issues?: string;
  safety_incident?: boolean;
  photos: SiteReportPhoto[];
  created_at: string;
  flag?: SiteReportFlag;
  flag_reason?: string;
  email_alerts_sent?: number;
  last_alert_sent_at?: string;
  alert_recipients?: AlertRecipientRecord[];
}

export interface EmailAlert {
  id: string;
  report_id: string;
  project_id: string;
  project_name: string;
  project_number?: string;
  flag: 'critical' | 'delay';
  recipient_name: string;
  recipient_email: string;
  recipient_role: string;
  sender_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  status: 'sent' | 'delivered' | 'failed';
  created_at: string;
  sent_at: string;
  message_id: string;
  metadata: {
    supervisor: string;
    date: string;
    issues: string;
    weather?: string;
    workers?: number;
    delay_reason?: string;
    activities?: string;
    safety_notes?: string;
  };
}

export interface ProjectHistory {
  id: string;
  project_id: string;
  project_name: string;
  name?: string;
  client_id?: string;
  client_name: string;
  type?: ProjectType;
  project_type: ProjectType;
  building_type: string;
  location: string;
  floor_area: number;
  floors: number;
  contract_value: number;
  planned_cost?: number;
  final_cost: number;
  final_actual_cost?: number;
  final_cost_variance?: number;
  completion_year: number;
  duration_weeks: number;
  planned_duration_months?: number;
  actual_duration_months?: number;
  labour_cost: number;
  material_cost: number;
  subcontractor_cost: number;
  equipment_cost: number;
  other_cost: number;
  profit: number;
  margin: number; // in %
  cost_per_m2: number; // final_cost / floor_area
  contract_value_per_m2: number; // contract_value / floor_area
  completed_date: string;
  completion_date?: string;
  lessons_learned?: string;
  delivery_method?: DeliveryMethod | string;
}

export interface SystemSettings {
  id: string;
  company_name: string;
  currency: string;
  currency_symbol: string;
  amber_threshold_percent: number; // e.g., 5% variance
  red_threshold_percent: number; // e.g., 10% variance
  default_contingency_percent?: number;
  email_notifications_enabled?: boolean;
  alert_pm_on_critical?: boolean;
  alert_pm_on_delay?: boolean;
  email_smtp_from?: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: 'project' | 'cost' | 'wbs' | 'site_report' | 'client' | 'history' | 'settings' | 'auth' | 'user';
  entity_id: string;
  details: string;
  timestamp: string;
}

// Project Intelligence Interfaces
export interface IntelligenceParams {
  project_type: ProjectType;
  building_type: string;
  location: string;
  floor_area: number;
  floors: number;
  delivery_method?: DeliveryMethod | string;
}

export interface IntelligenceQuery {
  name: string;
  project_type: ProjectType;
  building_type: string;
  location: string;
  floor_area: number;
  floors: number;
  delivery_method: DeliveryMethod;
}

export interface MatchedHistoricalProject {
  project: {
    id: string;
    name: string;
    client_name: string;
    type: string;
    building_type: string;
    location: string;
    floor_area: number;
    final_actual_cost: number;
    cost_per_m2: number;
    completion_date: string;
    lessons_learned: string;
  };
  similarity_score: number;
}

export interface IntelligenceResult {
  query: IntelligenceQuery;
  matched_projects: MatchedHistoricalProject[];
  benchmarks: {
    avg_cost_per_m2: number;
    median_cost_per_m2: number;
    min_cost_per_m2: number;
    max_cost_per_m2: number;
    avg_duration_months: number;
  };
  preliminary_estimate: {
    estimated_cost: number;
    range_min: number;
    range_max: number;
    estimated_duration_months: number;
    suggested_contingency_percent: number;
    disclaimer: string;
  };
  category_breakdown: {
    category: string;
    percentage: number;
    amount: number;
  }[];
  risk_factors: string[];
}

export interface SimilarProjectMatch {
  history: ProjectHistory;
  similarity_score: number; // 0 to 100%
  reasons: string[];
}

export interface CostBenchmarkResult {
  params: IntelligenceParams;
  matched_projects: SimilarProjectMatch[];
  avg_cost_per_m2: number;
  median_cost_per_m2: number;
  min_cost_per_m2: number;
  max_cost_per_m2: number;
  preliminary_cost: number;
  preliminary_range_low: number;
  preliminary_range_high: number;
  insights: string[];
  generated_at: string;
}

