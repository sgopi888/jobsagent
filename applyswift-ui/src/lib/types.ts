// ApplySwift — TypeScript interfaces mirroring the Python backend

export interface Job {
  url: string;
  title: string | null;
  salary: string | null;
  description: string | null;
  location: string | null;
  site: string | null;
  strategy: string | null;
  discovered_at: string | null;
  full_description: string | null;
  application_url: string | null;
  detail_scraped_at: string | null;
  detail_error: string | null;
  fit_score: number | null;
  score_reasoning: string | null;
  scored_at: string | null;
  tailored_resume_path: string | null;
  tailored_at: string | null;
  tailor_attempts: number;
  cover_letter_path: string | null;
  cover_letter_at: string | null;
  cover_attempts: number;
  applied_at: string | null;
  apply_status: string | null;
  apply_error: string | null;
  apply_attempts: number;
  agent_id: string | null;
  last_attempted_at: string | null;
  apply_duration_ms: number | null;
  apply_task_id: string | null;
  verification_confidence: string | null;
}

export interface Stats {
  total: number;
  by_site: [string, number][];
  pending_detail: number;
  with_description: number;
  detail_errors: number;
  scored: number;
  unscored: number;
  score_distribution: [number, number][];
  tailored: number;
  untailored_eligible: number;
  tailor_exhausted: number;
  with_cover_letter: number;
  cover_exhausted: number;
  applied: number;
  apply_errors: number;
  ready_to_apply: number;
  applied_jobs: { url: string; title: string; site: string; applied_at: string }[];
}

export interface WorkerState {
  worker_id: number;
  status: string;
  job_title: string;
  company: string;
  score: number;
  start_time: number;
  actions: number;
  last_action: string;
  jobs_applied: number;
  jobs_failed: number;
  jobs_done: number;
  total_cost: number;
  log_file: string | null;
}

export interface StageInfo {
  name: string;
  desc: string;
  pending: number;
  status: "idle" | "running" | "done" | "error";
}

export interface SSEMessage {
  line: string;
  timestamp: string;
}

export interface PipelineRunRequest {
  stages: string[];
  min_score?: number;
  validation_mode?: string;
  stream?: boolean;
}

export interface ApplyRunRequest {
  limit?: number;
  headless?: boolean;
}

export interface ApplyUrlRequest {
  url: string;
  model?: string;
  dry_run?: boolean;
}

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  work_authorization: string;
  compensation: {
    minimum_salary?: number;
    preferred_salary?: number;
    currency?: string;
  };
  skills: string[];
  [key: string]: unknown;
}

export interface SearchConfig {
  queries: string[];
  locations: string[];
  location_accept: string[];
  location_reject: string[];
  exclude_titles: string[];
  platforms?: PlatformConfig;
  [key: string]: unknown;
}

export interface PlatformConfig {
  linkedin?: { enabled: boolean; api_key?: string };
  indeed?: { enabled: boolean };
  glassdoor?: { enabled: boolean };
  dice?: { enabled: boolean };
  [key: string]: { enabled: boolean; api_key?: string } | undefined;
}

export interface LLMConfig {
  provider: "gemini" | "openai" | "claude" | "custom";
  api_key?: string;
  model?: string;
  base_url?: string;
}

export interface DoctorCheck {
  name: string;
  status: "ok" | "missing" | "warn" | "error";
  message: string;
}

export type JobStatus = "discovered" | "enriched" | "scored" | "tailored" | "ready" | "applied" | "failed";

export const STAGE_ORDER = ["discover", "enrich", "score", "tailor", "cover", "pdf"] as const;
export type StageName = typeof STAGE_ORDER[number];

export const STAGE_META: Record<StageName, { desc: string; icon: string }> = {
  discover: { desc: "Job discovery (JobSpy + Workday + smart extract)", icon: "Search" },
  enrich: { desc: "Detail enrichment (full descriptions + apply URLs)", icon: "FileText" },
  score: { desc: "LLM scoring (fit 1-10)", icon: "BarChart3" },
  tailor: { desc: "Resume tailoring (LLM + validation)", icon: "Scissors" },
  cover: { desc: "Cover letter generation", icon: "Mail" },
  pdf: { desc: "PDF conversion (tailored resumes + cover letters)", icon: "FileOutput" },
};
