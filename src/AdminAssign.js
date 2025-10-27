import React, { useState } from "react";
import users from "./users";
import events from "./events";

export default function AdminAssign({ searches, pendingRequests, onAssignEvent, userEvents, onRemoveJoinedEvent }) {
  // Debug: show pendingRequests
  console.log("[DEBUG] pendingRequests:", pendingRequests);
  const [selectedIdx, setSelectedIdx] = useState(null);
  // Only keep one selectedEvent state for event modal
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Log admin activities
  const logAdminActivity = (msg) => {
    console.log(`[ADMIN ACTIVITY] ${msg}`);
  };
  // Events now provided by a shared dataset (see src/events.js)

  // Duolingo-inspired theme to match SocialHome
  const theme = {
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
    shadow: "0 4px 14px rgba(0,0,0,0.06)",
    shadowSoft: "0 10px 30px rgba(0,0,0,0.08)",
    radius: 18,
    radiusLg: 22,
  };

  const styles = {
    container: {
      position: "relative",
      minHeight: "100vh",
      background: theme.bg,
      padding: 24,
      maxWidth: 680,
      margin: "0 auto",
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, sans-serif",
    },
    title: {
      fontSize: 24,
      fontWeight: 900,
      marginBottom: 18,
      textAlign: "center",
      color: theme.primary,
      letterSpacing: "-0.2px",
    },
    tabs: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 8,
      marginBottom: 18,
    },
    tabBtn: (active) => ({
      padding: 12,
      fontWeight: 900,
      background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
      color: active ? "white" : theme.text,
      border: `1px solid ${active ? theme.primary : theme.border}`,
      borderRadius: 14,
      cursor: "pointer",
      boxShadow: active ? "0 6px 16px rgba(88,204,2,0.28)" : "0 1px 3px rgba(0,0,0,0.06)",
    }),
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 10,
      color: theme.accent,
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    card: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: theme.radius,
      marginBottom: 12,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
    },
    itemRow: {
      background: theme.card,
      borderRadius: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: 16,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 15,
      color: theme.text,
      border: `1px solid ${theme.border}`,
    },
    primaryBtn: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
    },
    accentBtn: {
      background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
      boxShadow: "0 6px 16px rgba(28,176,246,0.28)",
    },
    dangerBtn: {
      background: theme.danger,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "6px 10px",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 13,
      boxShadow: "0 2px 6px rgba(234,43,43,0.18)",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },
    modal: {
      background: theme.card,
      borderRadius: theme.radiusLg,
      padding: 28,
      boxShadow: theme.shadowSoft,
      minWidth: 340,
      maxWidth: 520,
      border: `1px solid ${theme.border}`,
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, sans-serif",
    },
    subtitle: { fontSize: 14, color: theme.textMuted },
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>🛠️ Admin Dashboard</div>
      <div style={styles.tabs}>
        <button style={styles.tabBtn(activeTab === "requests")} onClick={() => setActiveTab("requests")}>Pending Requests</button>
        <button style={styles.tabBtn(activeTab === "users")} onClick={() => setActiveTab("users")}>All Users</button>
        <button style={styles.tabBtn(activeTab === "events")} onClick={() => setActiveTab("events")}>All Events</button>
        <button style={styles.tabBtn(activeTab === "joined")} onClick={() => setActiveTab("joined")}>Joined Events</button>
      </div>
      {activeTab === "joined" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎟️ All Joined Events</div>
          <ul style={{ padding: 0 }}>
            {Object.entries(userEvents || {}).map(([userKey, events]) => (
              <li key={userKey} style={styles.card}>
                <div style={{ fontWeight: 800, color: theme.text, marginBottom: 8 }}>👤 {userKey}</div>
                <div style={{ ...styles.subtitle, marginBottom: 8 }}>Joined Events:</div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {Array.isArray(events) && events.length > 0 ? (
                    events.map((ev, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ color: theme.text }}>{ev.name} {ev.time ? `(${ev.time})` : ""}</span>
                        <button style={{ ...styles.dangerBtn, marginLeft: 12 }} onClick={() => onRemoveJoinedEvent && onRemoveJoinedEvent(userKey, idx)}>Remove</button>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: theme.textMuted }}>No events joined.</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === "requests" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📝 Pending Requests</div>
          {(!pendingRequests || pendingRequests.length === 0) ? (
            <div style={{ ...styles.card, color: theme.textMuted }}>No pending requests.</div>
          ) : (
            <ul style={{ padding: 0 }}>
              {pendingRequests.map((req, idx) => (
                <li key={idx} style={styles.itemRow}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}</div>
                    <div style={{ fontSize: 13.5, color: theme.textMuted }}>
                      {req.event.type || req.event.category || req.event.name || "Event"}
                      {req.event.date ? ` | ${req.event.date}` : ""}
                      {req.targetFriend ? ` | via ${req.targetFriend}` : ""}
                    </div>
                  </div>
                  <button
                    style={styles.primaryBtn}
                    onClick={() => {
                      logAdminActivity(`Clicked Assign Event for user ${typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}`);
                      setSelectedIdx(idx);
                    }}
                  >Assign Event</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === "users" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>👥 All Users</div>
          <ul style={{ padding: 0 }}>
            {users.map(user => (
              <li key={user.id} style={{ ...styles.card, cursor: "pointer" }} onClick={() => setSelectedUser(user)}>
                <div style={{ fontSize: 18.5, fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                  {user.emoji} {user.name} {user.country}
                </div>
                <div style={{ fontSize: 14, color: theme.textMuted }}>{user.desc}</div>
                {user.city && <div style={{ fontSize: 13, color: theme.textMuted }}><b>City:</b> {user.city}</div>}
                <div style={{ fontSize: 13, color: theme.textMuted }}><b>Languages:</b> {user.languages.join(", ")}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "events" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📅 All Events</div>
          <ul style={{ padding: 0 }}>
            {events.map(ev => (
              <li key={ev.id} style={{ ...styles.card, cursor: "pointer" }} onClick={() => setSelectedEvent(ev)}>
                <div style={{ fontSize: 18.5, fontWeight: 800, color: theme.text }}>{ev.name}</div>
                <div style={{ fontSize: 14, color: theme.textMuted }}>Time: {ev.time}</div>
              </li>
            ))}
          </ul>
          {/* Event Details Modal */}
          {selectedEvent && (
            <div style={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10, color: theme.primary }}>✨ The Event</div>
                <div style={{ fontSize: 16, marginBottom: 4 }}><b>Event:</b> {String(selectedEvent.name)}</div>
                <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Time:</b> {String(selectedEvent.time || selectedEvent.date)}</div>
                {selectedEvent.budget && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Budget:</b> €{String(selectedEvent.budget)}</div>}
                {selectedEvent.location && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Location:</b> {String(selectedEvent.location)}</div>}
                {selectedEvent.description && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Description:</b> {String(selectedEvent.description)}</div>}
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 16, marginBottom: 8, color: theme.accent }}>🧃 The Residents</div>
                {Array.isArray(selectedEvent.crew) && selectedEvent.crew.length > 0 ? (
                  <ul style={{ paddingLeft: 16 }}>
                    {selectedEvent.crew.map((member, i) => {
                      let info = member;
                      if (typeof member === "object" && member.name) {
                        try {
                          info = require("./users").default.find(u => u.name === member.name) || member;
                        } catch {
                          info = member;
                        }
                      }
                      return (
                        <li key={i} style={{ marginBottom: 6, color: theme.text }}>
                          {info.emoji ? String(info.emoji) + " " : ""}
                          <b>{String(info.name)}</b>
                          {info.country ? ` (${String(info.country)})` : ""}
                          {info.desc ? ` – "${String(info.desc)}"` : ""}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ fontSize: 15, color: theme.textMuted }}>No residents listed.</div>
                )}
                <button style={{ ...styles.accentBtn, marginTop: 16 }} onClick={() => setSelectedEvent(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: theme.text }}>
              {selectedUser.emoji} {selectedUser.name} {selectedUser.country}
            </h3>
            <div style={{ fontSize: 16, color: theme.textMuted, marginBottom: 8 }}><b>Description:</b> {selectedUser.desc}</div>
            {selectedUser.city && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}><b>City:</b> {selectedUser.city}</div>}
            <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}><b>Languages:</b> {selectedUser.languages.join(", ")}</div>
            <button style={{ ...styles.accentBtn, marginTop: 16 }} onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
      {selectedIdx !== null && activeTab === "requests" && (
        <div style={styles.card}>
          <div style={{ fontWeight: 900, marginBottom: 10, color: theme.accent }}>
            Assign Event to {typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}
          </div>
          {logAdminActivity(`Opened assignment modal for user ${typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}`)}
          <select value={selectedEvent || ""} onChange={e => {
            setSelectedEvent(e.target.value);
            logAdminActivity(`Selected event ${e.target.value} for user ${pendingRequests[selectedIdx].user}`);
          }} style={{ padding: 10, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 12, width: "100%" }}>
            <option value="">-- Choose an Event --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name} ({ev.time})</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.primaryBtn} onClick={() => {
              logAdminActivity(`Confirmed assignment of event ${selectedEvent} to user ${pendingRequests[selectedIdx].user}`);
              if (onAssignEvent) onAssignEvent(selectedIdx, selectedEvent);
              setSelectedIdx(null);
              setSelectedEvent("");
            }}>Confirm Assignment</button>
            <button style={styles.dangerBtn} onClick={() => {
              logAdminActivity(`Cancelled assignment for user ${pendingRequests[selectedIdx].user}`);
              setSelectedIdx(null);
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
