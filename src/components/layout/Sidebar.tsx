"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, Briefcase, GitBranch, Send, Settings,
  ChevronLeft, ChevronRight, LayoutDashboard,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs",     icon: Briefcase,  label: "Jobs" },
  { href: "/pipeline", icon: GitBranch,  label: "Pipeline" },
  { href: "/apply",    icon: Send,       label: "Apply" },
  { href: "/settings", icon: Settings,   label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const w = collapsed ? 64 : 220;

  return (
    <aside
      style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: w, zIndex: 50,
        background: "linear-gradient(180deg, #060b17 0%, #02040a 100%)",
        borderRight: "1px solid rgba(99,179,237,0.07)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 18px",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        borderBottom: "1px solid rgba(99,179,237,0.07)",
        minHeight: 64,
      }}>
        {!collapsed && (
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(14,165,233,0.4)",
            }}>
              <Zap size={16} color="#fff" />
            </div>
            <span style={{
              fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              ApplySwift
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" style={{ display: "flex" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(14,165,233,0.4)",
          }}>
            <Zap size={16} color="#fff" />
          </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#475569", padding: 4, borderRadius: 6,
              display: "flex", alignItems: "center",
            }}
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}
              style={{
                justifyContent: collapsed ? "center" : "flex-start",
                padding: collapsed ? "10px" : "9px 14px",
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{ padding: "12px", display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)",
              cursor: "pointer", color: "#94a3b8", padding: "7px",
              borderRadius: 8, display: "flex", alignItems: "center",
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {!collapsed && (
        <div style={{
          padding: "14px 18px",
          borderTop: "1px solid rgba(99,179,237,0.07)",
        }}>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.05em" }}>
            AI JOB APPLICATION AGENT
          </div>
        </div>
      )}
    </aside>
  );
}
