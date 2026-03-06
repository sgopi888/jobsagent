"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  User, FileText, Search, Cpu, Key, CheckCircle, AlertCircle,
  Loader2, Save, ChevronDown, ChevronRight, Upload, Eye, EyeOff,
} from "lucide-react";
import Header from "@/components/layout/Header";
import StatusPill from "@/components/shared/StatusPill";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "resume",  label: "Resume",  icon: FileText },
  { id: "searches", label: "Search Config", icon: Search },
  { id: "llm",    label: "AI Models", icon: Key },
  { id: "system", label: "System",   icon: Cpu },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="max-w-5xl mx-auto">
      <Header title="Settings" subtitle="Configure your pipeline" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700/50 pb-px overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              tab === t.id
                ? "bg-slate-800/80 text-cyan-400 border-b-2 border-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile"  && <ProfileTab />}
      {tab === "resume"   && <ResumeTab />}
      {tab === "searches" && <SearchesTab />}
      {tab === "llm"      && <LLMTab />}
      {tab === "system"   && <SystemTab />}
    </div>
  );
}

/* ─────────────────────────── shared UI atoms ─────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70 mb-1">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder = "", wide = false, as: Tag = "input",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; wide?: boolean; as?: "input" | "textarea";
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-slate-400 uppercase mb-1 block">{label}</label>
      {Tag === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-y"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
        />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 uppercase mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SaveBar({ onSave, saving, saved, label = "Save" }: {
  onSave: () => void; saving: boolean; saved: boolean; label?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {label}
      </button>
      {saved && (
        <span className="text-sm text-emerald-400 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> Saved
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────── PROFILE TAB ─────────────────────────── */

type ProfileData = {
  personal: Record<string, string>;
  work_authorization: Record<string, string>;
  availability: Record<string, string>;
  compensation: Record<string, string>;
  experience: Record<string, string>;
  skills_boundary: Record<string, string[]>;
  eeo_voluntary: Record<string, string>;
};

const emptyProfile = (): ProfileData => ({
  personal: {},
  work_authorization: {},
  availability: {},
  compensation: {},
  experience: {},
  skills_boundary: { programming_languages: [], ml_ai: [], frameworks: [], tools: [] },
  eeo_voluntary: {},
});

