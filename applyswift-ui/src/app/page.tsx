"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const FEATURES = [
  {
    icon: "🔍",
    title: "Auto Discovery",
    desc: "Continuously scans LinkedIn, Indeed, Glassdoor, Dice & more. New jobs appear in your pipeline within minutes.",
    color: "#38bdf8",
  },
  {
    icon: "🧠",
    title: "AI Scoring",
    desc: "Gemini LLM scores every job 1–10 against your profile. Only high-fit roles make it through.",
    color: "#a78bfa",
  },
  {
    icon: "📄",
    title: "Resume Tailoring",
    desc: "Generates a custom ATS-optimised resume for each job. Validated against your real experience — no hallucination.",
    color: "#34d399",
  },
  {
    icon: "⚡",
    title: "One-Shot Apply",
    desc: "Paste any job URL. ApplySwift enriches, scores, tailors, and submits — all in under 90 seconds.",
    color: "#fbbf24",
  },
  {
    icon: "🤖",
    title: "Agent Browser",
    desc: "Claude Code drives a real Chrome browser. Fills forms, uploads resumes, handles CAPTCHAs automatically.",
    color: "#fb7185",
  },
  {
    icon: "✉️",
    title: "Email Verification",
    desc: "When a site sends a verification code, ApplySwift prompts you, then auto-enters it to complete the submission.",
    color: "#f472b6",
  },
];

const STEPS = [
  { n: "01", title: "Add your profile & resume", desc: "One-time setup in Settings. Your real data, never invented." },
  { n: "02", title: "Run the pipeline", desc: "Discover → Enrich → Score → Tailor runs in the background." },
  { n: "03", title: "Auto-apply", desc: "Paste a URL or let the queue run. Chrome opens, forms fill, resume uploads." },
  { n: "04", title: "Track everything", desc: "Dashboard shows every job, score, status and cost in real time." },
];

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div style={{
      position: "absolute",
      width: 2, height: 2,
      borderRadius: "50%",
      background: "rgba(56,189,248,0.4)",
      ...style,
    }} />
  );
}

export default function LandingPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { value: "< 90s", label: "Per application" },
    { value: "10×",   label: "More applications/day" },
    { value: "0",     label: "Hallucinated experience" },
    { value: "100%",  label: "Your real skills only" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#02040a",
      color: "#f0f6ff",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background nebula */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 70% 50% at 15% 5%, rgba(56,189,248,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 85%, rgba(167,139,250,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 50% 40%, rgba(52,211,153,0.03) 0%, transparent 70%)
        `,
      }} />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <Particle key={i} style={{
          top: `${8 + i * 7.5}%`,
          left: `${5 + (i * 37) % 90}%`,
          opacity: 0.3 + (i % 3) * 0.2,
          animation: `float-${i % 3} ${4 + i % 3}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}

      {/* Nav bar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 48px",
        background: "rgba(2,4,10,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99,179,237,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 0 20px rgba(14,165,233,0.4)",
          }}>⚡</div>
          <span style={{
            fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            ApplySwift
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/api/auth/login" style={{
            padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            color: "#fff", textDecoration: "none",
            boxShadow: "0 0 20px rgba(14,165,233,0.25)",
            transition: "box-shadow 0.2s",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20,
          background: "rgba(56,189,248,0.08)",
          border: "1px solid rgba(56,189,248,0.2)",
          fontSize: 12, fontWeight: 600, color: "#38bdf8",
          marginBottom: 32, letterSpacing: "0.05em",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", display: "inline-block", boxShadow: "0 0 8px #38bdf8" }} />
          AI-POWERED JOB APPLICATION AGENT
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(40px, 7vw, 80px)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          margin: "0 0 24px",
          maxWidth: 900,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #f0f6ff 0%, #94a3b8 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Apply to jobs
          </span>
          <br />
          <span style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #34d399 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            display: "block",
          }}>
            while you sleep.
          </span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: "clamp(15px, 2vw, 19px)",
          color: "#64748b",
          maxWidth: 560,
          lineHeight: 1.7,
          margin: "0 0 48px",
        }}>
          ApplySwift discovers jobs, scores them with AI, tailors your resume for each role,
          and submits applications — fully automated, zero hallucination.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 80 }}>
          <a href="/api/auth/login" style={{
            padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            color: "#fff", textDecoration: "none",
            boxShadow: "0 0 40px rgba(14,165,233,0.3)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Get Started with Google
          </a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: 0,
          background: "rgba(13,22,40,0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(99,179,237,0.1)",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              padding: "20px 36px", textAlign: "center",
              borderRight: i < stats.length - 1 ? "1px solid rgba(99,179,237,0.08)" : "none",
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f6ff" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", color: "#334155", fontSize: 12 }}>
          scroll ↓
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#38bdf8", textTransform: "uppercase", marginBottom: 14 }}>
            Capabilities
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, color: "#f0f6ff" }}>
            Everything automated,<br />nothing fabricated
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              padding: "28px 24px",
              background: "rgba(13,22,40,0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(99,179,237,0.07)",
              borderRadius: 16,
              transition: "border-color 0.2s, transform 0.2s",
              cursor: "default",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${f.color}30`;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,179,237,0.07)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${f.color}12`, border: `1px solid ${f.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f6ff", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#a78bfa", textTransform: "uppercase", marginBottom: 14 }}>
            How it works
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, color: "#f0f6ff" }}>
            Four steps to 10× your applications
          </h2>
        </div>

        <div style={{ display: "flex", gap: 0, position: "relative" }}>
          {/* Connector line */}
          <div style={{
            position: "absolute", top: 28, left: "12.5%", right: "12.5%",
            height: 1, background: "linear-gradient(90deg, #38bdf8, #a78bfa, #34d399, #fbbf24)",
            opacity: 0.2,
          }} />

          {STEPS.map((s, i) => (
            <div key={s.n} style={{ flex: 1, padding: "0 16px", textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: `linear-gradient(135deg, ${["#0ea5e9","#6366f1","#10b981","#f59e0b"][i]}22, ${["#0ea5e9","#6366f1","#10b981","#f59e0b"][i]}11)`,
                border: `1.5px solid ${["#0ea5e9","#6366f1","#10b981","#f59e0b"][i]}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 13, fontWeight: 800,
                color: ["#38bdf8","#a78bfa","#34d399","#fbbf24"][i],
              }}>
                {s.n}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          padding: "60px 48px",
          background: "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(99,102,241,0.08) 100%)",
          border: "1px solid rgba(56,189,248,0.15)",
          borderRadius: 24,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 400, height: 200, borderRadius: "50%",
            background: "rgba(56,189,248,0.04)", filter: "blur(60px)",
            pointerEvents: "none",
          }} />

          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f6ff", margin: "0 0 16px" }}>
            Ready to apply smarter?
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 36px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Your dashboard is live. Start with one job URL and watch the agent work.
          </p>
          <Link href="/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            color: "#fff", textDecoration: "none",
            boxShadow: "0 0 40px rgba(14,165,233,0.3)",
          }}>
            Open Dashboard ⚡
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(99,179,237,0.07)",
        padding: "24px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        color: "#334155", fontSize: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontWeight: 700, color: "#475569" }}>ApplySwift</span>
          <span>— AI Job Application Agent</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/dashboard" style={{ color: "#475569", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/jobs" style={{ color: "#475569", textDecoration: "none" }}>Jobs</Link>
          <Link href="/settings" style={{ color: "#475569", textDecoration: "none" }}>Settings</Link>
        </div>
      </footer>

      <style>{`
        @keyframes float-0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float-1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float-2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
