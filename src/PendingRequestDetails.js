import React, { useMemo } from "react";

export default function PendingRequestDetails({ request, onBack, onEdit, onCancel }) {
  const theme = useMemo(() => ({
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    accent: "#1CB0F6",
    border: "#EEF2F7",
    shadow: "0 6px 18px rgba(0,0,0,0.06)",
    radius: 18,
  }), []);

  const styles = {
    container: {
      minHeight: "100vh",
      background: theme.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },
    card: {
      background: theme.card,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      borderRadius: theme.radius,
      padding: 22,
      maxWidth: 560,
      width: "92vw",
    },
    title: {
      fontSize: 22,
      fontWeight: 900,
      color: theme.primary,
      marginBottom: 10,
      textAlign: "center",
    },
    row: { fontSize: 15, color: theme.text, margin: "8px 0" },
    label: { color: theme.textMuted, fontWeight: 700, fontSize: 13, textTransform: "uppercase" },
    value: { color: theme.text, fontWeight: 800 },
    buttonRow: { display: "flex", gap: 10, marginTop: 16 },
    btn: {
      flex: 1,
      padding: "12px 14px",
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
    },
    primaryBtn: {
      background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
      color: "white",
      boxShadow: "0 6px 16px rgba(28,176,246,0.28)",
    },
    secondaryBtn: {
      background: "#FFFFFF",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    dangerBtn: {
      background: "#EA2B2B",
      color: "white",
      boxShadow: "0 2px 6px rgba(234,43,43,0.18)",
    },
  };

  if (!request) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.title}>Pending Request</div>
          <div style={{ color: theme.textMuted }}>No request selected.</div>
          <div className="row" style={styles.buttonRow}>
            <button style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={onBack}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  const ev = request.event || {};
  const createdTs = request.createdAt || (Array.isArray(request.history) && request.history.length > 0 ? request.history[0].ts : null);
  const createdStr = createdTs ? new Date(createdTs).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "—";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>Your Pending Request</div>

        <div style={styles.row}><span style={styles.label}>Status</span><br /><span style={styles.value}>{request.stage >= 3 ? "Matched" : "Waiting for admin"}</span></div>
        <div style={styles.row}><span style={styles.label}>Requested on</span><br /><span style={styles.value}>{createdStr}</span></div>

        <div style={styles.row}><span style={styles.label}>Timeframe</span><br /><span style={styles.value}>{ev.timePreference || "—"}</span></div>
        <div style={styles.row}><span style={styles.label}>Time of day</span><br /><span style={styles.value}>{ev.timeOfDay || "—"}</span></div>
        <div style={styles.row}><span style={styles.label}>Location</span><br /><span style={styles.value}>{ev.place ? `${ev.place}${ev.location ? ` · ${ev.location}` : ''}` : (ev.location || "—")}</span></div>
        <div style={styles.row}><span style={styles.label}>Category</span><br /><span style={styles.value}>{ev.category || "—"}</span></div>
        <div style={styles.row}><span style={styles.label}>Language</span><br /><span style={styles.value}>{ev.language || "—"}</span></div>

        {request.stage >= 3 && request.assignedEventId && (
          <div style={styles.row}><span style={styles.label}>Assigned Event</span><br /><span style={styles.value}>#{String(request.assignedEventId)}</span></div>
        )}

        <div style={styles.buttonRow}>
          <button style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={onBack}>Back</button>
          <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={onEdit}>Edit Request</button>
          <button style={{ ...styles.btn, ...styles.dangerBtn }} onClick={onCancel}>Cancel Request</button>
        </div>
      </div>
    </div>
  );
}