function ProfileTab() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/profile").then((r) => r.json()).then((d) => {
      if (d && typeof d === "object" && d.personal) setProfile(d as ProfileData);
    });
  }, []);

  const setP = (section: keyof ProfileData, key: string, val: string) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, string>), [key]: val },
    }));
  };

  const setSkill = (key: string, val: string) => {
    setProfile((prev) => ({
      ...prev,
      skills_boundary: {
        ...prev.skills_boundary,
        [key]: val.split(",").map((s) => s.trim()).filter(Boolean),
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const p = profile.personal;
  const wa = profile.work_authorization;
  const av = profile.availability;
  const comp = profile.compensation;
  const exp = profile.experience;
  const skills = profile.skills_boundary;
  const eeo = profile.eeo_voluntary;

  const yesNo = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  const eduOptions = [
    { value: "High School", label: "High School" },
    { value: "Associate's Degree", label: "Associate's Degree" },
    { value: "Bachelor's Degree", label: "Bachelor's Degree" },
    { value: "Master's Degree", label: "Master's Degree" },
    { value: "PhD", label: "PhD" },
    { value: "Other", label: "Other" },
  ];
  const declineOpts = [
    "Decline to self-identify", "Male", "Female", "Non-binary", "Other",
  ].map((v) => ({ value: v, label: v }));
  const raceOpts = [
    "Decline to self-identify", "Asian", "Black or African American",
    "Hispanic or Latino", "White", "Two or more races", "Other",
  ].map((v) => ({ value: v, label: v }));
  const vetOpts = [
    "Decline to self-identify",
    "I am not a protected veteran",
    "I identify as a protected veteran",
  ].map((v) => ({ value: v, label: v }));
  const disabilityOpts = [
    "I do not wish to answer",
    "Yes, I have a disability",
    "No, I don't have a disability",
  ].map((v) => ({ value: v, label: v }));
  const currencyOpts = ["USD", "CAD", "EUR", "GBP", "AUD"].map((v) => ({ value: v, label: v }));

  return (
    <div className="space-y-5">

      {/* Personal */}
      <Section title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name"      value={p.full_name || ""}      onChange={(v) => setP("personal", "full_name", v)} />
          <Field label="Preferred Name" value={p.preferred_name || ""} onChange={(v) => setP("personal", "preferred_name", v)} placeholder="First name used on forms" />
          <Field label="Email"          value={p.email || ""}          onChange={(v) => setP("personal", "email", v)} type="email" />
          <Field label="Password (for job portals)" value={p.password || ""} onChange={(v) => setP("personal", "password", v)} type="password" placeholder="Used to sign in to employer portals" />
          <Field label="Phone"          value={p.phone || ""}          onChange={(v) => setP("personal", "phone", v)} type="tel" />
          <Field label="Address"        value={p.address || ""}        onChange={(v) => setP("personal", "address", v)} />
          <Field label="City"           value={p.city || ""}           onChange={(v) => setP("personal", "city", v)} />
          <Field label="State / Province" value={p.province_state || ""} onChange={(v) => setP("personal", "province_state", v)} />
          <Field label="Country"        value={p.country || ""}        onChange={(v) => setP("personal", "country", v)} />
          <Field label="Postal Code"    value={p.postal_code || ""}    onChange={(v) => setP("personal", "postal_code", v)} />
          <Field label="LinkedIn URL"   value={p.linkedin_url || ""}   onChange={(v) => setP("personal", "linkedin_url", v)} placeholder="https://linkedin.com/in/..." />
          <Field label="GitHub URL"     value={p.github_url || ""}     onChange={(v) => setP("personal", "github_url", v)} placeholder="https://github.com/..." />
          <Field label="Portfolio URL"  value={p.portfolio_url || ""}  onChange={(v) => setP("personal", "portfolio_url", v)} />
          <Field label="Website URL"    value={p.website_url || ""}    onChange={(v) => setP("personal", "website_url", v)} />
        </div>
      </Section>

      {/* Work Authorization */}
      <Section title="Work Authorization">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Legally Authorized to Work" value={wa.legally_authorized_to_work || "Yes"} onChange={(v) => setP("work_authorization", "legally_authorized_to_work", v)} options={yesNo} />
          <Select label="Requires Sponsorship" value={wa.require_sponsorship || "No"} onChange={(v) => setP("work_authorization", "require_sponsorship", v)} options={yesNo} />
          <Field  label="Work Permit Type" value={wa.work_permit_type || ""} onChange={(v) => setP("work_authorization", "work_permit_type", v)} placeholder="H-1B, OPT, Citizen, etc." />
        </div>
      </Section>

      {/* Availability */}
      <Section title="Availability">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field  label="Earliest Start Date" value={av.earliest_start_date || ""} onChange={(v) => setP("availability", "earliest_start_date", v)} placeholder="Immediately / 2-4 weeks" />
          <Select label="Available Full-Time" value={av.available_for_full_time || "Yes"} onChange={(v) => setP("availability", "available_for_full_time", v)} options={yesNo} />
          <Select label="Available Contract"  value={av.available_for_contract || "No"}  onChange={(v) => setP("availability", "available_for_contract", v)}  options={yesNo} />
        </div>
      </Section>

      {/* Compensation */}
      <Section title="Compensation">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field  label="Salary Expectation (floor)" value={comp.salary_expectation || ""} onChange={(v) => setP("compensation", "salary_expectation", v)} placeholder="250000" />
          <Select label="Currency" value={comp.salary_currency || "USD"} onChange={(v) => setP("compensation", "salary_currency", v)} options={currencyOpts} />
          <Field  label="Range Min" value={comp.salary_range_min || ""} onChange={(v) => setP("compensation", "salary_range_min", v)} placeholder="230000" />
          <Field  label="Range Max" value={comp.salary_range_max || ""} onChange={(v) => setP("compensation", "salary_range_max", v)} placeholder="280000" />
          <Field  label="Currency Conversion Note" value={comp.currency_conversion_note || ""} onChange={(v) => setP("compensation", "currency_conversion_note", v)} placeholder="Convert CAD → USD at current rate" wide />
        </div>
      </Section>

      {/* Experience */}
      <Section title="Experience">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field  label="Total Years of Experience" value={exp.years_of_experience_total || ""} onChange={(v) => setP("experience", "years_of_experience_total", v)} placeholder="5" />
          <Select label="Education Level" value={exp.education_level || "Master's Degree"} onChange={(v) => setP("experience", "education_level", v)} options={eduOptions} />
          <Field  label="Current / Most Recent Title" value={exp.current_title || ""} onChange={(v) => setP("experience", "current_title", v)} placeholder="Senior AI Engineer" />
          <Field  label="Current / Most Recent Company" value={exp.current_company || ""} onChange={(v) => setP("experience", "current_company", v)} placeholder="Morgan Stanley" />
          <Field  label="Target Role" value={exp.target_role || ""} onChange={(v) => setP("experience", "target_role", v)} placeholder="AI Engineer" wide />
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills">
        <p className="text-xs text-slate-500 -mt-2">Comma-separated. Used as reference data — the agent reads these to answer screening questions and rate your fit. Each site words questions differently; the agent decides the best answer per question using this as context.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Programming Languages" value={(skills.programming_languages || []).join(", ")} onChange={(v) => setSkill("programming_languages", v)} placeholder="Python, Java, SQL, TypeScript" />
          <Field label="ML / AI"               value={(skills.ml_ai || []).join(", ")}               onChange={(v) => setSkill("ml_ai", v)}               placeholder="LLMs, RAG, Agentic AI, Prompt Engineering" />
          <Field label="Frameworks & Libraries" value={(skills.frameworks || []).join(", ")}         onChange={(v) => setSkill("frameworks", v)}         placeholder="LangChain, FastAPI, PyTorch, React" />
          <Field label="Tools & Platforms"      value={(skills.tools || []).join(", ")}              onChange={(v) => setSkill("tools", v)}              placeholder="Docker, AWS, GCP, Git, Linux" />
        </div>
      </Section>

      {/* EEO */}
      <Section title="EEO / Demographics (Optional)">
        <p className="text-xs text-amber-400/70 -mt-2 leading-relaxed">
          ℹ️ These are your <strong>preferences / intent</strong> — not hardcoded answers. Every job site words these questions differently. The apply agent reads your preference here and picks the closest available option on each site (e.g. "Decline to answer", "Prefer not to say", "I do not wish to disclose", etc.).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Gender (your preference)"          value={eeo.gender || "Decline to self-identify"}         onChange={(v) => setP("eeo_voluntary", "gender", v)}          options={declineOpts} />
          <Select label="Race / Ethnicity (your preference)" value={eeo.race_ethnicity || "Decline to self-identify"} onChange={(v) => setP("eeo_voluntary", "race_ethnicity", v)}   options={raceOpts} />
          <Select label="Veteran Status (your preference)"  value={eeo.veteran_status || "Decline to self-identify"}  onChange={(v) => setP("eeo_voluntary", "veteran_status", v)}   options={vetOpts} />
          <Select label="Disability (your preference)" value={eeo.disability_status || "I do not wish to answer"} onChange={(v) => setP("eeo_voluntary", "disability_status", v)} options={disabilityOpts} />
        </div>
      </Section>

      <SaveBar onSave={save} saving={saving} saved={saved} label="Save Profile" />
    </div>
  );
}

/* ─────────────────────────── RESUME TAB ─────────────────────────── */

function ResumeTab() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/resume").then((r) => r.json()).then((d) => setContent(d.content || ""));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings/resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePdfUpload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["pdf", "txt", "text", "docx", "doc", "rtf"];
    if (!allowed.includes(ext)) {
      setUploadStatus({ ok: false, msg: `Unsupported format. Accepted: ${allowed.join(", ")}` });
      return;
    }
    setUploading(true);
    setUploadStatus(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/settings/resume/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setContent(data.content || "");
        setUploadStatus({ ok: true, msg: `✓ Extracted ${data.wordCount?.toLocaleString() ?? "?"} words from ${data.filename}` });
      } else {
        setUploadStatus({ ok: false, msg: data.error || "Upload failed" });
      }
    } catch (err) {
      setUploadStatus({ ok: false, msg: String(err) });
    }
    setUploading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handlePdfUpload(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handlePdfUpload(f);
  };

  return (
    <div className="space-y-5">

      {/* PDF upload zone */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70 mb-3">Upload Resume</h3>
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-600 hover:border-cyan-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-400">Extracting text…</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-500" />
              <p className="text-sm text-slate-400">Drag & drop your resume, or <span className="text-cyan-400 underline">click to browse</span></p>
              <p className="text-xs text-slate-600">Accepts PDF, DOCX, DOC, TXT, RTF — auto-extracts text</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.text,.rtf" className="hidden" onChange={onFileChange} />
        {uploadStatus && (
          <div className={`mt-3 text-sm flex items-center gap-2 ${uploadStatus.ok ? "text-emerald-400" : "text-rose-400"}`}>
            {uploadStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {uploadStatus.msg}
          </div>
        )}
      </div>

      {/* Text editor */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70">Resume Text</h3>
          <span className="text-xs text-slate-500">{content.split(/\s+/).filter(Boolean).length} words</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={22}
          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-y"
          placeholder="Paste your resume text here, or upload a PDF above to auto-extract…"
        />
        <p className="text-xs text-slate-500">This text is used when filling in text fields on job application forms. The PDF is uploaded when a file upload field is required.</p>
        <SaveBar onSave={save} saving={saving} saved={saved} label="Save Resume Text" />
      </div>
    </div>
  );
}

/* ─────────────────────────── SEARCHES TAB ─────────────────────────── */

interface QueryEntry { query: string; tier?: number }
interface SearchesConfig {
  queries?: (string | QueryEntry)[];
  locations?: (string | { label?: string; location?: string; remote?: boolean })[];
  sites?: string[];
  boards?: string[];
  tiers?: number[];
  enable_workday?: boolean;
  enable_smartextract?: boolean;
  defaults?: { results_per_site?: number; hours_old?: number; country_indeed?: string };
  location?: { accept_patterns?: string[]; reject_patterns?: string[] };
  location_accept?: string[];
  location_reject?: string[];
  exclude_titles?: string[];
}

const ALL_PLATFORMS = [
  { id: "indeed",       label: "Indeed",       note: "Best US coverage" },
  { id: "linkedin",     label: "LinkedIn",     note: "Wide network" },
  { id: "glassdoor",    label: "Glassdoor",    note: "Salary insights" },
  { id: "zip_recruiter", label: "ZipRecruiter", note: "SMB jobs" },
  { id: "google",       label: "Google Jobs",  note: "Aggregated" },
];

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

type ProfileSnippet = { personal?: Record<string, string>; work_authorization?: Record<string, string>; compensation?: Record<string, string>; experience?: Record<string, string> };

function ProfilePreviewStrip() {
  const [profile, setProfile] = useState<ProfileSnippet | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings/profile").then(r => r.json()).then(setProfile);
  }, []);

  if (!profile?.personal) return null;
  const p = profile.personal;
  const wa = profile.work_authorization || {};
  const comp = profile.compensation || {};
  const exp = profile.experience || {};

  const chips = [
    { label: "Name",      value: p.full_name },
    { label: "Email",     value: p.email },
    { label: "Phone",     value: p.phone },
    { label: "Location",  value: [p.city, p.province_state].filter(Boolean).join(", ") || "—" },
    { label: "Work Auth", value: wa.legally_authorized_to_work || "—" },
    { label: "Sponsorship", value: wa.require_sponsorship || "—" },
    { label: "Salary",    value: comp.salary_expectation ? `$${Number(comp.salary_expectation).toLocaleString()} ${comp.salary_currency || "USD"}` : "—" },
    { label: "Target Role", value: exp.target_role || "—" },
  ].filter(c => c.value && c.value !== "—");

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-800 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70">
          Auto-fill Preview — what will be submitted
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-2 mt-1">
            {chips.map(c => (
              <div key={c.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/50 text-xs">
                <span className="text-slate-500">{c.label}:</span>
                <span className="text-slate-300 font-medium">{c.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Edit these in the <strong className="text-slate-400">Profile</strong> tab. All fields flow into forms automatically.
          </p>
        </div>
      )}
    </div>
  );
}

function SearchesTab() {
  const [config, setConfig] = useState<SearchesConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/searches").then((r) => r.json()).then((d: SearchesConfig) => {
      // Normalize boards → sites
      const normalized = { ...d };
      if (!normalized.sites && normalized.boards) normalized.sites = normalized.boards;
      setConfig(normalized || {});
    });
  }, []);

  const save = async () => {
    setSaving(true);
    // Ensure both sites and boards are set (for compatibility)
    const toSave = { ...config, boards: config.sites };
    await fetch("/api/settings/searches", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sites = config.sites ?? [];
  const tiers = config.tiers ?? [1, 2, 3];
  const defaults = config.defaults ?? {};
  const locationAccept = config.location?.accept_patterns ?? config.location_accept ?? [];
  const locationReject = config.location?.reject_patterns ?? config.location_reject ?? [];

  const queryStrings = (config.queries ?? []).map(q =>
    typeof q === "string" ? q : q.query
  );
  const locationStrings = (config.locations ?? []).map(l =>
    typeof l === "string" ? l : l.label || l.location || ""
  ).filter(Boolean);

  const updateQueriesText = (text: string) => {
    const lines = text.split("\n").filter(Boolean);
    setConfig(prev => ({ ...prev, queries: lines.map(q => ({ query: q, tier: 1 })) }));
  };

  const updateListField = (key: keyof SearchesConfig, text: string) => {
    setConfig(prev => ({ ...prev, [key]: text.split("\n").filter(Boolean) }));
  };

  const updateLocationFilter = (type: "accept" | "reject", text: string) => {
    const arr = text.split("\n").filter(Boolean);
    setConfig(prev => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        ...(type === "accept" ? { accept_patterns: arr } : { reject_patterns: arr }),
      },
      ...(type === "accept" ? { location_accept: arr } : { location_reject: arr }),
    }));
  };

  const updateDefault = (key: string, value: number | string) => {
    setConfig(prev => ({ ...prev, defaults: { ...(prev.defaults ?? {}), [key]: value } }));
  };

  const toggleSite = (id: string) => {
    setConfig(prev => ({ ...prev, sites: toggle(prev.sites ?? [], id), boards: toggle(prev.boards ?? [], id) }));
  };
  const toggleTier = (t: number) => {
    setConfig(prev => ({ ...prev, tiers: toggle(prev.tiers ?? [1,2,3], t) }));
  };

  const labelSty: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", marginBottom: 8, display: "block" };
  const textareaSty: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" };
  const inputSty: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 13, textAlign: "center", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Profile preview strip */}
      <ProfilePreviewStrip />

      {/* Platforms */}
      <div className="glass" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--neon-blue)" }} />
          Job Platforms
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>— {sites.length} enabled</span>
        </div>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>JobSpy searches these platforms in parallel. Toggle to enable/disable.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_PLATFORMS.map(({ id, label, note }) => {
            const on = sites.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleSite(id)}
                style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: on ? "1.5px solid rgba(56,189,248,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  background: on ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                  color: on ? "#38bdf8" : "#64748b", cursor: "pointer", transition: "all 0.15s",
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                }}
              >
                <span>{on ? "✓ " : ""}{label}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: on ? "rgba(56,189,248,0.6)" : "#475569" }}>{note}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { key: "enable_workday" as const, label: "Workday Boards", desc: "Auto-detect Workday portals" },
            { key: "enable_smartextract" as const, label: "Smart Extract", desc: "Extract from company career pages" },
          ].map(({ key, label, desc }) => {
            const on = !!config[key];
            return (
              <button key={key} onClick={() => setConfig(prev => ({ ...prev, [key]: !on }))}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: on ? "1.5px solid rgba(167,139,250,0.45)" : "1px solid rgba(255,255,255,0.08)", background: on ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.03)", color: on ? "#a78bfa" : "#64748b", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <span>{on ? "✓ " : ""}{label}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: on ? "rgba(167,139,250,0.7)" : "#475569" }}>{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Limits */}
      <div className="glass" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Discovery Limits</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div>
            <label style={labelSty}>Results / Site</label>
            <input type="number" style={inputSty} value={defaults.results_per_site ?? 25} onChange={e => updateDefault("results_per_site", Number(e.target.value))} />
          </div>
          <div>
            <label style={labelSty}>Max Age (hours)</label>
            <input type="number" style={inputSty} value={defaults.hours_old ?? 72} onChange={e => updateDefault("hours_old", Number(e.target.value))} />
          </div>
          <div>
            <label style={labelSty}>Country (Indeed)</label>
            <input type="text" style={inputSty} value={defaults.country_indeed ?? "usa"} onChange={e => updateDefault("country_indeed", e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={labelSty}>Active Tiers</label>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3].map(t => {
              const on = tiers.includes(t);
              return (
                <button key={t} onClick={() => toggleTier(t)} style={{ padding: "5px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: on ? "1.5px solid rgba(251,191,36,0.45)" : "1px solid rgba(255,255,255,0.08)", background: on ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)", color: on ? "#fbbf24" : "#64748b", cursor: "pointer", transition: "all 0.15s" }}>T{t}</button>
              );
            })}
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>Tier 1 = priority, Tier 3 = stretch roles</span>
          </div>
        </div>
      </div>

      {/* Queries + Locations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Search Queries <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>{queryStrings.length} queries</span>
          </div>
          <textarea rows={8} style={textareaSty} value={queryStrings.join("\n")} onChange={e => updateQueriesText(e.target.value)} placeholder={"AI Engineer\nML Platform Engineer\nPrompt Engineer"} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>One query per line</div>
        </div>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Locations <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>{locationStrings.length} locations</span>
          </div>
          <textarea rows={4} style={textareaSty} value={locationStrings.join("\n")} onChange={e => updateListField("locations", e.target.value)} placeholder={"Remote\nAtlanta, GA\nNew York, NY"} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, marginBottom: 12 }}>One location per line</div>
          <label style={labelSty}>Exclude Job Titles</label>
          <textarea rows={3} style={textareaSty} value={(config.exclude_titles ?? []).join("\n")} onChange={e => updateListField("exclude_titles", e.target.value)} placeholder={"intern\nco-op\nclearance required"} />
        </div>
      </div>

      {/* Location filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Accept Locations</div>
          <textarea rows={6} style={textareaSty} value={locationAccept.join("\n")} onChange={e => updateLocationFilter("accept", e.target.value)} placeholder={"Atlanta\nGA\nRemote\nUSA"} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Job location must match one of these (case-insensitive)</div>
        </div>
        <div className="glass" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Reject Locations</div>
          <textarea rows={6} style={textareaSty} value={locationReject.join("\n")} onChange={e => updateLocationFilter("reject", e.target.value)} placeholder={"India\nPhilippines\nonsite only"} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Jobs with these patterns are skipped entirely</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-primary" onClick={save} disabled={saving} style={{ minWidth: 180, justifyContent: "center" }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Search Config</>}
        </button>
        {saved && <span style={{ fontSize: 13, color: "#34d399", display: "flex", alignItems: "center", gap: 6 }}><CheckCircle className="w-4 h-4" /> Saved</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────── LLM TAB ─────────────────────────── */

interface LLMData {
  providers: {
    gemini: { configured: boolean; api_key_hint: string; default_model: string; models: { id: string; label: string }[] };
    openai: { configured: boolean; api_key_hint: string; default_model: string; models: { id: string; label: string }[] };
    ollama: { configured: boolean; base_url: string; default_model: string; models: { id: string; label: string }[] };
  };
  active_model: string | null;
  active_provider: string | null;
  capsolver: { configured: boolean; api_key_hint: string };
}

const PROVIDER_META = {
  gemini: { name: "Google Gemini", letter: "G", color: "#4285F4", bg: "rgba(66,133,244,0.12)", envKey: "GEMINI_API_KEY", inputKey: "gemini_api_key", placeholder: "AIza..." },
  openai: { name: "OpenAI",        letter: "O", color: "#10a37f", bg: "rgba(16,163,127,0.12)", envKey: "OPENAI_API_KEY", inputKey: "openai_api_key", placeholder: "sk-..." },
  ollama: { name: "Ollama (Local)", letter: "L", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", envKey: "LLM_URL", inputKey: "llm_url", placeholder: "http://localhost:11434/v1" },
} as const;

type ProviderId = keyof typeof PROVIDER_META;

function LLMTab() {
  const [data, setData] = useState<LLMData | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({ gemini_api_key: "", openai_api_key: "", llm_url: "" });
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [capsolverKey, setCapsolverKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/settings/llm");
    const d = await res.json();
    setData(d);
    setSelectedModel(d.active_model || "");
    if (d.active_provider) setSelectedProvider(d.active_provider as ProviderId);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    setSaving(true);
    const body: Record<string, string> = {};
    if (keys.gemini_api_key) body.gemini_api_key = keys.gemini_api_key;
    if (keys.openai_api_key) body.openai_api_key = keys.openai_api_key;
    if (keys.llm_url)        body.llm_url = keys.llm_url;
    if (capsolverKey)        body.capsolver_api_key = capsolverKey;
    body.llm_model = selectedModel;

    await fetch("/api/settings/llm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setKeys({ gemini_api_key: "", openai_api_key: "", llm_url: "" });
    setCapsolverKey("");
    fetchData();
  };

  const activeProvider = selectedProvider ?? (data?.active_provider as ProviderId | null);
  const activeModels = activeProvider && data ? data.providers[activeProvider]?.models ?? [] : [];

  return (
    <div className="space-y-5">
      {/* Active provider banner */}
      {data?.active_provider && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          Active provider: <strong className="capitalize ml-1">{data.active_provider}</strong>
          {data.active_model
            ? <> — model: <strong>{data.active_model}</strong></>
            : <span className="text-emerald-500/70"> — using provider default</span>
          }
        </div>
      )}

      {/* 3 Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(PROVIDER_META) as ProviderId[]).map((id) => {
          const meta = PROVIDER_META[id];
          const provData = data?.providers[id];
          const isActive = activeProvider === id;
          const isOllama = id === "ollama";
          const inputKey = meta.inputKey;
          const hint = provData && "api_key_hint" in provData ? provData.api_key_hint : "";
          const baseUrl = provData && "base_url" in provData ? provData.base_url : "";
          const configured = provData?.configured ?? false;

          return (
            <div
              key={id}
              onClick={() => setSelectedProvider(id)}
              className="rounded-xl border p-4 cursor-pointer transition-all"
              style={{
                borderColor: isActive ? meta.color + "60" : "rgba(255,255,255,0.07)",
                background: isActive ? meta.bg : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: meta.bg, color: meta.color }}>
                  {meta.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-200">{meta.name}</span>
                    {configured && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Configured" />}
                  </div>
                  <p className="text-xs text-slate-500">{configured ? (isOllama ? baseUrl : hint) : "Not configured"}</p>
                </div>
              </div>

              {isOllama ? (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Ollama base URL</label>
                  <input
                    value={keys.llm_url}
                    onChange={(e) => setKeys(k => ({ ...k, llm_url: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={baseUrl || "http://localhost:11434/v1"}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-600 mt-1.5">
                    <code className="text-violet-400">ollama pull gemma3:latest</code> to enable
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <label className="text-xs text-slate-500 mb-1 block">API Key {hint ? `(current: ${hint})` : ""}</label>
                  <div className="relative">
                    <input
                      type={showKeys[inputKey] ? "text" : "password"}
                      value={keys[inputKey]}
                      onChange={(e) => setKeys(k => ({ ...k, [inputKey]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={hint || meta.placeholder}
                      className="w-full pr-8 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowKeys(s => ({ ...s, [inputKey]: !s[inputKey] })); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showKeys[inputKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Model selector — shown when a provider is selected */}
      {activeModels.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <h4 className="text-sm font-medium text-slate-300 mb-1">
            Model — <span className="capitalize text-cyan-400">{activeProvider}</span>
          </h4>
          <p className="text-xs text-slate-500 mb-3">Select a model for the active provider. Leave as default if unsure.</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="model" value="" checked={selectedModel === ""} onChange={() => setSelectedModel("")} className="accent-cyan-500" />
              <span className="text-sm text-slate-400">— Use provider default ({data?.providers[activeProvider!]?.default_model})</span>
            </label>
            {activeModels.map((m) => (
              <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="model" value={m.id} checked={selectedModel === m.id} onChange={() => setSelectedModel(m.id)} className="accent-cyan-500" />
                <span className="text-sm text-slate-200">{m.label}</span>
              </label>
            ))}
          </div>
          {activeProvider === "ollama" && (
            <p className="text-xs text-slate-500 mt-3 border-t border-slate-700/50 pt-3">
              💡 <strong className="text-slate-400">gemma3:latest</strong> and <strong className="text-slate-400">qwen3-vl:latest</strong> support vision (can read screenshots). Used for job scoring and tailoring — not for auto-apply (Claude handles apply sessions).
            </p>
          )}
        </div>
      )}

      {/* CapSolver */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-1">CapSolver API Key</h4>
        <p className="text-xs text-slate-500 mb-3">
          Used by the apply agent to solve CAPTCHAs (hCaptcha, reCAPTCHA, Turnstile) during auto-apply.
          {data?.capsolver.configured && <span className="text-emerald-400 ml-1">Current: {data.capsolver.api_key_hint}</span>}
        </p>
        <div className="relative max-w-md">
          <input
            type={showKeys.capsolver ? "text" : "password"}
            value={capsolverKey}
            onChange={(e) => setCapsolverKey(e.target.value)}
            placeholder={data?.capsolver.api_key_hint || "CAP-..."}
            className="w-full pr-8 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button onClick={() => setShowKeys(s => ({ ...s, capsolver: !s.capsolver }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {showKeys.capsolver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Priority info */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Provider Priority</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          The system uses the first configured provider: <strong className="text-slate-200">1) Ollama</strong> (if LLM_URL set) →{" "}
          <strong className="text-slate-200">2) OpenAI</strong> (if OPENAI_API_KEY set) →{" "}
          <strong className="text-slate-200">3) Gemini</strong> (if GEMINI_API_KEY set).{" "}
          <span className="text-slate-500">Claude Code CLI is always used separately for auto-apply sessions — no config needed here.</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save AI Settings
        </button>
        {saved && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved — restart pipeline to apply</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────── SYSTEM TAB ─────────────────────────── */

function SystemTab() {
  const [checks, setChecks] = useState<{ name: string; status: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState("");

  const runDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/doctor");
      const data = await res.json();
      setChecks(data.checks || []);
      setRaw(data.raw || "");
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { runDoctor(); }, [runDoctor]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">System Health</h3>
          <button
            onClick={runDoctor}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-slate-700 text-slate-300 text-xs hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
            Re-check
          </button>
        </div>
        {checks.length > 0 ? (
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                {c.status === "ok"
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <AlertCircle className={`w-4 h-4 shrink-0 ${c.status === "warn" ? "text-amber-400" : "text-rose-400"}`} />
                }
                <span className="text-sm text-slate-300 flex-1">{c.message}</span>
                <StatusPill status={c.status} />
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 py-4 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Running diagnostics...
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4">Click Re-check to run system diagnostics</p>
        )}
      </div>
      {raw && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Raw Output</h3>
          <pre className="terminal-output text-xs whitespace-pre-wrap">{raw}</pre>
        </div>
      )}
    </div>
  );
}
