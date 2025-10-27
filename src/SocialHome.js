import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import users from "./users";

function SocialHome({ userName = "Guest", onJoinEvent, joinedEvents = [], onJoinedEventClick, onUserClick, onLeaveEvent, pendingRequests = [], onCancelPendingRequest, showDebug }) {
  // Debug: show joinedEvents for current user
  if (showDebug) {
    console.log("[DEBUG] joinedEvents for", userName, joinedEvents);
  }
  const [selectedPending, setSelectedPending] = useState(null);
  // Removed selectedEvent state (no longer needed)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const socialPoints = 120;
  const nextLevel = 200;
  const highlightEvent = {
    name: "Karaoke on the Rooftop",
    time: "10:00 PM",
    attendees: 22,
  };
  // Dummy friends activity for demo
  const friendsActivity = [];
  return (
    <div style={styles.container}>
      {/* ...existing code... */}
      {/* Top Bar */}
      <div style={styles.header}>
        <button style={styles.iconButton} onClick={() => setShowProfileModal(true)}>
          <FaUserCircle size={40} color="#3b82f6" />
        </button>
        {/* User Profile Modal */}
        {showProfileModal && (
          <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              {(() => {
                const userInfo = users.find(u => u.name.toLowerCase() === userName.toLowerCase());
                if (!userInfo) return <div>No profile info found for {userName}.</div>;
                return (
                  <>
                    <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{userInfo.emoji} {userInfo.name} {userInfo.country}</h3>
                    <div style={{ fontSize: 16, color: "#555", marginBottom: 8 }}><b>Description:</b> {userInfo.desc}</div>
                    {userInfo.city && <div style={{ fontSize: 15, color: "#888", marginBottom: 8 }}><b>City:</b> {userInfo.city}</div>}
                    <div style={{ fontSize: 15, color: "#888", marginBottom: 8 }}><b>Languages:</b> {userInfo.languages.join(", ")}</div>
                    <button style={styles.cancelButton} onClick={() => setShowProfileModal(false)}>Close</button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        <span style={styles.points}>⭐ {socialPoints} pts</span>
      </div>
      {/* Greeting */}
      <div style={styles.greeting}>Hi {userName} 👋, ready for tonight?</div>
      {/* Social Points Progress */}
      <div style={styles.progressBox}>
        <div style={{ ...styles.progressBar, width: `${(socialPoints / nextLevel) * 100}%` }} />
        <span style={styles.progressText}>
          Level 2 Explorer ({socialPoints}/{nextLevel})
        </span>
      </div>
      {/* Highlight Event */}
      <div style={styles.highlightCard}>
        <div style={styles.highlightTitle}>🔥 Popular Tonight</div>
        <div style={styles.highlightEvent}>{highlightEvent.name}</div>
        <div style={styles.details}>
          ⏰ {highlightEvent.time} · 👥 {highlightEvent.attendees} joined
        </div>
      </div>
      {/* Friends Activity */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>👥 Friends are going to</div>
        {friendsActivity.map((f, idx) => (
          <div key={idx} style={styles.details}>
            • {f.name} → {f.event}
          </div>
        ))}
      </div>
      {/* Joined Events */}
      <div style={styles.title}>🎟️ My Joined Events</div>
      {joinedEvents.length === 0 ? (
        <div style={styles.empty}>You haven’t joined any events yet.</div>
      ) : (
        <div>
          {joinedEvents.map((item, idx) => (
            <div key={idx} style={styles.eventCard} onClick={() => {
              console.log(`[ACTIVITY] user "${userName}": clicked on joined event "${item.name || item.type || item.category || "Event"}"`, item);
              onJoinedEventClick(item);
            }}>
              <div style={styles.eventName}>{String(item.name || item.type || item.category || "Event")}</div>
              <div style={styles.details}>⏰ {String(item.time || item.date)}</div>
              {item.budget && <div style={styles.details}>💶 Budget: €{String(item.budget)}</div>}
              {/* Crew display: show full resident info for array of objects */}
              {Array.isArray(item.crew) && item.crew.length > 0 && (
                <div style={styles.details}>
                  🧃 The Residents:
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {item.crew.map((member, i) => {
                      let userInfo = typeof member === "object" && member !== null ? member : users.find(u => u.name === member || u.username === member);
                      if (!userInfo) userInfo = { name: member };
                      return (
                        <li key={i} style={{ fontSize: 13, color: "#555" }}>
                          {userInfo.emoji ? userInfo.emoji + " " : ""}{userInfo.name} {userInfo.country ? `(${userInfo.country})` : ""} – "{userInfo.desc || "No description."}"
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <button style={styles.leaveButton} onClick={e => { e.stopPropagation(); onLeaveEvent(item); }}>Leave</button>
            </div>
          ))}
        </div>
      )}
      {/* Join / Friends Buttons */}
      <div style={styles.joinButtonRow}>
        <button style={styles.joinButton} onClick={onJoinEvent}>➕ Join a New Event</button>
        <button style={{ ...styles.joinButton, backgroundColor: "#f59e0b" }} onClick={() => onUserClick && onUserClick("friends")}>👥 Friends’ Events</button>
      </div>
      {/* Pending Requests */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Pending Requests</div>
        {pendingRequests.length === 0 ? (
          <div style={styles.empty}>No pending requests.</div>
        ) : (
          <ul style={{ padding: 0 }}>
            {pendingRequests.map((req, idx) => (
              <li key={idx} style={styles.pendingCard} onClick={() => setSelectedPending(req)}>
                <span>
                  {req.event && (
                    <>
                      <strong>{req.event.type || req.event.category || "Event"}</strong>
                      {req.event.date && <> | <span>{req.event.date}</span></>}
                      {req.event.location && <> | <span>{req.event.location}</span></>}
                      {req.event.details && <> | <span>{req.event.details}</span></>}
                    </>
                  )}
                </span>
                <button style={styles.cancelButton} onClick={e => { e.stopPropagation(); onCancelPendingRequest(idx); }}>
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Modal for pending request details */}
        {selectedPending && (
          <div style={styles.modalOverlay} onClick={() => setSelectedPending(null)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3>Pending Request Details</h3>
              <pre style={{ fontSize: 14, background: "#f9fafb", padding: 12, borderRadius: 8, maxHeight: 300, overflow: "auto" }}>
                {JSON.stringify(selectedPending, null, 2)}
              </pre>
              <button style={styles.cancelButton} onClick={() => setSelectedPending(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
      {/* Floating Roulette Button */}
      <button style={styles.fab} onClick={() => onUserClick && onUserClick("roulette")}>🎲</button>
    </div>
  );
}

const styles = {
  container: { position: "relative", minHeight: "100vh", background: "#f0f4f8", padding: 20, maxWidth: 500, margin: "0 auto" },
  header: {
    display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
  },
  iconButton: {
    background: "none", border: "none", cursor: "pointer",
  },
  points: { fontSize: 16, fontWeight: 600, color: "#333" },
  greeting: { fontSize: 18, fontWeight: 500, marginBottom: 16 },
  progressBox: {
    backgroundColor: "#e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 16, height: 20, position: "relative",
  },
  progressBar: {
    height: "100%", backgroundColor: "#3b82f6", borderRadius: 8,
  },
  progressText: {
    position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", fontSize: 12, color: "white", fontWeight: 600,
  },
  highlightCard: {
    backgroundColor: "white", padding: 16, borderRadius: 12, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  highlightTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  highlightEvent: { fontSize: 18, fontWeight: 600, marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  title: {
    fontSize: 22, fontWeight: 700, marginBottom: 16, textAlign: "center",
  },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#666" },
  eventCard: {
    backgroundColor: "white", padding: 16, borderRadius: 12, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", position: "relative",
  },
  eventName: { fontSize: 18, fontWeight: 600, marginBottom: 6 },
  details: { fontSize: 14, color: "#444" },
  leaveButton: { marginTop: 8, background: "#ef4444", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
  joinButtonRow: { display: "flex", gap: 12, marginBottom: 16 },
  joinButton: { flex: 1, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 600, fontSize: 16, cursor: "pointer" },
  pendingCard: { background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 12, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" },
  cancelButton: { background: "#ef4444", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
  fab: {
    position: "fixed", bottom: 30, right: "calc(50vw - 250px + 30px)", background: "#3b82f6", width: 60, height: 60, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px #3b82f6", fontSize: 28, color: "white", border: "none", cursor: "pointer", zIndex: 100,
  },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
  },
  modal: {
    background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.15)", minWidth: 320, maxWidth: 480,
  },
};

export default SocialHome;
