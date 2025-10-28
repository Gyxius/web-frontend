import React, { useEffect, useMemo } from "react";

export default function WaitingForAdmin({ onHome, request, assignedEvent, onGoChat }) {
  // Auto-redirect to home when event is assigned (stage 3)
  useEffect(() => {
    const stage = request?.stage ?? 2;
    if (stage >= 3 && assignedEvent) {
      const timer = setTimeout(() => {
        onHome();
      }, 2000); // short delay to let user see success
      return () => clearTimeout(timer);
    }
  }, [request?.stage, assignedEvent, onHome]);

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
    quest: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      margin: "8px 0",
      color: theme.text,
      fontWeight: 700,
    },
    // Removed progress, dots, and buttons for a simplified view
  };


  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>🕹️ Waiting for Admin Approval</div>

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

            <button
              onClick={onHome}
              style={{
                marginTop: 16,
                width: "100%",
                background: "#FFFFFF",
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 800,
                color: theme.text,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              Go Home
            </button>

      </div>
    </div>
  );
}
