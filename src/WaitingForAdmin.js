import React, { useEffect, useMemo, useState } from "react";

export default function WaitingForAdmin({ onHome, request, assignedEvent, onGoChat }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);
  
  // Auto-redirect to home when event is assigned (stage 3)
  useEffect(() => {
    if (request?.stage >= 3 && assignedEvent) {
      const timer = setTimeout(() => {
        onHome();
      }, 2000); // Wait 2 seconds so user can see the success message
      return () => clearTimeout(timer);
    }
  }, [request, assignedEvent, onHome]);

  // Duolingo-like theme to match SocialHome
  const theme = useMemo(() => ({
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#1CB0F6",
    gold: "#FFDE59",
    danger: "#EA2B2B",
    track: "#E5E7EB",
    border: "#EEF2F7",
    shadow: "0 10px 30px rgba(0,0,0,0.08)",
    radius: 22,
  }), []);

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: theme.bg,
      padding: 24,
  fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },
    card: {
      background: theme.card,
      borderRadius: theme.radius,
      padding: 28,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      width: "min(520px, 92vw)",
      textAlign: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: 900,
      color: theme.primary,
      marginBottom: 8,
      letterSpacing: "-0.2px",
    },
    subtitle: {
      fontSize: 14.5,
      color: theme.textMuted,
      marginBottom: 16,
    },
    progressWrap: {
      background: theme.track,
      borderRadius: 999,
      height: 14,
      overflow: "hidden",
      margin: "14px 0 18px",
      border: `1px solid ${theme.border}`,
    },
    progressBar: (pct) => ({
      height: "100%",
      width: `${pct}%`,
      background: `linear-gradient(90deg, ${theme.primaryDark}, ${theme.primary})`,
      transition: "width 0.4s ease",
    }),
    quest: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      margin: "8px 0",
      color: theme.text,
      fontWeight: 700,
    },
    dot: {
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: 10,
      background: theme.accent,
      margin: "0 2px",
      opacity: 0.25,
    },
    btn: {
      marginTop: 14,
      background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
      color: "white",
      border: "none",
      borderRadius: 14,
      padding: "12px 16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(28,176,246,0.28)",
      width: "100%",
      fontSize: 15,
    },
    miniRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 6,
    },
    badge: {
      background: theme.gold,
      color: "#111827",
      borderRadius: 999,
      padding: "4px 10px",
      fontWeight: 900,
      fontSize: 12,
    },
  };

  const pct = (tick % 20) * 5; // 0 -> 95 looping
  const msgs = [
    "Rolling initiative…",
    "Matching your crew…",
    "Charging power-ups…",
    "Shuffling decks…",
    "Tuning the vibes…",
  ];
  const msg = msgs[tick % msgs.length];

  const activeDots = tick % 4; // 0..3

  return (
    <div style={styles.container}>
      <div style={styles.card}>
  <div style={styles.title}>🕹️ Waiting for Admin Approval</div>
        <div style={styles.subtitle}>{msg}</div>

        <div style={styles.progressWrap}>
          <div style={styles.progressBar(pct)} />
        </div>

        {(() => {
          const stage = request?.stage || 2; // default to received
          const step = (n, label, extra) => (
            <div style={{ ...styles.quest, opacity: stage >= n ? 1 : 0.5 }}>
              {stage > n ? "✅" : stage === n ? "🟡" : "⚪"} {label} {extra || ""}
            </div>
          );
          return (
            <>
              {step(1, "Form completed successfully")}
              {step(2, "App received your request")}
              {step(3, "Admin found a match", assignedEvent ? `– ${assignedEvent.name}` : "")}
              {stage >= 3 && (
                <div style={{ marginTop: 12, color: theme.primary, fontWeight: 800, fontSize: 15 }}>
                  🎉 Event suggestion ready! Redirecting to home...
                </div>
              )}
            </>
          );
        })()}

        <div style={{ marginTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                opacity: activeDots > i ? 1 : 0.25,
              }}
            />
          ))}
        </div>

        <div style={styles.miniRow}>
          <span>XP Bonus</span>
          <span style={styles.badge}>+{(tick % 7) * 5} XP</span>
        </div>

  <button style={{ ...styles.btn, marginTop: 14, background: "#FFFFFF", border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", color: theme.text }} onClick={onHome}>Go Home</button>
      </div>
    </div>
  );
}
