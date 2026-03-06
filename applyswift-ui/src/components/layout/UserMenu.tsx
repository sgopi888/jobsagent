"use client";

import { useState } from "react";
import { LogOut, ChevronUp } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, loading, logout } = useUser();
  const [open, setOpen] = useState(false);

  if (loading || !user) return null;

  const initials = (user.display_name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (collapsed) {
    return (
      <div style={{ padding: "12px", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}
          title={user.display_name || user.email}
        >
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(99,179,237,0.07)", position: "relative" }}>
      {open && (
        <div
          style={{
            position: "absolute", bottom: "100%", left: 12, right: 12,
            background: "#0f172a", border: "1px solid rgba(99,179,237,0.12)",
            borderRadius: 10, padding: "6px", marginBottom: 4,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "8px 10px", border: "none",
              background: "none", color: "#f87171", cursor: "pointer",
              borderRadius: 6, fontSize: 13,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "8px 6px", border: "none", background: "none",
          cursor: "pointer", borderRadius: 8, color: "#e2e8f0",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff",
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.display_name || "User"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.email}
          </div>
        </div>
        <ChevronUp
          size={14}
          style={{
            color: "#64748b", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>
    </div>
  );
}
